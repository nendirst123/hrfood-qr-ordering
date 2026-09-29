import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getStoreConfig, saveStoreConfig } from '@/lib/store-config';
import { StoreConfig } from '@/types/order';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const config = getStoreConfig();
  
  // Jika autoSchedule aktif, cek jam saat ini (WIB = UTC+7)
  let computedIsOpen = config.isOpen;
  if (config.autoSchedule) {
    const now = new Date();
    // Konversi ke WIB (UTC+7)
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const wibHours = (utcHours + 7) % 24;
    const currentWibTime = `${String(wibHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;

    if (config.openTime && config.closeTime) {
      if (config.openTime <= config.closeTime) {
        computedIsOpen = currentWibTime >= config.openTime && currentWibTime <= config.closeTime;
      } else {
        // Toko melewati tengah malam (mis. 18:00 - 02:00)
        computedIsOpen = currentWibTime >= config.openTime || currentWibTime <= config.closeTime;
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      ...config,
      effectiveIsOpen: computedIsOpen,
    },
  });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const body: Partial<StoreConfig> = await req.json();
    const current = getStoreConfig();

    const updated: StoreConfig = {
      ...current,
      ...body,
    };

    saveStoreConfig(updated);
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Save store config error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan konfigurasi toko' }, { status: 500 });
  }
}
