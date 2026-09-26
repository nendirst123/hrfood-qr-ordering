'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Utensils, 
  Search, 
  Plus, 
  Minus, 
  ShoppingBag, 
  X, 
  Check, 
  Sparkles, 
  CreditCard, 
  Banknote, 
  Clock, 
  ArrowRight,
  Flame,
  ChefHat
} from 'lucide-react';
import { MENU_ITEMS, CATEGORIES } from '@/data/menu';
import { MenuItem, CartItem, CartItemOptionSelected, PaymentMethod } from '@/types/order';

function OrderingAppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('table') || '';

  // State Meja
  const [tableNumber, setTableNumber] = useState<string>(tableParam || '01');
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(!tableParam);
  const [tempTableInput, setTempTableInput] = useState<string>(tableParam || '01');

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart & Modal
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { label: string; extraPrice: number }>>({});
  const [itemNotes, setItemNotes] = useState<string>('');

  // Checkout State
  const [customerName, setCustomerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cashier');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync param table
  useEffect(() => {
    if (tableParam) {
      setTableNumber(tableParam);
      setTempTableInput(tableParam);
      setIsTableModalOpen(false);
    }
  }, [tableParam]);

  // Dynamic Menu Availability State
  const [menuList, setMenuList] = useState<MenuItem[]>(MENU_ITEMS);

  useEffect(() => {
    const fetchMenuStatus = async () => {
      try {
        const res = await fetch('/api/menu');
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setMenuList(data.items);
        }
      } catch (err) {
        console.error('Failed fetching menu availability:', err);
      }
    };
    fetchMenuStatus();
    const interval = setInterval(fetchMenuStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuList.filter((item) => {
      const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [menuList, selectedCategory, searchQuery]);

  // Open Add Product Modal
  const handleOpenProduct = (item: MenuItem) => {
    setSelectedProduct(item);
    setProductQuantity(1);
    setItemNotes('');
    
    // Default selected options
    const defaults: Record<string, { label: string; extraPrice: number }> = {};
    if (item.options) {
      item.options.forEach((opt) => {
        if (opt.choices.length > 0) {
          defaults[opt.name] = {
            label: opt.choices[0].label,
            extraPrice: opt.choices[0].extraPrice || 0,
          };
        }
      });
    }
    setSelectedOptions(defaults);
  };

  // Hitung harga satuan produk modal berdasarkan opsi
  const currentModalUnitPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    const extra = Object.values(selectedOptions).reduce((acc, opt) => acc + (opt.extraPrice || 0), 0);
    return selectedProduct.price + extra;
  }, [selectedProduct, selectedOptions]);

  // Add to Cart
  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const chosenOpts: CartItemOptionSelected[] = Object.entries(selectedOptions).map(([optName, choice]) => ({
      optionName: optName,
      choiceLabel: choice.label,
      extraPrice: choice.extraPrice,
    }));

    const newItem: CartItem = {
      itemId: selectedProduct.id,
      name: selectedProduct.name,
      basePrice: selectedProduct.price,
      unitPrice: currentModalUnitPrice,
      quantity: productQuantity,
      selectedOptions: chosenOpts,
      notes: itemNotes.trim() || undefined,
      image: selectedProduct.image,
    };

    setCart((prev) => [...prev, newItem]);
    setSelectedProduct(null);
  };

  // Remove / Update Cart Item
  const handleRemoveCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCartQty = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  // Perhitungan Cart
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartTax = Math.round(cartSubtotal * 0.1); // PB1 10%
  const cartTotal = cartSubtotal + cartTax;
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Submit Order
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      alert('Mohon isi nama pemesan terlebih dahulu!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          customerName,
          items: cart,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCart([]);
        setIsCartOpen(false);
        router.push(`/order/${data.data.id}`);
      } else {
        alert(data.error || 'Gagal membuat pesanan.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto bg-slate-50 relative shadow-xl">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/hrfood-full-logo.png" 
              alt="HR Food - Makan Enak, Mood Naik!" 
              className="h-9 object-contain"
            />
          </div>

          {/* Table Badge */}
          <button
            onClick={() => setIsTableModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Meja {tableNumber.padStart(2, '0')}
          </button>
        </div>

        {/* Search Box */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ayam kampung, sate kulit, sambal, lele..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Banner Promo Hero */}
      <div className="p-4 space-y-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-800 via-rose-700 to-amber-800 p-4 text-white shadow-lg">
          <div className="relative z-10 flex items-center justify-between">
            <div className="max-w-[240px]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-black tracking-wider uppercase mb-1">
                <Sparkles className="w-3 h-3" /> Masakan Rumahan Rasa Juara!
              </span>
              <h2 className="text-lg font-black leading-tight">Tentukan Sendiri Level Pedasmu!</h2>
              <p className="text-xs text-rose-100 mt-1">
                3 Pilihan Sambal Mantap: <strong>Terasi</strong>, <strong>Bawang</strong> & <strong>Cabe Ijo</strong>!
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded-md border border-amber-400/30">
                  Mulai Rp 2.000-an
                </span>
                <button
                  onClick={() => handleOpenProduct(MENU_ITEMS[0])}
                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition shadow-sm flex items-center gap-1"
                >
                  Pesan <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Mascot Emblem on Banner */}
            <div className="w-20 h-20 rounded-2xl bg-white/90 p-1.5 shadow-lg flex items-center justify-center flex-shrink-0">
              <img
                src="/hrfood-emblem.png"
                alt="HR Food Mascot"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* 3 Sambal Khas Showcase */}
        <div className="bg-emerald-950 text-white rounded-2xl p-3 shadow-md border border-emerald-800/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🌶️</span>
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">3 Sambal Khas HR Food</h3>
            </div>
            <span className="text-[10px] text-emerald-300 font-medium">Bisa Pilih Tiap Lauk</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div
              onClick={() => setSelectedCategory('Aneka Sambal')}
              className="bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-700/50 rounded-xl p-1.5 text-center cursor-pointer transition active:scale-95"
            >
              <div className="w-full h-12 rounded-lg overflow-hidden mb-1 bg-black/30">
                <img src="/menu/sambal-terasi.jpg" alt="Sambal Terasi" className="w-full h-full object-cover" />
              </div>
              <p className="text-[11px] font-bold leading-tight">Terasi</p>
              <p className="text-[9px] text-emerald-300">Klasik & Nagih</p>
            </div>

            <div
              onClick={() => setSelectedCategory('Aneka Sambal')}
              className="bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-700/50 rounded-xl p-1.5 text-center cursor-pointer transition active:scale-95"
            >
              <div className="w-full h-12 rounded-lg overflow-hidden mb-1 bg-black/30">
                <img src="/menu/sambal-bawang.jpg" alt="Sambal Bawang" className="w-full h-full object-cover" />
              </div>
              <p className="text-[11px] font-bold leading-tight">Bawang</p>
              <p className="text-[9px] text-emerald-300">Segar & Pedas</p>
            </div>

            <div
              onClick={() => setSelectedCategory('Aneka Sambal')}
              className="bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-700/50 rounded-xl p-1.5 text-center cursor-pointer transition active:scale-95"
            >
              <div className="w-full h-12 rounded-lg overflow-hidden mb-1 bg-black/30">
                <img src="/menu/sambal-cabe-ijo.jpg" alt="Sambal Cabe Ijo" className="w-full h-full object-cover" />
              </div>
              <p className="text-[11px] font-bold leading-tight">Cabe Ijo</p>
              <p className="text-[9px] text-emerald-300">Pedas Mantap</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="sticky top-[108px] z-20 bg-slate-50/95 backdrop-blur-sm px-4 py-2 border-b border-slate-100">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-300 font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu List */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span>{selectedCategory} ({filteredItems.length})</span>
          <span>Dine-In Menu</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Utensils className="w-10 h-10 mx-auto stroke-1 mb-2 text-slate-300" />
            <p className="text-sm font-medium">Menu tidak ditemukan</p>
            <p className="text-xs text-slate-400 mt-0.5">Coba cari dengan kata kunci lain</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isAvailable = item.isAvailable !== false;
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isAvailable) handleOpenProduct(item);
                }}
                className={`rounded-xl p-3 border shadow-sm flex gap-3 transition ${
                  isAvailable
                    ? 'bg-white border-slate-100 cursor-pointer hover:border-rose-200 hover:shadow-md active:scale-[0.99]'
                    : 'bg-slate-50/90 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Product Image */}
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className={`w-full h-full object-cover ${!isAvailable ? 'grayscale' : ''}`}
                    loading="lazy"
                  />
                  {item.isPopular && isAvailable && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5 fill-current" /> Favorit
                    </span>
                  )}
                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-1 text-center">
                      <span className="bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                        HABIS
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className={`text-sm font-bold leading-snug line-clamp-1 ${isAvailable ? 'text-slate-900' : 'text-slate-500'}`}>
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
                    <span className={`text-sm font-extrabold ${isAvailable ? 'text-rose-600' : 'text-slate-400'}`}>
                      Rp {item.price.toLocaleString('id-ID')}
                    </span>
                    {isAvailable ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProduct(item);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-semibold transition border border-rose-100 shadow-sm"
                      >
                        <Plus className="w-3 h-3" /> Tambah
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-500 text-xs font-bold">
                        Habis
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Detail & Kustomisasi Produk */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
            {/* Modal Header */}
            <div className="relative h-44 bg-slate-100">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white">
                <h3 className="text-base font-bold leading-tight">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-200 mt-0.5 line-clamp-1">{selectedProduct.category}</p>
              </div>
            </div>

            {/* Modal Body: Options & Notes */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedProduct.description}
              </p>

              {/* Dynamic Options */}
              {selectedProduct.options && selectedProduct.options.map((optionGroup) => (
                <div key={optionGroup.name} className="border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                    <span>{optionGroup.name}</span>
                    <span className="text-[10px] text-rose-500 font-normal">Wajib dipilih</span>
                  </h4>
                  <div className="space-y-1.5">
                    {optionGroup.choices.map((choice) => {
                      const isSelected = selectedOptions[optionGroup.name]?.label === choice.label;
                      return (
                        <label
                          key={choice.label}
                          onClick={() => {
                            setSelectedOptions((prev) => ({
                              ...prev,
                              [optionGroup.name]: {
                                label: choice.label,
                                extraPrice: choice.extraPrice || 0,
                              },
                            }));
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50/70 font-semibold text-rose-900'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span>{choice.label}</span>
                          </div>
                          {choice.extraPrice ? (
                            <span className="text-rose-600 font-bold">
                              +Rp {choice.extraPrice.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Gratis</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Catatan Khusus */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Catatan untuk Dapur (Opsional)
                </label>
                <input
                  type="text"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Contoh: jangan terlalu pedas, lalapan banyak..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {/* 1-Tap Quick Badges */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'Goreng Garing',
                    'Sambal Dipisah',
                    'Lalapan Banyak',
                    'Sedikit Minyak',
                    'Es Sedikit',
                    'Nasi Pulen Hangat'
                  ].map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setItemNotes((prev) => prev ? `${prev}, ${tag}` : tag)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 border border-slate-200 transition active:scale-95"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-800">Jumlah Porsi</span>
                <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-xl">
                  <button
                    onClick={() => setProductQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-200 font-bold active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-slate-900 w-6 text-center">
                    {productQuantity}
                  </span>
                  <button
                    onClick={() => setProductQuantity((q) => q + 1)}
                    className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-200 font-bold active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer: Add Button */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-200 flex items-center justify-between px-4 transition active:scale-[0.98]"
              >
                <span>Tambah ke Pesanan</span>
                <span>Rp {(currentModalUnitPrice * productQuantity).toLocaleString('id-ID')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button Bar */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 inset-x-0 z-40 max-w-md mx-auto px-4">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl shadow-slate-400 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-200 hover:bg-slate-800 transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
                {totalItemCount}
              </div>
              <div className="text-left">
                <p className="text-[11px] text-slate-300">Meja {tableNumber}</p>
                <p className="text-sm font-black text-amber-400">
                  Rp {cartTotal.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-xl">
              <ShoppingBag className="w-3.5 h-3.5" />
              Lihat Pesanan
            </div>
          </button>
        </div>
      )}

      {/* Bottom Sheet / Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
            {/* Header Cart */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Rincian Pesanan Meja {tableNumber}</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                      {item.selectedOptions.length > 0 && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.selectedOptions.map((o) => `${o.choiceLabel}`).join(' • ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                          Catatan: &ldquo;{item.notes}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-rose-600 whitespace-nowrap">
                      Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleRemoveCartItem(idx)}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-medium"
                    >
                      Hapus
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateCartQty(idx, -1)}
                        className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateCartQty(idx, 1)}
                        className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Form Nama Pemesan */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nama Anda / Pemesan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Misal: Kak Dimas"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Pilihan Metode Bayar */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cashier')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'cashier'
                        ? 'border-rose-600 bg-rose-50/70 text-rose-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs">Bayar di Kasir</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-1">
                      Tunai / EDC / QRIS Kasir
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'qris'
                        ? 'border-rose-600 bg-rose-50/70 text-rose-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-rose-600" />
                      <span className="text-xs">QRIS di Meja</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-1">
                      Scan instan di layar HP
                    </span>
                  </button>
                </div>
              </div>

              {/* Rincian Biaya */}
              <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak Resto (PB1 10%)</span>
                  <span>Rp {cartTax.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Tagihan</span>
                  <span className="text-rose-600">Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Footer Checkout Button */}
            <div className="p-4 border-t border-slate-100 bg-white space-y-2">
              <button
                disabled={isSubmitting || cart.length === 0}
                onClick={handleSubmitOrder}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-red-200 flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <span>Mengirim Pesanan ke Dapur...</span>
                ) : (
                  <>
                    <span>Kirim Pesanan ke Dapur HR Food</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/6283838432860?text=${encodeURIComponent(
                  `Halo HR Food, saya dari Meja ${tableNumber} (${customerName || 'Tamu'}):\n` +
                  cart.map((i) => `- ${i.quantity}x ${i.name} ${i.selectedOptions.map((o) => o.choiceLabel).join(', ')} ${i.notes ? `(${i.notes})` : ''}`).join('\n') +
                  `\nTotal: Rp ${cartTotal.toLocaleString('id-ID')}\nMohon diproses ya kak!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <span>💬 Kirim ke WhatsApp Kasir (0838-3843-2860)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah / Set Meja Manual */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-2">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Masukkan Nomor Meja</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Lihat nomor meja yang tertera pada stand akrilik di meja Anda.
              </p>
            </div>

            <div>
              <input
                type="number"
                min="1"
                max="99"
                value={tempTableInput}
                onChange={(e) => setTempTableInput(e.target.value)}
                placeholder="Contoh: 05"
                className="w-full text-center text-2xl font-black tracking-widest py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900"
              />
            </div>

            <button
              onClick={() => {
                if (tempTableInput) {
                  setTableNumber(tempTableInput.padStart(2, '0'));
                  setIsTableModalOpen(false);
                }
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
            >
              Mulai Pesan Menu
            </button>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Chat & Delivery */}
      <a
        href="https://wa.me/6283838432860?text=Halo%20HR%20Food,%20saya%20pelanggan%20ingin%20bertanya"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-30 flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl transition active:scale-95 border-2 border-white text-xs font-bold"
        title="Chat WhatsApp HR Food"
      >
        <span className="text-sm">💬</span>
        <span className="text-[11px]">WA Kasir</span>
      </a>
    </div>
  );
}

export default function OrderingAppPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat Menu Cafe...</div>}>
      <OrderingAppContent />
    </Suspense>
  );
}
