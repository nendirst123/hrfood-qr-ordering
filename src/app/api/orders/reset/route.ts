import { NextRequest, NextResponse } from 'next/server';
import { resetAllOrders } from '@/lib/order-store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const result = resetAllOrders();
    return NextResponse.json({
      success: true,
      message: `Berhasil mereset pesanan. ${result.count} pesanan sebelumnya telah dicadangkan.`,
      backupOrders: result.backupOrders,
      count: result.count,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
