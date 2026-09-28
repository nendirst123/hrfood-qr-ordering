import { NextResponse } from 'next/server';
import { 
  getMenuWithAvailability, 
  getAvailabilityMap,
  setMenuItemAvailability, 
  syncMenuAvailability,
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem 
} from '@/lib/menu-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Ambil seluruh menu & peta ketersediaan
export async function GET() {
  const items = getMenuWithAvailability();
  const availabilityMap = getAvailabilityMap();
  return NextResponse.json({ success: true, items, availabilityMap });
}

// POST: Tambah menu baru, toggle availability, ATAU sinkronisasi ketersediaan
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Sinkronisasi ketersediaan massal (Self-Healing Serverless)
    if (body.syncAvailability && typeof body.syncAvailability === 'object') {
      const mergedMap = syncMenuAvailability(body.syncAvailability);
      const items = getMenuWithAvailability();
      return NextResponse.json({ success: true, availabilityMap: mergedMap, items });
    }

    // 2. Toggle stok satuan: { id, isAvailable, updatedAt? }
    if (body.id && typeof body.isAvailable === 'boolean') {
      const res = setMenuItemAvailability(body.id, body.isAvailable, body.updatedAt);
      return NextResponse.json({ success: res.success, availabilityMap: res.availabilityMap });
    }

    // 3. Jika membuat menu baru
    const { name, category, price, description, image, isPopular } = body;
    if (!name || !price || !category) {
      return NextResponse.json({ success: false, error: 'Nama, kategori, dan harga wajib diisi' }, { status: 400 });
    }

    const newItem = createMenuItem({
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

    return NextResponse.json({ success: true, data: newItem });
  } catch (err) {
    console.error('Menu POST error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memproses menu' }, { status: 500 });
  }
}

// PUT: Edit menu (Harga, Nama, Gambar, Deskripsi, Kategori)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, price, description, image, category, isPopular } = body;

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

    const updated = updateMenuItem(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Menu tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Menu PUT error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui menu' }, { status: 500 });
  }
}

// DELETE: Hapus menu
export async function DELETE(req: Request) {
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

    const ok = deleteMenuItem(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('Menu DELETE error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menghapus menu' }, { status: 500 });
  }
}
