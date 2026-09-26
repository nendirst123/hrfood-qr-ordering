import fs from 'fs';
import path from 'path';
import { Order, OrderStatus, PaymentMethod, CartItem } from '@/types/order';

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

export function getAllOrders(): Order[] {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const orders: Order[] = JSON.parse(raw || '[]');
      globalThis.__CACHED_ORDERS__ = orders;
      return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (err) {
    console.error('Failed reading orders file, using in-memory cache:', err);
  }
  return globalThis.__CACHED_ORDERS__ || [];
}

export function getOrderById(id: string): Order | null {
  const orders = getAllOrders();
  return orders.find(o => o.id === id) || null;
}

export function createOrder(payload: {
  tableNumber: string;
  customerName: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  isPaid?: boolean;
}): Order {
  ensureDataDir();
  const orders = getAllOrders();

  const subtotal = payload.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const tax = Math.round(subtotal * 0.1); // PB1 10%
  const total = subtotal + tax;

  const orderSeq = (orders.length + 1).toString().padStart(3, '0');
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    orderNumber: `ORD-${orderSeq}`,
    tableNumber: payload.tableNumber.trim().padStart(2, '0'),
    customerName: payload.customerName.trim() || 'Tamu Meja ' + payload.tableNumber,
    items: payload.items,
    subtotal,
    tax,
    total,
    paymentMethod: payload.paymentMethod,
    isPaid: payload.isPaid ?? (payload.paymentMethod === 'qris'), // Jika QRIS langsung tandai lunas untuk simulasi
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
