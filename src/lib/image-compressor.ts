/**
 * HR FOOD - Automatic Image Compressor
 * 
 * Mengompresi dan mengoptimalkan foto makanan langsung di browser (client-side)
 * sebelum diunggah ke server. Mengurangi ukuran file dari 3MB-10MB menjadi ~40KB-90KB
 * dengan kualitas visual tetap tajam di layar retina.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  preferredMimeType?: 'image/webp' | 'image/jpeg';
}

export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalBytes: number;
  compressedBytes: number;
  savingsPercent: number;
  width: number;
  height: number;
}

/**
 * Format bytes ke format yang mudah dibaca (KB / MB).
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Kompresi foto otomatis menggunakan HTML5 Canvas
 */
export async function compressImage(
  file: File,
  options?: CompressionOptions
): Promise<CompressionResult> {
  // Hanya proses jika file adalah gambar
  if (!file.type.startsWith('image/')) {
    throw new Error('File yang dipilih bukan gambar yang valid.');
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        const maxW = options?.maxWidth || 1000;
        const maxH = options?.maxHeight || 1000;

        // Skalakan dimensi dengan mempertahankan rasio aspek
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas context tidak tersedia');
        }

        // Kualitas render tinggi
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const preferredMime = options?.preferredMimeType || 'image/webp';
        const quality = options?.quality ?? 0.82;

        // Konversi ke Blob WebP atau fallback ke JPEG
        let blob: Blob | null = await new Promise(res => {
          canvas.toBlob(b => res(b), preferredMime, quality);
        });

        // Jika browser tidak mendukung WebP canvas export, fallback ke JPEG
        if (!blob || blob.type !== preferredMime) {
          blob = await new Promise(res => {
            canvas.toBlob(b => res(b), 'image/jpeg', quality);
          });
        }

        if (!blob) {
          throw new Error('Gagal mengompresi gambar');
        }

        // Tentukan ekstensi
        const isWebp = blob.type === 'image/webp';
        const ext = isWebp ? '.webp' : '.jpg';
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const cleanName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        const optimizedFileName = `${cleanName}_opt${ext}`;

        const compressedFile = new File([blob], optimizedFileName, {
          type: blob.type,
          lastModified: Date.now(),
        });

        const dataUrl = canvas.toDataURL(blob.type, quality);
        const originalBytes = file.size;
        const compressedBytes = compressedFile.size;
        const savingsPercent = originalBytes > compressedBytes
          ? Math.round(((originalBytes - compressedBytes) / originalBytes) * 100)
          : 0;

        resolve({
          file: compressedFile,
          dataUrl,
          originalBytes,
          compressedBytes,
          savingsPercent,
          width,
          height,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memuat file gambar untuk dikompresi.'));
    };

    img.src = objectUrl;
  });
}
