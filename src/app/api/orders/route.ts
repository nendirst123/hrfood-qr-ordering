import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/order-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    let orders = getAllOrders();
    if (table) {
      orders = orders.filter(o => o.tableNumber === table.padStart(2, '0'));
    }

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableNumber, customerName, items, paymentMethod, isPaid } = body;

    if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nomor meja dan daftar pesanan wajib diisi.' },
        { status: 400 }
      );
    }

    const newOrder = createOrder({
      tableNumber,
      customerName: customerName || `Tamu Meja ${tableNumber}`,
      items,
      paymentMethod: paymentMethod || 'cashier',
      isPaid,
    });

    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
