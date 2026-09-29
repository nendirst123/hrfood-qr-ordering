// Lapisan penyimpanan HR Food.
// - Di Vercel (POSTGRES_URL terisi, dari integrasi Neon): data disimpan di Postgres.
// - Lokal/dev (POSTGRES_URL kosong): tetap pakai file JSON di ./data (perilaku lama).
//
// Polanya key-value: satu tabel app_kv menyimpan seluruh dokumen JSON
// (orders, menu, promos, dsb). Cukup untuk skala warung dan membuat migrasi aman.

import fs from 'fs';
import path from 'path';

const DB_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
export const isDbEnabled = !!DB_URL;

// ---------------------------------------------------------------------------
// Fallback file lokal (dipakai saat dev tanpa database, dan sebagai seed awal)
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), 'data');

const FILE_MAP: Record<string, string> = {
  orders: 'orders.json',
  menu: 'menu.json',
  menu_availability: 'menu_availability.json',
  menu_deleted_ids: 'menu_deleted_ids.json',
  menu_overrides: 'menu_custom_overrides.json',
  promos: 'promos.json',
  store_config: 'store_config.json',
  delivery_settings: 'delivery_settings.json',
};

function localFilePath(key: string): string {
  return path.join(DATA_DIR, FILE_MAP[key] || `${key}.json`);
}

function readLocalFile<T>(key: string, fallback: T): T {
  try {
    const f = localFilePath(key);
    if (fs.existsSync(f)) {
      const raw = fs.readFileSync(f, 'utf-8');
      const parsed = JSON.parse(raw || 'null');
      return (parsed ?? fallback) as T;
    }
  } catch (err) {
    console.warn(`db: gagal baca file lokal ${key}:`, err);
  }
  return fallback;
}

function writeLocalFile(key: string, value: unknown): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(localFilePath(key), JSON.stringify(value, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`db: gagal tulis file lokal ${key}:`, err);
  }
}

// ---------------------------------------------------------------------------
// Postgres (Neon) via @vercel/postgres
// ---------------------------------------------------------------------------
let initPromise: Promise<void> | null = null;

async function ensureDbReady(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const { sql } = await import('@vercel/postgres');

    await sql`
      CREATE TABLE IF NOT EXISTS app_kv (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Seed awal dari file bawaan repo bila key belum ada.
    // 'orders' sengaja TIDAK di-seed (mulai kosong, tanpa data tes lama).
    const seeds: Record<string, unknown> = {
      menu: readLocalFile('menu', [] as unknown[]),
      menu_availability: readLocalFile('menu_availability', {}),
      menu_deleted_ids: readLocalFile('menu_deleted_ids', [] as string[]),
      menu_overrides: readLocalFile('menu_overrides', {}),
      promos: readLocalFile('promos', null),
      store_config: readLocalFile('store_config', null),
      delivery_settings: readLocalFile('delivery_settings', null),
    };

    for (const [key, value] of Object.entries(seeds)) {
      if (value === null || value === undefined) continue;
      await sql`
        INSERT INTO app_kv (key, value) VALUES (${key}, ${JSON.stringify(value)}::jsonb)
        ON CONFLICT (key) DO NOTHING
      `;
    }
  })().catch((err) => {
    // Biar percobaan berikutnya bisa retry, bukan nyangkut di promise gagal.
    initPromise = null;
    throw err;
  });
  return initPromise;
}

/** Baca satu dokumen JSON berdasarkan key. */
export async function kvGet<T>(key: string, fallback: T): Promise<T> {
  if (!isDbEnabled) {
    return readLocalFile<T>(key, fallback);
  }
  await ensureDbReady();
  const { sql } = await import('@vercel/postgres');
  const { rows } = await sql`SELECT value FROM app_kv WHERE key = ${key} LIMIT 1`;
  if (rows.length === 0) return fallback;
  return rows[0].value as T;
}

/** Tulis satu dokumen JSON berdasarkan key (upsert). */
export async function kvSet(key: string, value: unknown): Promise<void> {
  if (!isDbEnabled) {
    writeLocalFile(key, value);
    return;
  }
  await ensureDbReady();
  const { sql } = await import('@vercel/postgres');
  await sql`
    INSERT INTO app_kv (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}
