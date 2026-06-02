import { NextResponse } from 'next/server';
import { validateAndFormatPhone } from '@/lib/phoneVerification';

export async function POST(req) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    const result = await validateAndFormatPhone(phone);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({
      valid: true,
      e164: result.e164,
      phone_type: result.phone_type,
      carrier: result.carrier,
      international_number: result.international_number || result.e164,
    });
  } catch (e) {
    console.error('[phone/validate]', e.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
