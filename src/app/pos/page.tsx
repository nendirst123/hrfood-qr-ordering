'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminPinGate from '@/components/AdminPinGate';
import ThermalReceiptModal from '@/components/ThermalReceiptModal';
import { MenuItem, Order, OrderType, PaymentMethod, CartItemOptionSelected } from '@/types/order';
import { ShoppingCart, Plus, Minus, Trash2, Printer, Search, Banknote, QrCode, UtensilsCrossed, ShoppingBag } from 'lucide-react';

type CartLine = {
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

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
      const q = search.toLowerCase();
      const okSearch = !q || m.name.toLowerCase().includes(q);
      return okCat && okSearch;
    });
  }, [menuItems, category, search]);

  const addToCart = (item: MenuItem) => {
    if (item.isAvailable === false) return;
    const { selected, unitPrice } = defaultOptions(item);
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.itemId === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, {
        itemId: item.id, name: item.name, quantity: 1,
        unitPrice, selectedOptions: selected, notes: '', image: item.image,
      }];
    });
  };

  const changeQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev.map((l) => (l.itemId === itemId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const setNote = (itemId: string, notes: string) => {
    setCart((prev) => prev.map((l) => (l.itemId === itemId ? { ...l, notes } : l)));
  };

  const subtotal = cart.reduce((a, l) => a + l.unitPrice * l.quantity, 0);

  const submitOrder = async () => {
    setError('');
    if (cart.length === 0) {
      setError('Keranjang masih kosong.');
      return;
    }
    if (orderType === 'dine_in' && !tableNumber.trim()) {
      setError('Nomor meja wajib diisi untuk makan di tempat.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          tableNumber: orderType === 'dine_in' ? tableNumber.trim() : undefined,
          customerName: customerName.trim() || 'Walk-in',
          items: cart.map((l) => ({
            itemId: l.itemId,
            name: l.name,
            quantity: l.quantity,
            selectedOptions: l.selectedOptions,
            notes: l.notes || undefined,
          })),
          paymentMethod,
          source: 'pos',
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal membuat pesanan.');

      let order: Order = json.data;

      // Tunai di kasir = langsung lunas & masuk dapur
      if (paymentMethod === 'cashier') {
        const p2 = await fetch(`/api/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cooking', isPaid: true }),
        });
        const j2 = await p2.json();
        if (j2.success) order = j2.data;
      }

      setLastOrder(order);
      setShowReceipt(true);
      setCart([]);
      setCustomerName('');
      // tableNumber dipertahankan untuk order berikutnya di meja yang sama
    } catch (e: any) {
      setError(e.message || 'Gagal membuat pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPinGate>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-red-700 text-white px-4 py-3 flex items-center justify-between shadow">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            <div>
              <h1 className="font-black text-sm leading-tight">Mode Kasir</h1>
              <p className="text-[11px] opacity-80">HR Food — walk-in / tanpa QR</p>
            </div>
          </div>
          <a href="/kitchen" className="text-xs font-bold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl transition">
            → Dapur
          </a>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 p-3 sm:p-4 max-w-7xl mx-auto">
          {/* Kiri: menu */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari menu..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    category === c
                      ? 'bg-red-700 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-sm text-slate-500 text-center py-10">Memuat menu...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filtered.map((m) => {
                  const soldOut = m.isAvailable === false;
                  const lowStock = typeof m.stock === 'number' && m.stock > 0 && m.stock <= 5;
                  return (
                    <button
                      key={m.id}
                      disabled={soldOut}
                      onClick={() => addToCart(m)}
                      className={`bg-white dark:bg-slate-900 border rounded-2xl p-2.5 text-left transition shadow-sm ${
                        soldOut
                          ? 'opacity-50 border-slate-200 dark:border-slate-800'
                          : 'border-slate-200 dark:border-slate-700 hover:border-red-400 active:scale-[0.98]'
                      }`}
                    >
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2">
                        <img src={m.image} alt={m.name} className={`w-full h-full object-cover ${soldOut && 'grayscale'}`} loading="lazy" />
                      </div>
                      <p className="text-xs font-bold truncate">{m.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-black text-red-700 dark:text-red-400">{toIdr(m.price)}</span>
                        {soldOut ? (
                          <span className="text-[10px] font-black text-red-600 uppercase">Habis</span>
                        ) : typeof m.stock === 'number' ? (
                          <span className={`text-[10px] font-bold ${lowStock ? 'text-amber-600' : 'text-slate-500'}`}>
                            Stok {m.stock}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Kanan: keranjang */}
          <div className="w-full lg:w-[360px] flex-shrink-0">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-4 lg:sticky lg:top-20">
              <h2 className="font-black text-sm flex items-center gap-2 mb-3">
                <ShoppingCart className="w-4 h-4" /> Keranjang
                <span className="ml-auto text-xs font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                  {cart.reduce((a, l) => a + l.quantity, 0)} item
                </span>
              </h2>

              {/* Tipe order */}
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {([
                  { v: 'dine_in', label: 'Makan di Tempat', icon: UtensilsCrossed },
                  { v: 'takeaway', label: 'Bawa Pulang', icon: ShoppingBag },
                ] as const).map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setOrderType(o.v)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold border transition ${
                      orderType === o.v
                        ? 'bg-red-700 text-white border-red-700'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <o.icon className="w-4 h-4" /> {o.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {orderType === 'dine_in' && (
                  <input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                    placeholder="No. Meja*"
                    inputMode="numeric"
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                )}
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value.slice(0, 40))}
                  placeholder="Nama (opsional)"
                  className={`px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${orderType !== 'dine_in' ? 'col-span-2' : ''}`}
                />
              </div>

              {/* Item keranjang */}
              <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                {cart.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">Ketuk menu untuk menambah.</p>
                )}
                {cart.map((l) => (
                  <div key={l.itemId} className="border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold truncate flex-1">{l.name}</p>
                      <button onClick={() => setCart((p) => p.filter((x) => x.itemId !== l.itemId))} className="text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => changeQty(l.itemId, -1)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-black w-6 text-center">{l.quantity}</span>
                        <button onClick={() => changeQty(l.itemId, 1)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs font-black">{toIdr(l.unitPrice * l.quantity)}</span>
                    </div>
                    <input
                      value={l.notes}
                      onChange={(e) => setNote(l.itemId, e.target.value.slice(0, 100))}
                      placeholder="Catatan (mis. es teh manisnya dikit)"
                      className="mt-1.5 w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                ))}
              </div>

              {/* Pembayaran */}
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {([
                  { v: 'cashier', label: 'Tunai', icon: Banknote },
                  { v: 'qris', label: 'QRIS', icon: QrCode },
                ] as const).map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setPaymentMethod(o.v)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold border transition ${
                      paymentMethod === o.v
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <o.icon className="w-4 h-4" /> {o.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-200 dark:border-slate-700 mb-3">
                <span className="text-sm font-bold text-slate-500">Total</span>
                <span className="text-lg font-black text-red-700 dark:text-red-400">{toIdr(subtotal)}</span>
              </div>

              {error && (
                <p className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2 mb-3">{error}</p>
              )}

              <button
                onClick={submitOrder}
                disabled={submitting || cart.length === 0}
                className="w-full py-3 rounded-2xl bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-black text-sm transition shadow"
              >
                {submitting ? 'Memproses...' : `Buat Pesanan • ${toIdr(subtotal)}`}
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Tunai = otomatis lunas & masuk dapur • QRIS = pelanggan scan di kasir
              </p>
            </div>
          </div>
        </div>
      </div>

      {showReceipt && (
        <ThermalReceiptModal order={lastOrder} onClose={() => { setShowReceipt(false); setLastOrder(null); }} />
      )}
    </AdminPinGate>
  );
}
