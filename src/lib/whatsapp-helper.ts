import { Order } from '@/types/order';

export function formatWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62') && cleaned.length > 0) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function generateCustomerWhatsAppUrl(order: Order): string {
  const phone = formatWhatsAppNumber(order.customerPhone || '');
  const itemsList = order.items
    .map(it => {
      const options = it.selectedOptions?.map(o => o.choiceLabel).join(', ');
      return `- ${it.quantity}x ${it.name}${options ? ` (${options})` : ''}`;
    })
    .join('\n');

  const text = `Halo Kak *${order.customerName}*, kami dari *HR FOOD*! 🍲✨

Pesanan Anda dengan nomor *${order.orderNumber}* sudah selesai dimasak dan sedang dalam perjalanan diantar oleh kurir ke alamat:
📍 *${order.deliveryAddress}*
${order.deliveryNotes ? `Patokan: ${order.deliveryNotes}\n` : ''}
📋 *Rincian Pesanan:*
${itemsList}

💰 *Total Tagihan:* *Rp ${order.total.toLocaleString('id-ID')}*
Status Pembayaran: *${order.isPaid ? 'SUDAH LUNAS (' + order.paymentMethod.toUpperCase() + ')' : 'BAYAR DI TEMPAT / COD (Mohon siapkan uang pas)'}*

Mohon ditunggu kedatangan kurir kami ya Kak. Selamat menikmati hidangan HR FOOD! 🙏`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function generateCourierWhatsAppUrl(order: Order, courierPhone: string = ''): string {
  const phone = formatWhatsAppNumber(courierPhone);
  const itemsList = order.items
    .map(it => {
      const notes = it.notes ? ` [Catatan: ${it.notes}]` : '';
      return `- ${it.quantity}x ${it.name}${notes}`;
    })
    .join('\n');

  const text = `🛵 *TUGAS PENGANTARAN KURIR - HR FOOD*
-------------------------------------
No. Order: *${order.orderNumber}*
Penerima: *${order.customerName}*
No. WA Penerima: ${order.customerPhone || '-'}
📍 Alamat: *${order.deliveryAddress}*
${order.deliveryNotes ? `Patokan: ${order.deliveryNotes}\n` : ''}
📋 Menu yang Dibawa:
${itemsList}

💵 Tagihan ke Tamu: *Rp ${order.total.toLocaleString('id-ID')}*
⚠️ Status Bayar: *${order.isPaid ? 'LUNAS (JANGAN MINTA PEMBAYARAN)' : 'COD / TAGIH TUNAI Rp ' + order.total.toLocaleString('id-ID')}*

Mohon hati-hati di jalan dan selamat bertugas! 🛵💨`;

  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}
