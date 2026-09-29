import { NextRequest, NextResponse } from 'next/server';
import { syncOrders } from '@/lib/order-store';
import { requireAdmin } from '@/lib/admin-auth';
import { Order } from '@/types/order';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // KEAMANAN: sinkronisasi order massal hanya untuk admin/dapur.
  // Pelanggan tidak boleh menyuntikkan order arbitrer ke database.
  const denied = requireAdmin(req);
  if (denied) return denied;

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

    const synced = await syncOrders(incoming);
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
