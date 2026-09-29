import { kvGet, kvSet } from './db';
import { StoreConfig } from '@/types/order';

const CONFIG_KEY = 'store_config';

const DEFAULT_STORE_CONFIG: StoreConfig = {
  isOpen: true,
  autoSchedule: false,
  openTime: '10:00',
  closeTime: '22:00',
  closedMessage: 'Maaf, saat ini HR FOOD sedang tutup. Jam operasional kami pukul 10:00 - 22:00 WIB. Pemesanan akan dibuka kembali saat resto beroperasi.',
  storeAddress: 'Bunijaya, Kec. Gununghalu, Kab. Bandung Barat, Jawa Barat (Resto HR Food)',
  storeLatitude: -7.0101905,
  storeLongitude: 107.2760032,
  storePhone: '0838-3843-2860',
};

export async function getStoreConfig(): Promise<StoreConfig> {
  const config = await kvGet<StoreConfig | null>(CONFIG_KEY, null);
  return config || DEFAULT_STORE_CONFIG;
}

export async function saveStoreConfig(config: StoreConfig): Promise<StoreConfig> {
  await kvSet(CONFIG_KEY, config);
  return config;
}
