'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Utensils, 
  Volume2, 
  VolumeX, 
  Printer, 
  RefreshCw, 
  QrCode, 
  CreditCard, 
  AlertCircle,
  Check,
  Search,
  ExternalLink,
  Bike,
  Package,
  MapPin,
  Phone,
  MessageCircle,
  Navigation
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/order';

// Web Audio API Chime Synthesizer
function playNewOrderChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Nada 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Nada 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.error('Audio play error:', err);
  }
}

export default function KitchenDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');

  const prevOrderCountRef = useRef<number>(0);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const fetched: Order[] = data.data;

        // Cek jika ada pesanan baru masuk
        if (prevOrderCountRef.current > 0 && fetched.length > prevOrderCountRef.current) {
          if (audioEnabled) {
            playNewOrderChime();
          }
        }
        prevOrderCountRef.current = fetched.length;
        setOrders(fetched);
      }
    } catch (err) {
      console.error('Failed fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [audioEnabled]);

  // Update Status
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, isPaid?: boolean) => {
    try {
      const payload: any = { status: newStatus };
      if (typeof isPaid === 'boolean') payload.isPaid = isPaid;

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.data : o)));
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  // Cetak Kitchen Slip / Kasir Receipt
  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Filter List
  const filteredOrders = orders.filter((order) => {
    const type = order.orderType || 'dine_in';

    if (filterStatus === 'active') {
      return order.status !== 'completed' && order.status !== 'cancelled';
    }
    if (filterStatus === 'dine_in') {
      return type === 'dine_in' && order.status !== 'completed' && order.status !== 'cancelled';
    }
    if (filterStatus === 'delivery') {
      return type === 'delivery' && order.status !== 'completed' && order.status !== 'cancelled';
    }
    if (filterStatus === 'takeaway') {
      return type === 'takeaway' && order.status !== 'completed' && order.status !== 'cancelled';
    }
    if (filterStatus === 'pending_payment') {
      return !order.isPaid;
    }
    if (filterStatus === 'cooking') {
      return order.status === 'cooking';
    }
    if (filterStatus === 'on_delivery') {
      return order.status === 'on_delivery';
    }
    if (filterStatus === 'ready') {
      return order.status === 'ready';
    }
    if (filterStatus === 'completed') {
      return order.status === 'completed';
    }
    return true;
  });

  // Counters
  const activeCount = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;
  const deliveryCount = orders.filter((o) => o.orderType === 'delivery' && o.status !== 'completed' && o.status !== 'cancelled').length;
  const takeawayCount = orders.filter((o) => o.orderType === 'takeaway' && o.status !== 'completed' && o.status !== 'cancelled').length;
  const cookingCount = orders.filter((o) => o.status === 'cooking').length;
  const onDeliveryCount = orders.filter((o) => o.status === 'on_delivery').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Staff Dashboard */}
      <header className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/95 p-1 flex items-center justify-center shadow-md shadow-red-950/60 flex-shrink-0">
              <img src="/hrfood-emblem.png" alt="HR Food" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-black text-white truncate">
                  KDS Dapur & Ekspedisi
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Pantau antrean masak di meja, pesanan delivery kurir, dan takeaway
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Alarm Audio Toggle */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                audioEnabled
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
              title={audioEnabled ? 'Alarm Suara Aktif' : 'Alarm Senyap'}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              <span className="hidden sm:inline">{audioEnabled ? 'Alarm: On' : 'Alarm: Mute'}</span>
            </button>

            {/* Link POS Kasir & Rekap */}
            <Link
              href="/admin"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow transition"
              title="Buka Kasir & Rekap Omzet"
            >
              <span>📊</span>
              <span className="hidden xs:inline sm:inline">Kasir</span>
            </Link>

            {/* Link Menu Tamu */}
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Buka Halaman Pemesanan"
            >
              <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Menu Tamu</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Filter Tabs Bar */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-3 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 max-w-full">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
              filterStatus === 'active'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span>Semua Aktif</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('delivery')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
              filterStatus === 'delivery'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Bike className="w-3 h-3 text-purple-300" />
            <span>🛵 Delivery</span>
            {deliveryCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] text-purple-200">
                {deliveryCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterStatus('takeaway')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
              filterStatus === 'takeaway'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Package className="w-3 h-3 text-emerald-300" />
            <span>🛍️ Bungkus</span>
            {takeawayCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] text-emerald-200">
                {takeawayCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterStatus('cooking')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
              filterStatus === 'cooking'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/50'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-300" />
            <span>🍳 Dimasak ({cookingCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('on_delivery')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
              filterStatus === 'on_delivery'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Navigation className="w-3 h-3 text-indigo-300" />
            <span>Diantar Kurir ({onDeliveryCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
              filterStatus === 'completed'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Riwayat Selesai</span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setViewMode(viewMode === 'cards' ? 'compact' : 'cards')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition flex items-center gap-1 border border-slate-700"
            title={viewMode === 'cards' ? 'Beralih ke Tampilan Ringkas' : 'Beralih ke Tampilan Kartu'}
          >
            <span>{viewMode === 'cards' ? '📑' : '🔲'}</span>
            <span className="hidden sm:inline">{viewMode === 'cards' ? 'Ringkas' : 'Kartu'}</span>
          </button>

          <button
            onClick={fetchOrders}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Segarkan Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Container */}
      <main className="p-2.5 sm:p-6 flex-1 overflow-y-auto">
        {loading && orders.length === 0 ? (
          <div className="py-24 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-rose-500" />
            <p className="text-sm">Menghubungkan ke sistem pesanan HR Food...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 stroke-1 mx-auto mb-3 text-slate-700" />
            <p className="text-sm sm:text-base font-bold text-slate-400">Tidak ada antrean pada kategori ini</p>
            <p className="text-xs text-slate-600 mt-1">Pesanan masuk akan muncul secara realtime.</p>
          </div>
        ) : viewMode === 'compact' ? (
          /* TAMPILAN RINGKAS */
          <div className="space-y-2.5 max-w-4xl mx-auto">
            {filteredOrders.map((order) => {
              const orderType = order.orderType || 'dine_in';
              const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000));

              return (
                <div
                  key={order.id}
                  className={`p-3 rounded-xl border transition-all ${
                    orderType === 'delivery'
                      ? 'bg-slate-900 border-purple-500/50 ring-1 ring-purple-500/30'
                      : !order.isPaid
                      ? 'bg-slate-900 border-amber-500/50 ring-1 ring-amber-500/30'
                      : order.status === 'cooking'
                      ? 'bg-slate-900 border-red-500/50 ring-1 ring-red-500/30'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {orderType === 'delivery' ? (
                        <span className="text-xs font-black px-2 py-0.5 rounded-md bg-purple-600 text-white flex items-center gap-1">
                          <Bike className="w-3 h-3" /> DELIVERY
                        </span>
                      ) : orderType === 'takeaway' ? (
                        <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white flex items-center gap-1">
                          <Package className="w-3 h-3" /> BUNGKUS
                        </span>
                      ) : (
                        <span className="text-sm font-black text-amber-400">
                          MEJA {order.tableNumber}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-slate-400">{order.orderNumber}</span>
                      <span className="text-xs text-slate-300 font-medium">({order.customerName})</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                        ⏱️ {elapsedMinutes}m
                      </span>
                      {order.isPaid ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          LUNAS
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {orderType === 'delivery' ? 'COD' : 'BELUM BAYAR'}
                        </span>
                      )}
                    </div>
                  </div>

                  {orderType === 'delivery' && (
                    <div className="mb-2 p-2 bg-purple-950/40 border border-purple-800/50 rounded-lg text-[11px] text-purple-200">
                      <p className="line-clamp-1">📍 <strong>Alamat:</strong> {order.deliveryAddress}</p>
                      {order.deliveryNotes && <p className="text-purple-300">📝 Patokan: {order.deliveryNotes}</p>}
                    </div>
                  )}

                  {/* Ringkasan Item Pesanan */}
                  <div className="text-xs text-slate-200 space-y-1 mb-2.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-bold text-white">{item.quantity}x {item.name}</span>
                          {item.selectedOptions.length > 0 && (
                            <span className="text-[11px] text-slate-400 ml-1.5">
                              ({item.selectedOptions.map((o) => o.choiceLabel).join(' • ')})
                            </span>
                          )}
                          {item.notes && (
                            <span className="text-[11px] text-amber-300 block">
                              📝 &ldquo;{item.notes}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tombol Aksi KDS */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handlePrint(order)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300"
                      title="Cetak Tiket"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {order.customerPhone && (
                      <a
                        href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Halo Kak ${order.customerName}, konfirmasi pesanan ${order.orderNumber} dari HR Food siap diproses ya!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/50 transition"
                        title="Chat WA Customer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {!order.isPaid ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'cooking', true)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Konfirmasi & Masak
                      </button>
                    ) : order.status === 'cooking' ? (
                      orderType === 'delivery' ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'on_delivery')}
                          className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow"
                        >
                          <Bike className="w-3.5 h-3.5" /> Berikan ke Kurir (Diantar)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'ready')}
                          className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow"
                        >
                          <Utensils className="w-3.5 h-3.5" /> Siap Saji / Ambil
                        </button>
                      )
                    ) : order.status === 'on_delivery' ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'completed', true)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai / Terkirim
                      </button>
                    ) : order.status === 'ready' ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai Disajikan
                      </button>
                    ) : (
                      <span className="flex-1 text-center text-xs text-slate-500">Selesai</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TAMPILAN KARTU PENUH */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {filteredOrders.map((order) => {
              const orderType = order.orderType || 'dine_in';
              const timeFormatted = new Date(order.createdAt).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000));

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-lg transition duration-200 ${
                    orderType === 'delivery'
                      ? 'bg-slate-900 border-purple-500/60 ring-2 ring-purple-500/30'
                      : !order.isPaid
                      ? 'bg-slate-900 border-amber-500/60 ring-2 ring-amber-500/30'
                      : order.status === 'cooking'
                      ? 'bg-slate-900 border-red-500/60 ring-2 ring-red-500/30'
                      : order.status === 'on_delivery'
                      ? 'bg-slate-900 border-indigo-500/60 ring-2 ring-indigo-500/30'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3.5 border-b border-slate-800/80 bg-slate-850">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {orderType === 'delivery' ? (
                          <div className="px-2.5 py-1 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center gap-1.5 shadow">
                            <Bike className="w-4 h-4" />
                            <span>DELIVERY</span>
                          </div>
                        ) : orderType === 'takeaway' ? (
                          <div className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 shadow">
                            <Package className="w-4 h-4" />
                            <span>BUNGKUS</span>
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 rounded-xl bg-red-600 text-white font-black text-xs sm:text-sm">
                            MEJA {order.tableNumber}
                          </div>
                        )}
                        <span className="font-mono text-xs font-bold text-slate-300">{order.orderNumber}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                          ⏱️ {elapsedMinutes}m
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-semibold truncate max-w-[180px]">
                        👤 {order.customerName}
                      </span>
                      <span className="text-[10px] text-slate-400">{timeFormatted}</span>
                    </div>

                    {/* Informasi Pengantaran / Takeaway */}
                    {orderType === 'delivery' && (
                      <div className="mt-2.5 p-2 rounded-xl bg-purple-950/60 border border-purple-800/60 text-xs space-y-1">
                        <div className="flex items-start gap-1.5 text-purple-200">
                          <MapPin className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                          <p className="line-clamp-2 leading-tight">{order.deliveryAddress}</p>
                        </div>
                        {order.deliveryNotes && (
                          <p className="text-[10px] text-purple-300 pl-5">
                            Patokan: {order.deliveryNotes}
                          </p>
                        )}
                        {order.customerPhone && (
                          <div className="pt-1 flex items-center justify-between text-[11px] text-purple-200 border-t border-purple-800/40">
                            <span>WA: {order.customerPhone}</span>
                            <a
                              href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Halo Kak ${order.customerName}, kami dari HR Food ingin mengonfirmasi pesanan ${order.orderNumber}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-0.5"
                            >
                              <MessageCircle className="w-3 h-3" /> Chat Customer
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {orderType === 'takeaway' && (
                      <div className="mt-2 p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-[11px] text-emerald-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Estimasi Ambil: <strong>{order.pickupTime || 'Segera'}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto max-h-60 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="pb-2 border-b border-slate-800/60 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-white text-sm">
                            <span className="text-amber-400 mr-1.5">{item.quantity}x</span>
                            {item.name}
                          </span>
                        </div>

                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.selectedOptions.map((opt, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium"
                              >
                                {opt.choiceLabel}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <div className="mt-1 text-[11px] text-amber-300 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded">
                            📝 &ldquo;{item.notes}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Card Footer & Action Buttons */}
                  <div className="p-3.5 bg-slate-850 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Total Tagihan:</span>
                      <span className="font-extrabold text-white text-sm">
                        Rp {order.total.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handlePrint(order)}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 transition"
                        title="Cetak Tiket Dapur (KOT)"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Action by state */}
                      {!order.isPaid ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'cooking', true)}
                          className="flex-1 min-h-[40px] py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <Check className="w-4 h-4 stroke-[3]" /> Konfirmasi Bayar & Masak
                        </button>
                      ) : order.status === 'cooking' ? (
                        orderType === 'delivery' ? (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'on_delivery')}
                            className="flex-1 min-h-[40px] py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                          >
                            <Bike className="w-4 h-4" /> Serahkan ke Kurir
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                            className="flex-1 min-h-[40px] py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                          >
                            <Utensils className="w-4 h-4" /> Hidangan Siap
                          </button>
                        )
                      ) : order.status === 'on_delivery' ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'completed', true)}
                          className="flex-1 min-h-[40px] py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Tandai Terkirim / Selesai
                        </button>
                      ) : order.status === 'ready' ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                          className="flex-1 min-h-[40px] py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Sajikan / Serahkan (Selesai)
                        </button>
                      ) : (
                        <span className="flex-1 py-2 text-center text-xs font-semibold text-slate-500">
                          Pesanan Selesai
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Printable Receipt (Disembunyikan di layar, muncul saat window.print()) */}
      {printingOrder && (
        <div id="printable-receipt" className="hidden print:block text-black bg-white font-mono text-xs p-4">
          <div className="text-center pb-2 border-b border-dashed border-black">
            <h2 className="text-sm font-bold">HR FOOD</h2>
            <p className="text-[10px]">MASAKAN RUMAHAN RASA JUARA!</p>
            <p className="text-[10px]">WA / Delivery: 0838-3843-2860</p>
            <p className="text-[9px]">{new Date(printingOrder.createdAt).toLocaleString('id-ID')}</p>
          </div>

          <div className="py-2 border-b border-dashed border-black">
            <div className="flex justify-between font-bold text-sm">
              <span>
                {printingOrder.orderType === 'delivery'
                  ? '🛵 DELIVERY'
                  : printingOrder.orderType === 'takeaway'
                  ? '🛍️ BUNGKUS'
                  : `MEJA: ${printingOrder.tableNumber}`}
              </span>
              <span>{printingOrder.orderNumber}</span>
            </div>
            <p className="text-[11px]">Tamu: {printingOrder.customerName}</p>
            {printingOrder.orderType === 'delivery' && (
              <>
                <p className="text-[10px]">Alamat: {printingOrder.deliveryAddress}</p>
                {printingOrder.deliveryNotes && (
                  <p className="text-[9px]">Patokan: {printingOrder.deliveryNotes}</p>
                )}
                {printingOrder.customerPhone && (
                  <p className="text-[10px]">WA: {printingOrder.customerPhone}</p>
                )}
              </>
            )}
            <p className="text-[10px] mt-1 font-bold">
              Status: {printingOrder.isPaid ? 'LUNAS' : 'BELUM BAYAR (COD / KASIR)'}
            </p>
          </div>

          <div className="py-2 border-b border-dashed border-black space-y-2">
            {printingOrder.items.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between font-bold">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{(item.unitPrice * item.quantity).toLocaleString('id-ID')}</span>
                </div>
                {item.selectedOptions.length > 0 && (
                  <p className="text-[9px] pl-3">
                    {item.selectedOptions.map((o) => o.choiceLabel).join(', ')}
                  </p>
                )}
                {item.notes && (
                  <p className="text-[10px] pl-3 font-bold">
                    ** CATATAN: {item.notes} **
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="py-2 text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp {printingOrder.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Pajak (PB1 10%):</span>
              <span>Rp {printingOrder.tax.toLocaleString('id-ID')}</span>
            </div>
            {printingOrder.orderType === 'delivery' && (
              <div className="flex justify-between font-semibold">
                <span>Ongkos Kirim:</span>
                <span>Rp {(printingOrder.deliveryFee || 0).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
              <span>TOTAL:</span>
              <span>Rp {printingOrder.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="text-center pt-3 border-t border-dashed border-black text-[9px]">
            <p>Terima kasih atas pesanan Anda!</p>
            <p>HR Food - Makan Enak, Mood Naik!</p>
          </div>
        </div>
      )}
    </div>
  );
}
