import fs from 'fs';
import path from 'path';
import { PromoCode } from '@/types/order';

const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
const PROMO_FILE = path.join(DATA_DIR, 'promos.json');
const BUNDLED_PROMO_FILE = path.join(process.cwd(), 'data', 'promos.json');

declare global {
  var __CACHED_PROMOS__: PromoCode[] | undefined;
}

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

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PROMO_FILE)) {
      if (fs.existsSync(BUNDLED_PROMO_FILE)) {
        const bundledContent = fs.readFileSync(BUNDLED_PROMO_FILE, 'utf-8');
        fs.writeFileSync(PROMO_FILE, bundledContent, 'utf-8');
      } else {
        fs.writeFileSync(PROMO_FILE, JSON.stringify(DEFAULT_PROMOS, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    console.warn('Filesystem access warning (Vercel serverless):', err);
  }
}

export function getAllPromos(): PromoCode[] {
  ensureDataDir();
  try {
    if (fs.existsSync(PROMO_FILE)) {
      const raw = fs.readFileSync(PROMO_FILE, 'utf-8');
      const data: PromoCode[] = JSON.parse(raw);
      globalThis.__CACHED_PROMOS__ = data;
      return data;
    }
  } catch (err) {
    console.error('Failed reading promos file:', err);
  }
  return globalThis.__CACHED_PROMOS__ || DEFAULT_PROMOS;
}

export function saveAllPromos(promos: PromoCode[]): boolean {
  ensureDataDir();
  globalThis.__CACHED_PROMOS__ = promos;
  try {
    fs.writeFileSync(PROMO_FILE, JSON.stringify(promos, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('Failed writing promos to filesystem, kept in memory:', err);
    return true;
  }
}

export function upsertPromo(promo: PromoCode): PromoCode {
  const current = getAllPromos();
  const index = current.findIndex(p => p.id === promo.id || p.code.toUpperCase() === promo.code.toUpperCase());
  if (index >= 0) {
    current[index] = { ...promo, id: current[index].id, code: promo.code.toUpperCase() };
  } else {
    current.push({ ...promo, code: promo.code.toUpperCase() });
  }
  saveAllPromos(current);
  return promo;
}

export function deletePromo(id: string): boolean {
  const current = getAllPromos();
  const filtered = current.filter(p => p.id !== id);
  if (filtered.length === current.length) return false;
  return saveAllPromos(filtered);
}

export function validatePromo(code: string, subtotal: number): {
  valid: boolean;
  promo?: PromoCode;
  discountAmount: number;
  message: string;
} {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, discountAmount: 0, message: 'Kode promo belum dimasukkan' };
  }

  const promos = getAllPromos();
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
