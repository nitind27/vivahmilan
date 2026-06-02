import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  listAdmins,
  provisionAdmin,
  updateOwnAdminAccount,
  getAdminById,
} from '@/lib/adminAccounts.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const me = await getAdminById(session.user.id);
  const admins = await listAdmins();

  return NextResponse.json({
    me: me
      ? {
          id: me.id,
          name: me.name,
          email: me.email,
          hasPassword: !!me.hasPassword,
          createdAt: me.createdAt,
          lastLoginAt: me.lastLoginAt,
        }
      : null,
    admins: admins.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      isActive: !!a.isActive,
      createdAt: a.createdAt,
      lastLoginAt: a.lastLoginAt,
      isSelf: a.id === session.user.id,
    })),
  });
}

/** Update own account */
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = await updateOwnAdminAccount(session.user.id, {
      name: body.name,
      email: body.email,
      newPassword: body.newPassword,
      currentPassword: body.currentPassword,
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: result.passwordChanged
        ? 'Password updated. Sign in again if your session expires.'
        : result.updated
          ? 'Account updated'
          : 'No changes',
      requiresReLogin: !!(result.passwordChanged || body.email),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Update failed' }, { status: 400 });
  }
}

/** Create new admin account */
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { name, email, password } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const created = await provisionAdmin({ name, email, password });

    return NextResponse.json({
      success: true,
      admin: created,
      message: created.upgraded
        ? `Existing user upgraded to admin: ${created.email}`
        : `Admin account created: ${created.email}`,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Could not create admin' }, { status: 400 });
  }
}
