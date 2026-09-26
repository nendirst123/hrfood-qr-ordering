import { NextRequest, NextResponse } from 'next/server';
import { getDeliverySettings, saveDeliverySettings } from '@/lib/delivery-store';
import { DeliverySettings } from '@/types/order';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = getDeliverySettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = saveDeliverySettings(body as DeliverySettings);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = saveDeliverySettings(body as DeliverySettings);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
