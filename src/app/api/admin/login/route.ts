import { NextRequest, NextResponse } from 'next/server';
import { verifyPin, buildAdminCookie } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pin = String(body?.pin || '');

    if (!verifyPin(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN salah.' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ success: true });
    res.headers.set('Set-Cookie', buildAdminCookie());
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Login gagal' },
      { status: 500 }
    );
  }
}
