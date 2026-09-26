import base64
import os
import subprocess

def to_base64(path):
    if not os.path.exists(path):
        print(f"Warning: {path} not found")
        return ""
    ext = os.path.splitext(path)[1].lower()
    mime = "image/png" if ext == ".png" else "image/jpeg"
    with open(path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode("utf-8")

logo_full = to_base64("/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/public/hrfood-full-logo.png")
emblem = to_base64("/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/public/hrfood-emblem.png")
img_menu = to_base64("/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/hrfood_menu_upgraded.png")
img_qr = to_base64("/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/hrfood_qr_upgraded.png")
img_kitchen = to_base64("/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/screenshot_kitchen_kds.png")

html_content = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Buku Panduan & Tutorial Aplikasi QR Ordering - HR FOOD</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        
        @page {{
            size: A4 portrait;
            margin: 0;
        }}
        
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        
        body {{
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f1f5f9;
            color: #1e293b;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }}
        
        .page {{
            width: 210mm;
            height: 297mm;
            padding: 16mm 18mm;
            position: relative;
            background: #ffffff;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
        }}
        
        /* Header & Footer */
        .page-header {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #fee2e2;
            padding-bottom: 8mm;
            margin-bottom: 6mm;
        }}
        
        .header-brand {{
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        
        .header-brand img {{
            height: 38px;
            object-fit: contain;
        }}
        
        .header-title {{
            font-size: 13px;
            font-weight: 800;
            color: #b91c1c;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        
        .header-meta {{
            font-size: 10px;
            color: #64748b;
            font-weight: 600;
            text-align: right;
        }}
        
        .page-footer {{
            border-top: 1px solid #e2e8f0;
            padding-top: 5mm;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 9px;
            color: #94a3b8;
            font-weight: 600;
        }}
        
        .content-body {{
            flex: 1;
            display: flex;
            flex-direction: column;
        }}
        
        /* Cover Styling */
        .cover-page {{
            background: linear-gradient(145deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%);
            color: #ffffff;
            padding: 24mm 20mm;
        }}
        
        .cover-badge {{
            display: inline-block;
            background: rgba(254, 240, 138, 0.2);
            border: 1px solid #fef08a;
            color: #fef08a;
            font-size: 11px;
            font-weight: 800;
            padding: 6px 14px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
        }}
        
        .cover-title {{
            font-size: 32px;
            font-weight: 900;
            line-height: 1.15;
            color: #ffffff;
            margin-bottom: 12px;
        }}
        
        .cover-subtitle {{
            font-size: 16px;
            font-weight: 500;
            color: #fecaca;
            margin-bottom: 28px;
            line-height: 1.4;
        }}
        
        .cover-center-box {{
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 18px;
            padding: 22px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            justify-content: space-around;
            gap: 20px;
        }}
        
        .role-pill {{
            background: #ffffff;
            border-radius: 14px;
            padding: 16px 14px;
            color: #1e293b;
            text-align: center;
            flex: 1;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }}
        
        .role-pill .icon {{
            font-size: 26px;
            margin-bottom: 6px;
        }}
        
        .role-pill .name {{
            font-size: 13px;
            font-weight: 800;
            color: #991b1b;
            margin-bottom: 4px;
        }}
        
        .role-pill .desc {{
            font-size: 10px;
            color: #64748b;
            line-height: 1.3;
        }}
        
        .cover-footer {{
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            padding-top: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 11px;
            color: #fecaca;
        }}
        
        /* Inner Pages Styling */
        .section-title {{
            font-size: 20px;
            font-weight: 900;
            color: #991b1b;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 4px;
        }}
        
        .section-desc {{
            font-size: 11px;
            color: #64748b;
            margin-bottom: 16px;
            font-weight: 500;
        }}
        
        .step-card {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 14px;
            margin-bottom: 12px;
            display: flex;
            gap: 14px;
            align-items: flex-start;
        }}
        
        .step-num {{
            width: 32px;
            height: 32px;
            border-radius: 10px;
            background: #b91c1c;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 14px;
            flex-shrink: 0;
            box-shadow: 0 4px 10px rgba(185, 28, 28, 0.3);
        }}
        
        .step-info {{
            flex: 1;
        }}
        
        .step-heading {{
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
        }}
        
        .step-text {{
            font-size: 11px;
            color: #475569;
            line-height: 1.45;
        }}
        
        .step-highlight {{
            display: inline-block;
            background: #fef2f2;
            color: #b91c1c;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 10px;
        }}
        
        .img-container {{
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1);
            border: 1px solid #cbd5e1;
            background: #ffffff;
        }}
        
        .img-caption {{
            font-size: 9.5px;
            color: #64748b;
            text-align: center;
            margin-top: 6px;
            font-weight: 600;
        }}
        
        .grid-2 {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            align-items: center;
        }}
        
        .pill-badge {{
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
            color: #334155;
            margin: 2px;
        }}
        
        .alert-box {{
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 10px 14px;
            border-radius: 8px;
            margin-top: 10px;
            font-size: 10.5px;
            color: #92400e;
            line-height: 1.4;
        }}
        
        .tips-card {{
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 12px;
            margin-top: 12px;
        }}
        
        .tips-title {{
            font-size: 11.5px;
            font-weight: 800;
            color: #166534;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
        }}
        
        .tips-item {{
            font-size: 10.5px;
            color: #15803d;
            line-height: 1.4;
            margin-bottom: 4px;
        }}
        
        .color-timer {{
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            vertical-align: middle;
            margin-right: 4px;
        }}
    </style>
</head>
<body>

    <!-- HALAMAN 1: COVER BUKU PANDUAN -->
    <div class="page cover-page">
        <div>
            <div class="cover-badge">Buku Panduan Operasional Resmi</div>
            <div style="margin-bottom: 24px;">
                <img src="{logo_full}" alt="HR Food Logo" style="height: 65px; background: rgba(255,255,255,0.95); padding: 8px 16px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.3);">
            </div>
            <h1 class="cover-title">TATA CARA PENGGUNAAN<br>SISTEM QR ORDERING</h1>
            <p class="cover-subtitle">Panduan Praktis & Bergambar untuk Pelanggan Meja, Koki Dapur, dan Kasir Restoran HR Food</p>
        </div>
        
        <div class="cover-center-box">
            <div class="role-pill">
                <div class="icon">📱</div>
                <div class="name">1. PELANGGAN</div>
                <div class="desc">Scan QR meja, pilih lauk & sambal, kirim pesanan dari HP tanpa antre.</div>
            </div>
            <div class="role-pill">
                <div class="icon">🍳</div>
                <div class="name">2. KOKI DAPUR</div>
                <div class="desc">Dengar bel otomatis, lihat request khusus, pantau timer durasi masak.</div>
            </div>
            <div class="role-pill">
                <div class="icon">💵</div>
                <div class="name">3. KASIR</div>
                <div class="desc">Cek tagihan meja, terima pembayaran Cash / QRIS, cetak kartu meja.</div>
            </div>
        </div>
        
        <div class="cover-footer">
            <div><strong>HR FOOD</strong> &mdash; <em>Makan Enak, Mood Naik!</em></div>
            <div>Hotline / WhatsApp Resmi: <strong>0838-3843-2860</strong></div>
            <div>Versi 2.0 &bull; 2026</div>
        </div>
    </div>

    <!-- HALAMAN 2: PANDUAN PELANGGAN MEJA -->
    <div class="page">
        <div class="page-header">
            <div class="header-brand">
                <img src="{emblem}" alt="Emblem HR Food">
                <div class="header-title">Panduan Bagian 1 &bull; Pelanggan Meja</div>
            </div>
            <div class="header-meta">
                HR Food QR Table Ordering<br>
                <span>Halaman 2 dari 5</span>
            </div>
        </div>
        
        <div class="content-body">
            <div class="section-title">📱 Langkah Pemesanan dari Meja (Untuk Tamu)</div>
            <div class="section-desc">Tamu tidak perlu mengunduh aplikasi atau registrasi akun. Cukup gunakan kamera bawaan smartphone.</div>
            
            <div class="grid-2" style="margin-bottom: 12px;">
                <div>
                    <div class="step-card">
                        <div class="step-num">1</div>
                        <div class="step-info">
                            <div class="step-heading">Arahkan Kamera HP ke QR Code Meja</div>
                            <div class="step-text">Buka kamera HP atau Google Lens, arahkan ke akrilik barcode di meja. Klik link yang muncul. Menu HR Food langsung terbuka dengan nomor meja Anda (misal: <strong>Meja 02</strong>).</div>
                        </div>
                    </div>
                    
                    <div class="step-card">
                        <div class="step-num">2</div>
                        <div class="step-info">
                            <div class="step-heading">Pilih Menu, Sambal & Level Pedas</div>
                            <div class="step-text">
                                Klik tombol <strong>+ Tambah</strong> pada lauk favorit. Pilih:
                                <div style="margin-top: 4px;">
                                    <span class="step-highlight">Sambal Terasi</span>
                                    <span class="step-highlight">Sambal Bawang</span>
                                    <span class="step-highlight">Cabe Ijo</span>
                                </div>
                                <div style="margin-top: 4px; font-size: 10px; color: #64748b;">
                                    Pilih Level: Level 1 (Sedang), 2 (Pedas), atau 3 (Ekstra Pedas).
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="step-card">
                        <div class="step-num">3</div>
                        <div class="step-info">
                            <div class="step-heading">Pilih Request Cepat 1 Sentuhan</div>
                            <div class="step-text">
                                Cukup tekan tombol request tanpa perlu mengetik:
                                <div style="margin-top: 4px;">
                                    <span class="pill-badge">+ Goreng Garing</span>
                                    <span class="pill-badge">+ Sambal Dipisah</span>
                                    <span class="pill-badge">+ Lalapan Banyak</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div class="img-container">
                        <img src="{img_menu}" alt="Tampilan Menu HP Pelanggan" style="width: 100%; max-height: 310px; object-fit: cover; object-position: top;">
                    </div>
                    <div class="img-caption">Gambar 1: Tampilan Menu Pelanggan di Layar HP (Meja 02)</div>
                </div>
            </div>
            
            <div class="step-card">
                <div class="step-num">4</div>
                <div class="step-info">
                    <div class="step-heading">Kirim Pesanan & Pantau Status Real-Time</div>
                    <div class="step-text">
                        Buka keranjang belanja merah di bawah layar. Pilih cara pembayaran (<strong>Bayar di Kasir / Tunai</strong> atau <strong>QRIS</strong>), lalu klik <strong>"Kirim Pesanan Sekarang"</strong>. Layar HP tamu otomatis menampilkan status pesanan (<em>Menunggu Dapur &rarr; Sedang Dimasak &rarr; Siap Disajikan</em>) dan tombol <strong>"Kirim Struk ke WhatsApp Kasir"</strong>.
                    </div>
                </div>
            </div>
            
            <div class="alert-box">
                💡 <strong>Tips untuk Waiter:</strong> Jika tamu kebingungan, pelayan cukup menyapa ramah: <em>"Silakan langsung arahkan kamera HP ke barcode meja ya Kak, menu lezat HR Food langsung muncul di HP Kakak!"</em>
            </div>
        </div>
        
        <div class="page-footer">
            <div>Buku Panduan Operasional HR Food &bull; Standar Meja Makan</div>
            <div>0838-3843-2860</div>
        </div>
    </div>

    <!-- HALAMAN 3: PANDUAN BAGIAN DAPUR -->
    <div class="page">
        <div class="page-header">
            <div class="header-brand">
                <img src="{emblem}" alt="Emblem HR Food">
                <div class="header-title">Panduan Bagian 2 &bull; Koki & Bagian Dapur</div>
            </div>
            <div class="header-meta">
                HR Food Kitchen Display System (KDS)<br>
                <span>Halaman 3 dari 5</span>
            </div>
        </div>
        
        <div class="content-body">
            <div class="section-title">🍳 Kitchen Display System (Layar Antrean Dapur)</div>
            <div class="section-desc">Layar KDS diakses koki melalui tablet atau monitor di area masak: <code>http://localhost:3005/kitchen</code></div>
            
            <div class="img-container" style="margin-bottom: 12px;">
                <img src="{img_kitchen}" alt="Layar Kitchen Display System" style="width: 100%; max-height: 250px; object-fit: cover; object-position: top;">
            </div>
            <div class="img-caption" style="margin-bottom: 14px;">Gambar 2: Antarmuka Antrean Pesanan KDS Real-Time dengan Peringatan Timer & Tombol Aksi</div>
            
            <div class="grid-2">
                <div class="step-card">
                    <div class="step-num" style="background: #eab308;">🔔</div>
                    <div class="step-info">
                        <div class="step-heading">Alarm Suara Bel Pesanan Masuk</div>
                        <div class="step-text">Setiap ada tamu yang checkout dari meja, sistem akan membunyikan <strong>Chime Bell 2-Nada yang kencang</strong>. Koki tidak perlu terus-menerus menatap layar saat sedang menggoreng.</div>
                    </div>
                </div>
                
                <div class="step-card">
                    <div class="step-num" style="background: #2563eb;">⏱️</div>
                    <div class="step-info">
                        <div class="step-heading">Sistem Timer Warna Durasi Masak</div>
                        <div class="step-text">
                            Kartu pesanan memiliki indikator warna otomatis:
                            <div style="margin-top: 4px; font-size: 10.5px;">
                                <span class="color-timer" style="background: #22c55e;"></span><strong>Hijau (0-5 mnt):</strong> Pesanan baru.<br>
                                <span class="color-timer" style="background: #eab308;"></span><strong>Kuning (5-12 mnt):</strong> Segera proses.<br>
                                <span class="color-timer" style="background: #ef4444;"></span><strong>Merah Berkedip (>12 mnt):</strong> Prioritas mendesak!
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="grid-2" style="margin-top: 4px;">
                <div class="step-card">
                    <div class="step-num" style="background: #0284c7;">1</div>
                    <div class="step-info">
                        <div class="step-heading">Klik Tombol "Mulai Masak"</div>
                        <div class="step-text">Saat koki mulai menyiapkan bahan & menggoreng lauk, klik tombol <strong>"Mulai Masak"</strong>. Status pesanan di HP pelanggan otomatis berubah menjadi <em>"Sedang Dimasak"</em>.</div>
                    </div>
                </div>
                
                <div class="step-card">
                    <div class="step-num" style="background: #16a34a;">2</div>
                    <div class="step-info">
                        <div class="step-heading">Klik "Siap Disajikan" & Cetak KOT</div>
                        <div class="step-text">Setelah makanan matang di nampan, klik <strong>"Siap Disajikan"</strong> agar waiter langsung mengantar ke meja. Koki juga bisa klik <strong>"Cetak KOT"</strong> untuk print kertas tiket thermal.</div>
                    </div>
                </div>
            </div>
            
            <div class="tips-card">
                <div class="tips-title">📌 Standar Kualitas Dapur HR Food:</div>
                <div class="tips-item">&bull; Selalu baca kotak kuning catatan khusus (contoh: <em>Goreng Kering</em> atau <em>Sambal Terasi Level 3 Ekstra Pedas</em>) sebelum meracik.</div>
                <div class="tips-item">&bull; Pisahkan piring sambal jika pelanggan memilih opsi <em>"+ Sambal Dipisah"</em>.</div>
            </div>
        </div>
        
        <div class="page-footer">
            <div>Buku Panduan Operasional HR Food &bull; Modul Koki & Dapur</div>
            <div>Dapur Bebas Kertas &bull; Zero Miss Order</div>
        </div>
    </div>

    <!-- HALAMAN 4: PANDUAN KASIR & CETAK MEJA -->
    <div class="page">
        <div class="page-header">
            <div class="header-brand">
                <img src="{emblem}" alt="Emblem HR Food">
                <div class="header-title">Panduan Bagian 3 &bull; Kasir & Manajemen Meja</div>
            </div>
            <div class="header-meta">
                HR Food Kasir & QR Generator<br>
                <span>Halaman 4 dari 5</span>
            </div>
        </div>
        
        <div class="content-body">
            <div class="section-title">💵 Alur Kasir & Cetak Kartu Meja Akrilik</div>
            <div class="section-desc">Panduan penanganan transaksi tamu serta pembuatan stand meja akrilik baru: <code>http://localhost:3005/qr-generator</code></div>
            
            <div class="grid-2" style="margin-bottom: 12px;">
                <div>
                    <div class="step-card">
                        <div class="step-num" style="background: #0f172a;">A</div>
                        <div class="step-info">
                            <div class="step-heading">Konfirmasi Pembayaran Tamu</div>
                            <div class="step-text">
                                Saat tamu selesai makan atau hendak bayar di muka:
                                <ul style="margin-left: 16px; margin-top: 4px; font-size: 10.5px; color: #475569;">
                                    <li>Tamu menyebutkan nomor meja (misal: Meja 02).</li>
                                    <li>Kasir cek total rincian menu pada layar kasir.</li>
                                    <li>Terima tunai atau konfirmasi notifikasi QRIS.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="step-card">
                        <div class="step-num" style="background: #16a34a;">B</div>
                        <div class="step-info">
                            <div class="step-heading">Tutup Meja (Tandai Selesai)</div>
                            <div class="step-text">
                                Klik tombol hijau <strong>"Selesai"</strong> pada kartu pesanan. Meja tersebut otomatis kembali kosong dan siap diisi oleh pelanggan baru.
                            </div>
                        </div>
                    </div>
                    
                    <div class="step-card">
                        <div class="step-num" style="background: #25d366;">C</div>
                        <div class="step-info">
                            <div class="step-heading">Penerimaan Pesanan via WhatsApp</div>
                            <div class="step-text">
                                Jika tamu memilih kirim struk ke WA, chat akan masuk ke nomor resmi <strong>0838-3843-2860</strong> berisi rincian menu lengkap, total harga, dan nomor meja tamu.
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div class="img-container">
                        <img src="{img_qr}" alt="Kartu Meja Akrilik HR Food" style="width: 100%; max-height: 290px; object-fit: contain; background: #fafafa; padding: 6px;">
                    </div>
                    <div class="img-caption">Gambar 3: Stand Meja Akrilik Siap Cetak (Meja 01 s/d Meja 10)</div>
                </div>
            </div>
            
            <div class="step-card" style="margin-top: 6px;">
                <div class="step-num" style="background: #b91c1c;">D</div>
                <div class="step-info">
                    <div class="step-heading">Cara Cetak Kartu Meja Baru (Jika Menambah Meja atau Akrilik Rusak)</div>
                    <div class="step-text">
                        1. Buka menu generator di komputer kasir: <code>http://localhost:3005/qr-generator</code><br>
                        2. Pilih nomor meja yang ingin dicetak (misal Meja 01 s/d Meja 10).<br>
                        3. Klik tombol merah <strong>"Cetak Semua Kartu"</strong> atau tekan kombinasi <strong>Ctrl + P</strong> pada keyboard.<br>
                        4. Cetak menggunakan kertas stiker tebal atau art paper, potong sesuai ukuran, lalu selipkan ke stand akrilik T-shape / L-shape meja makan.
                    </div>
                </div>
            </div>
        </div>
        
        <div class="page-footer">
            <div>Buku Panduan Operasional HR Food &bull; Kasir & Manajemen Meja</div>
            <div>0838-3843-2860</div>
        </div>
    </div>

    <!-- HALAMAN 5: TROUBLESHOOTING & SOP DARURAT -->
    <div class="page">
        <div class="page-header">
            <div class="header-brand">
                <img src="{emblem}" alt="Emblem HR Food">
                <div class="header-title">Panduan Bagian 4 &bull; Tanya Jawab & Solusi Cepat</div>
            </div>
            <div class="header-meta">
                HR Food Troubleshooting Guide<br>
                <span>Halaman 5 dari 5</span>
            </div>
        </div>
        
        <div class="content-body">
            <div class="section-title">❓ Tanya Jawab & Solusi Kendala di Lapangan</div>
            <div class="section-desc">Jawaban cepat untuk situasi tidak terduga saat jam operasional ramai (rush hour).</div>
            
            <div class="step-card">
                <div class="step-num" style="background: #b91c1c;">Q1</div>
                <div class="step-info">
                    <div class="step-heading">Bagaimana jika HP pelanggan tidak memiliki kuota internet?</div>
                    <div class="step-text">
                        <strong>Solusi:</strong> Resto menyediakan koneksi WiFi gratis untuk pelanggan. Tempelkan nama WiFi & Password di samping barcode meja. Jika pelanggan tidak membawa HP, pelayan (waiter) dapat membukakan menu melalui tablet pelayan dan menginputkan nomor meja pelanggan.
                    </div>
                </div>
            </div>
            
            <div class="step-card">
                <div class="step-num" style="background: #b91c1c;">Q2</div>
                <div class="step-info">
                    <div class="step-heading">Bagaimana jika pelanggan ingin menambah pesanan (Repeat Order)?</div>
                    <div class="step-text">
                        <strong>Solusi:</strong> Pelanggan cukup membuka kembali link di HP-nya atau scan ulang QR Code di mejanya, lalu pilih menu tambahan (misal: <em>Es Teh Manis</em> atau <em>Ekstra Sambal</em>). Pesanan baru otomatis masuk ke dapur dengan nomor meja yang sama.
                    </div>
                </div>
            </div>
            
            <div class="step-card">
                <div class="step-num" style="background: #b91c1c;">Q3</div>
                <div class="step-info">
                    <div class="step-heading">Bagaimana jika salah satu menu lauk sudah habis di dapur?</div>
                    <div class="step-text">
                        <strong>Solusi:</strong> Koki atau kasir dapat mengubah status ketersediaan menu di sistem dalam 1 detik. Menu yang ditandai <em>"Habis"</em> otomatis tidak dapat diklik oleh pelanggan di meja, sehingga mencegah kekecewaan tamu.
                    </div>
                </div>
            </div>
            
            <div class="step-card">
                <div class="step-num" style="background: #b91c1c;">Q4</div>
                <div class="step-info">
                    <div class="step-heading">Apakah struk pesanan bisa dicetak ke kertas seperti biasa?</div>
                    <div class="step-text">
                        <strong>Solusi:</strong> Ya, sangat bisa. Sistem terintegrasi dengan printer thermal standar (58mm dan 80mm). Koki di dapur cukup klik <strong>"Cetak KOT"</strong> dan kasir dapat mencetak struk tagihan belanja tamu kapan saja.
                    </div>
                </div>
            </div>
            
            <div class="tips-card" style="margin-top: 10px; background: #eff6ff; border-color: #bfdbfe;">
                <div class="tips-title" style="color: #1e40af;">📞 Kontak Bantuan & Hotline Tim IT HR Food:</div>
                <div class="tips-item" style="color: #1e3a8a;">&bull; WhatsApp Hotline Resmi: <strong>0838-3843-2860</strong></div>
                <div class="tips-item" style="color: #1e3a8a;">&bull; Slogan Brand: <em>"Makan Enak, Mood Naik! - Masakan Rumahan Rasa Juara!"</em></div>
                <div class="tips-item" style="color: #1e3a8a;">&bull; Alamat Server Lokal: <code>http://localhost:3005</code></div>
            </div>
        </div>
        
        <div class="page-footer">
            <div>Buku Panduan Operasional HR Food &bull; Standar Pelayanan Prima</div>
            <div>0838-3843-2860</div>
        </div>
    </div>

</body>
</html>
"""

with open("/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/tutorial.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Generated tutorial.html. Converting to A4 PDF via Chrome...")
chrome_path = "/usr/bin/google-chrome-stable"
cmd = [
    chrome_path,
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--print-to-pdf=/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/HR_FOOD_Buku_Panduan_Tutorial_Bergambar.pdf",
    "--print-to-pdf-no-header",
    "file:///home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/tutorial.html"
]
res = subprocess.run(cmd, capture_output=True, text=True)
print(res.stdout)
print(res.stderr)
if os.path.exists("/home/zabirru/.gemini/antigravity/scratch/cafe-qr-ordering/HR_FOOD_Buku_Panduan_Tutorial_Bergambar.pdf"):
    print("Successfully generated HR_FOOD_Buku_Panduan_Tutorial_Bergambar.pdf!")
else:
    print("Failed to generate PDF")
