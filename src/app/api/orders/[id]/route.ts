import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus, syncOrders } from '@/lib/order-store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let order = getOrderById(params.id);

    // Self-healing: jika instance serverless baru belum memiliki order di /tmp, pulihkan dari header fallback
    if (!order) {
      const fallbackHeader = request.headers.get('x-fallback-order');
      if (fallbackHeader) {
        try {
          const parsed = JSON.parse(decodeURIComponent(fallbackHeader));
          if (parsed && parsed.id === params.id) {
            syncOrders([parsed]);
            order = parsed;
          }
        } catch (e) {
          // ignore header parse error
        }
      }
    }

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
  try {
    const body = await request.json();
    const { status, isPaid } = body;

    const updated = updateOrderStatus(params.id, status, isPaid);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
