export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getAllOrders } from '@/lib/order-store';

export async function GET() {
  const orders = getAllOrders();

  // Filter order hari ini (lokal)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr));

  // Hanya order yang valid/bukan cancelled
  const validOrders = todayOrders.filter(o => o.status !== 'cancelled');

  const totalOmzet = validOrders.reduce((sum, o) => sum + (o.isPaid || o.status === 'completed' ? o.total : 0), 0);
  const potentialOmzet = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = validOrders.length;
  const activeOrders = validOrders.filter(o => o.status === 'cooking' || o.status === 'pending_payment' || o.status === 'ready').length;
  const completedOrders = validOrders.filter(o => o.status === 'completed').length;

  // Breakdown Metode Pembayaran
  let cashTotal = 0;
  let qrisTotal = 0;
  validOrders.forEach(o => {
    if (o.isPaid || o.status === 'completed') {
      if (o.paymentMethod === 'cashier') cashTotal += o.total;
      if (o.paymentMethod === 'qris') qrisTotal += o.total;
    }
  });

  // Breakdown Menu Terlaris (Item Counts)
  const itemMap: Record<string, { name: string; qty: number; revenue: number; image: string }> = {};
  // Breakdown Sambal Terfavorit
  const sambalMap: Record<string, number> = {
    'Sambal Terasi': 0,
    'Sambal Bawang': 0,
    'Sambal Cabe Ijo': 0,
    'Lainnya / Tanpa Sambal': 0
  };

  validOrders.forEach(order => {
    order.items.forEach(item => {
      if (!itemMap[item.itemId]) {
        itemMap[item.itemId] = {
          name: item.name,
          qty: 0,
          revenue: 0,
          image: item.image || ''
        };
      }
      itemMap[item.itemId].qty += item.quantity;
      itemMap[item.itemId].revenue += item.unitPrice * item.quantity;

      // Cek sambal dari selectedOptions
      item.selectedOptions?.forEach(opt => {
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

  return NextResponse.json({
    success: true,
    data: {
      date: todayStr,
      totalOmzet,
      potentialOmzet,
      totalOrders,
      activeOrders,
      completedOrders,
      payment: {
        cashTotal,
        qrisTotal
      },
      topItems,
      sambalStats: sambalMap,
      recentOrders: todayOrders
    }
  });
}
