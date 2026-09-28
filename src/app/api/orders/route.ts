import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/order-store';
import { getAvailabilityMap, syncMenuAvailability } from '@/lib/menu-store';
import { OrderType, PaymentMethod, CartItem } from '@/types/order';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const orderType = searchParams.get('type') as OrderType | null;
    const date = searchParams.get('date');

    let orders = getAllOrders(date || undefined);
    if (table) {
      orders = orders.filter(o => o.tableNumber === table.padStart(2, '0'));
    }
    if (orderType) {
      orders = orders.filter(o => o.orderType === orderType);
    }

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderType = 'dine_in',
      tableNumber,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryNotes,
      deliveryZoneId,
      deliveryZoneName,
      deliveryDistanceKm,
      deliveryFee = 0,
      pickupTime,
      items,
      paymentMethod = 'cashier',
      isPaid,
      discountCode,
      discountAmount = 0,
      clientAvailability,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar pesanan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    // Sinkronkan ketersediaan menu dari client jika ada (mengatasi stateless serverless microVM)
    if (clientAvailability && typeof clientAvailability === 'object') {
      syncMenuAvailability(clientAvailability);
    }

    // Validasi menu yang sedang habis stok
    const availabilityMap = getAvailabilityMap();
    const soldOutCartItems = items.filter((cartItem: CartItem) => {
      const entry = availabilityMap[cartItem.itemId];
      return entry && entry.isAvailable === false;
    });

    if (soldOutCartItems.length > 0) {
      const names = soldOutCartItems.map((i: CartItem) => i.name).join(', ');
      return NextResponse.json(
        { success: false, error: `Maaf, menu "${names}" sedang habis stok. Silakan periksa kembali keranjang Anda.` },
        { status: 400 }
      );
    }

    // Validasi spesifik per tipe pesanan
    if (orderType === 'dine_in') {
      if (!tableNumber && tableNumber !== '0') {
        return NextResponse.json(
          { success: false, error: 'Nomor meja wajib diisi untuk makan di tempat.' },
          { status: 400 }
        );
      }
    } else if (orderType === 'delivery') {
      if (!customerPhone || !customerPhone.trim()) {
        return NextResponse.json(
          { success: false, error: 'Nomor WhatsApp wajib diisi untuk konfirmasi pengantaran.' },
          { status: 400 }
        );
      }
      if (!deliveryAddress || !deliveryAddress.trim()) {
        return NextResponse.json(
          { success: false, error: 'Alamat pengantaran lengkap wajib diisi.' },
          { status: 400 }
        );
      }
    } else if (orderType === 'takeaway') {
      if (!customerPhone || !customerPhone.trim()) {
        return NextResponse.json(
          { success: false, error: 'Nomor WhatsApp wajib diisi untuk konfirmasi pengambilan pesanan.' },
          { status: 400 }
        );
      }
    }

    const newOrder = createOrder({
      orderType,
      tableNumber,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryNotes,
      deliveryZoneId,
      deliveryZoneName,
      deliveryDistanceKm: typeof deliveryDistanceKm === 'number' ? deliveryDistanceKm : undefined,
      deliveryFee: Number(deliveryFee) || 0,
      pickupTime,
      items,
      paymentMethod,
      isPaid,
      discountCode,
      discountAmount: Number(discountAmount) || 0,
    });

    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
