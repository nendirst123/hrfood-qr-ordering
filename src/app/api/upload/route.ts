import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isVercel = process.env.VERCEL === '1';

    // Jika di Vercel, encode sebagai Data URL Base64 yang aman dan mandiri
    if (isVercel) {
      const mimeType = file.type || 'image/jpeg';
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return NextResponse.json({ success: true, url: dataUrl });
    }

    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'menu', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Sanitasi nama file unik
      const ext = path.extname(file.name) || '.jpg';
      const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const filename = `menu_${Date.now()}_${cleanName.substring(0, 15)}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/menu/uploads/${filename}`;
      return NextResponse.json({ success: true, url: publicUrl });
    } catch (writeErr) {
      // Fallback ke Base64 Data URL jika penulisan disk gagal
      console.warn('Filesystem write failed, falling back to Base64:', writeErr);
      const mimeType = file.type || 'image/jpeg';
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return NextResponse.json({ success: true, url: dataUrl });
    }
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
