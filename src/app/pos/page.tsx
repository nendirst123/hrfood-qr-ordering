'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AdminPinGate from '@/components/AdminPinGate';
import ThermalReceiptModal from '@/components/ThermalReceiptModal';
import { ThemeToggle } from '@/components/ThemeProvider';
import { MenuItem, Order, OrderType, PaymentMethod, CartItemOptionSelected } from '@/types/order';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  Search,
  Banknote,
  QrCode,
  UtensilsCrossed,
  ShoppingBag,
  ChefHat,
  LayoutDashboard,
  Check,
  AlertCircle,
  X,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

type CartLine = {
  cartId: string;
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  selectedOptions: CartItemOptionSelected[];
  notes: string;
  image: string;
};

function toIdr(n: number): string {
  return `Rp${Number(n || 0).toLocaleString('id-ID')}`;
}

/** Varian default = pilihan pertama tiap grup opsi (sambal & level standar). */
function defaultOptions(item: MenuItem): { selected: CartItemOptionSelected[]; unitPrice: number } {
  let unitPrice = Number(item.price) || 0;
  const selected: CartItemOptionSelected[] = (item.options || []).map((opt) => {
    const choice = opt.choices[0];
    const extra = Number(choice?.extraPrice) || 0;
    unitPrice += extra;
    return { optionName: opt.name, choiceLabel: choice?.label || '', extraPrice: extra };
  });
  return { selected, unitPrice };
}

