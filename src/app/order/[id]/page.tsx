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
  Check,
  Bike,
  Package,
  MapPin,
  Phone,
  MessageCircle,
  Navigation
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
        case 'ready': return 1; // Siap packing
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
    <div className="min-h-screen pb-20 max-w-md mx-auto bg-slate-50 shadow-xl">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <button
          onClick={() => router.push(orderType === 'dine_in' ? `/?table=${order.tableNumber}` : `/?type=${orderType}`)}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Pesan Lagi
        </button>
        <div className="flex items-center gap-1.5">
          <img src="/hrfood-emblem.png" alt="HR Food" className="w-6 h-6 object-contain" />
          <span className="text-xs font-bold text-slate-800">Status Pesanan</span>
        </div>
        
        {/* Badge Tipe Pesanan */}
        {orderType === 'delivery' ? (
          <div className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-black flex items-center gap-1">
            <Bike className="w-3 h-3 text-purple-700" />
            <span>Delivery</span>
          </div>
        ) : orderType === 'takeaway' ? (
          <div className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center gap-1">
            <Package className="w-3 h-3 text-emerald-700" />
            <span>Bungkus</span>
          </div>
        ) : (
          <div className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-black">
            Meja {order.tableNumber}
          </div>
        )}
      </header>

      <div className="p-4 space-y-4">
        {/* Order Header Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nomor Pesanan</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{order.orderNumber}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pelanggan: <strong className="text-slate-800">{order.customerName}</strong>
          </p>

          {/* Badge Lunas / Belum Bayar */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold">
            {order.isPaid ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1 text-[11px]">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Pembayaran Lunas
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                {orderType === 'delivery' ? 'Bayar Tunai ke Kurir (COD)' : 'Menunggu Bayar di Kasir'}
              </span>
            )}
          </div>
        </div>

        {/* Informasi Alamat Pengantaran (Jika Delivery) */}
        {orderType === 'delivery' && (
          <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-2xl p-4 shadow-lg space-y-3">
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

        {/* QRIS Box jika belum bayar & metode qris */}
        {!order.isPaid && order.paymentMethod === 'qris' && (
          <div className="bg-gradient-to-b from-rose-50 to-white rounded-2xl p-5 border border-rose-200 text-center shadow-sm">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100/70 px-3 py-1 rounded-full mb-3">
              <QrCode className="w-3.5 h-3.5" /> Scan QRIS di Bawah Ini
            </div>
            
            <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl shadow-inner border border-slate-200 flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=HR-FOOD-${order.orderNumber}-TOTAL-${order.total}`}
                alt="QRIS Code"
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Total Tagihan: <strong className="text-rose-600 font-extrabold text-sm">Rp {order.total.toLocaleString('id-ID')}</strong>
            </p>

            <button
              disabled={isSimulatingPay}
              onClick={handleSimulatePayQRIS}
              className="mt-3 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              {isSimulatingPay ? 'Memverifikasi Pembayaran...' : 'Simulasi Pembayaran Berhasil'}
            </button>
          </div>
        )}

        {/* Live Stepper Tracker */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {orderType === 'delivery' ? 'Status Pengantaran Live' : 'Status Proses Pesanan'}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Auto-update realtime</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isPassed = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div key={step.key} className="relative flex items-start gap-3">
                  <div
                    className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isPassed
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-50'
                        : isCurrent
                        ? orderType === 'delivery'
                          ? 'bg-purple-600 text-white ring-4 ring-purple-100 animate-pulse'
                          : 'bg-rose-600 text-white ring-4 ring-rose-100 animate-pulse'
                        : 'bg-slate-200 text-slate-400'
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
                          ? orderType === 'delivery' ? 'text-purple-700' : 'text-rose-600'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ringkasan Item Pesanan */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Rincian Item Hidangan ({order.items.length})
          </h3>

          <div className="space-y-2.5">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>{item.quantity}x</span>
                    <span>{item.name}</span>
                  </div>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <p className="text-[10px] text-slate-500 pl-4">
                      {item.selectedOptions.map((o) => o.choiceLabel).join(' • ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 ml-4 inline-block">
                      Catatan: {item.notes}
                    </p>
                  )}
                </div>
                <span className="font-semibold text-slate-700 whitespace-nowrap">
                  Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>

          {/* Rincian Finansial */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rp {order.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Pajak Resto (PB1 10%)</span>
              <span>Rp {order.tax.toLocaleString('id-ID')}</span>
            </div>
            {orderType === 'delivery' && (
              <div className="flex justify-between text-purple-700 font-medium">
                <span>Ongkir ({order.deliveryZoneName || 'Pengantaran'})</span>
                <span>
                  {order.deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold">GRATIS</span>
                  ) : (
                    `Rp ${(order.deliveryFee || 0).toLocaleString('id-ID')}`
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Pembayaran</span>
              <span className="text-rose-600">Rp {order.total.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Bantuan / Kontak Resto */}
        <div className="text-center space-y-1 pt-2">
          <p className="text-[11px] text-slate-400">Ada kendala atau ingin menambah menu?</p>
          <a
            href="https://wa.me/6283838432860"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
          >
            <span>💬 Hubungi Kasir via WhatsApp (0838-3843-2860)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
