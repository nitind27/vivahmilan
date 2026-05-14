import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

// GET /api/auth/qr-image?data=<url> — generates a QR code data URL
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get('data');
  if (!data) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  try {
    const dataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return NextResponse.json({ dataUrl });
  } catch (err) {
    console.error('QR image error:', err);
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 });
  }
}