export default function PosPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('Semua');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cashier');
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Modal custom varian pilihan kasir
  const [optionModalItem, setOptionModalItem] = useState<MenuItem | null>(null);
  const [modalSelections, setModalSelections] = useState<Record<string, string>>({});
  const [modalNotes, setModalNotes] = useState('');

  // Jam digital live
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Jakarta',
        }) + ' WIB'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch daftar menu
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/menu');
        const json = await res.json();
        if (json.success) setMenuItems(json.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((m) => m.category && set.add(m.category));
    return ['Semua', ...Array.from(set)];
  }, [menuItems]);

  const filtered = useMemo(() => {
    return menuItems.filter((m) => {
      const okCat = category === 'Semua' || m.category === category;
      const q = search.toLowerCase().trim();
      const okSearch = !q || m.name.toLowerCase().includes(q) || (m.category || '').toLowerCase().includes(q);
      return okCat && okSearch;
    });
  }, [menuItems, category, search]);

  const subtotal = useMemo(() => {
    return cart.reduce((a, l) => a + l.unitPrice * l.quantity, 0);
  }, [cart]);

  // Kalkulasi uang diterima & kembalian
  const cashNum = typeof cashReceived === 'number' ? cashReceived : 0;
  const changeAmount = Math.max(0, cashNum - subtotal);
  const isCashInsufficient = paymentMethod === 'cashier' && subtotal > 0 && cashNum < subtotal;

  // Rekomendasi nominal pecahan uang cepat
  const quickCashSuggestions = useMemo(() => {
    if (subtotal <= 0) return [10000, 20000, 50000, 100000];
    const s = new Set<number>();
    s.add(subtotal); // Uang Pas

    // Pecahan bulat di atas subtotal
    const round10k = Math.ceil(subtotal / 10000) * 10000;
    if (round10k > subtotal) s.add(round10k);

    const round20k = Math.ceil(subtotal / 20000) * 20000;
    if (round20k > subtotal) s.add(round20k);

    const round50k = Math.ceil(subtotal / 50000) * 50000;
    if (round50k > subtotal) s.add(round50k);

    const round100k = Math.ceil(subtotal / 100000) * 100000;
    if (round100k > subtotal) s.add(round100k);

    // Standar pecahan umum
    if (subtotal < 50000) s.add(50000);
    if (subtotal < 100000) s.add(100000);
    s.add(200000);

    return Array.from(s).sort((a, b) => a - b).slice(0, 6);
  }, [subtotal]);

  // Klik menu di grid: jika ada opsi varian, buka modal pilihan; jika tidak ada opsi, langsung add
  const handleItemClick = (item: MenuItem) => {
    if (item.isAvailable === false) return;

    if (item.options && item.options.length > 0) {
      // Siapkan modal dengan pilihan default pertama
      const initial: Record<string, string> = {};
      item.options.forEach((opt) => {
        if (opt.choices?.[0]) initial[opt.name] = opt.choices[0].label;
      });
      setModalSelections(initial);
      setModalNotes('');
      setOptionModalItem(item);
    } else {
      // Langsung tambah
      addDirectToCart(item);
    }
  };

  const addDirectToCart = (item: MenuItem) => {
    const { selected, unitPrice } = defaultOptions(item);
    const cartId = `${item.id}-default`;

    setCart((prev) => {
      const idx = prev.findIndex((l) => l.cartId === cartId && !l.notes);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          cartId,
          itemId: item.id,
          name: item.name,
          quantity: 1,
          unitPrice,
          selectedOptions: selected,
          notes: '',
          image: item.image,
        },
      ];
    });
  };

  const confirmOptionModal = () => {
    if (!optionModalItem) return;

    let unitPrice = Number(optionModalItem.price) || 0;
    const selected: CartItemOptionSelected[] = (optionModalItem.options || []).map((opt) => {
      const chosenLabel = modalSelections[opt.name] || opt.choices?.[0]?.label || '';
      const choice = opt.choices.find((c) => c.label === chosenLabel);
      const extra = Number(choice?.extraPrice) || 0;
      unitPrice += extra;
      return { optionName: opt.name, choiceLabel: chosenLabel, extraPrice: extra };
    });

    const optKey = selected.map((s) => `${s.optionName}:${s.choiceLabel}`).join('|');
    const noteKey = modalNotes.trim();
    const cartId = `${optionModalItem.id}-${optKey}-${noteKey}`;

    setCart((prev) => {
      const idx = prev.findIndex((l) => l.cartId === cartId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          cartId,
          itemId: optionModalItem.id,
          name: optionModalItem.name,
          quantity: 1,
          unitPrice,
          selectedOptions: selected,
          notes: noteKey,
          image: optionModalItem.image,
        },
      ];
    });

    setOptionModalItem(null);
  };

  const changeQty = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.cartId === cartId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const removeCartItem = (cartId: string) => {
    setCart((prev) => prev.filter((l) => l.cartId !== cartId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setCashReceived('');
    setError('');
  };

  const submitOrder = async () => {
    setError('');
    if (cart.length === 0) {
      setError('Keranjang masih kosong. Pilih menu terlebih dahulu.');
      return;
    }
    if (orderType === 'dine_in' && !tableNumber.trim()) {
      setError('Nomor meja wajib diisi untuk pesanan makan di tempat.');
      return;
    }

    if (paymentMethod === 'cashier') {
      if (typeof cashReceived !== 'number' || cashReceived < subtotal) {
        setError(`Uang tunai belum cukup! Total tagihan ${toIdr(subtotal)}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          tableNumber: orderType === 'dine_in' ? tableNumber.trim() : undefined,
          customerName: customerName.trim() || (orderType === 'dine_in' ? `Meja ${tableNumber.trim()}` : 'Walk-in'),
          items: cart.map((l) => ({
            itemId: l.itemId,
            name: l.name,
            quantity: l.quantity,
            selectedOptions: l.selectedOptions,
            notes: l.notes || undefined,
          })),
          paymentMethod,
          source: 'pos',
          cashReceived: paymentMethod === 'cashier' ? cashNum : undefined,
          changeAmount: paymentMethod === 'cashier' ? changeAmount : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal membuat pesanan.');

      let order: Order = json.data;

      // Tunai di kasir = otomatis lunas & langsung masuk antrean koki dapur
      if (paymentMethod === 'cashier') {
        const p2 = await fetch(`/api/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'cooking',
            isPaid: true,
            cashReceived: cashNum,
            changeAmount: changeAmount,
          }),
        });
        const j2 = await p2.json();
        if (j2.success) order = j2.data;
      }

      setLastOrder(order);
      setShowReceipt(true);
      setCart([]);
      setCashReceived('');
      setCustomerName('');
      // nomor meja tetap dipertahankan untuk kenyamanan bila kasir memesankan ronde kedua
    } catch (e: any) {
      setError(e.message || 'Gagal membuat pesanan kasir.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPinGate>
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-red-500 selection:text-white flex flex-col">
        {/* Top Header POS: Modern Minimalist */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-2.5">
          <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-3">
            {/* Logo & Identity */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition">
                  HR
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm tracking-tight">HR Food</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                      POS Kasir
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
                    Walk-in & Pembayaran Langsung
                  </p>
                </div>
              </Link>
            </div>

            {/* Live Clock & Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{currentTime || 'Memuat waktu...'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Kasir Aktif</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <Link
                href="/kitchen"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
                title="Buka Layar Koki Dapur"
              >
                <ChefHat className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Dapur</span>
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
                title="Buka Dashboard Owner / Admin"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-500" />
                <span className="hidden sm:inline">Owner</span>
              </Link>
              <div className="border-l border-zinc-200 dark:border-zinc-800 pl-1.5 ml-1">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Layout */}
        <div className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-4 flex flex-col lg:flex-row gap-4 items-start">
          {/* Kolom Kiri: Menu Catalog & Selector */}
          <main className="flex-1 min-w-0 w-full space-y-3">
            {/* Search & Category Header Bar */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari menu cepat (mis. Nasi, Ayam, Sambal)..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition placeholder:text-zinc-400"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Horizontal Category Pill Scroller */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                {categories.map((c) => {
                  const isActive = category === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all select-none ${
                        isActive
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Items Grid */}
            {loading ? (
              <div className="py-20 text-center text-zinc-400 text-xs font-medium">
                Memuat katalog menu...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                <p className="text-zinc-500 text-sm font-bold">Menu tidak ditemukan</p>
                <p className="text-xs text-zinc-400 mt-1">Coba kata kunci pencarian atau kategori lain.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
                {filtered.map((item) => {
                  const soldOut = item.isAvailable === false;
                  const lowStock = typeof item.stock === 'number' && item.stock > 0 && item.stock <= 5;
                  const hasOptions = item.options && item.options.length > 0;

                  return (
                    <button
                      key={item.id}
                      disabled={soldOut}
                      onClick={() => handleItemClick(item)}
                      className={`group relative bg-white dark:bg-zinc-900 border rounded-2xl p-2 sm:p-2.5 text-left flex flex-col justify-between transition-all shadow-sm ${
                        soldOut
                          ? 'opacity-40 border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-500/50 hover:shadow-md active:scale-[0.98]'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative mb-2">
                        <img
                          src={item.image}
                          alt={item.name}
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                            soldOut ? 'grayscale' : ''
                          }`}
                          loading="lazy"
                        />
                        {soldOut && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-[10px] font-black uppercase tracking-wider text-white bg-red-600 px-2 py-0.5 rounded-md">
                              Habis
                            </span>
                          </div>
                        )}
                        {!soldOut && hasOptions && (
                          <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm text-[9.5px] font-bold text-white px-1.5 py-0.5 rounded-md">
                            Pilihan Opsi
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <p className="text-xs font-bold leading-tight line-clamp-2 text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                            {item.category}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                          <span className="text-xs sm:text-sm font-black text-red-700 dark:text-red-400">
                            {toIdr(item.price)}
                          </span>

                          {typeof item.stock === 'number' && !soldOut && (
                            <span
                              className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${
                                lowStock
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                  : 'text-zinc-400'
                              }`}
                            >
                              Sisa {item.stock}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </main>

          {/* Kolom Kanan: Keranjang Kasir & Kalkulator Kembalian */}
          <aside className="w-full lg:w-[410px] flex-shrink-0">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-4 lg:sticky lg:top-16 space-y-3.5">
              {/* Header Keranjang */}
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm leading-tight">Keranjang Kasir</h2>
                    <p className="text-[10.5px] text-zinc-400">
                      {cart.reduce((a, l) => a + l.quantity, 0)} menu dipilih
                    </p>
                  </div>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Kosongkan</span>
                  </button>
                )}
              </div>

              {/* Tipe Pesanan Switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setOrderType('dine_in')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition select-none ${
                    orderType === 'dine_in'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5 text-red-600" />
                  <span>Makan di Tempat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('takeaway')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition select-none ${
                    orderType === 'takeaway'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bawa Pulang</span>
                </button>
              </div>

              {/* Meja & Nama Pelanggan */}
              <div className="grid grid-cols-3 gap-2">
                {orderType === 'dine_in' ? (
                  <>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        No. Meja*
                      </label>
                      <input
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                        placeholder="01"
                        inputMode="numeric"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-extrabold text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Nama Tamu (Opsional)
                      </label>
                      <input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value.slice(0, 40))}
                        placeholder="Mis. Pak Budi"
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-span-3">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      Nama Tamu / Pemesan (Bawa Pulang)
                    </label>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value.slice(0, 40))}
                      placeholder="Nama pelanggan walk-in..."
                      className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                )}
              </div>

              {/* Daftar Item Keranjang */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    Ketuk menu di kiri untuk menambahkan pesanan.
                  </div>
                ) : (
                  cart.map((line) => (
                    <div
                      key={line.cartId}
                      className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-zinc-50/60 dark:bg-zinc-800/40 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">
                            {line.name}
                          </p>
                          {line.selectedOptions && line.selectedOptions.length > 0 && (
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                              {line.selectedOptions.map((o) => o.choiceLabel).join(', ')}
                            </p>
                          )}
                          {line.notes && (
                            <p className="text-[9.5px] font-semibold text-amber-600 dark:text-amber-400 italic">
                              * {line.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeCartItem(line.cartId)}
                          className="text-zinc-400 hover:text-red-600 p-0.5 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                        {/* Stepper Qty */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => changeQty(line.cartId, -1)}
                            className="w-6 h-6 rounded-md bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-600 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black w-6 text-center">{line.quantity}</span>
                          <button
                            onClick={() => changeQty(line.cartId, 1)}
                            className="w-6 h-6 rounded-md bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-600 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-black text-zinc-900 dark:text-white">
                          {toIdr(line.unitPrice * line.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Subtotal Bar */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500">Total Tagihan</span>
                <span className="text-base font-black text-red-700 dark:text-red-400">{toIdr(subtotal)}</span>
              </div>

              {/* Pilihan Metode Pembayaran */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cashier')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition ${
                      paymentMethod === 'cashier'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Tunai (Cash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition ${
                      paymentMethod === 'qris'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QRIS Scan</span>
                  </button>
                </div>
              </div>

              {/* KALKULATOR KEMBALIAN (Hanya saat Tunai) */}
              {paymentMethod === 'cashier' && (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                      Uang Tunai Diterima
                    </label>
                    {cashReceived !== '' && (
                      <button
                        onClick={() => setCashReceived('')}
                        className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Input Uang Tunai */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cashReceived !== '' ? Number(cashReceived).toLocaleString('id-ID') : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setCashReceived(raw ? Number(raw) : '');
                      }}
                      placeholder={subtotal > 0 ? subtotal.toLocaleString('id-ID') : '0'}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Rekomendasi Pecahan Cepat */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setCashReceived(subtotal)}
                      disabled={subtotal <= 0}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 hover:border-emerald-500 active:scale-95 transition"
                    >
                      Uang Pas
                    </button>
                    {quickCashSuggestions.map((nom) => (
                      <button
                        key={nom}
                        type="button"
                        onClick={() => setCashReceived(nom)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border active:scale-95 transition ${
                          cashReceived === nom
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 hover:border-emerald-500 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {nom >= 1000 ? `${nom / 1000}rb` : toIdr(nom)}
                      </button>
                    ))}
                  </div>

                  {/* Tampilan Kembalian / Kurang */}
                  {subtotal > 0 && cashReceived !== '' && (
                    <div
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition ${
                        isCashInsufficient
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      <span>{isCashInsufficient ? 'Uang Masih Kurang' : 'Kembalian Pelanggan'}</span>
                      <span className="text-sm font-black">
                        {isCashInsufficient ? toIdr(subtotal - cashNum) : toIdr(changeAmount)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Button: Proses & Cetak Struk */}
              <button
                type="button"
                onClick={submitOrder}
                disabled={submitting || cart.length === 0 || isCashInsufficient}
                className="w-full py-3 px-4 rounded-xl bg-red-700 hover:bg-red-600 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Memproses Pesanan...</span>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Bayar & Cetak Struk • {toIdr(subtotal)}</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-zinc-400 text-center leading-tight">
                {paymentMethod === 'cashier'
                  ? 'Tunai kasir otomatis berstatus Lunas dan langsung masuk ke tiket antrean dapur.'
                  : 'Pesanan QRIS menunggu konfirmasi scan sebelum diproses koki.'}
              </p>
            </div>
          </aside>
        </div>

        {/* MODAL PILIHAN VARIAN KASIR (1-Click Fast Tap) */}
        {optionModalItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <img
                    src={optionModalItem.image}
                    alt={optionModalItem.name}
                    className="w-12 h-12 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                      {optionModalItem.name}
                    </h3>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">
                      {toIdr(optionModalItem.price)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOptionModalItem(null)}
                  className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Opsi-opsi (Sambal & Level Pedas) */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {(optionModalItem.options || []).map((opt) => (
                  <div key={opt.name} className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      {opt.name}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {opt.choices.map((choice) => {
                        const isSelected = modalSelections[opt.name] === choice.label;
                        return (
                          <button
                            key={choice.label}
                            type="button"
                            onClick={() =>
                              setModalSelections((prev) => ({
                                ...prev,
                                [opt.name]: choice.label,
                              }))
                            }
                            className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition flex items-center justify-between ${
                              isSelected
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm'
                                : 'bg-zinc-50 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                            }`}
                          >
                            <span className="truncate">{choice.label}</span>
                            {!!choice.extraPrice && choice.extraPrice > 0 && (
                              <span className="text-[10px] font-black text-amber-500 ml-1">
                                +{toIdr(choice.extraPrice)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Catatan Khusus */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    Catatan Masakan (Opsional)
                  </label>
                  <input
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value.slice(0, 80))}
                    placeholder="Mis. jangan terlalu asin / sambal dipisah..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOptionModalItem(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmOptionModal}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-600 text-white shadow transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah ke Keranjang</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Cetak Struk Thermal */}
        {showReceipt && (
          <ThermalReceiptModal
            order={lastOrder}
            onClose={() => {
              setShowReceipt(false);
              setLastOrder(null);
            }}
          />
        )}
      </div>
    </AdminPinGate>
  );
}
