export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getReportData } from '@/lib/report';

export async function GET(request: NextRequest) {
  // KEAMANAN: laporan omzet hanya untuk admin
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');

  const report = await getReportData(dateParam);

  return NextResponse.json({
    success: true,
    data: {
      date: report.date,
      totalOmzet: report.totalOmzet,
      potentialOmzet: report.potentialOmzet,
      totalOrders: report.totalOrders,
      activeOrders: report.activeOrders,
      completedOrders: report.completedOrders,
      payment: {
        cashTotal: report.cashTotal,
        qrisTotal: report.qrisTotal,
      },
      topItems: report.topItems,
      sambalStats: report.sambalStats,
      recentOrders: report.orders,
    },
  });
}
