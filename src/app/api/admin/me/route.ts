import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, buildLogoutCookie } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json({ success: true, isAdmin: isAdminRequest(req) });
}

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set('Set-Cookie', buildLogoutCookie());
  return res;
}
