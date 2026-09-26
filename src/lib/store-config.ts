import fs from 'fs';
import path from 'path';
import { StoreConfig } from '@/types/order';

const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'store_config.json');
const BUNDLED_CONFIG_FILE = path.join(process.cwd(), 'data', 'store_config.json');

declare global {
  var __CACHED_STORE_CONFIG__: StoreConfig | undefined;
}

const DEFAULT_STORE_CONFIG: StoreConfig = {
  isOpen: true,
  autoSchedule: false,
  openTime: '10:00',
  closeTime: '22:00',
  closedMessage: 'Maaf, saat ini HR FOOD sedang tutup. Jam operasional kami pukul 10:00 - 22:00 WIB. Pemesanan akan dibuka kembali saat resto beroperasi.',
};

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONFIG_FILE)) {
      if (fs.existsSync(BUNDLED_CONFIG_FILE)) {
        const bundledContent = fs.readFileSync(BUNDLED_CONFIG_FILE, 'utf-8');
        fs.writeFileSync(CONFIG_FILE, bundledContent, 'utf-8');
      } else {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_STORE_CONFIG, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    console.warn('Filesystem access warning (Vercel serverless):', err);
  }
}

export function getStoreConfig(): StoreConfig {
  ensureDataDir();
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const config: StoreConfig = JSON.parse(raw);
      globalThis.__CACHED_STORE_CONFIG__ = config;
      return config;
    }
  } catch (err) {
    console.error('Failed reading store config file, using fallback cache:', err);
  }
  return globalThis.__CACHED_STORE_CONFIG__ || DEFAULT_STORE_CONFIG;
}

export function saveStoreConfig(config: StoreConfig): StoreConfig {
  ensureDataDir();
  globalThis.__CACHED_STORE_CONFIG__ = config;
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed writing store config to filesystem, kept in memory:', err);
  }
  return config;
}
