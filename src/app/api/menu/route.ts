import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { 
  getMenuWithAvailability, 
  getAvailabilityMap,
  getDeletedMenuIds,
  getMenuOverrides,
  setMenuItemAvailability, 
  syncMenuAvailability,
  syncMenuData,
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  restoreMenuItem
} from '@/lib/menu-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Ambil seluruh menu, peta ketersediaan, daftar deletedIds, & overrides
export async function GET() {
  const items = await getMenuWithAvailability();
  const availabilityMap = await getAvailabilityMap();
  const deletedIds = await getDeletedMenuIds();
  const overrides = await getMenuOverrides();
  return NextResponse.json({ 
    success: true, 
    items, 
    availabilityMap, 
    deletedIds, 
    overrides 
  });
}

// POST: Tambah menu baru, toggle availability, syncMenuData, ATAU restore menu
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const body = await req.json();

    // 1. Sinkronisasi perubahan menu komprehensif (Self-Healing Serverless)
    if (body.syncMenuData && typeof body.syncMenuData === 'object') {
      const res = await syncMenuData(body.syncMenuData);
      return NextResponse.json({ 
        success: true, 
        items: res.items, 
        availabilityMap: res.availabilityMap,
        deletedIds: res.deletedIds,
        overrides: res.overrides,
      });
    }

    // 2. Sinkronisasi ketersediaan stok massal (legacy support)
    if (body.syncAvailability && typeof body.syncAvailability === 'object') {
      const mergedMap = await syncMenuAvailability(body.syncAvailability);
      const items = await getMenuWithAvailability();
      return NextResponse.json({ 
        success: true, 
        availabilityMap: mergedMap, 
        items,
        deletedIds: await getDeletedMenuIds(),
        overrides: await getMenuOverrides(),
      });
    }

    // 3. Pulihkan menu yang pernah dihapus
    if (body.restoreId && typeof body.restoreId === 'string') {
      const restored = await restoreMenuItem(body.restoreId);
      return NextResponse.json({ 
        success: true, 
        data: restored,
        deletedIds: await getDeletedMenuIds(),
        items: await getMenuWithAvailability(),
      });
    }

    // 4. Toggle stok satuan: { id, isAvailable, updatedAt? }
    if (body.id && typeof body.isAvailable === 'boolean') {
      const res = await setMenuItemAvailability(body.id, body.isAvailable, body.updatedAt);
      return NextResponse.json({ 
        success: res.success, 
        availabilityMap: res.availabilityMap,
        deletedIds: await getDeletedMenuIds(),
      });
    }

    // 5. Tambah menu baru
    const { name, category, price, description, image, isPopular } = body;
    if (!name || !price || !category) {
      return NextResponse.json({ success: false, error: 'Nama, kategori, dan harga wajib diisi' }, { status: 400 });
    }

    const newItem = await createMenuItem({
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      description: description?.trim() || '',
      image: image?.trim() || '/menu/ayam-kampung.jpg',
      isPopular: !!isPopular,
      isAvailable: true,
      options: [
        {
          name: 'Pilihan Varian Sambal',
          choices: [
            { label: 'Sambal Terasi (Klasik & Nagih)', extraPrice: 0 },
            { label: 'Sambal Bawang (Segar & Pedas)', extraPrice: 0 },
            { label: 'Sambal Cabe Ijo (Pedasnya Mantap)', extraPrice: 0 },
            { label: 'Tanpa Sambal / Sambal Dipisah', extraPrice: 0 },
          ],
        },
        {
          name: 'Level Pedas',
          choices: [
            { label: 'Level 1 - Sedang Gurih', extraPrice: 0 },
            { label: 'Level 2 - Pedas Mantap', extraPrice: 0 },
            { label: 'Level 3 - Pedas Nampol (Extra Cabe)', extraPrice: 1000 },
            { label: 'Level 0 - Tidak Pedas', extraPrice: 0 },
          ],
        }
      ]
    });

    return NextResponse.json({ 
      success: true, 
      data: newItem,
      deletedIds: await getDeletedMenuIds(),
      overrides: await getMenuOverrides(),
    });
  } catch (err) {
    console.error('Menu POST error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memproses menu' }, { status: 500 });
  }
}

// PUT: Edit menu (Harga, Nama, Gambar, Deskripsi, Kategori, isPopular)
export async function PUT(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const { id, name, price, description, image, category, isPopular, options, isAvailable, stock } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID menu wajib disertakan' }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (price !== undefined) updates.price = Number(price);
    if (description !== undefined) updates.description = description.trim();
    if (image !== undefined) updates.image = image.trim();
    if (category !== undefined) updates.category = category.trim();
    if (isPopular !== undefined) updates.isPopular = !!isPopular;
    if (isAvailable !== undefined) updates.isAvailable = !!isAvailable;
    if (options !== undefined) updates.options = options;
    // Stok: angka >= 0, atau null untuk "tanpa batas" (tidak dilacak)
    if (stock !== undefined) {
      if (stock === null || stock === '') {
        updates.stock = null;
      } else {
        const n = Math.floor(Number(stock));
        if (Number.isNaN(n) || n < 0 || n > 1000000) {
          return NextResponse.json({ success: false, error: 'Stok harus angka 0 atau lebih.' }, { status: 400 });
        }
        updates.stock = n;
      }
    }

    const updated = await updateMenuItem(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Menu tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: updated,
      deletedIds: await getDeletedMenuIds(),
      overrides: await getMenuOverrides(),
    });
  } catch (err) {
    console.error('Menu PUT error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui menu' }, { status: 500 });
  }
}

// DELETE: Hapus menu secara permanen
export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID menu wajib disertakan' }, { status: 400 });
    }

    const ok = await deleteMenuItem(id);
    return NextResponse.json({ 
      success: ok,
      deletedId: id,
      deletedIds: await getDeletedMenuIds(),
      overrides: await getMenuOverrides(),
    });
  } catch (err) {
    console.error('Menu DELETE error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menghapus menu' }, { status: 500 });
  }
}
