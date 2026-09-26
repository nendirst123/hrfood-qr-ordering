import fs from 'fs';
import path from 'path';
import { Order, OrderStatus, PaymentMethod, CartItem, OrderType } from '@/types/order';

const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'orders.json');
const BUNDLED_DATA_FILE = path.join(process.cwd(), 'data', 'orders.json');

declare global {
  var __CACHED_ORDERS__: Order[] | undefined;
}

// Pastikan direktori data ada dan aman di Vercel Serverless
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      if (fs.existsSync(BUNDLED_DATA_FILE)) {
        const bundledContent = fs.readFileSync(BUNDLED_DATA_FILE, 'utf-8');
        fs.writeFileSync(DATA_FILE, bundledContent, 'utf-8');
      } else {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
      }
    }
  } catch (err) {
    console.warn('Filesystem access warning (Vercel serverless):', err);
  }
}

export function getAllOrders(filterDate?: string): Order[] {
  ensureDataDir();
  let orders: Order[] = [];

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: Order[] = JSON.parse(raw || '[]');
      
      // Preserve existing data: ensure backward-compatible defaults
      orders = parsed.map(o => ({
        ...o,
        orderType: o.orderType || 'dine_in',
        deliveryFee: o.deliveryFee || 0,
      }));

      globalThis.__CACHED_ORDERS__ = orders;
    }
  } catch (err) {
    console.error('Failed reading orders file, using in-memory cache:', err);
    orders = globalThis.__CACHED_ORDERS__ || [];
  }

  // Filter Tanggal jika diberikan
  if (filterDate && filterDate !== 'all') {
    let targetDateStr = filterDate;
    const now = new Date();

    if (filterDate === 'today') {
      targetDateStr = now.toISOString().split('T')[0];
    } else if (filterDate === 'yesterday') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      targetDateStr = yesterday.toISOString().split('T')[0];
    }

    orders = orders.filter(o => o.createdAt.startsWith(targetDateStr));
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getOrderById(id: string): Order | null {
  const orders = getAllOrders();
  return orders.find(o => o.id === id) || null;
}

export function createOrder(payload: {
  tableNumber?: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  deliveryZoneId?: string;
  deliveryZoneName?: string;
  deliveryFee?: number;
  pickupTime?: string;
  orderType?: OrderType;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  isPaid?: boolean;
  discountCode?: string;
  discountAmount?: number;
}): Order {
  ensureDataDir();
  const orders = getAllOrders();

  const subtotal = payload.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const tax = 0; // Bebas Pajak Resto (Tanpa PB1)
  const discountAmount = Math.max(0, payload.discountAmount || 0);
  const deliveryFee = payload.orderType === 'delivery' ? (payload.deliveryFee || 0) : 0;
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
    deliveryZoneId: payload.deliveryZoneId,
    deliveryZoneName: payload.deliveryZoneName,
    deliveryFee,
    pickupTime: payload.pickupTime?.trim(),
    items: payload.items,
    subtotal,
    tax: 0,
    discountCode: payload.discountCode?.trim() || undefined,
    discountAmount,
    total,
    paymentMethod: payload.paymentMethod,
    isPaid: payload.isPaid ?? (payload.paymentMethod === 'qris'),
    status: payload.isPaid || payload.paymentMethod === 'qris' ? 'cooking' : 'pending_payment',
    createdAt: now,
    updatedAt: now,
  };

  orders.unshift(newOrder);
  globalThis.__CACHED_ORDERS__ = orders;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed writing orders to filesystem, kept in memory:', err);
  }
  return newOrder;
}

export function updateOrderStatus(id: string, status: OrderStatus, isPaid?: boolean): Order | null {
  ensureDataDir();
  const orders = getAllOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return null;

  orders[index].status = status;
  if (typeof isPaid === 'boolean') {
    orders[index].isPaid = isPaid;
  }
  orders[index].updatedAt = new Date().toISOString();

  globalThis.__CACHED_ORDERS__ = orders;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed updating orders to filesystem, kept in memory:', err);
  }
  return orders[index];
}

export function resetAllOrders(): { success: boolean; backupOrders: Order[]; count: number } {
  ensureDataDir();
  const previousOrders = getAllOrders();

  // Buat cadangan lokal jika tidak di serverless
  try {
    const backupFileName = `backup_orders_${Date.now()}.json`;
    const backupFilePath = path.join(DATA_DIR, backupFileName);
    fs.writeFileSync(backupFilePath, JSON.stringify(previousOrders, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed writing backup file to disk:', err);
  }

  // Kosongkan orders
  globalThis.__CACHED_ORDERS__ = [];
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed resetting orders in filesystem, reset in memory:', err);
  }

  return {
    success: true,
    backupOrders: previousOrders,
    count: previousOrders.length,
  };
}
