import fs from 'fs';
import path from 'path';
import { DeliverySettings, DeliveryZone } from '@/types/order';

const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'delivery_settings.json');
const BUNDLED_DATA_FILE = path.join(process.cwd(), 'data', 'delivery_settings.json');

declare global {
  var __CACHED_DELIVERY_SETTINGS__: DeliverySettings | undefined;
}

const DEFAULT_SETTINGS: DeliverySettings = {
  isEnabled: true,
  minOrderAmount: 15000,
  freeDeliveryThreshold: 150000,
  whatsappNumber: '6283838432860',
  zones: [
    {
      id: 'zone-1',
      name: 'Zona 1 - Radius Dekat (< 2 km)',
      description: 'Area sekitar resto, kantor kelurahan, dan perumahan terdekat',
      fee: 5000,
      estimatedTime: '15 - 25 Menit',
      isActive: true,
    },
    {
      id: 'zone-2',
      name: 'Zona 2 - Radius Sedang (2 - 5 km)',
      description: 'Area perumahan pusat kota, ruko, dan sekolah/kampus',
      fee: 10000,
      estimatedTime: '25 - 35 Menit',
      isActive: true,
    },
    {
      id: 'zone-3',
      name: 'Zona 3 - Radius Luas (5 - 8 km)',
      description: 'Area pinggiran kota dan kawasan industri',
      fee: 15000,
      estimatedTime: '35 - 50 Menit',
      isActive: true,
    },
    {
      id: 'zone-4',
      name: 'Zona 4 - Luar Area (> 8 km)',
      description: 'Pengantaran jarak jauh khusus, tarif disesuaikan',
      fee: 25000,
      estimatedTime: '45 - 60 Menit',
      isActive: true,
    },
  ],
};

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      if (fs.existsSync(BUNDLED_DATA_FILE)) {
        const bundledContent = fs.readFileSync(BUNDLED_DATA_FILE, 'utf-8');
        fs.writeFileSync(DATA_FILE, bundledContent, 'utf-8');
      } else {
        fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    console.warn('Filesystem access warning (Vercel serverless):', err);
  }
}

export function getDeliverySettings(): DeliverySettings {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const settings: DeliverySettings = JSON.parse(raw);
      globalThis.__CACHED_DELIVERY_SETTINGS__ = settings;
      return settings;
    }
  } catch (err) {
    console.error('Failed reading delivery settings file, using fallback cache:', err);
  }
  return globalThis.__CACHED_DELIVERY_SETTINGS__ || DEFAULT_SETTINGS;
}

export function saveDeliverySettings(settings: DeliverySettings): DeliverySettings {
  ensureDataDir();
  globalThis.__CACHED_DELIVERY_SETTINGS__ = settings;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed writing delivery settings to filesystem, kept in memory:', err);
  }
  return settings;
}

export function updateDeliveryZone(zone: DeliveryZone): DeliverySettings {
  const current = getDeliverySettings();
  const index = current.zones.findIndex(z => z.id === zone.id);
  if (index >= 0) {
    current.zones[index] = zone;
  } else {
    current.zones.push(zone);
  }
  return saveDeliverySettings(current);
}

export function deleteDeliveryZone(zoneId: string): DeliverySettings {
  const current = getDeliverySettings();
  current.zones = current.zones.filter(z => z.id !== zoneId);
  return saveDeliverySettings(current);
}
