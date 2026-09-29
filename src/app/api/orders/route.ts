import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/order-store';
import { getAvailabilityMap, syncMenuAvailability } from '@/lib/menu-store';
import { requireAdmin, isAdminRequest } from '@/lib/admin-auth';
import { getStoreConfig, isStoreOpenNow } from '@/lib/store-config';
import { OrderType, PaymentMethod, CartItem } from '@/types/order';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // KEAMANAN: daftar semua pesanan hanya untuk admin/dapur
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const orderType = searchParams.get('type') as OrderType | null;
    const date = searchParams.get('date');

    let orders = await getAllOrders(date || undefined);
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
    // KEAMANAN: tolak order baru saat toko tutup (termasuk jadwal otomatis).
    const storeConfig = await getStoreConfig();
    if (!isStoreOpenNow(storeConfig)) {
      return NextResponse.json(
        { success: false, error: storeConfig.closedMessage || 'Maaf, toko sedang tutup.' },
        { status: 403 }
      );
    }

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
      paymentMethod,
      discountCode,
      clientAvailability,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar pesanan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    // KEAMANAN: hanya metode pembayaran yang dikenal yang diterima
    const safePaymentMethod: PaymentMethod = paymentMethod === 'qris' ? 'qris' : 'cashier';
    // KEAMANAN: hanya tipe pesanan yang dikenal yang diterima
    const safeOrderType: OrderType =
      orderType === 'delivery' || orderType === 'takeaway' ? orderType : 'dine_in';

    // KEAMANAN: sinkronisasi stok dari client hanya diterima dari admin/dapur.
    // Pelanggan tidak boleh mengubah status ketersediaan menu.
    if (isAdminRequest(request) && clientAvailability && typeof clientAvailability === 'object') {
      await syncMenuAvailability(clientAvailability);
    }

    // Validasi menu yang sedang habis stok
    const availabilityMap = await getAvailabilityMap();
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

    const newOrder = await createOrder({
      orderType: safeOrderType,
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
      paymentMethod: safePaymentMethod,
      // isPaid & discountAmount dari client DIABAIKAN (keamanan):
      // lunas hanya via dapur/admin, diskon dihitung server dari discountCode.
      discountCode,
    });

    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
