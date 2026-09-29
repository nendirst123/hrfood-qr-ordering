import { kvGet, kvSet } from './db';
import { PromoCode } from '@/types/order';

const PROMOS_KEY = 'promos';

const DEFAULT_PROMOS: PromoCode[] = [
  {
    id: 'promo-1',
    code: 'HEMAT5K',
    title: 'Potongan Hemat Rp 5.000',
    type: 'fixed',
    value: 5000,
    minOrder: 25000,
    description: 'Potongan langsung Rp 5.000 untuk belanja minimal Rp 25.000',
    isActive: true,
  },
  {
    id: 'promo-2',
    code: 'DISKON10',
    title: 'Diskon 10% Spesial',
    type: 'percent',
    value: 10,
    minOrder: 35000,
    maxDiscount: 8000,
    description: 'Diskon 10% (maksimal potongan Rp 8.000) minimal order Rp 35.000',
    isActive: true,
  },
  {
    id: 'promo-3',
    code: 'GRATISONGKIR',
    title: 'Subsidi Ongkir Rp 5.000',
    type: 'fixed',
    value: 5000,
    minOrder: 30000,
    description: 'Potongan ongkos kirim Rp 5.000 khusus pesanan delivery',
    isActive: true,
  },
  {
    id: 'promo-4',
    code: 'WARGABARU',
    title: 'Promo Pengunjung Baru Rp 3.000',
    type: 'fixed',
    value: 3000,
    minOrder: 15000,
    description: 'Potongan Rp 3.000 untuk pelanggan baru HR Food',
    isActive: true,
  },
];

export async function getAllPromos(): Promise<PromoCode[]> {
  const data = await kvGet<PromoCode[]>(PROMOS_KEY, DEFAULT_PROMOS);
  return Array.isArray(data) && data.length > 0 ? data : DEFAULT_PROMOS;
}

export async function saveAllPromos(promos: PromoCode[]): Promise<boolean> {
  try {
    await kvSet(PROMOS_KEY, promos);
    return true;
  } catch (err) {
    console.warn('Failed saving promos:', err);
    return true;
  }
}

export async function upsertPromo(promo: PromoCode): Promise<PromoCode> {
  const current = await getAllPromos();
  const index = current.findIndex(p => p.id === promo.id || p.code.toUpperCase() === promo.code.toUpperCase());
  if (index >= 0) {
    current[index] = { ...promo, id: current[index].id, code: promo.code.toUpperCase() };
  } else {
    current.push({ ...promo, code: promo.code.toUpperCase() });
  }
  await saveAllPromos(current);
  return promo;
}

export async function deletePromo(id: string): Promise<boolean> {
  const current = await getAllPromos();
  const filtered = current.filter(p => p.id !== id);
  if (filtered.length === current.length) return false;
  return saveAllPromos(filtered);
}

export async function validatePromo(code: string, subtotal: number): Promise<{
  valid: boolean;
  promo?: PromoCode;
  discountAmount: number;
  message: string;
}> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, discountAmount: 0, message: 'Kode promo belum dimasukkan' };
  }

  const promos = await getAllPromos();
  const found = promos.find(p => p.code.toUpperCase() === cleanCode && p.isActive);

  if (!found) {
    return { valid: false, discountAmount: 0, message: 'Kode promo tidak ditemukan atau sudah tidak aktif' };
  }

  if (subtotal < found.minOrder) {
    return {
      valid: false,
      promo: found,
      discountAmount: 0,
      message: `Minimal belanja Rp ${found.minOrder.toLocaleString('id-ID')} untuk menggunakan kupon ini (Kurang Rp ${(found.minOrder - subtotal).toLocaleString('id-ID')})`,
    };
  }

  let discount = 0;
  if (found.type === 'fixed') {
    discount = found.value;
  } else if (found.type === 'percent') {
    discount = Math.round((subtotal * found.value) / 100);
    if (found.maxDiscount && discount > found.maxDiscount) {
      discount = found.maxDiscount;
    }
  }

  // Diskon tidak boleh melebihi subtotal
  discount = Math.min(discount, subtotal);

  return {
    valid: true,
    promo: found,
    discountAmount: discount,
    message: `Kupon ${found.code} berhasil digunakan! Hemat Rp ${discount.toLocaleString('id-ID')}`,
  };
}
