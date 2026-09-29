import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/order-store';
import { getAvailabilityMap, getMenuWithAvailability, syncMenuAvailability } from '@/lib/menu-store';
import { requireAdmin, isAdminRequest } from '@/lib/admin-auth';
import { getStoreConfig, isStoreOpenNow } from '@/lib/store-config';
import { notifyOrderEvent } from '@/lib/wa-notify';
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
      source,
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

    // Validasi menu yang sedang habis stok + stok tidak cukup (dari data server)
    const availabilityMap = await getAvailabilityMap();
    const menuList = await getMenuWithAvailability();
    const menuById = new Map(menuList.map((m) => [m.id, m]));
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

    // Cek stok otomatis lebih awal agar pesan error jelas (createOrder juga cek lagi)
    const qtyById = new Map<string, number>();
    for (const ci of items as CartItem[]) {
      qtyById.set(ci.itemId, (qtyById.get(ci.itemId) || 0) + (Number(ci.quantity) || 0));
    }
    const insufficient: string[] = [];
    for (const [id, qty] of qtyById) {
      const m = menuById.get(id);
      if (m && typeof m.stock === 'number' && m.stock < qty) {
        insufficient.push(`${m.name} (sisa ${m.stock})`);
      }
    }
    if (insufficient.length > 0) {
      return NextResponse.json(
        { success: false, error: `Stok tidak cukup: ${insufficient.join(', ')}. Silakan kurangi jumlahnya.` },
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
      // Sumber order: hanya admin/kasir yang boleh menandai 'pos'.
      source: isAdminRequest(request) && source === 'pos' ? 'pos' : 'qr',
    });

    // NOTIF WA: kabari pelanggan bahwa pesanan diterima (async, tidak menghambat respons)
    notifyOrderEvent(newOrder, 'order_received').catch(() => {});

    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
