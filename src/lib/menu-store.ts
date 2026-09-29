import { kvGet, kvSet } from './db';
import { MENU_ITEMS } from '@/data/menu';
import { MenuItem } from '@/types/order';

const MENU_KEY = 'menu';
const AVAILABILITY_KEY = 'menu_availability';
const DELETED_IDS_KEY = 'menu_deleted_ids';
const OVERRIDES_KEY = 'menu_overrides';

export type AvailabilityEntry = {
  isAvailable: boolean;
  updatedAt: number;
};

export type AvailabilityMap = Record<string, AvailabilityEntry>;

// ----------------------------------------------------
// Peta Ketersediaan Stok (Availability)
// ----------------------------------------------------
export async function getAvailabilityMap(): Promise<AvailabilityMap> {
  const parsed = await kvGet<Record<string, any>>(AVAILABILITY_KEY, {});
  const map: AvailabilityMap = {};
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
  return map;
}

export async function saveAvailabilityMap(map: AvailabilityMap): Promise<boolean> {
  try {
    await kvSet(AVAILABILITY_KEY, map);
    return true;
  } catch (err) {
    console.warn('Failed saving availability map:', err);
    return false;
  }
}

// ----------------------------------------------------
// ID Menu yang Dihapus (Deleted Menu IDs)
// ----------------------------------------------------
export async function getDeletedMenuIds(): Promise<string[]> {
  const parsed = await kvGet<string[]>(DELETED_IDS_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

export async function saveDeletedMenuIds(ids: string[]): Promise<boolean> {
  try {
    await kvSet(DELETED_IDS_KEY, Array.from(new Set(ids)));
    return true;
  } catch (err) {
    console.warn('Failed saving deleted menu ids:', err);
    return false;
  }
}

// ----------------------------------------------------
// Kustomisasi & Edit Menu (Overrides)
// ----------------------------------------------------
export async function getMenuOverrides(): Promise<Record<string, MenuItem>> {
  const parsed = await kvGet<Record<string, MenuItem>>(OVERRIDES_KEY, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

export async function saveMenuOverrides(overrides: Record<string, MenuItem>): Promise<boolean> {
  try {
    await kvSet(OVERRIDES_KEY, overrides);
    return true;
  } catch (err) {
    console.warn('Failed saving menu overrides:', err);
    return false;
  }
}

// ----------------------------------------------------
// Ambil Seluruh Menu dengan Integrasi Override & Deleted
// ----------------------------------------------------
export async function getMenuWithAvailability(): Promise<MenuItem[]> {
  const [baseItemsRaw, deletedIdsArr, overrides, availabilityMap, storeConfig] = await Promise.all([
    kvGet<MenuItem[]>(MENU_KEY, []),
    getDeletedMenuIds(),
    getMenuOverrides(),
    getAvailabilityMap(),
    kvGet<{ allSoldOut?: boolean }>('store_config', {}),
  ]);
  const allSoldOut = storeConfig?.allSoldOut === true;

  let baseItems: MenuItem[] = baseItemsRaw;
  if (!baseItems || baseItems.length === 0) {
    baseItems = MENU_ITEMS;
  }

  const deletedIds = new Set(deletedIdsArr);

  // 1. Filter out deleted items
  const activeBase = baseItems.filter((item) => !deletedIds.has(item.id));

  // 2. Terapkan overrides pada base items
  const seenIds = new Set<string>();
  const mergedItems = activeBase.map((item) => {
    seenIds.add(item.id);
    const override = overrides[item.id];
    let currentItem = override ? { ...item, ...override, id: item.id } : { ...item };

    // Terapkan availability (flag allSoldOut menimpa semua jadi habis)
    const availEntry = availabilityMap[item.id];
    if (allSoldOut) {
      currentItem.isAvailable = false;
    } else if (availEntry !== undefined) {
      currentItem.isAvailable = availEntry.isAvailable;
      if (availEntry.updatedAt) {
        currentItem.updatedAt = new Date(availEntry.updatedAt).toISOString();
      }
    } else if (currentItem.isAvailable === undefined) {
      currentItem.isAvailable = true;
    }

    // STOK OTOMATIS: stok 0 (atau negatif) memaksa status habis,
    // tanpa menimpa saklar manual — saat stok diisi lagi, status manual berlaku lagi.
    if (typeof currentItem.stock === 'number' && currentItem.stock <= 0) {
      currentItem.isAvailable = false;
    }

    return currentItem;
  });

  // 3. Masukkan item custom baru yang ada di overrides tapi belum ada di base
  Object.values(overrides).forEach((customItem) => {
    if (!deletedIds.has(customItem.id) && !seenIds.has(customItem.id)) {
      seenIds.add(customItem.id);
      const availEntry = availabilityMap[customItem.id];
      let avail = allSoldOut ? false : (availEntry !== undefined ? availEntry.isAvailable : customItem.isAvailable !== false);
      if (typeof customItem.stock === 'number' && customItem.stock <= 0) {
        avail = false;
      }
      const itemWithAvail: MenuItem = {
        ...customItem,
        isAvailable: avail,
        updatedAt: availEntry?.updatedAt ? new Date(availEntry.updatedAt).toISOString() : customItem.updatedAt,
      };
      mergedItems.push(itemWithAvail);
    }
  });

  return mergedItems;
}

// Simpan seluruh menu (base)
async function saveMenuItems(items: MenuItem[]): Promise<boolean> {
  try {
    await kvSet(MENU_KEY, items);
    return true;
  } catch (err) {
    console.warn('Failed saving menu items:', err);
    return false;
  }
}

// ----------------------------------------------------
// CRUD Menu
// ----------------------------------------------------

// 1. Tambah Menu Baru
export async function createMenuItem(item: Omit<MenuItem, 'id'> & { id?: string }): Promise<MenuItem> {
  const id = item.id || `hr-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = Date.now();

  const newItem: MenuItem = {
    ...item,
    id,
    isAvailable: item.isAvailable !== false,
    updatedAt: now,
  };

  // Pastikan tidak ada di daftar deletedIds
  const deleted = (await getDeletedMenuIds()).filter((dId) => dId !== id);
  await saveDeletedMenuIds(deleted);

  // Simpan ke overrides
  const overrides = await getMenuOverrides();
  overrides[id] = newItem;
  await saveMenuOverrides(overrides);

  // Simpan ketersediaan
  const map = await getAvailabilityMap();
  map[id] = { isAvailable: newItem.isAvailable !== false, updatedAt: now };
  await saveAvailabilityMap(map);

  // Dapatkan menu segar
  const allItems = await getMenuWithAvailability();
  await saveMenuItems(allItems);

  return newItem;
}

// 2. Update Menu (Ganti Harga, Nama, Deskripsi, Kategori, Foto)
export async function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
  const allItems = await getMenuWithAvailability();
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
  const deleted = (await getDeletedMenuIds()).filter((dId) => dId !== id);
  await saveDeletedMenuIds(deleted);

  // Simpan ke overrides
  const overrides = await getMenuOverrides();
  overrides[id] = updatedItem;
  await saveMenuOverrides(overrides);

  // Refresh menu
  const refreshed = await getMenuWithAvailability();
  await saveMenuItems(refreshed);

  return updatedItem;
}

// 3. Hapus Menu Permanen
export async function deleteMenuItem(id: string): Promise<boolean> {
  // Tambahkan ke deletedIds
  const deleted = new Set(await getDeletedMenuIds());
  deleted.add(id);
  await saveDeletedMenuIds(Array.from(deleted));

  // Hapus dari overrides
  const overrides = await getMenuOverrides();
  if (overrides[id]) {
    delete overrides[id];
    await saveMenuOverrides(overrides);
  }

  // Hapus dari availability
  const map = await getAvailabilityMap();
  if (map[id]) {
    delete map[id];
    await saveAvailabilityMap(map);
  }

  // Refresh menu
  const refreshed = await getMenuWithAvailability();
  await saveMenuItems(refreshed);

  return true;
}

// 4. Pulihkan Menu yang Pernah Dihapus (Restore)
export async function restoreMenuItem(id: string): Promise<MenuItem | null> {
  const deleted = (await getDeletedMenuIds()).filter((dId) => dId !== id);
  await saveDeletedMenuIds(deleted);

  const refreshed = await getMenuWithAvailability();
  await saveMenuItems(refreshed);

  return refreshed.find((m) => m.id === id) || null;
}

// 5. Toggle Ketersediaan Stok Satuan
export async function setMenuItemAvailability(
  id: string,
  isAvailable: boolean,
  clientUpdatedAt?: number
): Promise<{ success: boolean; availabilityMap: AvailabilityMap }> {
  const map = await getAvailabilityMap();
  const timestamp = clientUpdatedAt || Date.now();

  map[id] = {
    isAvailable,
    updatedAt: timestamp,
  };

  await saveAvailabilityMap(map);
  return { success: true, availabilityMap: map };
}

// 6. Sinkronisasi Ketersediaan Stok Massal
export async function syncMenuAvailability(
  incoming: Record<string, boolean | { isAvailable: boolean; updatedAt?: number }>
): Promise<AvailabilityMap> {
  const currentMap = await getAvailabilityMap();
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
    await saveAvailabilityMap(currentMap);
  }

  return currentMap;
}

// ----------------------------------------------------
// Stok Otomatis: kurangi saat order dibuat, kembalikan saat order dibatalkan
// ----------------------------------------------------

export type StockLine = { itemId: string; quantity: number };

/**
 * Coba kurangi stok untuk beberapa baris order.
 * Hanya item yang punya `stock` berupa angka yang dilacak (undefined = tanpa batas).
 * Mengembalikan { ok:false, insufficient:[nama...] } bila ada stok yang kurang —
 * dalam hal ini TIDAK ADA stok yang dikurangi (all-or-nothing).
 */
export async function tryDecrementStock(
  lines: StockLine[]
): Promise<{ ok: boolean; insufficient: string[] }> {
  const items = await getMenuWithAvailability();
  const byId = new Map(items.map((i) => [i.id, i]));

  // Agregasi qty per item (satu order bisa berisi item yang sama 2x)
  const totals = new Map<string, number>();
  for (const l of lines) {
    if (!l.itemId) continue;
    totals.set(l.itemId, (totals.get(l.itemId) || 0) + Math.max(0, Math.floor(Number(l.quantity) || 0)));
  }

  const insufficient: string[] = [];
  for (const [id, qty] of totals) {
    const item = byId.get(id);
    if (item && typeof item.stock === 'number' && item.stock < qty) {
      insufficient.push(`${item.name} (sisa ${item.stock})`);
    }
  }
  if (insufficient.length > 0) {
    return { ok: false, insufficient };
  }

  // Kurangi — tulis hanya field `stock` ke overrides agar tidak mengganggu
  // field lain (mis. status availability manual).
  const overrides = await getMenuOverrides();
  let changed = false;
  for (const [id, qty] of totals) {
    const item = byId.get(id);
    if (item && typeof item.stock === 'number' && qty > 0) {
      const prev = overrides[id] || {};
      const prevStock = typeof prev.stock === 'number' ? prev.stock : item.stock;
      overrides[id] = { ...prev, id, stock: Math.max(0, prevStock - qty) } as MenuItem;
      changed = true;
    }
  }
  if (changed) {
    await saveMenuOverrides(overrides);
  }
  return { ok: true, insufficient: [] };
}

/**
 * Kembalikan stok saat order dibatalkan.
 */
export async function restoreStock(lines: StockLine[]): Promise<void> {
  const items = await getMenuWithAvailability();
  const byId = new Map(items.map((i) => [i.id, i]));

  const totals = new Map<string, number>();
  for (const l of lines) {
    if (!l.itemId) continue;
    totals.set(l.itemId, (totals.get(l.itemId) || 0) + Math.max(0, Math.floor(Number(l.quantity) || 0)));
  }

  const overrides = await getMenuOverrides();
  let changed = false;
  for (const [id, qty] of totals) {
    const item = byId.get(id);
    if (item && typeof item.stock === 'number' && qty > 0) {
      const prev = overrides[id] || {};
      const prevStock = typeof prev.stock === 'number' ? prev.stock : item.stock;
      overrides[id] = { ...prev, id, stock: prevStock + qty } as MenuItem;
      changed = true;
    }
  }
  if (changed) {
    await saveMenuOverrides(overrides);
  }
}

// 7. Sinkronisasi Komprehensif Perubahan Menu
export async function syncMenuData(incoming: {
  deletedIds?: string[];
  overrides?: Record<string, MenuItem>;
  syncAvailability?: Record<string, any>;
}): Promise<{
  items: MenuItem[];
  availabilityMap: AvailabilityMap;
  deletedIds: string[];
  overrides: Record<string, MenuItem>;
}> {
  let hasDeletedChanges = false;
  let hasOverrideChanges = false;

  // Sync deleted IDs
  if (Array.isArray(incoming.deletedIds) && incoming.deletedIds.length > 0) {
    const currentDeleted = new Set(await getDeletedMenuIds());
    incoming.deletedIds.forEach((id) => {
      if (!currentDeleted.has(id)) {
        currentDeleted.add(id);
        hasDeletedChanges = true;
      }
    });
    if (hasDeletedChanges) {
      await saveDeletedMenuIds(Array.from(currentDeleted));
    }
  }

  // Sync overrides
  if (incoming.overrides && typeof incoming.overrides === 'object') {
    const currentOverrides = await getMenuOverrides();
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
      await saveMenuOverrides(currentOverrides);
    }
  }

  // Sync availability
  if (incoming.syncAvailability) {
    await syncMenuAvailability(incoming.syncAvailability);
  }

  const [items, availabilityMap, deletedIds, overrides] = await Promise.all([
    getMenuWithAvailability(),
    getAvailabilityMap(),
    getDeletedMenuIds(),
    getMenuOverrides(),
  ]);
  return { items, availabilityMap, deletedIds, overrides };
}
