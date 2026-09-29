import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/order-store';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await getOrderById(params.id);

    // KEAMANAN: fallback header x-fallback-order DIHAPUS.
    // Order pelanggan tidak boleh dipulihkan ke database dari data browser.
    // Dengan database Neon bersama, order selalu ditemukan via ID.

    if (!order) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // KEAMANAN: ubah status / tandai lunas hanya untuk admin/dapur
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { status, isPaid } = body;

    const updated = await updateOrderStatus(params.id, status, isPaid);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
