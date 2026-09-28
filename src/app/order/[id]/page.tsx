'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Clock, 
  Flame, 
  UtensilsCrossed, 
  ArrowLeft, 
  CreditCard, 
  AlertCircle,
  RefreshCw,
  QrCode,
  Check,
  Bike,
  Package,
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  Sparkles,
  Download
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/order';
import { ThemeToggle } from '@/components/ThemeProvider';
import { QRIS_MERCHANT_INFO } from '@/lib/qris';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isSimulatingPay, setIsSimulatingPay] = useState<boolean>(false);
  const [showOriginalBarcode, setShowOriginalBarcode] = useState<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  // 1. Inisialisasi awal langsung dari LocalStorage (Zero Delay & Anti-404)
  useEffect(() => {
    let localData: Order | null = null;
    try {
      const stored = localStorage.getItem(`hrfood_order_${orderId}`);
      if (stored) {
        localData = JSON.parse(stored);
      } else {
        const latest = localStorage.getItem('hrfood_latest_order');
        if (latest) {
          const parsed = JSON.parse(latest);
          if (parsed && parsed.id === orderId) {
            localData = parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Gagal membaca order dari localStorage:', e);
    }

    if (localData) {
      setOrder(localData);
      setLoading(false);
      setError('');

      // Kirim sinkronisasi ke serverless backend secara background (Self-Healing)
      if (!isSyncingRef.current) {
        isSyncingRef.current = true;
        fetch('/api/orders/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: [localData] }),
        })
          .catch(() => {})
          .finally(() => {
            isSyncingRef.current = false;
          });
      }
    }
  }, [orderId]);

  // 2. Fetch Order dari Server dengan Fallback Header & Resilience
  const fetchOrder = async () => {
    try {
      // Ambil fallback payload dari state atau local storage
      let fallbackPayload = '';
      try {
        const stored = localStorage.getItem(`hrfood_order_${orderId}`) || localStorage.getItem('hrfood_latest_order');
        if (stored) fallbackPayload = encodeURIComponent(stored);
      } catch (e) {}

      const headers: Record<string, string> = {};
      if (fallbackPayload) {
        headers['x-fallback-order'] = fallbackPayload;
      }

      const res = await fetch(`/api/orders/${orderId}`, { headers });
      const data = await res.json();

      if (data.success && data.data) {
        setOrder(data.data);
        setError('');
        retryCountRef.current = 0;
        try {
          localStorage.setItem(`hrfood_order_${orderId}`, JSON.stringify(data.data));
        } catch (e) {}
      } else {
        // Jika server mengembalikan 404
        if (order) {
          // Jangan timpa jika kita sudah memiliki data pesanan di state!
          if (!isSyncingRef.current) {
            isSyncingRef.current = true;
            fetch('/api/orders/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orders: [order] }),
            })
              .catch(() => {})
              .finally(() => {
                isSyncingRef.current = false;
              });
          }
        } else {
          // Cek kembali localStorage jika state masih kosong
          try {
            const stored = localStorage.getItem(`hrfood_order_${orderId}`);
            if (stored) {
              const parsed = JSON.parse(stored);
              setOrder(parsed);
              setError('');
              return;
            }
          } catch (e) {}

          // Izinkan retry hingga 5 kali sebelum menampilkan layar error
          if (retryCountRef.current < 5) {
            retryCountRef.current += 1;
          } else {
            setError(data.error || 'Pesanan tidak ditemukan');
          }
        }
      }
    } catch (err: any) {
      if (!order) {
        if (retryCountRef.current < 5) {
          retryCountRef.current += 1;
        } else {
          setError(err.message || 'Gagal memuat status pesanan');
        }
      }
    } finally {
      // Hanya matikan loading jika order sudah ada atau retry sudah selesai
      if (order || retryCountRef.current >= 5 || error) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchOrder();
    // Auto-refresh status setiap 3 detik
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Simulasi Bayar QRIS
  const handleSimulatePayQRIS = async () => {
    setIsSimulatingPay(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cooking',
          isPaid: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
        try {
          localStorage.setItem(`hrfood_order_${orderId}`, JSON.stringify(data.data));
        } catch (e) {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingPay(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex items-center justify-center p-4 transition-colors">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold">Memuat status pesanan Anda...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center text-center transition-colors">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-2" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Oops, Terjadi Kendala</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{error || 'Pesanan tidak ditemukan'}</p>
        <Link
          href="/"
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition"
        >
          Kembali ke Menu
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const orderType = order.orderType || 'dine_in';

  // Steps definition based on Order Type
  const steps = orderType === 'delivery' ? [
    { key: 'pending_payment' as OrderStatus, label: 'Pesanan Masuk', desc: order.isPaid ? 'Pesanan dikonfirmasi' : 'Menunggu pembayaran COD/QRIS', icon: Clock },
    { key: 'cooking' as OrderStatus, label: 'Sedang Dimasak', desc: 'Dapur menyiapkan hidangan hangat', icon: Flame },
    { key: 'on_delivery' as OrderStatus, label: 'Dalam Pengantaran', desc: 'Kurir menuju lokasi alamat Anda', icon: Bike },
    { key: 'completed' as OrderStatus, label: 'Pesanan Diterima', desc: 'Selamat menikmati sajian HR Food!', icon: CheckCircle2 },
  ] : [
    { key: 'pending_payment' as OrderStatus, label: 'Pesanan Diterima', desc: order.isPaid ? 'Lunas' : 'Menunggu pembayaran kasir', icon: Clock },
    { key: 'cooking' as OrderStatus, label: 'Sedang Dimasak', desc: 'Koki menyiapkan pesanan Anda', icon: Flame },
    { key: 'ready' as OrderStatus, label: orderType === 'takeaway' ? 'Siap Diambil' : 'Siap Disajikan', desc: orderType === 'takeaway' ? 'Silakan ambil di meja kasir' : 'Runner mengantar ke meja', icon: UtensilsCrossed },
    { key: 'completed' as OrderStatus, label: 'Selesai', desc: 'Terima kasih telah berkunjung', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: OrderStatus) => {
    if (orderType === 'delivery') {
      switch (status) {
        case 'pending_payment': return 0;
        case 'cooking': return 1;
        case 'ready': return 1;
        case 'on_delivery': return 2;
        case 'completed': return 3;
        default: return 0;
      }
    } else {
      switch (status) {
        case 'pending_payment': return 0;
        case 'cooking': return 1;
        case 'ready': return 2;
        case 'on_delivery': return 2;
        case 'completed': return 3;
        default: return 0;
      }
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="min-h-screen pb-20 max-w-md mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-xl transition-colors">
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20 transition-colors">
        <button
          onClick={() => router.push(orderType === 'dine_in' ? `/?table=${order.tableNumber}` : `/?type=${orderType}`)}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Pesan Lagi
        </button>

        <div className="flex items-center gap-1.5">
          <img src="/hrfood-emblem.png" alt="HR Food" className="w-6 h-6 object-contain" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Status Pesanan</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle (Light / Dark Mode) */}
          <ThemeToggle compact />

          {/* Badge Tipe Pesanan */}
          {orderType === 'delivery' ? (
            <div className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-[11px] font-black flex items-center gap-1 border border-purple-200 dark:border-purple-800">
              <Bike className="w-3 h-3 text-purple-700 dark:text-purple-400" />
              <span>Delivery</span>
            </div>
          ) : orderType === 'takeaway' ? (
            <div className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-black flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
              <Package className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
              <span>Bungkus</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-rose-950/80 text-red-800 dark:text-rose-300 text-[11px] font-black border border-red-200 dark:border-rose-800">
              Meja {order.tableNumber}
            </div>
          )}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Order Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm text-center transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Nomor Pesanan</span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{order.orderNumber}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pelanggan: <strong className="text-slate-800 dark:text-slate-200">{order.customerName}</strong>
          </p>

          {/* Badge Lunas / Belum Bayar */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold">
            {order.isPaid ? (
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1 rounded-full flex items-center gap-1 text-[11px]">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Pembayaran Lunas
              </span>
            ) : (
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 px-3 py-1 rounded-full flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                {order.paymentMethod === 'qris'
                  ? 'Menunggu Pembayaran QRIS DANA'
                  : orderType === 'delivery'
                  ? 'Bayar Tunai ke Kurir (COD)'
                  : 'Menunggu Bayar di Kasir'}
              </span>
            )}
          </div>
        </div>

        {/* Informasi Alamat Pengantaran (Jika Delivery) */}
        {orderType === 'delivery' && (
          <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-2xl p-4 shadow-lg space-y-3 border border-purple-800/50">
            <div className="flex items-center justify-between border-b border-purple-800/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/30 flex items-center justify-center text-purple-300">
                  <Navigation className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider">Tujuan Pengantaran</h3>
              </div>
              <span className="text-[11px] font-bold bg-purple-500/40 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/30">
                {order.deliveryZoneName || 'Zona Standar'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-white font-medium leading-relaxed">{order.deliveryAddress}</p>
              </div>

              {order.deliveryNotes && (
                <div className="bg-purple-950/70 border border-purple-800/60 rounded-xl p-2.5 mt-2">
                  <p className="text-[11px] text-purple-300">
                    <strong className="text-purple-200">Patokan Rumah / Catatan Kurir:</strong> &ldquo;{order.deliveryNotes}&rdquo;
                  </p>
                </div>
              )}

              {order.customerPhone && (
                <div className="flex items-center gap-2 pt-1 text-purple-200 text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-purple-400" />
                  <span>WhatsApp: {order.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Tombol Hubungi Kurir / Resto */}
            <div className="pt-2 border-t border-purple-800/80 flex items-center gap-2">
              <a
                href={`https://wa.me/6283838432860?text=${encodeURIComponent(
                  `Halo HR Food, saya ingin menanyakan status pesanan delivery:\nNo Order: ${order.orderNumber}\nAtas Nama: ${order.customerName}\nAlamat: ${order.deliveryAddress || '-'}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat Admin Resto / Info Driver</span>
              </a>
            </div>
          </div>
        )}

        {/* Informasi Takeaway (Jika Takeaway) */}
        {orderType === 'takeaway' && (
          <div className="bg-emerald-950 text-white rounded-2xl p-4 shadow-lg space-y-2 border border-emerald-800/60">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>INFORMASI PENGAMBILAN</span>
            </div>
            <p className="text-xs text-emerald-100">
              Perkiraan waktu ambil: <strong>{order.pickupTime || '15 - 20 Menit'}</strong>
            </p>
            <p className="text-[11px] text-emerald-300">
              Tunjukkan nomor pesanan <strong>{order.orderNumber}</strong> ke kasir saat mengambil bungkusan Anda.
            </p>
          </div>
        )}

        {/* QRIS Dinamis Otomatis Muncul Harga jika belum bayar & metode qris */}
        {!order.isPaid && order.paymentMethod === 'qris' && (
          <div className="bg-gradient-to-b from-blue-50/90 via-white to-blue-50/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 rounded-3xl p-5 border-2 border-blue-200 dark:border-blue-800/70 text-center shadow-lg transition-all space-y-4">
            
            {/* Header Badge */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-900/60 px-3.5 py-1 rounded-full border border-blue-200 dark:border-blue-700 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>QRIS Dinamis &bull; Harga Otomatis Terdeteksi</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Scan via aplikasi <strong>DANA</strong> atau e-wallet &amp; mobile banking apa pun.
              </p>
            </div>

            {/* Official National Standard QRIS Board */}
            <div className="max-w-[300px] mx-auto bg-white rounded-2xl shadow-md border-2 border-slate-200 overflow-hidden text-slate-900">
              {/* Top Banner Header: QRIS & GPN Logo */}
              <div className="bg-white px-4 pt-3 pb-2 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="font-black text-lg tracking-tighter text-slate-900 flex items-center">
                    <span className="text-red-600">Q</span>RIS
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase leading-none block text-left">
                    Standar<br />Nasional
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black tracking-tight text-red-600 uppercase border border-red-600 px-1 rounded-sm">
                    GPN
                  </span>
                </div>
              </div>

              {/* Merchant Info */}
              <div className="px-3 pt-2 text-center border-b border-slate-100 pb-2">
                <h4 className="text-sm font-black text-slate-950 uppercase tracking-wide">
                  {QRIS_MERCHANT_INFO.merchantName}
                </h4>
                <div className="text-[10px] text-slate-600 font-mono font-semibold">
                  NMID: {QRIS_MERCHANT_INFO.nmid}
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px] font-bold mt-1">
                  <span>⚡ QRIS Dinamis Otomatis</span>
                </div>
              </div>

              {/* Dynamic QR Barcode Container */}
              <div className="p-3 bg-white flex flex-col items-center justify-center relative">
                {showOriginalBarcode ? (
                  <img
                    src="/qris-dana.jpg"
                    alt="QRIS Asli Hrfood.id"
                    className="w-full max-h-64 object-contain rounded-lg shadow-inner border border-slate-100"
                  />
                ) : (
                  <div className="relative p-2 bg-white rounded-xl border border-slate-200 shadow-inner group">
                    <img
                      src={`/api/qris?amount=${order.total}`}
                      alt={`Dynamic QRIS Rp ${order.total.toLocaleString('id-ID')}`}
                      className="w-56 h-56 object-contain"
                    />
                    {/* Center DANA Emblem */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-white p-0.5 shadow-md border border-blue-400 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-full rounded-md bg-[#118EEA] text-white font-black text-[9px] flex items-center justify-center shadow-xs">
                        DANA
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-2 text-center space-y-0.5">
                  <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">
                    SATU QRIS UNTUK SEMUA PEMBAYARAN
                  </span>
                </div>
              </div>

              {/* Bottom Card Footer: Amount Confirmation */}
              <div className="bg-blue-600 text-white px-3 py-2 text-center">
                <span className="text-[10px] text-blue-100 block font-medium">Nominal Terkunci Otomatis:</span>
                <span className="text-base font-black tracking-tight text-white block">
                  Rp {order.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Quick Actions (Simpan QR / Toggle Barcode Asli) */}
            <div className="flex items-center justify-center gap-2">
              <a
                href={`/api/qris?amount=${order.total}`}
                download={`QRIS-HRFOOD-${order.orderNumber}-${order.total}.png`}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Simpan Barcode QR</span>
              </a>

              <button
                type="button"
                onClick={() => setShowOriginalBarcode(!showOriginalBarcode)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium transition"
              >
                {showOriginalBarcode ? 'Lihat QR Dinamis' : 'Lihat Barcode Fisik Asli'}
              </button>
            </div>

            {/* Petunjuk Interaktif */}
            <div className="text-left text-xs bg-blue-50/70 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-blue-200/80 dark:border-slate-700 space-y-2 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-200 font-bold text-xs uppercase tracking-wide">
                <span>⚡ Cara Bayar Bebas Ribet:</span>
              </div>
              <ul className="text-[11px] space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                <li>
                  Buka aplikasi <strong>DANA</strong> (atau BCA, Mandiri, GoPay, OVO, ShopeePay).
                </li>
                <li>
                  Pilih menu <strong>Pindai / Scan QRIS</strong>, lalu arahkan kamera ke barcode di atas (atau unggah dari galeri jika di HP yang sama).
                </li>
                <li>
                  Nominal <strong className="text-blue-600 dark:text-blue-400">Rp {order.total.toLocaleString('id-ID')}</strong> akan <strong>langsung muncul otomatis</strong> di layar tanpa perlu Anda ketik!
                </li>
                <li>
                  Periksa penerima <strong>Hrfood.id</strong> lalu klik <strong>Bayar</strong>.
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                disabled={isSimulatingPay}
                onClick={handleSimulatePayQRIS}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {isSimulatingPay ? 'Memverifikasi Pembayaran...' : 'Konfirmasi Sudah Bayar QRIS'}
              </button>

              <a
                href={`https://wa.me/6283838432860?text=${encodeURIComponent(
                  `Halo Admin HR FOOD, saya sudah transfer via QRIS DANA untuk pesanan #${order.orderNumber} senilai Rp ${order.total.toLocaleString('id-ID')}. Mohon dicek ya!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Kirim Bukti Bayar ke WhatsApp Resto</span>
              </a>
            </div>
          </div>
        )}

        {/* Live Stepper Tracker */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {orderType === 'delivery' ? 'Status Pengantaran Live' : 'Status Proses Pesanan'}
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Auto-update realtime</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isPassed = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div key={step.key} className="relative flex items-start gap-3">
                  <div
                    className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isPassed
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-50 dark:ring-emerald-950/60'
                        : isCurrent
                        ? orderType === 'delivery'
                          ? 'bg-purple-600 text-white ring-4 ring-purple-100 dark:ring-purple-950/60 animate-pulse'
                          : 'bg-rose-600 text-white ring-4 ring-rose-100 dark:ring-rose-950/60 animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {isPassed ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : (
                      <StepIcon className="w-2.5 h-2.5" />
                    )}
                  </div>

                  <div>
                    <h4
                      className={`text-xs font-bold leading-tight ${
                        isCurrent
                          ? orderType === 'delivery' ? 'text-purple-700 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'
                          : isPassed
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ringkasan Item Pesanan */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            Rincian Item Hidangan ({order.items.length})
          </h3>

          <div className="space-y-2.5">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <span>{item.quantity}x</span>
                    <span>{item.name}</span>
                  </div>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-4">
                      {item.selectedOptions.map((o) => o.choiceLabel).join(' • ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded mt-0.5 ml-4 inline-block">
                      Catatan: {item.notes}
                    </p>
                  )}
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>

          {/* Rincian Finansial */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">Rp {order.subtotal.toLocaleString('id-ID')}</span>
            </div>
            {!!order.discountAmount && order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                <span>Diskon Kupon {order.discountCode ? `(${order.discountCode})` : ''}</span>
                <span>- Rp {order.discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            {orderType === 'delivery' && (
              <div className="flex justify-between text-purple-700 dark:text-purple-400 font-medium">
                <span>Ongkir ({order.deliveryZoneName || 'Pengantaran'})</span>
                <span>
                  {order.deliveryFee === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">GRATIS</span>
                  ) : (
                    `Rp ${(order.deliveryFee || 0).toLocaleString('id-ID')}`
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-800">
              <span>Total Pembayaran</span>
              <span className="text-rose-600 dark:text-rose-400 font-black">Rp {order.total.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Bantuan / Kontak Resto */}
        <div className="text-center space-y-1 pt-2">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Ada kendala atau ingin menambah menu?</p>
          <a
            href="https://wa.me/6283838432860"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <span>💬 Hubungi Kasir via WhatsApp (0838-3843-2860)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
