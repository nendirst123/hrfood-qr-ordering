import { kvGet, kvSet } from './db';
import { Order, OrderStatus } from '@/types/order';
import { formatWhatsAppNumber } from './whatsapp-helper';

// ----------------------------------------------------
// Notifikasi WhatsApp Otomatis ke Pelanggan
// Provider: Fonnte (https://fonnte.com) — gateway WA Indonesia,
// cukup dengan token API, tanpa perlu server WA sendiri.
// Owner mendaftarkan sendiri nomor pengirim di dashboard Fonnte,
// lalu menempel tokennya di panel admin (tab Notifikasi).
// ----------------------------------------------------

export type WaNotifyEvent = 'order_received' | 'cooking' | 'ready' | 'completed';

export interface WaNotifySettings {
  enabled: boolean;
  /** Token API Fonnte — disimpan server-side, tidak pernah dikirim ke client. */
  token: string;
  events: Record<WaNotifyEvent, boolean>;
}

const WA_KEY = 'wa_notify_settings';
const FONNTE_SEND_URL = 'https://api.fonnte.com/send';

const DEFAULT_EVENTS: Record<WaNotifyEvent, boolean> = {
  order_received: true,
  cooking: true,
  ready: true,
  completed: false,
};

export async function getWaNotifySettings(): Promise<WaNotifySettings> {
  const raw = await kvGet<Partial<WaNotifySettings>>(WA_KEY, {});
  return {
    enabled: !!raw?.enabled,
    token: typeof raw?.token === 'string' ? raw.token : '',
    events: {
      order_received: raw?.events?.order_received ?? DEFAULT_EVENTS.order_received,
      cooking: raw?.events?.cooking ?? DEFAULT_EVENTS.cooking,
      ready: raw?.events?.ready ?? DEFAULT_EVENTS.ready,
      completed: raw?.events?.completed ?? DEFAULT_EVENTS.completed,
    },
  };
}

export async function saveWaNotifySettings(
  patch: { enabled?: boolean; token?: string; events?: Partial<Record<WaNotifyEvent, boolean>> }
): Promise<WaNotifySettings> {
  const current = await getWaNotifySettings();
  const next: WaNotifySettings = {
    enabled: patch.enabled !== undefined ? !!patch.enabled : current.enabled,
    // Token hanya ditimpa bila diisi (tidak dikirim ulang dari client saat GET menyembunyikannya)
    token: typeof patch.token === 'string' && patch.token.trim() !== '' ? patch.token.trim() : current.token,
    events: {
      order_received: patch.events?.order_received ?? current.events.order_received,
      cooking: patch.events?.cooking ?? current.events.cooking,
      ready: patch.events?.ready ?? current.events.ready,
      completed: patch.events?.completed ?? current.events.completed,
    },
  };
  await kvSet(WA_KEY, next);
  return next;
}

/** Kirim 1 pesan WA via Fonnte. Mengembalikan true bila API menerima. */
export async function sendWaMessage(phone: string, message: string): Promise<boolean> {
  const settings = await getWaNotifySettings();
  if (!settings.enabled || !settings.token) return false;
  const target = formatWhatsAppNumber(phone || '');
  if (!target || !message) return false;

  try {
    const body = new URLSearchParams();
    body.set('target', target);
    body.set('message', message);
    body.set('countryCode', '62');

    const res = await fetch(FONNTE_SEND_URL, {
      method: 'POST',
      headers: { Authorization: settings.token },
      body,
    });
    if (!res.ok) {
      console.warn('[wa-notify] Fonnte HTTP', res.status);
      return false;
    }
    const json = (await res.json().catch(() => null)) as any;
    // Fonnte mengembalikan { status: true/false, ... }
    return !!json && json.status !== false;
  } catch (err) {
    console.warn('[wa-notify] gagal kirim:', err);
    return false;
  }
}

function toIdr(n: number): string {
  return `Rp${Number(n || 0).toLocaleString('id-ID')}`;
}

export function buildWaMessage(order: Order, event: WaNotifyEvent): string {
  const name = order.customerName || 'Kak';
  const no = order.orderNumber;
  const total = toIdr(order.total);
  const type = order.orderType || 'dine_in';

  switch (event) {
    case 'order_received': {
      const items = order.items.map((i) => `- ${i.quantity}x ${i.name}`).join('\n');
      return (
        `Halo ${name}! Terima kasih sudah pesan di *HR FOOD* 🍲\n\n` +
        `Pesanan *${no}* sudah kami terima:\n${items}\n\n` +
        `Total: *${total}*\n` +
        `Kami kabari lagi saat mulai dimasak ya. 🙏`
      );
    }
    case 'cooking':
      return (
        `Kabar baik ${name}! 👨‍🍳\n` +
        `Pesanan *${no}* sedang *dimasak* sekarang. Tunggu sebentar ya, aromanya sudah menggoda nih. 😋\n\n- HR FOOD`
      );
    case 'ready': {
      if (type === 'delivery') {
        return (
          `${name}, pesanan *${no}* sudah siap dan *sedang diantar*! 🛵💨\n` +
          `Mohon siapkan *${total}* ${order.isPaid ? '(sudah lunas ✅)' : 'tunai ya'}.\n\n- HR FOOD`
        );
      }
      if (type === 'takeaway') {
        return (
          `${name}, pesanan *${no}* sudah *siap diambil*! 🎉\n` +
          `Silakan datang ke kasir HR FOOD. Total *${total}*.\n\n- HR FOOD`
        );
      }
      return (
        `${name}, pesanan *${no}* (Meja ${order.tableNumber}) sudah *siap dihidangkan*! 🍽️\n` +
        `Selamat menikmati. 🙏\n\n- HR FOOD`
      );
    }
    case 'completed':
      return (
        `Terima kasih ${name} sudah jajan di *HR FOOD*! 🙏✨\n` +
        `Semoga puas dengan pesanan *${no}*. Ditunggu order berikutnya ya! 😊`
      );
  }
}

/** Petakan status order -> event notifikasi (null = tidak ada notif). */
export function statusToWaEvent(status: OrderStatus): WaNotifyEvent | null {
  if (status === 'cooking') return 'cooking';
  if (status === 'ready' || status === 'on_delivery') return 'ready';
  if (status === 'completed') return 'completed';
  return null;
}

/**
 * Kirim notifikasi untuk sebuah event. Aman dipanggil tanpa await
 * (fire-and-forget): gagal kirim tidak menggagalkan order.
 */
export async function notifyOrderEvent(order: Order, event: WaNotifyEvent): Promise<boolean> {
  try {
    const settings = await getWaNotifySettings();
    if (!settings.enabled || !settings.token) return false;
    if (!settings.events[event]) return false;
    const phone = (order.customerPhone || '').trim();
    if (!phone) return false;
    const message = buildWaMessage(order, event);
    return await sendWaMessage(phone, message);
  } catch (err) {
    console.warn('[wa-notify] notifyOrderEvent gagal:', err);
    return false;
  }
}
