import fs from 'fs';
import path from 'path';
import { MENU_ITEMS } from '@/data/menu';
import { MenuItem } from '@/types/order';

const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const BUNDLED_MENU_FILE = path.join(process.cwd(), 'data', 'menu.json');

const AVAILABILITY_FILE = path.join(DATA_DIR, 'menu_availability.json');
const BUNDLED_AVAILABILITY_FILE = path.join(process.cwd(), 'data', 'menu_availability.json');

export type AvailabilityEntry = {
  isAvailable: boolean;
  updatedAt: number;
};

export type AvailabilityMap = Record<string, AvailabilityEntry>;

declare global {
  var __CACHED_MENU_ITEMS__: MenuItem[] | undefined;
  var __MENU_AVAILABILITY_MAP__: AvailabilityMap | undefined;
}

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Pastikan menu.json ada
    if (!fs.existsSync(MENU_FILE)) {
      if (fs.existsSync(BUNDLED_MENU_FILE)) {
        const bundledContent = fs.readFileSync(BUNDLED_MENU_FILE, 'utf-8');
        fs.writeFileSync(MENU_FILE, bundledContent, 'utf-8');
      } else {
        const initialMenu: MenuItem[] = MENU_ITEMS.map((item) => ({
          ...item,
          isAvailable: true,
        }));
        fs.writeFileSync(MENU_FILE, JSON.stringify(initialMenu, null, 2), 'utf-8');
      }
    }

    // Pastikan menu_availability.json ada
    if (!fs.existsSync(AVAILABILITY_FILE)) {
      if (fs.existsSync(BUNDLED_AVAILABILITY_FILE)) {
        const bundledAvail = fs.readFileSync(BUNDLED_AVAILABILITY_FILE, 'utf-8');
        fs.writeFileSync(AVAILABILITY_FILE, bundledAvail, 'utf-8');
      } else {
        fs.writeFileSync(AVAILABILITY_FILE, JSON.stringify({}, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    console.warn('Filesystem access warning (Vercel serverless):', err);
  }
}

// Ambil seluruh peta ketersediaan
export function getAvailabilityMap(): AvailabilityMap {
  ensureDataDir();
  if (globalThis.__MENU_AVAILABILITY_MAP__ && Object.keys(globalThis.__MENU_AVAILABILITY_MAP__).length > 0) {
    return globalThis.__MENU_AVAILABILITY_MAP__;
  }

  const map: AvailabilityMap = {};
  try {
    if (fs.existsSync(AVAILABILITY_FILE)) {
      const raw = fs.readFileSync(AVAILABILITY_FILE, 'utf-8');
      const parsed = JSON.parse(raw || '{}');
      Object.entries(parsed).forEach(([id, val]) => {
        if (typeof val === 'boolean') {
          map[id] = { isAvailable: val, updatedAt: Date.now() };
        } else if (val && typeof val === 'object' && typeof (val as any).isAvailable === 'boolean') {
          map[id] = {
            isAvailable: (val as any).isAvailable,
            updatedAt: Number((val as any).updatedAt) || Date.now(),
          };
        }
      });
    }
  } catch (err) {
    console.error('Failed reading availability map:', err);
  }

  globalThis.__MENU_AVAILABILITY_MAP__ = map;
  return map;
}

// Simpan peta ketersediaan ke disk dan memory
export function saveAvailabilityMap(map: AvailabilityMap): boolean {
  ensureDataDir();
  globalThis.__MENU_AVAILABILITY_MAP__ = map;
  try {
    fs.writeFileSync(AVAILABILITY_FILE, JSON.stringify(map, null, 2), 'utf-8');
    if (!isVercel && fs.existsSync(BUNDLED_AVAILABILITY_FILE)) {
      try {
        fs.writeFileSync(BUNDLED_AVAILABILITY_FILE, JSON.stringify(map, null, 2), 'utf-8');
      } catch (e) {}
    }
    return true;
  } catch (err) {
    console.warn('Failed saving availability map to filesystem:', err);
    return false;
  }
}

// Ambil seluruh menu digabung dengan status ketersediaan terkini
export function getMenuWithAvailability(): MenuItem[] {
  ensureDataDir();
  let items: MenuItem[] = [];

  try {
    if (fs.existsSync(MENU_FILE)) {
      const raw = fs.readFileSync(MENU_FILE, 'utf-8');
      items = JSON.parse(raw || '[]');
    }
  } catch (err) {
    console.error('Failed reading menu.json, using fallback cache:', err);
  }

  if (!items || items.length === 0) {
    items = globalThis.__CACHED_MENU_ITEMS__ || MENU_ITEMS;
  }

  const availabilityMap = getAvailabilityMap();

  // Terapkan availabilityMap ke setiap menu item
  const mergedItems = items.map((item) => {
    const entry = availabilityMap[item.id];
    return {
      ...item,
      isAvailable: entry !== undefined ? entry.isAvailable : item.isAvailable !== false,
      updatedAt: entry?.updatedAt ? new Date(entry.updatedAt).toISOString() : item.updatedAt,
    };
  });

  globalThis.__CACHED_MENU_ITEMS__ = mergedItems;
  return mergedItems;
}

// Simpan seluruh menu
function saveMenuItems(items: MenuItem[]): boolean {
  ensureDataDir();
  globalThis.__CACHED_MENU_ITEMS__ = items;
  try {
    fs.writeFileSync(MENU_FILE, JSON.stringify(items, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('Failed saving menu.json to filesystem, kept in memory:', err);
    return true;
  }
}

// Tambah Menu Baru
export function createMenuItem(item: Omit<MenuItem, 'id'> & { id?: string }): MenuItem {
  const items = getMenuWithAvailability();
  const id = item.id || `hr-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newItem: MenuItem = {
    ...item,
    id,
    isAvailable: item.isAvailable !== false,
  };

  items.push(newItem);
  saveMenuItems(items);

  // Catat juga di availabilityMap
  const map = getAvailabilityMap();
  map[id] = { isAvailable: newItem.isAvailable !== false, updatedAt: Date.now() };
  saveAvailabilityMap(map);

  return newItem;
}

// Update Menu (Harga, Gambar, Nama, Kategori, dll)
export function updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
  const items = getMenuWithAvailability();
  const index = items.findIndex((m) => m.id === id);
  if (index === -1) return null;

  items[index] = {
    ...items[index],
    ...updates,
    id, // ID tidak boleh berubah
  };

  saveMenuItems(items);
  return items[index];
}

// Hapus Menu
export function deleteMenuItem(id: string): boolean {
  const items = getMenuWithAvailability();
  const filtered = items.filter((m) => m.id !== id);
  if (filtered.length === items.length) return false;

  const map = getAvailabilityMap();
  delete map[id];
  saveAvailabilityMap(map);

  return saveMenuItems(filtered);
}

// Toggle Ketersediaan Stok Satuan dengan Timestamp
export function setMenuItemAvailability(
  id: string,
  isAvailable: boolean,
  clientUpdatedAt?: number
): { success: boolean; availabilityMap: AvailabilityMap } {
  const map = getAvailabilityMap();
  const timestamp = clientUpdatedAt || Date.now();

  map[id] = {
    isAvailable,
    updatedAt: timestamp,
  };

  saveAvailabilityMap(map);
  updateMenuItem(id, { isAvailable });

  return { success: true, availabilityMap: map };
}

// Sinkronisasi Massal Status Ketersediaan Menu (Self-Healing untuk Vercel Serverless)
export function syncMenuAvailability(
  incoming: Record<string, boolean | { isAvailable: boolean; updatedAt?: number }>
): AvailabilityMap {
  const currentMap = getAvailabilityMap();
  let hasChanges = false;

  Object.entries(incoming).forEach(([id, val]) => {
    if (!id) return;
    const isAvail = typeof val === 'boolean' ? val : val?.isAvailable;
    const incomingTime = typeof val === 'object' && val?.updatedAt ? Number(val.updatedAt) : Date.now();

    if (typeof isAvail !== 'boolean') return;

    const existing = currentMap[id];
    if (!existing || incomingTime >= existing.updatedAt) {
      currentMap[id] = {
        isAvailable: isAvail,
        updatedAt: incomingTime,
      };
      hasChanges = true;
    }
  });

  if (hasChanges) {
    saveAvailabilityMap(currentMap);
    getMenuWithAvailability();
  }

  return currentMap;
}
