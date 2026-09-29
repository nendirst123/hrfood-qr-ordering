import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(req: NextRequest) {
  // KEAMANAN: upload hanya untuk admin
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // KEAMANAN: batasi ukuran & tipe file
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ success: false, error: 'Ukuran file maksimal 5 MB.' }, { status: 400 });
    }
    const mimeType = file.type || 'image/jpeg';
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json({ success: false, error: 'Tipe file harus gambar (JPG/PNG/WebP/GIF).' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isVercel = process.env.VERCEL === '1';

    // Jika di Vercel, encode sebagai Data URL Base64 yang aman dan mandiri
    if (isVercel) {
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return NextResponse.json({ success: true, url: dataUrl });
    }

    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'menu', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Sanitasi nama file unik — ekstensi diambil dari tipe MIME tervalidasi
      const extByMime: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
      };
      const ext = extByMime[mimeType] || '.jpg';
      const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const filename = `menu_${Date.now()}_${cleanName.substring(0, 15)}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/menu/uploads/${filename}`;
      return NextResponse.json({ success: true, url: publicUrl });
    } catch (writeErr) {
      // Fallback ke Base64 Data URL jika penulisan disk gagal
      console.warn('Filesystem write failed, falling back to Base64:', writeErr);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return NextResponse.json({ success: true, url: dataUrl });
    }
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
