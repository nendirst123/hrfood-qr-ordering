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

const DELETED_IDS_FILE = path.join(DATA_DIR, 'menu_deleted_ids.json');
const BUNDLED_DELETED_IDS_FILE = path.join(process.cwd(), 'data', 'menu_deleted_ids.json');

const OVERRIDES_FILE = path.join(DATA_DIR, 'menu_custom_overrides.json');
const BUNDLED_OVERRIDES_FILE = path.join(process.cwd(), 'data', 'menu_custom_overrides.json');

export type AvailabilityEntry = {
  isAvailable: boolean;
  updatedAt: number;
};

export type AvailabilityMap = Record<string, AvailabilityEntry>;

declare global {
  var __CACHED_MENU_ITEMS__: MenuItem[] | undefined;
  var __MENU_AVAILABILITY_MAP__: AvailabilityMap | undefined;
  var __DELETED_MENU_IDS__: Set<string> | undefined;
  var __MENU_OVERRIDES__: Record<string, MenuItem> | undefined;
}

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // 1. Pastikan menu.json ada
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

    // 2. Pastikan menu_availability.json ada
    if (!fs.existsSync(AVAILABILITY_FILE)) {
      if (fs.existsSync(BUNDLED_AVAILABILITY_FILE)) {
        const bundledAvail = fs.readFileSync(BUNDLED_AVAILABILITY_FILE, 'utf-8');
        fs.writeFileSync(AVAILABILITY_FILE, bundledAvail, 'utf-8');
      } else {
        fs.writeFileSync(AVAILABILITY_FILE, JSON.stringify({}, null, 2), 'utf-8');
      }
    }

    // 3. Pastikan menu_deleted_ids.json ada
    if (!fs.existsSync(DELETED_IDS_FILE)) {
      if (fs.existsSync(BUNDLED_DELETED_IDS_FILE)) {
        const bundled = fs.readFileSync(BUNDLED_DELETED_IDS_FILE, 'utf-8');
        fs.writeFileSync(DELETED_IDS_FILE, bundled, 'utf-8');
      } else {
        fs.writeFileSync(DELETED_IDS_FILE, JSON.stringify([], null, 2), 'utf-8');
      }
    }

    // 4. Pastikan menu_custom_overrides.json ada
    if (!fs.existsSync(OVERRIDES_FILE)) {
      if (fs.existsSync(BUNDLED_OVERRIDES_FILE)) {
        const bundled = fs.readFileSync(BUNDLED_OVERRIDES_FILE, 'utf-8');
        fs.writeFileSync(OVERRIDES_FILE, bundled, 'utf-8');
      } else {
        fs.writeFileSync(OVERRIDES_FILE, JSON.stringify({}, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    console.warn('Filesystem access warning (Vercel serverless):', err);
  }
}

// ----------------------------------------------------
// Peta Ketersediaan Stok (Availability)
// ----------------------------------------------------
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

// ----------------------------------------------------
// ID Menu yang Dihapus (Deleted Menu IDs)
// ----------------------------------------------------
export function getDeletedMenuIds(): string[] {
  ensureDataDir();
  if (globalThis.__DELETED_MENU_IDS__) {
    return Array.from(globalThis.__DELETED_MENU_IDS__);
  }

  const set = new Set<string>();
  try {
    if (fs.existsSync(DELETED_IDS_FILE)) {
      const raw = fs.readFileSync(DELETED_IDS_FILE, 'utf-8');
      const parsed = JSON.parse(raw || '[]');
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => set.add(id));
      }
    }
  } catch (err) {
    console.error('Failed reading deleted menu ids:', err);
  }

  globalThis.__DELETED_MENU_IDS__ = set;
  return Array.from(set);
}

export function saveDeletedMenuIds(ids: string[]): boolean {
  ensureDataDir();
  const set = new Set(ids);
  globalThis.__DELETED_MENU_IDS__ = set;
  const arr = Array.from(set);
  try {
    fs.writeFileSync(DELETED_IDS_FILE, JSON.stringify(arr, null, 2), 'utf-8');
    if (!isVercel && fs.existsSync(BUNDLED_DELETED_IDS_FILE)) {
      try {
        fs.writeFileSync(BUNDLED_DELETED_IDS_FILE, JSON.stringify(arr, null, 2), 'utf-8');
      } catch (e) {}
    }
    return true;
  } catch (err) {
    console.warn('Failed saving deleted menu ids to filesystem:', err);
    return false;
  }
}

