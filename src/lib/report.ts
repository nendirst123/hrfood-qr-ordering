import { getAllOrders } from './order-store';
import { Order } from '@/types/order';

export interface ReportData {
  date: string;
  dateLabel: string;
  totalOmzet: number;
  potentialOmzet: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cashTotal: number;
  qrisTotal: number;
  topItems: { name: string; qty: number; revenue: number; image: string }[];
  sambalStats: Record<string, number>;
  orders: Order[];
}

/** Hitung data laporan untuk satu tanggal/periode. Dipakai API JSON & PDF. */
export async function getReportData(dateParam: string | null): Promise<ReportData> {
  const orders = await getAllOrders();

  let targetDateStr = new Date().toISOString().split('T')[0];
  let dateLabel = 'Hari Ini';
  if (dateParam && dateParam !== 'today') {
    if (dateParam === 'yesterday') {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      targetDateStr = yesterday.toISOString().split('T')[0];
      dateLabel = 'Kemarin';
    } else if (dateParam === 'all') {
      dateLabel = 'Semua Waktu';
    } else {
      targetDateStr = dateParam;
      dateLabel = targetDateStr;
    }
  }

  const targetOrders =
    dateParam === 'all' ? orders : orders.filter((o) => o.createdAt.startsWith(targetDateStr));

  const validOrders = targetOrders.filter((o) => o.status !== 'cancelled');

  const totalOmzet = validOrders.reduce(
    (sum, o) => sum + (o.isPaid || o.status === 'completed' ? o.total : 0),
    0
  );
  const potentialOmzet = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = validOrders.length;
  const activeOrders = validOrders.filter((o) =>
    ['cooking', 'pending_payment', 'ready', 'on_delivery'].includes(o.status)
  ).length;
  const completedOrders = validOrders.filter((o) => o.status === 'completed').length;

  let cashTotal = 0;
  let qrisTotal = 0;
  validOrders.forEach((o) => {
    if (o.isPaid || o.status === 'completed') {
      if (o.paymentMethod === 'cashier') cashTotal += o.total;
      if (o.paymentMethod === 'qris') qrisTotal += o.total;
    }
  });

  const itemMap: Record<string, { name: string; qty: number; revenue: number; image: string }> = {};
  const sambalMap: Record<string, number> = {
    'Sambal Terasi': 0,
    'Sambal Bawang': 0,
    'Sambal Cabe Ijo': 0,
    'Lainnya / Tanpa Sambal': 0,
  };

  validOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (!itemMap[item.itemId]) {
        itemMap[item.itemId] = { name: item.name, qty: 0, revenue: 0, image: item.image || '' };
      }
      itemMap[item.itemId].qty += item.quantity;
      itemMap[item.itemId].revenue += item.unitPrice * item.quantity;

      item.selectedOptions?.forEach((opt) => {
        const choice = opt.choiceLabel.toLowerCase();
        if (choice.includes('terasi')) {
          sambalMap['Sambal Terasi'] += item.quantity;
        } else if (choice.includes('bawang')) {
          sambalMap['Sambal Bawang'] += item.quantity;
        } else if (choice.includes('cabe ijo') || choice.includes('ijo')) {
          sambalMap['Sambal Cabe Ijo'] += item.quantity;
        } else {
          sambalMap['Lainnya / Tanpa Sambal'] += item.quantity;
        }
      });
    });
  });

  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty);

  return {
    date: targetDateStr,
    dateLabel,
    totalOmzet,
    potentialOmzet,
    totalOrders,
    activeOrders,
    completedOrders,
    cashTotal,
    qrisTotal,
    topItems,
    sambalStats: sambalMap,
    orders: targetOrders,
  };
}

export function formatRp(n: number): string {
  return 'Rp' + (Number(n) || 0).toLocaleString('id-ID');
}
