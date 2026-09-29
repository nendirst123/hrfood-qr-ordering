import { kvGet, kvSet } from './db';
import { Order, OrderStatus, PaymentMethod, CartItem, OrderType, MenuItem } from '@/types/order';
import { getMenuWithAvailability } from './menu-store';
import { validatePromo } from './promo-store';
import { getDeliverySettings } from './delivery-store';

const ORDERS_KEY = 'orders';

// Helper format tanggal dalam timezone Asia/Jakarta (WIB)
export function getWibDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date);
}

export function getOrderWibDateString(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(isoString));
  } catch (e) {
    return isoString.split('T')[0];
  }
}

async function loadOrders(): Promise<Order[]> {
  const parsed = await kvGet<Order[]>(ORDERS_KEY, []);
  // Preserve existing data: ensure backward-compatible defaults
  return parsed.map(o => ({
    ...o,
    orderType: o.orderType || 'dine_in',
    deliveryFee: o.deliveryFee || 0,
  }));
}

async function saveOrders(orders: Order[]): Promise<void> {
  await kvSet(ORDERS_KEY, orders);
}

export async function getAllOrders(filterDate?: string): Promise<Order[]> {
  let orders = await loadOrders();

  // Filter Tanggal berdasarkan Timezone Resto (Asia/Jakarta / WIB)
  if (filterDate && filterDate !== 'all') {
    const todayWib = getWibDateString();
    let targetDateStr = filterDate;

    if (filterDate === 'today') {
      targetDateStr = todayWib;
    } else if (filterDate === 'yesterday') {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      targetDateStr = getWibDateString(yesterday);
    }

    orders = orders.filter(o => {
      const orderWib = getOrderWibDateString(o.createdAt);
      return orderWib === targetDateStr;
    });
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await getAllOrders();
  return orders.find(o => o.id === id) || null;
}

export async function createOrder(payload: {
  tableNumber?: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  deliveryZoneId?: string;
  deliveryZoneName?: string;
  deliveryDistanceKm?: number;
  deliveryFee?: number;
  pickupTime?: string;
  orderType?: OrderType;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  isPaid?: boolean;
  discountCode?: string;
  discountAmount?: number;
}): Promise<Order> {
  const orders = await loadOrders();

  // === KEAMANAN: harga selalu dihitung dari data menu di server ===
  // unitPrice / basePrice / extraPrice dari client DIABAIKAN agar tidak bisa dimanipulasi.
  const menuMap = new Map<string, MenuItem>();
  for (const m of await getMenuWithAvailability()) menuMap.set(m.id, m);

  const serverItems: CartItem[] = payload.items.map((item) => {
    const menuItem = menuMap.get(item.itemId);
    if (!menuItem) {
      throw new Error(`Menu "${item.name || item.itemId}" tidak ditemukan.`);
    }
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
      throw new Error(`Jumlah untuk "${menuItem.name}" tidak valid.`);
    }

    let unitPrice = Number(menuItem.price) || 0;
    const serverOptions = (item.selectedOptions || []).map((opt) => {
      const menuOpt = (menuItem.options || []).find((o) => o.name === opt.optionName);
      const choice = menuOpt?.choices.find((c) => c.label === opt.choiceLabel);
      if (!menuOpt || !choice) {
        throw new Error(`Opsi "${opt.choiceLabel}" untuk "${menuItem.name}" tidak valid.`);
      }
      const extraPrice = Number(choice.extraPrice) || 0;
      unitPrice += extraPrice;
      return {
        optionName: opt.optionName,
        choiceLabel: opt.choiceLabel,
        extraPrice,
      };
    });

    return {
      itemId: menuItem.id,
      name: menuItem.name,
      basePrice: Number(menuItem.price) || 0,
      unitPrice,
      quantity: qty,
      selectedOptions: serverOptions,
      notes: typeof item.notes === 'string' ? item.notes.slice(0, 200) : undefined,
      image: menuItem.image,
    };
  });

  const subtotal = serverItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const tax = 0; // Bebas Pajak Resto (Tanpa PB1)

  // === KEAMANAN: diskon dihitung server via validatePromo, bukan dari client ===
  let discountAmount = 0;
  const discountCode = payload.discountCode?.trim() || undefined;
  if (discountCode) {
    const promoCheck = await validatePromo(discountCode, subtotal);
    if (!promoCheck.valid) {
      throw new Error(promoCheck.message || 'Kode promo tidak valid.');
    }
    discountAmount = promoCheck.discountAmount;
  }

  // === KEAMANAN: ongkir dihitung server dari delivery_settings, bukan dari client ===
  // Client hanya boleh memilih deliveryZoneId; nama zona & fee diambil dari server.
  let deliveryFee = 0;
  let serverZoneId: string | undefined;
  let serverZoneName: string | undefined;
  const orderTypeForDelivery = (payload.orderType as OrderType) || 'dine_in';
  if (orderTypeForDelivery === 'delivery') {
    const settings = await getDeliverySettings();
    if (!settings.isEnabled) {
      throw new Error('Layanan delivery sedang nonaktif.');
    }
    const zone = settings.zones.find(
      (z) => z.id === payload.deliveryZoneId && z.isActive
    );
    if (!zone) {
      throw new Error('Zona delivery tidak valid. Silakan pilih zona lagi.');
    }
    if (settings.minOrderAmount > 0 && subtotal < settings.minOrderAmount) {
      throw new Error(
        `Minimal belanja untuk delivery Rp${settings.minOrderAmount.toLocaleString('id-ID')}.`
      );
    }
    serverZoneId = zone.id;
    serverZoneName = zone.name;
    deliveryFee = Number(zone.fee) || 0;
    const freeThreshold = Number(settings.freeDeliveryThreshold) || 0;
    if (freeThreshold > 0 && subtotal >= freeThreshold) {
      deliveryFee = 0;
    }
  }
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  const orderSeq = (orders.length + 1).toString().padStart(3, '0');
  const now = new Date().toISOString();

  const orderType = payload.orderType || 'dine_in';
  let tableNumber = (payload.tableNumber || '').trim();
  if (!tableNumber) {
    if (orderType === 'delivery') tableNumber = 'DLV';
    else if (orderType === 'takeaway') tableNumber = 'TA';
    else tableNumber = '01';
  } else if (!isNaN(Number(tableNumber))) {
    tableNumber = tableNumber.padStart(2, '0');
  }

  const defaultCustomerName =
    orderType === 'delivery'
      ? 'Pelanggan Delivery'
      : orderType === 'takeaway'
      ? 'Pelanggan Takeaway'
      : `Tamu Meja ${tableNumber}`;

  const newOrder: Order = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    orderNumber: `ORD-${orderSeq}`,
    orderType,
    tableNumber,
    customerName: payload.customerName?.trim() || defaultCustomerName,
    customerPhone: payload.customerPhone?.trim(),
    deliveryAddress: payload.deliveryAddress?.trim(),
    deliveryNotes: payload.deliveryNotes?.trim(),
    deliveryZoneId: serverZoneId,
    deliveryZoneName: serverZoneName,
    deliveryDistanceKm: payload.deliveryDistanceKm,
    deliveryFee,
    pickupTime: payload.pickupTime?.trim(),
    items: serverItems,
    subtotal,
    tax: 0,
    discountCode,
    discountAmount,
    total,
    paymentMethod: payload.paymentMethod,
    // KEAMANAN: pelanggan tidak bisa menandai pesanannya sendiri sebagai lunas.
    // Status lunas hanya bisa diubah dari dapur/admin (endpoint terproteksi).
    isPaid: false,
    status: 'pending_payment',
    createdAt: now,
    updatedAt: now,
  };

  orders.unshift(newOrder);
  await saveOrders(orders);
  return newOrder;
}