// ----------------------------------------------------
// Kustomisasi & Edit Menu (Overrides)
// ----------------------------------------------------
export function getMenuOverrides(): Record<string, MenuItem> {
  ensureDataDir();
  if (globalThis.__MENU_OVERRIDES__) {
    return globalThis.__MENU_OVERRIDES__;
  }

  const overrides: Record<string, MenuItem> = {};
  try {
    if (fs.existsSync(OVERRIDES_FILE)) {
      const raw = fs.readFileSync(OVERRIDES_FILE, 'utf-8');
      const parsed = JSON.parse(raw || '{}');
      if (parsed && typeof parsed === 'object') {
        Object.assign(overrides, parsed);
      }
    }
  } catch (err) {
    console.error('Failed reading menu overrides:', err);
  }

  globalThis.__MENU_OVERRIDES__ = overrides;
  return overrides;
}

export function saveMenuOverrides(overrides: Record<string, MenuItem>): boolean {
  ensureDataDir();
  globalThis.__MENU_OVERRIDES__ = overrides;
  try {
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(overrides, null, 2), 'utf-8');
    if (!isVercel && fs.existsSync(BUNDLED_OVERRIDES_FILE)) {
      try {
        fs.writeFileSync(BUNDLED_OVERRIDES_FILE, JSON.stringify(overrides, null, 2), 'utf-8');
      } catch (e) {}
    }
    return true;
  } catch (err) {
    console.warn('Failed saving menu overrides to filesystem:', err);
    return false;
  }
}

// ----------------------------------------------------
// Ambil Seluruh Menu dengan Integrasi Override & Deleted
// ----------------------------------------------------
export function getMenuWithAvailability(): MenuItem[] {
  ensureDataDir();
  let baseItems: MenuItem[] = [];

  try {
    if (fs.existsSync(MENU_FILE)) {
      const raw = fs.readFileSync(MENU_FILE, 'utf-8');
      baseItems = JSON.parse(raw || '[]');
    }
  } catch (err) {
    console.error('Failed reading menu.json, using fallback:', err);
  }

  if (!baseItems || baseItems.length === 0) {
    baseItems = MENU_ITEMS;
  }

  const deletedIds = new Set(getDeletedMenuIds());
  const overrides = getMenuOverrides();
  const availabilityMap = getAvailabilityMap();

  // 1. Filter out deleted items
  const activeBase = baseItems.filter((item) => !deletedIds.has(item.id));

  // 2. Terapkan overrides pada base items
  const seenIds = new Set<string>();
  const mergedItems = activeBase.map((item) => {
    seenIds.add(item.id);
    const override = overrides[item.id];
    let currentItem = override ? { ...item, ...override, id: item.id } : { ...item };

    // Terapkan availability
    const availEntry = availabilityMap[item.id];
    if (availEntry !== undefined) {
      currentItem.isAvailable = availEntry.isAvailable;
      if (availEntry.updatedAt) {
        currentItem.updatedAt = new Date(availEntry.updatedAt).toISOString();
      }
    } else if (currentItem.isAvailable === undefined) {
      currentItem.isAvailable = true;
    }

    return currentItem;
  });

  // 3. Masukkan item custom baru yang ada di overrides tapi belum ada di base
  Object.values(overrides).forEach((customItem) => {
    if (!deletedIds.has(customItem.id) && !seenIds.has(customItem.id)) {
      seenIds.add(customItem.id);
      const availEntry = availabilityMap[customItem.id];
      const itemWithAvail: MenuItem = {
        ...customItem,
        isAvailable: availEntry !== undefined ? availEntry.isAvailable : customItem.isAvailable !== false,
        updatedAt: availEntry?.updatedAt ? new Date(availEntry.updatedAt).toISOString() : customItem.updatedAt,
      };
      mergedItems.push(itemWithAvail);
    }
  });

  globalThis.__CACHED_MENU_ITEMS__ = mergedItems;
  return mergedItems;
}

// Simpan seluruh menu ke disk jika memungkinkan
function saveMenuItems(items: MenuItem[]): boolean {
  ensureDataDir();
  globalThis.__CACHED_MENU_ITEMS__ = items;
  try {
    fs.writeFileSync(MENU_FILE, JSON.stringify(items, null, 2), 'utf-8');
    if (!isVercel && fs.existsSync(BUNDLED_MENU_FILE)) {
      try {
        fs.writeFileSync(BUNDLED_MENU_FILE, JSON.stringify(items, null, 2), 'utf-8');
      } catch (e) {}
    }
    return true;
  } catch (err) {
    console.warn('Failed saving menu.json to filesystem, kept in memory:', err);
    return true;
  }
}

// ----------------------------------------------------
// CRUD Menu dengan Jaminan Persistensi
// ----------------------------------------------------

