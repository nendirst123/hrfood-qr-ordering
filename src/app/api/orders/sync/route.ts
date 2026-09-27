import { NextResponse } from 'next/server';
import { syncOrders } from '@/lib/order-store';
import { Order } from '@/types/order';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let incoming: Order[] = [];

    if (Array.isArray(body.orders)) {
      incoming = body.orders;
    } else if (body.order && typeof body.order === 'object') {
      incoming = [body.order];
    } else if (Array.isArray(body)) {
      incoming = body;
    }

    if (incoming.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada data pesanan untuk disinkronkan' }, { status: 400 });
    }

    const synced = syncOrders(incoming);
    return NextResponse.json({
      success: true,
      message: `${incoming.length} pesanan berhasil disinkronkan`,
      totalOrders: synced.length,
    });
  } catch (err: any) {
    console.error('API Orders Sync error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menyinkronkan pesanan' },
      { status: 500 }
    );
  }
}