export async function updateOrderStatus(id: string, status: OrderStatus, isPaid?: boolean): Promise<Order | null> {
  const orders = await loadOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return null;

  orders[index].status = status;
  if (typeof isPaid === 'boolean') {
    orders[index].isPaid = isPaid;
  }
  orders[index].updatedAt = new Date().toISOString();

  await saveOrders(orders);
  return orders[index];
}

export async function resetAllOrders(): Promise<{ success: boolean; backupOrders: Order[]; count: number }> {
  const previousOrders = await loadOrders();

  // Kosongkan orders (backup dikembalikan lewat respons API)
  await saveOrders([]);

  return {
    success: true,
    backupOrders: previousOrders,
    count: previousOrders.length,
  };
}

// Sinkronisasi pesanan dari klien (fallback kompatibilitas)
export async function syncOrders(incomingOrders: Order[]): Promise<Order[]> {
  const currentOrders = await loadOrders();
  const orderMap = new Map<string, Order>();

  currentOrders.forEach(o => orderMap.set(o.id, o));

  incomingOrders.forEach(incoming => {
    if (!incoming || !incoming.id) return;
    const existing = orderMap.get(incoming.id);
    if (!existing) {
      orderMap.set(incoming.id, incoming);
    } else {
      const incomingTime = new Date(incoming.updatedAt || incoming.createdAt).getTime();
      const existingTime = new Date(existing.updatedAt || existing.createdAt).getTime();
      if (incomingTime > existingTime) {
        orderMap.set(incoming.id, incoming);
      }
    }
  });

  const merged = Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  await saveOrders(merged);
  return merged;
}
