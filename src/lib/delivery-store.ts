import { kvGet, kvSet } from './db';
import { DeliverySettings, DeliveryZone } from '@/types/order';

const SETTINGS_KEY = 'delivery_settings';

const DEFAULT_SETTINGS: DeliverySettings = {
  isEnabled: true,
  minOrderAmount: 15000,
  freeDeliveryThreshold: 150000,
  whatsappNumber: '6283838432860',
  feeMode: 'per_km',
  perKmRate: 5000,
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

export async function getDeliverySettings(): Promise<DeliverySettings> {
  const settings = await kvGet<DeliverySettings | null>(SETTINGS_KEY, null);
  return settings || DEFAULT_SETTINGS;
}

export async function saveDeliverySettings(settings: DeliverySettings): Promise<DeliverySettings> {
  // Merge dengan settings lama agar partial update tidak menghapus field lain
  const current = await getDeliverySettings();
  const merged = { ...current, ...settings };
  await kvSet(SETTINGS_KEY, merged);
  return merged;
}

export async function updateDeliveryZone(zone: DeliveryZone): Promise<DeliverySettings> {
  const current = await getDeliverySettings();
  const index = current.zones.findIndex(z => z.id === zone.id);
  if (index >= 0) {
    current.zones[index] = zone;
  } else {
    current.zones.push(zone);
  }
  return saveDeliverySettings(current);
}

export async function deleteDeliveryZone(zoneId: string): Promise<DeliverySettings> {
  const current = await getDeliverySettings();
  current.zones = current.zones.filter(z => z.id !== zoneId);
  return saveDeliverySettings(current);
}
