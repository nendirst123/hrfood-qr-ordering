'use client';

import React, { useState, useEffect } from 'react';
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
  Check
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/order';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isSimulatingPay, setIsSimulatingPay] = useState<boolean>(false);

  // Fetch Order
  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
      } else {
        setError(data.error || 'Pesanan tidak ditemukan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat status pesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Auto-refresh status setiap 4 detik
    const interval = setInterval(fetchOrder, 4000);
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
      if (data.success) {
        setOrder(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingPay(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Memuat status pesanan Anda...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-2" />
        <h2 className="text-lg font-bold text-slate-900">Oops, Terjadi Kendala</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">{error || 'Pesanan tidak ditemukan'}</p>
        <Link
          href="/"
          className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow"
        >
          Kembali ke Menu
        </Link>
      </div>
    );
  }

  // Stepper helper
  const steps: { key: OrderStatus; label: string; desc: string; icon: any }[] = [
    { key: 'pending_payment', label: 'Menunggu Pembayaran', desc: 'Selesaikan transaksi', icon: Clock },
    { key: 'cooking', label: 'Sedang Dimasak', desc: 'Koki menyiapkan pesanan', icon: Flame },
    { key: 'ready', label: 'Siap Disajikan', desc: 'Runner mengantar ke meja', icon: UtensilsCrossed },
    { key: 'completed', label: 'Selesai', desc: 'Selamat menikmati hidangan', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment': return 0;
      case 'cooking': return 1;
      case 'ready': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="min-h-screen pb-20 max-w-md mx-auto bg-slate-50 shadow-xl">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <button
          onClick={() => router.push(`/?table=${order.tableNumber}`)}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Tambah Menu
        </button>
        <div className="flex items-center gap-1.5">
          <img src="/hrfood-emblem.png" alt="HR Food" className="w-6 h-6 object-contain" />
          <span className="text-xs font-bold text-slate-800">Status Pesanan</span>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-black">
          Meja {order.tableNumber}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Order Header Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order ID</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{order.orderNumber}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Atas Nama: <strong className="text-slate-800">{order.customerName}</strong></p>

          {/* Badge Lunas / Belum Bayar */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold">
            {order.isPaid ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> Pembayaran Lunas
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> Menunggu Pembayaran di Kasir
              </span>
            )}
          </div>
        </div>

        {/* QRIS Box jika belum bayar & metode qris */}
        {!order.isPaid && order.paymentMethod === 'qris' && (
          <div className="bg-gradient-to-b from-rose-50 to-white rounded-2xl p-5 border border-rose-200 text-center shadow-sm">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100/70 px-3 py-1 rounded-full mb-3">
              <QrCode className="w-3.5 h-3.5" /> Scan QRIS di Bawah Ini
            </div>
            
            {/* Simulasi Gambar QRIS */}
            <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl shadow-inner border border-slate-200 flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=WAROENG-CAFE-${order.orderNumber}-TOTAL-${order.total}`}
                alt="QRIS Code"
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Total Pembayaran: <strong className="text-rose-600 font-bold">Rp {order.total.toLocaleString('id-ID')}</strong>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Buka BCA Mobile, GoPay, OVO, ShopeePay, atau Livin Mandiri untuk scan.
            </p>

            <button
              disabled={isSimulatingPay}
              onClick={handleSimulatePayQRIS}
              className="mt-3 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition active:scale-[0.98]"
            >
              {isSimulatingPay ? 'Memproses Verifikasi...' : 'Simulasikan Pembayaran Berhasil'}
            </button>
          </div>
        )}

        {/* Info Bayar di Kasir */}
        {!order.isPaid && order.paymentMethod === 'cashier' && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 text-sm">
              <CreditCard className="w-4 h-4" /> Alur Pembayaran Kasir
            </div>
            <p>
              Silakan bawa HP Anda ke <strong>Meja Kasir</strong> dan sebutkan <strong>Meja {order.tableNumber} ({order.orderNumber})</strong>.
            </p>
            <p className="text-amber-800/80">
              Kasir akan menerima pembayaran (Tunai, QRIS, atau Kartu Debit). Setelah kasir mengonfirmasi, koki akan langsung memasak pesanan Anda!
            </p>
          </div>
        )}

        {/* Progress Tracker Stepper */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 mb-3">Perjalanan Masakan Anda</h3>
          <div className="space-y-4 relative">
            {/* Line indicator */}
            <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-slate-200 -z-0"></div>

            {steps.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex items-start gap-3 relative z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isPast
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                      : isCurrent
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-200 ring-4 ring-rose-100'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                    {isPast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <StepIcon className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1">
                    <h4 className={`text-xs font-bold leading-tight ${
                      isCurrent ? 'text-rose-600' : isPast ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rincian Menu Pesanan */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800">Daftar Menu yang Dipesan</h3>
          <div className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-start justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{item.quantity}x {item.name}</p>
                  {item.selectedOptions.length > 0 && (
                    <p className="text-[10px] text-slate-500">
                      {item.selectedOptions.map((o) => o.choiceLabel).join(' • ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                      Catatan: &ldquo;{item.notes}&rdquo;
                    </p>
                  )}
                </div>
                <span className="font-bold text-slate-800 whitespace-nowrap">
                  Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rp {order.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Pajak (PB1 10%)</span>
              <span>Rp {order.tax.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-100">
              <span>Total Tagihan</span>
              <span className="text-rose-600">Rp {order.total.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Kirim Bukti Order ke WhatsApp Kasir */}
        <a
          href={`https://wa.me/6283838432860?text=${encodeURIComponent(
            `Halo HR Food, saya dari Meja ${order.tableNumber}:\n` +
            `No Pesanan: ${order.orderNumber}\n` +
            `Nama: ${order.customerName}\n` +
            `Status: ${order.isPaid ? 'Sudah Lunas' : 'Belum Bayar (Kasir)'}\n` +
            `Menu:\n` +
            order.items.map((i) => `- ${i.quantity}x ${i.name} ${i.selectedOptions.map((o) => o.choiceLabel).join(', ')} ${i.notes ? `(${i.notes})` : ''}`).join('\n') +
            `\nTotal: Rp ${order.total.toLocaleString('id-ID')}\nMohon dicek ya kak, terima kasih!`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-center rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition active:scale-95"
        >
          💬 Kirim / Simpan Struk ke WhatsApp Kasir
        </a>

        {/* Tombol Pesan Lagi */}
        <Link
          href={`/?table=${order.tableNumber}`}
          className="block w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-center rounded-xl text-xs font-bold shadow-sm transition"
        >
          + Tambah Pesanan Lain di Meja {order.tableNumber}
        </Link>
      </div>
    </div>
  );
}
