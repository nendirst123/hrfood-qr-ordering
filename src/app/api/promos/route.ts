import { NextResponse } from 'next/server';
import { getAllPromos, upsertPromo, deletePromo, validatePromo } from '@/lib/promo-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get('all') === '1';

  const all = getAllPromos();
  const result = showAll ? all : all.filter(p => p.isActive);

  return NextResponse.json({ success: true, data: result });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validasi Kupon di Checkout
    if (body.action === 'validate') {
      const { code, subtotal } = body;
      const res = validatePromo(code, Number(subtotal) || 0);
      return NextResponse.json({ success: true, ...res });
    }

    // 2. Toggle Status Aktif Kupon
    if (body.action === 'toggle' && body.id) {
      const all = getAllPromos();
      const target = all.find(p => p.id === body.id);
      if (!target) return NextResponse.json({ success: false, error: 'Promo tidak ditemukan' }, { status: 404 });
      target.isActive = !target.isActive;
      upsertPromo(target);
      return NextResponse.json({ success: true, data: target });
    }

    // 3. Tambah / Edit Promo (Admin)
    const { code, title, type, value, minOrder, maxDiscount, description, isActive } = body;
    if (!code || !title || !value) {
      return NextResponse.json({ success: false, error: 'Kode kupon, judul, dan nilai diskon wajib diisi' }, { status: 400 });
    }

    const promo = upsertPromo({
      id: body.id || `promo-${Date.now()}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      type: type === 'percent' ? 'percent' : 'fixed',
      value: Number(value),
      minOrder: Number(minOrder) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      description: description?.trim() || '',
      isActive: isActive !== false,
    });

    return NextResponse.json({ success: true, data: promo });
  } catch (err) {
    console.error('Promo API error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memproses promo' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID kupon wajib diisi' }, { status: 400 });

    const ok = deletePromo(id);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('Delete promo error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menghapus promo' }, { status: 500 });
  }
}
