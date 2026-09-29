import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'hr_admin';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 hari

function getPin(): string {
  const pin = process.env.ADMIN_PIN || '123456';
  if (!process.env.ADMIN_PIN) {
    console.warn(
      '[admin-auth] ADMIN_PIN belum diset — memakai PIN default "123456". ' +
      'Segera set ADMIN_PIN di environment Vercel!'
    );
  }
  return pin;
}

function getSecret(): string {
  return process.env.ADMIN_SECRET || 'hr-food-default-secret-ganti-segera';
}

function signPin(pin: string): string {
  return crypto.createHmac('sha256', getSecret()).update(`hr-admin:${pin}`).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function verifyPin(pin: string): boolean {
  return safeEqual(String(pin || ''), getPin());
}

export function isAdminRequest(req: NextRequest): boolean {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return false;
  return safeEqual(cookie, signPin(getPin()));
}

/** Kembalikan 401 JSON bila bukan admin, atau null bila lolos. */
export function requireAdmin(req: NextRequest): NextResponse | null {
  if (isAdminRequest(req)) return null;
  return NextResponse.json(
    { success: false, error: 'Akses ditolak. Silakan login sebagai admin.' },
    { status: 401 }
  );
}

export function buildAdminCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return (
    `${COOKIE_NAME}=${signPin(getPin())}; Path=/; HttpOnly; ` +
    `Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`
  );
}

export function buildLogoutCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`;
}

export { COOKIE_NAME };
