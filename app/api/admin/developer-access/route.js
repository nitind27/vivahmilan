import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  parseDeveloperAccessInput,
  provisionDeveloperAccount,
  saveDeveloperPortalEmails,
} from '@/lib/developerAccess';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const raw = body.accounts ?? body.developer_portal_emails ?? '';
    const { accounts, emailsOnly } = parseDeveloperAccessInput(raw);

    if (accounts.length === 0 && emailsOnly.length === 0) {
      await saveDeveloperPortalEmails([]);
      return NextResponse.json({ success: true, provisioned: [], emails: [] });
    }

    const provisioned = [];
    const errors = [];

    for (const { email, password } of accounts) {
      try {
        const user = await provisionDeveloperAccount(email, password);
        provisioned.push(user.email);
      } catch (e) {
        errors.push({ email, error: e.message });
      }
    }

    const allEmails = [...provisioned, ...emailsOnly];
    const savedEmails = await saveDeveloperPortalEmails(allEmails);

    if (errors.length > 0 && provisioned.length === 0) {
      return NextResponse.json(
        { error: 'Could not create accounts', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      provisioned,
      emails: savedEmails,
      errors: errors.length ? errors : undefined,
      message:
        provisioned.length > 0
          ? `${provisioned.length} account(s) ready — login with email + password on /login`
          : 'Emails saved for portal bypass (add email:password to set login password)',
    });
  } catch (e) {
    console.error('[developer-access]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
