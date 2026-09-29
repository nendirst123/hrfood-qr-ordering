import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getWaNotifySettings, saveWaNotifySettings, sendWaMessage, WaNotifyEvent } from '@/lib/wa-notify';
import { formatWhatsAppNumber } from '@/lib/whatsapp-helper';

export const dynamic = 'force-dynamic';

// GET: ambil pengaturan (token TIDAK pernah dikembalikan utuh ke client)
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const s = await getWaNotifySettings();
  return NextResponse.json({
    success: true,
    data: {
      enabled: s.enabled,
      tokenSet: s.token.length > 0,
      tokenHint: s.token.length > 4 ? `••••${s.token.slice(-4)}` : '',
      events: s.events,
    },
  });
}

// POST: simpan pengaturan, atau kirim pesan tes { testPhone }
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();

    // Mode tes: kirim 1 pesan tes ke nomor yang diberikan
    if (body.testPhone) {
      const target = formatWhatsAppNumber(String(body.testPhone));
      if (!target) {
        return NextResponse.json({ success: false, error: 'Nomor WA tes tidak valid.' }, { status: 400 });
      }
      const ok = await sendWaMessage(
        target,
        `Tes notifikasi *HR FOOD* ✅\n\nKalau pesan ini masuk, berarti notifikasi WA otomatis sudah jalan. 🎉`
      );
      return NextResponse.json({
        success: ok,
        error: ok ? undefined : 'Gagal mengirim. Cek token Fonnte & pastikan notifikasi AKTIF.',
      });
    }

    const { enabled, token, events } = body;
    const cleanEvents: Partial<Record<WaNotifyEvent, boolean>> = {};
    if (events && typeof events === 'object') {
      (['order_received', 'cooking', 'ready', 'completed'] as WaNotifyEvent[]).forEach((k) => {
        if (typeof events[k] === 'boolean') cleanEvents[k] = events[k];
      });
    }

    const saved = await saveWaNotifySettings({
      enabled: typeof enabled === 'boolean' ? enabled : undefined,
      token: typeof token === 'string' ? token : undefined,
      events: cleanEvents,
    });

    return NextResponse.json({
      success: true,
      data: {
        enabled: saved.enabled,
        tokenSet: saved.token.length > 0,
        events: saved.events,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Gagal menyimpan.' }, { status: 500 });
  }
}