// 1. Tambah Menu Baru
export function createMenuItem(item: Omit<MenuItem, 'id'> & { id?: string }): MenuItem {
  const id = item.id || `hr-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = Date.now();

  const newItem: MenuItem = {
    ...item,
    id,
    isAvailable: item.isAvailable !== false,
    updatedAt: now,
  };

  // Pastikan tidak ada di daftar deletedIds
  const deleted = getDeletedMenuIds().filter((dId) => dId !== id);
  saveDeletedMenuIds(deleted);

  // Simpan ke overrides
  const overrides = getMenuOverrides();
  overrides[id] = newItem;
  saveMenuOverrides(overrides);

  // Simpan ketersediaan
  const map = getAvailabilityMap();
  map[id] = { isAvailable: newItem.isAvailable !== false, updatedAt: now };
  saveAvailabilityMap(map);

  // Dapatkan menu segar
  const allItems = getMenuWithAvailability();
  saveMenuItems(allItems);

  return newItem;
}

// 2. Update Menu (Ganti Harga, Nama, Deskripsi, Kategori, Foto)
export function updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
  const allItems = getMenuWithAvailability();
  const existing = allItems.find((m) => m.id === id);
  if (!existing && !updates.name) return null;

  const now = Date.now();
  const updatedItem: MenuItem = {
    ...(existing || {}),
    ...updates,
    id, // ID tidak boleh berubah
    updatedAt: now,
  } as MenuItem;

  // Pastikan ID tidak ada di deleted
  const deleted = getDeletedMenuIds().filter((dId) => dId !== id);
  saveDeletedMenuIds(deleted);

  // Simpan ke overrides
  const overrides = getMenuOverrides();
  overrides[id] = updatedItem;
  saveMenuOverrides(overrides);

  // Refresh menu
  const refreshed = getMenuWithAvailability();
  saveMenuItems(refreshed);

  return updatedItem;
}

// 3. Hapus Menu Permanen
export function deleteMenuItem(id: string): boolean {
  // Tambahkan ke deletedIds
  const deleted = new Set(getDeletedMenuIds());
  deleted.add(id);
  saveDeletedMenuIds(Array.from(deleted));

  // Hapus dari overrides
  const overrides = getMenuOverrides();
  if (overrides[id]) {
    delete overrides[id];
    saveMenuOverrides(overrides);
  }

  // Hapus dari availability
  const map = getAvailabilityMap();
  if (map[id]) {
    delete map[id];
    saveAvailabilityMap(map);
  }

  // Refresh menu
  const refreshed = getMenuWithAvailability();
  saveMenuItems(refreshed);

  return true;
}

// 4. Pulihkan Menu yang Pernah Dihapus (Restore)
export function restoreMenuItem(id: string): MenuItem | null {
  const deleted = getDeletedMenuIds().filter((dId) => dId !== id);
  saveDeletedMenuIds(deleted);

  const refreshed = getMenuWithAvailability();
  saveMenuItems(refreshed);

  return refreshed.find((m) => m.id === id) || null;
}

// 5. Toggle Ketersediaan Stok Satuan
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
  return { success: true, availabilityMap: map };
}

// 6. Sinkronisasi Ketersediaan Stok Massal
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
  }

  return currentMap;
}

// 7. Sinkronisasi Komprehensif Perubahan Menu (Self-Healing untuk Vercel Serverless)
export function syncMenuData(incoming: {
  deletedIds?: string[];
  overrides?: Record<string, MenuItem>;
  syncAvailability?: Record<string, any>;
}): {
  items: MenuItem[];
  availabilityMap: AvailabilityMap;
  deletedIds: string[];
  overrides: Record<string, MenuItem>;
} {
  let hasDeletedChanges = false;
  let hasOverrideChanges = false;

  // Sync deleted IDs
  if (Array.isArray(incoming.deletedIds) && incoming.deletedIds.length > 0) {
    const currentDeleted = new Set(getDeletedMenuIds());
    incoming.deletedIds.forEach((id) => {
      if (!currentDeleted.has(id)) {
        currentDeleted.add(id);
        hasDeletedChanges = true;
      }
    });
    if (hasDeletedChanges) {
      saveDeletedMenuIds(Array.from(currentDeleted));
    }
  }

  // Sync overrides
  if (incoming.overrides && typeof incoming.overrides === 'object') {
    const currentOverrides = getMenuOverrides();
    Object.entries(incoming.overrides).forEach(([id, incomingItem]) => {
      if (!id || !incomingItem) return;
      const existing = currentOverrides[id];
      const incomingTime = incomingItem.updatedAt
        ? new Date(incomingItem.updatedAt).getTime()
        : Date.now();
      const existingTime = existing?.updatedAt
        ? new Date(existing.updatedAt).getTime()
        : 0;

      if (!existing || incomingTime >= existingTime) {
        currentOverrides[id] = {
          ...incomingItem,
          updatedAt: incomingTime,
        };
        hasOverrideChanges = true;
      }
    });
    if (hasOverrideChanges) {
      saveMenuOverrides(currentOverrides);
    }
  }

  // Sync availability
  if (incoming.syncAvailability) {
    syncMenuAvailability(incoming.syncAvailability);
  }

  const items = getMenuWithAvailability();
  return {
    items,
    availabilityMap: getAvailabilityMap(),
    deletedIds: getDeletedMenuIds(),
    overrides: getMenuOverrides(),
  };
}
