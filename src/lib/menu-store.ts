import fs from 'fs';
import path from 'path';
import { MENU_ITEMS } from '@/data/menu';
import { MenuItem } from '@/types/order';

const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const BUNDLED_MENU_FILE = path.join(process.cwd(), 'data', 'menu.json');

declare global {
  var __CACHED_MENU_ITEMS__: MenuItem[] | undefined;
}

function ensureMenuFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(MENU_FILE)) {
      if (fs.existsSync(BUNDLED_MENU_FILE)) {
        const bundledContent = fs.readFileSync(BUNDLED_MENU_FILE, 'utf-8');
        fs.writeFileSync(MENU_FILE, bundledContent, 'utf-8');
      } else {
        // Inisialisasi awal dari menu.ts dengan default isAvailable: true
        const initialMenu: MenuItem[] = MENU_ITEMS.map(item => ({
          ...item,
          isAvailable: true,
        }));
        fs.writeFileSync(MENU_FILE, JSON.stringify(initialMenu, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    console.warn('Filesystem access warning (Vercel serverless):', err);
  }
}

// Ambil seluruh menu
export function getMenuWithAvailability(): MenuItem[] {
  ensureMenuFile();
  try {
    if (fs.existsSync(MENU_FILE)) {
      const raw = fs.readFileSync(MENU_FILE, 'utf-8');
      const items: MenuItem[] = JSON.parse(raw || '[]');
      globalThis.__CACHED_MENU_ITEMS__ = items;
      return items;
    }
  } catch (err) {
    console.error('Failed reading menu.json, using in-memory cache:', err);
  }
  return globalThis.__CACHED_MENU_ITEMS__ || MENU_ITEMS;
}

// Simpan seluruh menu
function saveMenuItems(items: MenuItem[]): boolean {
  ensureMenuFile();
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
  return newItem;
}

// Update Menu (Harga, Gambar, Nama, Kategori, dll)
export function updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
  const items = getMenuWithAvailability();
  const index = items.findIndex(m => m.id === id);
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
  const filtered = items.filter(m => m.id !== id);
  if (filtered.length === items.length) return false;

  return saveMenuItems(filtered);
}

// Toggle Ketersediaan Stok
export function setMenuItemAvailability(id: string, isAvailable: boolean): boolean {
  const updated = updateMenuItem(id, { isAvailable });
  return !!updated;
}
