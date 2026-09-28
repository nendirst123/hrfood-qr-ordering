// HR FOOD Geolocation & Distance Calculation Utility (Haversine Formula)

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Pusat Koordinat Resto HR Food (Titik Pangkal Pengantaran - Bunijaya, Gununghalu)
export const RESTO_COORDINATES: Coordinates = {
  latitude: -7.0101905,
  longitude: 107.2760032,
};

// Preset Wilayah / Desa / Kompleks Sekitar HR Food (Bagi pelanggan yang memilih manual tanpa GPS)
export interface VillagePreset {
  id: string;
  name: string;
  description: string;
  nominalKm: number;
  coords?: Coordinates;
}

export const LOCAL_VILLAGE_PRESETS: VillagePreset[] = [
  {
    id: 'preset-desa-pusat',
    name: 'Desa Bunijaya / Sekitar Resto (< 1 km)',
    description: 'Area pasar, balai desa Bunijaya, dan pertokoan dekat HR Food',
    nominalKm: 0.8,
    coords: { latitude: -7.0108, longitude: 107.2770 },
  },
  {
    id: 'preset-gununghalu',
    name: 'Desa Gununghalu / Sukasirna (~1.8 km)',
    description: 'Pemukiman warga, kantor kecamatan, dan pertigaan Gununghalu',
    nominalKm: 1.8,
    coords: { latitude: -7.0180, longitude: 107.2840 },
  },
  {
    id: 'preset-sirnajaya',
    name: 'Desa Sirnajaya & Sindangjaya (~2.8 km)',
    description: 'Perkampungan timur, sekolah SMP/SMA, dan area perumahan warga',
    nominalKm: 2.8,
    coords: { latitude: -7.0250, longitude: 107.2890 },
  },
  {
    id: 'preset-celak',
    name: 'Desa Celak & Sekitarnya (~4.2 km)',
    description: 'Komplek pemukiman, ruko, klinik kesehatan, dan pesantren',
    nominalKm: 4.2,
    coords: { latitude: -7.0380, longitude: 107.2950 },
  },
  {
    id: 'preset-rongga',
    name: 'Wilayah Rongga & Perbatasan (~5.8 km)',
    description: 'Jalur jalan raya utama dan perkampungan batas barat',
    nominalKm: 5.8,
    coords: { latitude: -7.0520, longitude: 107.3020 },
  },
  {
    id: 'preset-luar-wilayah',
    name: 'Radius Luar Kecamatan (> 7 km)',
    description: 'Wilayah tetangga kecamatan / perbatasan radius jauh',
    nominalKm: 7.5,
    coords: { latitude: -7.0700, longitude: 107.3150 },
  },
];

// Rumus Haversine: Menghitung jarak lurus dua titik koordinat bumi (dalam Kilometer)
export function calculateHaversineDistanceKm(
  coord1: Coordinates,
  coord2: Coordinates = RESTO_COORDINATES
): number {
  const R = 6371; // Radius bumi dalam KM
  const dLat = deg2rad(coord2.latitude - coord1.latitude);
  const dLon = deg2rad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coord1.latitude)) *
      Math.cos(deg2rad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const rawDistance = R * c;

  // Kalikan faktor koreksi rute jalan darat (sekitar 1.25x dari garis lurus udara)
  const roadDistance = rawDistance * 1.25;

  // Pembulatan ke 1 angka di belakang koma (minimal 0.5 km)
  return Math.max(0.5, Math.round(roadDistance * 10) / 10);
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export interface DeliveryCalculationResult {
  distanceKm: number;
  fee: number;
  estimatedMinutesText: string;
  zoneName: string;
  isFreeDelivery: boolean;
}

// Hitung ongkir otomatis berdasarkan jarak KM
export function calculateDeliveryFeeFromKm(
  distanceKm: number,
  cartSubtotal: number = 0,
  freeDeliveryThreshold?: number
): DeliveryCalculationResult {
  // Cek apakah tembus batas gratis ongkir
  const isFreeDelivery = !!(freeDeliveryThreshold && cartSubtotal >= freeDeliveryThreshold);

  let fee = 0;
  let zoneName = '';
  let estimatedMin = 15;
  let estimatedMax = 25;

  if (distanceKm <= 2.0) {
    fee = 5000;
    zoneName = `Area Dekat (${distanceKm} km)`;
    estimatedMin = 15;
    estimatedMax = 25;
  } else if (distanceKm <= 4.5) {
    fee = 8000;
    zoneName = `Area Sedang (${distanceKm} km)`;
    estimatedMin = 20;
    estimatedMax = 35;
  } else if (distanceKm <= 7.0) {
    fee = 12000;
    zoneName = `Area Menengah (${distanceKm} km)`;
    estimatedMin = 30;
    estimatedMax = 45;
  } else if (distanceKm <= 10.0) {
    fee = 18000;
    zoneName = `Area Luar (${distanceKm} km)`;
    estimatedMin = 40;
    estimatedMax = 55;
  } else {
    // Di atas 10 km: base 18rb + 2rb/km
    const extraKm = Math.ceil(distanceKm - 10);
    fee = 18000 + extraKm * 2000;
    zoneName = `Luar Jangkauan (${distanceKm} km)`;
    estimatedMin = 50;
    estimatedMax = 70;
  }

  return {
    distanceKm,
    fee: isFreeDelivery ? 0 : fee,
    estimatedMinutesText: `${estimatedMin} - ${estimatedMax} Menit`,
    zoneName,
    isFreeDelivery,
  };
}
