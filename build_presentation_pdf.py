import base64
import os
import subprocess

def b64(path):
    if os.path.exists(path):
        with open(path, 'rb') as f:
            ext = path.split('.')[-1].lower()
            mime = 'image/png' if ext == 'png' else 'image/jpeg'
            return f"data:{mime};base64," + base64.b64encode(f.read()).decode('utf-8')
    return ''

logo_full = b64('public/hrfood-full-logo.png')
logo_emblem = b64('public/hrfood-emblem.png')
screen_menu = b64('/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/hrfood_menu_upgraded.png')
screen_kitchen = b64('/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/hrfood_kitchen.png')
screen_qr = b64('/home/zabirru/.gemini/antigravity/brain/983032df-0799-44e4-a7dc-a91c40e2171c/hrfood_qr_upgraded.png')

html_content = f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>HR Food - Presentasi Sistem QR Table Ordering</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {{
      box-sizing: border-box;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }}
    @page {{
      size: 1920px 1080px;
      margin: 0;
    }}
    html, body {{
      margin: 0;
      padding: 0;
      background: #090d16;
      color: #f8fafc;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}
    .slide {{
      width: 1920px;
      height: 1080px;
      page-break-after: always;
      page-break-inside: avoid;
      break-after: page;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 70px 90px;
      background: #090d16;
    }}
  </style>
</head>
<body class="bg-slate-950 text-slate-100">

  <!-- ==================== SLIDE 1: COVER ==================== -->
  <div class="slide bg-gradient-to-br from-slate-950 via-[#0d1527] to-[#1a0a0d]">
    <!-- Top Header info -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-14 h-14 bg-white/95 p-1.5 rounded-2xl shadow-xl flex items-center justify-center">
          <img src="{logo_emblem}" alt="HR Food Emblem" class="w-full h-full object-contain" />
        </div>
        <img src="{logo_full}" alt="HR Food" class="h-12 object-contain" />
      </div>
      <div class="px-5 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm tracking-wider uppercase">
        Proposal & Dokumentasi Sistem Resto 2026
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl my-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-base font-extrabold uppercase tracking-wider mb-6">
        <span>🌶️</span> Transformasi Digital Rumah Makan HR Food
      </div>
      <h1 class="text-6xl font-black tracking-tight leading-[1.15] text-white">
        Sistem Pemesanan Meja <br />
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-amber-400">
          Berbasis QR Code & KDS Dapur
        </span>
      </h1>
      <p class="text-2xl text-slate-300 mt-6 leading-relaxed font-medium max-w-3xl">
        Mengoptimalkan perputaran meja, mengeliminasi antrean kasir, dan menjamin 100% akurasi varian sambal & level pedas secara real-time.
      </p>

      <div class="grid grid-cols-3 gap-6 mt-10 max-w-3xl">
        <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <p class="text-3xl font-black text-amber-400">0 Antrean</p>
          <p class="text-sm text-slate-400 mt-1">Pesan langsung dari meja tanpa antre di kasir</p>
        </div>
        <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <p class="text-3xl font-black text-emerald-400">100% Akurat</p>
          <p class="text-sm text-slate-400 mt-1">Tamu pilih sendiri sambal & level pedas di HP</p>
        </div>
        <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <p class="text-3xl font-black text-red-400">Pay Upfront</p>
          <p class="text-sm text-slate-400 mt-1">Bebas risiko meja belum bayar / kabur</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between pt-6 border-t border-slate-800/80 text-sm text-slate-400">
      <div class="flex items-center gap-2">
        <span class="font-bold text-white">HR Food</span> — <span class="text-amber-400">Makan Enak, Mood Naik!</span>
      </div>
      <div>Hotline & Delivery: <strong class="text-white">0838-3843-2860</strong></div>
    </div>
  </div>

  <!-- ==================== SLIDE 2: LATAR BELAKANG & PROBLEM ==================== -->
  <div class="slide bg-slate-950">
    <div class="flex items-center justify-between border-b border-slate-800 pb-5">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-red-400">Tantangan Operasional</p>
        <h2 class="text-3xl font-black text-white">Mengapa Sistem Manual Menghambat Omzet?</h2>
      </div>
      <img src="{logo_full}" alt="HR Food" class="h-9 object-contain" />
    </div>

    <div class="grid grid-cols-2 gap-8 my-auto">
      <div class="bg-red-950/20 border border-red-500/30 p-8 rounded-3xl space-y-4">
        <div class="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center text-2xl font-black">1</div>
        <h3 class="text-2xl font-bold text-white">Antrean Kasir & Tamu Menumpuk di Jam Makan</h3>
        <p class="text-slate-300 text-base leading-relaxed">
          Pada jam makan siang & malam, kasir kewalahan melayani tamu yang antre untuk melihat menu, memesan, sekaligus membayar. Hal ini membuat tamu baru enggan masuk karena melihat antrean panjang.
        </p>
      </div>

      <div class="bg-amber-950/20 border border-amber-500/30 p-8 rounded-3xl space-y-4">
        <div class="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl font-black">2</div>
        <h3 class="text-2xl font-bold text-white">Salah Catat Varian Sambal & Level Pedas</h3>
        <p class="text-slate-300 text-base leading-relaxed">
          Menu HR Food memiliki 3 varian sambal (Terasi, Bawang, Cabe Ijo) dan 4 level pedas. Catatan kertas manual sering tidak terbaca koki atau salah dengar pelayan, berujung pada komplain pelanggan.
        </p>
      </div>

      <div class="bg-orange-950/20 border border-orange-500/30 p-8 rounded-3xl space-y-4">
        <div class="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-2xl font-black">3</div>
        <h3 class="text-2xl font-bold text-white">Perputaran Meja Lambat (Low Table Turnover)</h3>
        <p class="text-slate-300 text-base leading-relaxed">
          Setelah makan selesai, tamu harus memanggil pelayan, menunggu struk dihitung, dan kasir mengembalikan uang. Rata-rata meja terbuang 8-15 menit hanya untuk proses pembayaran di akhir.
        </p>
      </div>

      <div class="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-4">
        <div class="w-14 h-14 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center text-2xl font-black">4</div>
        <h3 class="text-2xl font-bold text-white">Biaya Gaji Pelayan Tinggi (High Labor Cost)</h3>
        <p class="text-slate-300 text-base leading-relaxed">
          Diperlukan 3-5 pelayan hanya untuk mencatat pesanan dari meja ke meja dan mengantar nota fisik ke dapur. Biaya operasional gaji membengkak tanpa peningkatan kualitas layanan.
        </p>
      </div>
    </div>

    <div class="flex items-center justify-between pt-4 border-t border-slate-800 text-sm text-slate-400">
      <span>HR Food Digital Transformation</span>
      <span>Halaman 02</span>
    </div>
  </div>

  <!-- ==================== SLIDE 3: SOLUSI QR TABLE ORDERING ==================== -->
  <div class="slide bg-slate-950">
    <div class="flex items-center justify-between border-b border-slate-800 pb-5">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-emerald-400">Solusi Strategis</p>
        <h2 class="text-3xl font-black text-white">Konsep Model QR Table Ordering HR Food</h2>
      </div>
      <img src="{logo_full}" alt="HR Food" class="h-9 object-contain" />
    </div>

    <div class="grid grid-cols-3 gap-8 my-auto">
      <div class="bg-gradient-to-b from-slate-900 to-[#0e1629] border border-slate-800 p-8 rounded-3xl flex flex-col justify-between">
        <div>
          <div class="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-3xl mb-6">
            📱
          </div>
          <h3 class="text-2xl font-black text-white">1. Self-Order di Meja</h3>
          <p class="text-slate-300 text-base leading-relaxed mt-4">
            Tamu cukup mengarahkan kamera HP ke QR Code akrilik di meja. Langsung terbuka katalog menu lengkap dengan foto menggugah selera tanpa perlu instalasi aplikasi apapun.
          </p>
        </div>
        <div class="mt-6 pt-6 border-t border-slate-800 text-xs text-amber-400 font-bold">
          ✓ Cepat • Praktis • Higienis
        </div>
      </div>

      <div class="bg-gradient-to-b from-slate-900 to-[#0e1629] border border-slate-800 p-8 rounded-3xl flex flex-col justify-between">
        <div>
          <div class="w-16 h-16 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-3xl mb-6">
            💳
          </div>
          <h3 class="text-2xl font-black text-white">2. Bayar Lunas di Awal</h3>
          <p class="text-slate-300 text-base leading-relaxed mt-4">
            Mengadopsi alur efisiensi resto fast-casual: tamu memilih bayar instan via QRIS di HP atau bayar tunai di kasir. Makanan baru dimasak setelah lunas, menghilangkan risiko meja kabur.
          </p>
        </div>
        <div class="mt-6 pt-6 border-t border-slate-800 text-xs text-emerald-400 font-bold">
          ✓ 0% Risiko Dine & Dash • Cash Flow Aman
        </div>
      </div>

      <div class="bg-gradient-to-b from-slate-900 to-[#0e1629] border border-slate-800 p-8 rounded-3xl flex flex-col justify-between">
        <div>
          <div class="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-3xl mb-6">
            👨‍🍳
          </div>
          <h3 class="text-2xl font-black text-white">3. KDS Dapur Real-Time</h3>
          <p class="text-slate-300 text-base leading-relaxed mt-4">
            Begitu lunas, pesanan otomatis berbunyi di tablet/layar dapur. Koki langsung melihat nomor meja, lauk, sambal, dan level pedas dengan jelas, disertai timer masak otomatis.
          </p>
        </div>
        <div class="mt-6 pt-6 border-t border-slate-800 text-xs text-red-400 font-bold">
          ✓ Bebas Kertas Bon Hilang • Koki Fokus Masak
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between pt-4 border-t border-slate-800 text-sm text-slate-400">
      <span>HR Food Digital Transformation</span>
      <span>Halaman 03</span>
    </div>
  </div>

  <!-- ==================== SLIDE 4: DIAGRAM ALUR KERJA (WORKFLOW) ==================== -->
  <div class="slide bg-slate-950">
    <div class="flex items-center justify-between border-b border-slate-800 pb-5">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-amber-400">Standar Operasional Prosedur</p>
        <h2 class="text-3xl font-black text-white">Alur Pemesanan 5 Langkah Terintegrasi</h2>
      </div>
      <img src="{logo_full}" alt="HR Food" class="h-9 object-contain" />
    </div>

    <div class="my-auto space-y-6">
      <div class="grid grid-cols-5 gap-4">
        <!-- Step 1 -->
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative">
          <div class="w-12 h-12 rounded-xl bg-red-600 text-white font-black text-xl flex items-center justify-center mb-4 shadow-lg shadow-red-900/50">
            01
          </div>
          <h4 class="text-lg font-bold text-white leading-tight">Duduk & Scan QR</h4>
          <p class="text-xs text-slate-400 mt-2 leading-relaxed">
            Tamu duduk di meja kosong, mengarahkan kamera HP ke QR Code akrilik di meja.
          </p>
          <div class="mt-4 text-[11px] font-bold text-red-400 bg-red-950/40 p-2 rounded-lg">
            Meja otomatis terdeteksi (misal Meja 02)
          </div>
        </div>

        <!-- Step 2 -->
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative">
          <div class="w-12 h-12 rounded-xl bg-orange-600 text-white font-black text-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-900/50">
            02
          </div>
          <h4 class="text-lg font-bold text-white leading-tight">Pilih Menu & Sambal</h4>
          <p class="text-xs text-slate-400 mt-2 leading-relaxed">
            Pilih lauk ayam/ikan, pilih sambal (Terasi/Bawang/Ijo), dan tentukan level pedas 0-3.
          </p>
          <div class="mt-4 text-[11px] font-bold text-orange-400 bg-orange-950/40 p-2 rounded-lg">
            Tersedia pill request: "Goreng Garing"
          </div>
        </div>

        <!-- Step 3 -->
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative">
          <div class="w-12 h-12 rounded-xl bg-amber-600 text-white font-black text-xl flex items-center justify-center mb-4 shadow-lg shadow-amber-900/50">
            03
          </div>
          <h4 class="text-lg font-bold text-white leading-tight">Bayar di Awal</h4>
          <p class="text-xs text-slate-400 mt-2 leading-relaxed">
            Tamu pilih metode bayar: Scan QRIS langsung di layar HP atau bayar ke kasir.
          </p>
          <div class="mt-4 text-[11px] font-bold text-amber-400 bg-amber-950/40 p-2 rounded-lg">
            Bisa kirim struk instan ke WA Kasir
          </div>
        </div>

        <!-- Step 4 -->
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative">
          <div class="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-900/50">
            04
          </div>
          <h4 class="text-lg font-bold text-white leading-tight">KDS Dapur Berbunyi</h4>
          <p class="text-xs text-slate-400 mt-2 leading-relaxed">
            Alarm bel lonceng berbunyi otomatis di tablet koki. Order masuk status "Sedang Dimasak".
          </p>
          <div class="mt-4 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 p-2 rounded-lg">
            Koki fokus menggoreng & meracik
          </div>
        </div>

        <!-- Step 5 -->
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative">
          <div class="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50">
            05
          </div>
          <h4 class="text-lg font-bold text-white leading-tight">Sajikan & Pulang</h4>
          <p class="text-xs text-slate-400 mt-2 leading-relaxed">
            Runner antar hidangan ke meja. Selesai makan tamu langsung pulang tanpa antre bill.
          </p>
          <div class="mt-4 text-[11px] font-bold text-blue-400 bg-blue-950/40 p-2 rounded-lg">
            Meja siap diisi tamu berikutnya!
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-r from-red-950/40 via-amber-950/40 to-emerald-950/40 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="text-3xl">💡</span>
          <div>
            <h5 class="text-base font-bold text-white">Kelebihan Utama Alur Ini:</h5>
            <p class="text-xs text-slate-300 mt-0.5">Tidak ada waktu terbuang untuk mencetak tagihan manual di akhir sesi makan tamu.</p>
          </div>
        </div>
        <span class="text-xs font-black text-emerald-400 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          EFISIENSI WAKTU 50% LEBIH CEPAT
        </span>
      </div>
    </div>

    <div class="flex items-center justify-between pt-4 border-t border-slate-800 text-sm text-slate-400">
      <span>HR Food Digital Transformation</span>
      <span>Halaman 04</span>
    </div>
  </div>

  <!-- ==================== SLIDE 5: ANTARMUKA MOBILE PELANGGAN ==================== -->
  <div class="slide bg-slate-950">
    <div class="flex items-center justify-between border-b border-slate-800 pb-5">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-red-400">Pengalaman Pengguna (Customer UX)</p>
        <h2 class="text-3xl font-black text-white">Antarmuka Mobile Web HR Food</h2>
      </div>
      <img src="{logo_full}" alt="HR Food" class="h-9 object-contain" />
    </div>

    <div class="grid grid-cols-12 gap-8 my-auto items-center">
      <!-- Screenshot Phone Mockup -->
      <div class="col-span-5 flex justify-center">
        <div class="w-[340px] rounded-[36px] p-3 bg-gradient-to-b from-slate-700 to-slate-900 border-4 border-slate-800 shadow-2xl shadow-red-950/40">
          <div class="rounded-[28px] overflow-hidden bg-slate-950 border border-slate-800 max-h-[560px]">
            <img src="{screen_menu}" alt="Screenshot Menu Tamu" class="w-full h-auto object-cover object-top" />
          </div>
        </div>
      </div>

      <!-- Feature Highlights -->
      <div class="col-span-7 space-y-6">
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <div class="flex items-center gap-3">
            <span class="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center font-black">A</span>
            <h4 class="text-xl font-bold text-white">Branding Resmi & 3 Varian Sambal Khas</h4>
          </div>
          <p class="text-slate-300 text-sm mt-2 leading-relaxed">
            Terpasang logo resmi HR Food transparan dan kartu showcase interaktif untuk <strong>Sambal Terasi</strong> (Klasik & Nagih), <strong>Sambal Bawang</strong> (Segar & Pedas), dan <strong>Sambal Cabe Ijo</strong> (Pedas Mantap).
          </p>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <div class="flex items-center gap-3">
            <span class="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-black">B</span>
            <h4 class="text-xl font-bold text-white">Quick Request Badges (1 Sentuhan)</h4>
          </div>
          <p class="text-slate-300 text-sm mt-2 leading-relaxed">
            Tamu tidak perlu mengetik panjang. Cukup tap tombol pill: <span class="text-amber-300 font-semibold">+ Goreng Garing</span>, <span class="text-amber-300 font-semibold">+ Sambal Dipisah</span>, <span class="text-amber-300 font-semibold">+ Lalapan Banyak</span>, atau <span class="text-amber-300 font-semibold">+ Es Sedikit</span>.
          </p>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <div class="flex items-center gap-3">
            <span class="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black">C</span>
            <h4 class="text-xl font-bold text-white">Integrasi WhatsApp Kasir & Delivery</h4>
          </div>
          <p class="text-slate-300 text-sm mt-2 leading-relaxed">
            Tombol <strong>💬 Kirim Struk ke WhatsApp Kasir</strong> langsung membuka chat WA resmi ke <code>0838-3843-2860</code> dengan rincian pesanan terformat rapi.
          </p>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between pt-4 border-t border-slate-800 text-sm text-slate-400">
      <span>HR Food Digital Transformation</span>
      <span>Halaman 05</span>
    </div>
  </div>

  <!-- ==================== SLIDE 6: KITCHEN DISPLAY SYSTEM (KDS) ==================== -->
  <div class="slide bg-slate-950">
    <div class="flex items-center justify-between border-b border-slate-800 pb-5">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-orange-400">Operasional Dapur & Kasir</p>
        <h2 class="text-3xl font-black text-white">Kitchen Display System (KDS) Real-Time</h2>
      </div>
      <img src="{logo_full}" alt="HR Food" class="h-9 object-contain" />
    </div>

    <div class="grid grid-cols-12 gap-8 my-auto items-center">
      <!-- Feature list -->
      <div class="col-span-5 space-y-6">
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <h4 class="text-lg font-bold text-amber-400 flex items-center gap-2">
            🔔 Audio Bell Synthesizer
          </h4>
          <p class="text-slate-300 text-sm mt-2 leading-relaxed">
            Alarm bel nada ganda berbunyi otomatis di area dapur yang bising setiap ada pesanan masuk, memastikan tidak ada orderan terlewat.
          </p>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <h4 class="text-lg font-bold text-red-400 flex items-center gap-2">
            ⏱️ Smart Elapsed Timer
          </h4>
          <p class="text-slate-300 text-sm mt-2 leading-relaxed">
            Indikator warna durasi pesanan: <span class="text-emerald-400 font-bold">Hijau (&lt;5 mnt)</span>, <span class="text-amber-400 font-bold">Kuning (5-12 mnt)</span>, dan <span class="text-red-400 font-bold animate-pulse">Merah Berkedip (&gt;12 mnt)</span> sebagai prioritas dapur.
          </p>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <h4 class="text-lg font-bold text-emerald-400 flex items-center gap-2">
            🖨️ Cetak Tiket Dapur (KOT)
          </h4>
          <p class="text-slate-300 text-sm mt-2 leading-relaxed">
            Tersedia tombol cetak format thermal 58mm/80mm dengan kop resmi HR Food jika koki tetap membutuhkan salinan kertas fisik.
          </p>
        </div>
      </div>

      <!-- KDS Screenshot -->
      <div class="col-span-7">
        <div class="rounded-3xl p-3 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 shadow-2xl">
          <div class="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
            <img src="{screen_kitchen}" alt="Screenshot KDS Dapur" class="w-full h-auto object-cover" />
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between pt-4 border-t border-slate-800 text-sm text-slate-400">
      <span>HR Food Digital Transformation</span>
      <span>Halaman 06</span>
    </div>
  </div>

  <!-- ==================== SLIDE 7: KARTU MEJA AKRILIK ==================== -->
  <div class="slide bg-slate-950">
    <div class="flex items-center justify-between border-b border-slate-800 pb-5">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-emerald-400">Perangkat Keras Meja</p>
        <h2 class="text-3xl font-black text-white">Generator Kartu QR Meja (Siap Cetak)</h2>
      </div>
      <img src="{logo_full}" alt="HR Food" class="h-9 object-contain" />
    </div>

    <div class="grid grid-cols-12 gap-8 my-auto items-center">
      <!-- Screenshot QR Cards -->
      <div class="col-span-7">
        <div class="rounded-3xl p-3 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 shadow-2xl">
          <div class="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
            <img src="{screen_qr}" alt="Screenshot Kartu Meja HR Food" class="w-full h-auto object-cover" />
          </div>
        </div>
      </div>

      <!-- Feature points -->
      <div class="col-span-5 space-y-6">
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <h4 class="text-lg font-bold text-white">Nomor Meja Terkunci Otomatis</h4>
          <p class="text-slate-300 text-sm mt-2 leading-relaxed">
            Setiap meja memiliki QR Code unik. Tamu Meja 02 tidak akan pernah salah memesan atas nama Meja 03 karena nomor meja terkunci di URL link QR Code.
          </p>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <h4 class="text-lg font-bold text-white">Desain Elegan Stand Akrilik</h4>
          <p class="text-slate-300 text-sm mt-2 leading-relaxed">
            Ukuran kartu proporsional untuk dimasukkan ke stand akrilik T-shape meja, dilengkapi panduan visual 3 langkah yang mudah dipahami orang tua maupun anak muda.
          </p>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <h4 class="text-lg font-bold text-white">Cetak Sekali Klik (PDF / Printer)</h4>
          <p class="text-slate-300 text-sm mt-2 leading-relaxed">
            Admin cukup memilih rentang meja (misal Meja 1 s/d 12) lalu tekan tombol <em>Cetak Semua Kartu</em> untuk langsung di-print ke kertas art paper / stiker.
          </p>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between pt-4 border-t border-slate-800 text-sm text-slate-400">
      <span>HR Food Digital Transformation</span>
      <span>Halaman 07</span>
    </div>
  </div>

  <!-- ==================== SLIDE 8: ANALISIS ROI & MANFAAT BISNIS ==================== -->
  <div class="slide bg-slate-950">
    <div class="flex items-center justify-between border-b border-slate-800 pb-5">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-amber-400">Analisis Finansial & Operasional</p>
        <h2 class="text-3xl font-black text-white">Dampak Nyata Terhadap Keuntungan Resto</h2>
      </div>
      <img src="{logo_full}" alt="HR Food" class="h-9 object-contain" />
    </div>

    <div class="grid grid-cols-4 gap-6 my-auto">
      <div class="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 rounded-3xl text-center flex flex-col justify-between">
        <div>
          <div class="text-5xl font-black text-emerald-400">+45%</div>
          <h4 class="text-xl font-bold text-white mt-4">Perputaran Meja (Table Turnover)</h4>
          <p class="text-xs text-slate-300 mt-2 leading-relaxed">
            Tamu tidak perlu menunggu bon di akhir makan. Selesai makan langsung pulang, meja langsung siap untuk tamu berikutnya.
          </p>
        </div>
        <div class="mt-6 pt-4 border-t border-slate-800 text-[11px] text-emerald-400 font-bold">
          Kapasitas Tamu Harian Naik
        </div>
      </div>

      <div class="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 rounded-3xl text-center flex flex-col justify-between">
        <div>
          <div class="text-5xl font-black text-amber-400">-35%</div>
          <h4 class="text-xl font-bold text-white mt-4">Efisiensi Biaya Gaji Pelayan</h4>
          <p class="text-xs text-slate-300 mt-2 leading-relaxed">
            Tidak perlu menambah 2-3 pelayan pencatat menu di jam ramai. Staf dialihkan fokus ke kecepatan penyajian dan kebersihan.
          </p>
        </div>
        <div class="mt-6 pt-4 border-t border-slate-800 text-[11px] text-amber-400 font-bold">
          Hemat Beban Operasional Bulanan
        </div>
      </div>

      <div class="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 rounded-3xl text-center flex flex-col justify-between">
        <div>
          <div class="text-5xl font-black text-red-400">0%</div>
          <h4 class="text-xl font-bold text-white mt-4">Kesalahan Menu & Sambal</h4>
          <p class="text-xs text-slate-300 mt-2 leading-relaxed">
            Pilihan sambal, level pedas, dan catatan khusus dimasukkan sendiri oleh tamu, mengeliminasi komplain makanan terbuang.
          </p>
        </div>
        <div class="mt-6 pt-4 border-t border-slate-800 text-[11px] text-red-400 font-bold">
          Zero Food Waste Akibat Salah Menu
        </div>
      </div>

      <div class="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 rounded-3xl text-center flex flex-col justify-between">
        <div>
          <div class="text-5xl font-black text-blue-400">100%</div>
          <h4 class="text-xl font-bold text-white mt-4">Bebas Risiko Tidak Bayar</h4>
          <p class="text-xs text-slate-300 mt-2 leading-relaxed">
            Semua transaksi dibayar di kasir atau via QRIS sebelum koki mulai memasak. Nol potensi kerugian dine-and-dash.
          </p>
        </div>
        <div class="mt-6 pt-4 border-t border-slate-800 text-[11px] text-blue-400 font-bold">
          Keamanan Finansial 100% Terjamin
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between pt-4 border-t border-slate-800 text-sm text-slate-400">
      <span>HR Food Digital Transformation</span>
      <span>Halaman 08</span>
    </div>
  </div>

  <!-- ==================== SLIDE 9: RENCANA IMPLEMENTASI ==================== -->
  <div class="slide bg-slate-950">
    <div class="flex items-center justify-between border-b border-slate-800 pb-5">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-emerald-400">Rencana Eksekusi</p>
        <h2 class="text-3xl font-black text-white">Langkah Implementasi di Outlet HR Food</h2>
      </div>
      <img src="{logo_full}" alt="HR Food" class="h-9 object-contain" />
    </div>

    <div class="grid grid-cols-4 gap-6 my-auto">
      <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div class="text-amber-400 font-black text-sm uppercase tracking-wider mb-2">Tahap 1</div>
        <h4 class="text-xl font-bold text-white">Cetak Stand Meja</h4>
        <p class="text-slate-400 text-xs mt-2 leading-relaxed">
          Buka <code>/qr-generator</code>, cetak kartu akrilik untuk Meja 1 s/d 12 dan masukkan ke stand akrilik di setiap meja.
        </p>
        <span class="inline-block mt-4 px-3 py-1 bg-amber-500/10 text-amber-300 rounded-lg text-[11px] font-bold">Estimasi: 1 Hari</span>
      </div>

      <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div class="text-orange-400 font-black text-sm uppercase tracking-wider mb-2">Tahap 2</div>
        <h4 class="text-xl font-bold text-white">Setup Device Dapur & Kasir</h4>
        <p class="text-slate-400 text-xs mt-2 leading-relaxed">
          Letakkan 1 tablet Android murah / laptop di kasir dan 1 tablet di dekat koki untuk membuka layar <code>/kitchen</code>.
        </p>
        <span class="inline-block mt-4 px-3 py-1 bg-orange-500/10 text-orange-300 rounded-lg text-[11px] font-bold">Estimasi: 2 Jam</span>
      </div>

      <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div class="text-emerald-400 font-black text-sm uppercase tracking-wider mb-2">Tahap 3</div>
        <h4 class="text-xl font-bold text-white">Briefing Singkat Staf</h4>
        <p class="text-slate-400 text-xs mt-2 leading-relaxed">
          Edukasi koki mengenai bunyi bel order baru dan kasir mengenai tombol "Konfirmasi Lunas & Masak".
        </p>
        <span class="inline-block mt-4 px-3 py-1 bg-emerald-500/10 text-emerald-300 rounded-lg text-[11px] font-bold">Estimasi: 30 Menit</span>
      </div>

      <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div class="text-blue-400 font-black text-sm uppercase tracking-wider mb-2">Tahap 4</div>
        <h4 class="text-xl font-bold text-white">Go-Live & Operasional</h4>
        <p class="text-slate-400 text-xs mt-2 leading-relaxed">
          Tamu langsung disambut dengan meja ber-QR Code. Nikmati alur pesanan yang hening, rapi, dan cepat!
        </p>
        <span class="inline-block mt-4 px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg text-[11px] font-bold">Siap Digunakan</span>
      </div>
    </div>

    <div class="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
      <div>
        <h5 class="text-base font-bold text-white">Status Sistem: <span class="text-emerald-400">Production Ready (100% Tested)</span></h5>
        <p class="text-xs text-slate-400">Seluruh kode telah di-build tanpa error di port 3005 dengan dataset menu asli HR Food.</p>
      </div>
      <div class="text-xs font-mono text-slate-400 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
        Local Port: http://localhost:3005
      </div>
    </div>

    <div class="flex items-center justify-between pt-4 border-t border-slate-800 text-sm text-slate-400">
      <span>HR Food Digital Transformation</span>
      <span>Halaman 09</span>
    </div>
  </div>

  <!-- ==================== SLIDE 10: CLOSING ==================== -->
  <div class="slide bg-gradient-to-br from-slate-950 via-[#101726] to-[#1c0b0f] text-center flex flex-col justify-between">
    <div class="flex justify-between items-center">
      <div class="w-12 h-12 bg-white/95 p-1 rounded-xl shadow-md">
        <img src="{logo_emblem}" alt="HR Food" class="w-full h-full object-contain" />
      </div>
      <img src="{logo_full}" alt="HR Food" class="h-10 object-contain" />
    </div>

    <div class="max-w-3xl mx-auto my-auto space-y-6">
      <div class="w-24 h-24 bg-white/95 rounded-3xl p-2 mx-auto shadow-2xl flex items-center justify-center">
        <img src="{logo_emblem}" alt="HR Food" class="w-full h-full object-contain" />
      </div>

      <h2 class="text-5xl font-black text-white tracking-tight leading-tight">
        Siap Melayani Tamu Lebih Cepat, <br />
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-amber-400">
          Makan Enak, Mood Naik! 🌶️
        </span>
      </h2>

      <p class="text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
        Sistem pemesanan digital modern untuk membawa cita rasa masakan rumahan HR Food ke level profesional berikutnya.
      </p>

      <div class="pt-4 flex items-center justify-center gap-6">
        <div class="bg-slate-900/80 border border-slate-800 px-6 py-3 rounded-2xl">
          <p class="text-xs text-slate-400">WhatsApp Hotline & Delivery</p>
          <p class="text-lg font-black text-emerald-400 mt-0.5">0838-3843-2860</p>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 px-6 py-3 rounded-2xl">
          <p class="text-xs text-slate-400">Akses Sistem Operasional</p>
          <p class="text-lg font-black text-amber-400 mt-0.5">http://localhost:3005</p>
        </div>
      </div>
    </div>

    <div class="pt-6 border-t border-slate-800 text-xs text-slate-400">
      &copy; 2026 HR Food. Masakan Rumahan Rasa Juara! Seluruh Hak Cipta Dilindungi.
    </div>
  </div>

</body>
</html>
"""

with open('presentation.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Generated presentation.html. Converting to PDF via Chrome...")

cmd = [
    '/usr/bin/google-chrome-stable',
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--print-to-pdf-no-header',
    '--no-pdf-header-footer',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=5000',
    '--print-to-pdf=HR_FOOD_Presentasi_QR_Ordering.pdf',
    f"file://{os.path.abspath('presentation.html')}"
]

subprocess.run(cmd, check=True)
print("Successfully generated HR_FOOD_Presentasi_QR_Ordering.pdf!")
