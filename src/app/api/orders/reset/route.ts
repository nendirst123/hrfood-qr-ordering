import { NextRequest, NextResponse } from 'next/server';
import { resetAllOrders } from '@/lib/order-store';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // KEAMANAN: reset semua pesanan hanya untuk admin
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const result = await resetAllOrders();
    return NextResponse.json({
      success: true,
      message: `Berhasil mereset pesanan. ${result.count} pesanan sebelumnya telah dicadangkan.`,
      backupOrders: result.backupOrders,
      count: result.count,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
