import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { generateDynamicQRIS } from '@/lib/qris';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const amount = Number(searchParams.get('amount')) || 0;
  const dynamicString = generateDynamicQRIS(amount);

  try {
    const pngBuffer = await QRCode.toBuffer(dynamicString, {
      width: 420,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
