export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getReportData, formatRp, ReportData } from '@/lib/report';

// pdfkit hanya di-load saat route dipanggil (hindari beban cold-start)
async function buildPdf(report: ReportData): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const W = doc.page.width - 80;
  let y = 50;

  const ensure = (need: number) => {
    if (y + need > doc.page.height - 60) {
      doc.addPage();
      y = 50;
    }
  };

  // ===== Header =====
  doc.fillColor('#1a1a1a').fontSize(22).font('Helvetica-Bold').text('HR FOOD', 40, y);
  doc.fontSize(11).font('Helvetica').fillColor('#555')
    .text('Makan Enak, Mood Naik!', 40, y + 26);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#1a1a1a')
    .text('Laporan Penjualan', 40, y + 44);
  doc.fontSize(10).font('Helvetica').fillColor('#555')
    .text(`Periode: ${report.dateLabel} (${report.date})`, 40, y + 62);
  const genTime = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  doc.text(`Dicetak: ${genTime} WIB`, 40, y + 76);
  y += 104;

  // ===== Ringkasan =====
  ensure(90);
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text('Ringkasan', 40, y);
  y += 18;
  const summary: [string, string][] = [
    ['Total Omzet (lunas)', formatRp(report.totalOmzet)],
    ['Potensi Omzet', formatRp(report.potentialOmzet)],
    ['Jumlah Pesanan', String(report.totalOrders)],
    ['Selesai', String(report.completedOrders)],
    ['Tunai / Kasir', formatRp(report.cashTotal)],
    ['QRIS', formatRp(report.qrisTotal)],
  ];
  const colW = W / 3;
  summary.forEach(([label, value], i) => {
    const cx = 40 + (i % 3) * colW;
    const cy = y + Math.floor(i / 3) * 34;
    doc.fontSize(9).font('Helvetica').fillColor('#777').text(label, cx, cy);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text(value, cx, cy + 11);
  });
  y += 78;

  // ===== Menu Terlaris =====
  ensure(40);
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text('Menu Terlaris', 40, y);
  y += 18;
  const drawRow = (cells: string[], bold = false, shade = false) => {
    ensure(20);
    if (shade) doc.rect(40, y - 3, W, 18).fill('#f3f3f3');
    doc.fillColor('#1a1a1a').fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica');
    const widths = [30, W - 30 - 130, 60, 70];
    let x = 40;
    cells.forEach((c, i) => {
      doc.text(c, x + 2, y, { width: widths[i] - 4, align: i >= 2 ? 'right' : 'left' });
      x += widths[i];
    });
    y += 18;
  };
  drawRow(['No', 'Menu', 'Qty', 'Omzet'], true, true);
  report.topItems.slice(0, 15).forEach((it, i) => {
    drawRow([String(i + 1), it.name, String(it.qty), formatRp(it.revenue)], false, i % 2 === 1);
  });
  if (report.topItems.length === 0) {
    doc.fontSize(9).font('Helvetica').fillColor('#777').text('Belum ada penjualan.', 40, y);
    y += 18;
  }
  y += 14;

  // ===== Daftar Pesanan =====
  ensure(40);
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text('Daftar Pesanan', 40, y);
  y += 18;
  const drawORow = (cells: string[], bold = false, shade = false) => {
    ensure(20);
    if (shade) doc.rect(40, y - 3, W, 18).fill('#f3f3f3');
    doc.fillColor('#1a1a1a').fontSize(8.5).font(bold ? 'Helvetica-Bold' : 'Helvetica');
    const widths = [70, W - 70 - 90 - 70 - 60, 90, 70, 60];
    let x = 40;
    cells.forEach((c, i) => {
      doc.text(c, x + 2, y, { width: widths[i] - 4, align: i >= 2 ? 'right' : 'left' });
      x += widths[i];
    });
    y += 18;
  };
  drawORow(['No. Order', 'Pelanggan', 'Item', 'Total', 'Status'], true, true);
  const statusId: Record<string, string> = {
    pending_payment: 'Belum Bayar', cooking: 'Dimasak', ready: 'Siap',
    on_delivery: 'Diantar', completed: 'Selesai', cancelled: 'Batal',
  };
  report.orders.slice(0, 60).forEach((o, i) => {
    const itemCount = o.items.reduce((s, it) => s + it.quantity, 0);
    drawORow(
      [o.orderNumber || '-', (o.customerName || '-').slice(0, 28), String(itemCount), formatRp(o.total), statusId[o.status] || o.status],
      false, i % 2 === 1
    );
  });
  if (report.orders.length === 0) {
    doc.fontSize(9).font('Helvetica').fillColor('#777').text('Belum ada pesanan.', 40, y);
    y += 18;
  }

  // ===== Footer =====
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).font('Helvetica').fillColor('#999')
      .text(`HR Food • Halaman ${i + 1} dari ${pages.count}`, 40, doc.page.height - 35, { align: 'center', width: W });
  }

  doc.end();
  return done;
}

export async function GET(request: NextRequest) {
  // KEAMANAN: unduh laporan hanya untuk admin
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const report = await getReportData(searchParams.get('date'));
    const pdf = await buildPdf(report);

    const filename = `laporan-hrfood-${report.date}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdf.length),
      },
    });
  } catch (err: any) {
    console.error('PDF report error:', err);
    return NextResponse.json({ success: false, error: 'Gagal membuat PDF' }, { status: 500 });
  }
}
