import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getStoreConfig, saveStoreConfig, isStoreOpenNow } from '@/lib/store-config';
import { StoreConfig } from '@/types/order';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const config = await getStoreConfig();

  return NextResponse.json({
    success: true,
    data: {
      ...config,
      effectiveIsOpen: isStoreOpenNow(config),
    },
  });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const body: Partial<StoreConfig> = await req.json();
    const current = await getStoreConfig();

    const updated: StoreConfig = {
      ...current,
      ...body,
    };

    await saveStoreConfig(updated);
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Save store config error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan konfigurasi toko' }, { status: 500 });
  }
}
