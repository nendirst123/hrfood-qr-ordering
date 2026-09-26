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
  ChefHat,
  Bike,
  Package,
  MapPin,
  Phone,
  HelpCircle,
  FileText
} from 'lucide-react';
import { MENU_ITEMS, CATEGORIES } from '@/data/menu';
import { 
  MenuItem, 
  CartItem, 
  CartItemOptionSelected, 
  PaymentMethod, 
  OrderType, 
  DeliverySettings, 
  DeliveryZone 
} from '@/types/order';

function OrderingAppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('table') || '';
  const typeParam = (searchParams.get('type') as OrderType) || '';

  // Order Mode: 'dine_in' | 'delivery' | 'takeaway'
  const [orderType, setOrderType] = useState<OrderType>(
    typeParam === 'delivery' || typeParam === 'takeaway' ? typeParam : 'dine_in'
  );

  // State Meja (Dine-in)
  const [tableNumber, setTableNumber] = useState<string>(tableParam || '01');
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(!tableParam && orderType === 'dine_in');
  const [tempTableInput, setTempTableInput] = useState<string>(tableParam || '01');

  // State Delivery
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('15-20 Menit Lagi');

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

  // Sync param table & type
  useEffect(() => {
    if (tableParam) {
      setTableNumber(tableParam);
      setTempTableInput(tableParam);
      setIsTableModalOpen(false);
    }
    if (typeParam && (typeParam === 'delivery' || typeParam === 'takeaway' || typeParam === 'dine_in')) {
      setOrderType(typeParam);
    }
  }, [tableParam, typeParam]);

  // Fetch Delivery Settings
  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const res = await fetch('/api/delivery');
        const data = await res.json();
        if (data.success && data.data) {
          setDeliverySettings(data.data);
          const activeZones = data.data.zones?.filter((z: DeliveryZone) => z.isActive) || [];
          if (activeZones.length > 0 && !selectedZone) {
            setSelectedZone(activeZones[0]);
          }
        }
      } catch (err) {
        console.error('Failed fetching delivery settings:', err);
      }
    };
    fetchDelivery();
  }, []);

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

    const chosenOptions: CartItemOptionSelected[] = Object.entries(selectedOptions).map(
      ([optionName, choice]) => ({
        optionName,
        choiceLabel: choice.label,
        extraPrice: choice.extraPrice,
      })
    );

    const newCartItem: CartItem = {
      itemId: selectedProduct.id,
      name: selectedProduct.name,
      basePrice: selectedProduct.price,
      unitPrice: currentModalUnitPrice,
      quantity: productQuantity,
      selectedOptions: chosenOptions,
      notes: itemNotes.trim() ? itemNotes.trim() : undefined,
      image: selectedProduct.image,
    };

    setCart((prev) => [...prev, newCartItem]);
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
  const currentDeliveryFee = useMemo(() => {
    if (orderType !== 'delivery') return 0;
    if (deliverySettings?.freeDeliveryThreshold && cartSubtotal >= deliverySettings.freeDeliveryThreshold) {
      return 0; // Gratis ongkir jika di atas threshold
    }
    return selectedZone?.fee || 0;
  }, [orderType, deliverySettings, cartSubtotal, selectedZone]);

  const cartTotal = cartSubtotal + cartTax + currentDeliveryFee;
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Submit Order
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      alert('Mohon isi nama pemesan terlebih dahulu!');
      return;
    }

    if (orderType === 'delivery') {
      if (!customerPhone.trim()) {
        alert('Mohon isi nomor WhatsApp Anda untuk koordinasi kurir pengantaran!');
        return;
      }
      if (!deliveryAddress.trim()) {
        alert('Mohon tuliskan alamat lengkap pengantaran!');
        return;
      }
      if (deliverySettings?.minOrderAmount && cartSubtotal < deliverySettings.minOrderAmount) {
        alert(`Minimal pembelian untuk pengantaran delivery adalah Rp ${deliverySettings.minOrderAmount.toLocaleString('id-ID')}`);
        return;
      }
    }

    if (orderType === 'takeaway' && !customerPhone.trim()) {
      alert('Mohon isi nomor WhatsApp Anda untuk konfirmasi pesanan siap diambil!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        orderType,
        tableNumber: orderType === 'dine_in' ? tableNumber : (orderType === 'delivery' ? 'DLV' : 'TA'),
        customerName,
        customerPhone: customerPhone.trim() || undefined,
        items: cart,
        paymentMethod,
      };

      if (orderType === 'delivery') {
        payload.deliveryAddress = deliveryAddress.trim();
        payload.deliveryNotes = deliveryNotes.trim() || undefined;
        payload.deliveryZoneId = selectedZone?.id;
        payload.deliveryZoneName = selectedZone?.name;
        payload.deliveryFee = currentDeliveryFee;
      } else if (orderType === 'takeaway') {
        payload.pickupTime = pickupTime;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const activeZones = deliverySettings?.zones?.filter((z) => z.isActive) || [];

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

          {/* Mode Switcher Button (Dine-in / Delivery / Takeaway) */}
          <div className="flex items-center gap-1">
            {orderType === 'dine_in' && (
              <button
                onClick={() => setIsTableModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Meja {tableNumber.padStart(2, '0')}
              </button>
            )}

            {orderType === 'delivery' && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition shadow-sm"
              >
                <Bike className="w-3.5 h-3.5 text-purple-600" />
                <span>Pesan Antar</span>
              </button>
            )}

            {orderType === 'takeaway' && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition shadow-sm"
              >
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bawa Pulang</span>
              </button>
            )}
          </div>
        </div>

        {/* Order Mode Tab Pill Switcher */}
        <div className="mt-2.5 p-1 bg-slate-100 rounded-xl grid grid-cols-3 gap-1 text-[11px] font-bold">
          <button
            onClick={() => setOrderType('dine_in')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
              orderType === 'dine_in'
                ? 'bg-white text-red-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3 h-3" />
            <span>Di Meja</span>
          </button>

          <button
            onClick={() => setOrderType('delivery')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
              orderType === 'delivery'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bike className="w-3 h-3" />
            <span>Pesan Antar</span>
          </button>

          <button
            onClick={() => setOrderType('takeaway')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
              orderType === 'takeaway'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3 h-3" />
            <span>Bungkus</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="mt-2.5 relative">
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

      {/* Mode Banner Info Alert */}
      {orderType === 'delivery' && (
        <div className="mx-4 mt-3 bg-gradient-to-r from-purple-500/10 via-purple-600/5 to-indigo-500/10 border border-purple-200 rounded-xl p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
            <Bike className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <span className="font-bold text-purple-900 block">Layanan Pesan Antar Online Aktif!</span>
            <span className="text-[11px] text-purple-700">Makanan hangat diantar kurir langsung ke alamat Anda.</span>
          </div>
        </div>
      )}

      {orderType === 'takeaway' && (
        <div className="mx-4 mt-3 bg-gradient-to-r from-emerald-500/10 via-emerald-600/5 to-teal-500/10 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <span className="font-bold text-emerald-900 block">Mode Bawa Pulang / Takeaway</span>
            <span className="text-[11px] text-emerald-700">Pesan sekarang tanpa antre, ambil langsung saat matang.</span>
          </div>
        </div>
      )}

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
              <div className="text-base mb-0.5">🔥</div>
              <h4 className="text-[11px] font-bold text-amber-300">Terasi</h4>
              <p className="text-[9px] text-emerald-200">Gurih & Nagih</p>
            </div>

            <div
              onClick={() => setSelectedCategory('Aneka Sambal')}
              className="bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-700/50 rounded-xl p-1.5 text-center cursor-pointer transition active:scale-95"
            >
              <div className="text-base mb-0.5">🧅</div>
              <h4 className="text-[11px] font-bold text-amber-300">Bawang</h4>
              <p className="text-[9px] text-emerald-200">Aroma Sedap</p>
            </div>

            <div
              onClick={() => setSelectedCategory('Aneka Sambal')}
              className="bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-700/50 rounded-xl p-1.5 text-center cursor-pointer transition active:scale-95"
            >
              <div className="text-base mb-0.5">🍃</div>
              <h4 className="text-[11px] font-bold text-amber-300">Cabe Ijo</h4>
              <p className="text-[9px] text-emerald-200">Segar Pedas</p>
            </div>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid List */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {selectedCategory === 'Semua' ? 'Daftar Menu Lezat' : selectedCategory} ({filteredItems.length})
          </h3>
          {selectedCategory !== 'Semua' && (
            <button 
              onClick={() => setSelectedCategory('Semua')}
              className="text-[11px] text-red-600 font-semibold hover:underline"
            >
              Lihat Semua
            </button>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <span className="text-3xl">🍲</span>
            <p className="text-xs font-bold text-slate-700">Menu tidak ditemukan</p>
            <p className="text-[11px] text-slate-400">Coba ganti kata kunci pencarian atau kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const isAvailable = item.isAvailable !== false;
              return (
                <div
                  key={item.id}
                  onClick={() => isAvailable && handleOpenProduct(item)}
                  className={`bg-white rounded-2xl border overflow-hidden shadow-sm flex flex-col justify-between transition-all ${
                    isAvailable
                      ? 'border-slate-150 hover:shadow-md cursor-pointer active:scale-[0.98]'
                      : 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50'
                  }`}
                >
                  <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className={`w-full h-full object-cover transition duration-300 ${
                        isAvailable ? 'hover:scale-105' : 'grayscale'
                      }`}
                      loading="lazy"
                    />
                    {item.isPopular && isAvailable && (
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                        ⭐ FAVORIT
                      </span>
                    )}
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                          Stok Habis
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-xs font-black text-rose-600">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                      {isAvailable && (
                        <button
                          type="button"
                          className="w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-200">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItemCount}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold leading-tight">
                  {orderType === 'dine_in' ? `Meja ${tableNumber}` : orderType === 'delivery' ? 'Pesan Antar' : 'Bawa Pulang'} &bull; {totalItemCount} Menu
                </p>
                <p className="text-xs font-black text-slate-900">
                  Rp {cartTotal.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-200 active:scale-95 transition"
            >
              <span>Lanjut Pesan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Detail Item & Opsi Sambal/Level */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header Produk Modal */}
            <div className="relative aspect-video w-full bg-slate-100">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-black text-slate-900">{selectedProduct.name}</h3>
                  <span className="text-sm font-black text-rose-600 whitespace-nowrap">
                    Rp {selectedProduct.price.toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedProduct.description}</p>
              </div>

              {/* Pilihan Opsi / Sambal */}
              {selectedProduct.options && selectedProduct.options.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  {selectedProduct.options.map((opt) => (
                    <div key={opt.name} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>{opt.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">Wajib pilih 1</span>
                      </label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {opt.choices.map((choice) => {
                          const isSelected = selectedOptions[opt.name]?.label === choice.label;
                          return (
                            <button
                              type="button"
                              key={choice.label}
                              onClick={() => {
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [opt.name]: {
                                    label: choice.label,
                                    extraPrice: choice.extraPrice || 0,
                                  },
                                }));
                              }}
                              className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition ${
                                isSelected
                                  ? 'border-red-600 bg-red-50/70 text-red-950 font-bold'
                                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>{choice.label}</span>
                              {choice.extraPrice ? (
                                <span className="text-[11px] text-rose-600 font-semibold">
                                  +Rp {choice.extraPrice.toLocaleString('id-ID')}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Gratis</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Catatan Khusus */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Catatan untuk Dapur (Opsional)
                </label>
                <input
                  type="text"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Contoh: Sambal dipisah, jangan terlalu garing..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800">Jumlah Pesanan</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setProductQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-black w-6 text-center">{productQuantity}</span>
                  <button
                    onClick={() => setProductQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Tambah ke Keranjang */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-slate-400">Total Produk</p>
                <p className="text-sm font-black text-rose-600">
                  Rp {(currentModalUnitPrice * productQuantity).toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={handleAddToCart}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md shadow-red-200 active:scale-95 transition"
              >
                + Tambah ke Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Keranjang & Checkout */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header Cart */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {orderType === 'dine_in' && `Rincian Pesanan Meja ${tableNumber}`}
                  {orderType === 'delivery' && 'Pesanan Antar (Delivery)'}
                  {orderType === 'takeaway' && 'Pesanan Bawa Pulang (Takeaway)'}
                </h3>
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

              {/* Form Data Pelanggan */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nama Pemesan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Misal: Kak Dimas"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Nomor WhatsApp (Khusus Delivery & Takeaway) */}
                {(orderType === 'delivery' || orderType === 'takeaway') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        Nomor WhatsApp Pemesan <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Untuk koordinasi kurir</span>
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}

                {/* Form Spesifik Delivery */}
                {orderType === 'delivery' && (
                  <div className="space-y-3 bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
                    {/* Pilihan Zona Ongkir */}
                    <div>
                      <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center justify-between">
                        <span>Pilih Area / Zona Ongkir <span className="text-rose-500">*</span></span>
                        {deliverySettings?.freeDeliveryThreshold && (
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            Gratis ongkir &gt; Rp {deliverySettings.freeDeliveryThreshold.toLocaleString('id-ID')}
                          </span>
                        )}
                      </label>
                      <select
                        value={selectedZone?.id || ''}
                        onChange={(e) => {
                          const found = activeZones.find((z) => z.id === e.target.value);
                          if (found) setSelectedZone(found);
                        }}
                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                      >
                        {activeZones.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            {zone.name} &bull; Rp {zone.fee.toLocaleString('id-ID')} ({zone.estimatedTime})
                          </option>
                        ))}
                      </select>
                      {selectedZone && (
                        <p className="text-[10px] text-purple-700 mt-1">
                          📍 {selectedZone.description}
                        </p>
                      )}
                    </div>

                    {/* Alamat Pengantaran */}
                    <div>
                      <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-600" />
                        Alamat Lengkap Pengantaran <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Contoh: Jl. Merpati No. 12 RT 03/RW 04, Komplek Griya Asri"
                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Patokan Rumah / Catatan Kurir */}
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-800 mb-1">
                        Patokan Rumah / Catatan Kurir (Opsional)
                      </label>
                      <input
                        type="text"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Contoh: Pagar hitam depan musholla, titip di sekuriti"
                        className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* Form Spesifik Takeaway */}
                {orderType === 'takeaway' && (
                  <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 space-y-2">
                    <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      Estimasi Waktu Pengambilan
                    </label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs text-slate-800 font-medium"
                    >
                      <option value="15-20 Menit Lagi">15 - 20 Menit Lagi (Segera)</option>
                      <option value="30 Menit Lagi">30 Menit Lagi</option>
                      <option value="45 Menit Lagi">45 Menit Lagi</option>
                      <option value="1 Jam Lagi">1 Jam Lagi</option>
                      <option value="Malam Hari (Jam 19:00)">Malam Hari (Jam 19:00)</option>
                    </select>
                  </div>
                )}
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
                      <span className="text-xs">
                        {orderType === 'delivery' ? 'COD (Tunai ke Kurir)' : 'Bayar di Kasir'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-1">
                      {orderType === 'delivery' ? 'Bayar saat kurir sampai' : 'Tunai / EDC kasir'}
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
                      <span className="text-xs">QRIS Instan</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-1">
                      Scan via Gopay/OVO/BCA
                    </span>
                  </button>
                </div>
              </div>

              {/* Rincian Biaya */}
              <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                <div className="flex justify-between">
                  <span>Subtotal Pesanan</span>
                  <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak Resto (PB1 10%)</span>
                  <span>Rp {cartTax.toLocaleString('id-ID')}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-purple-700 font-medium">
                    <span>Ongkos Kirim ({selectedZone?.name || 'Area'})</span>
                    <span>
                      {currentDeliveryFee === 0 ? (
                        <span className="text-emerald-600 font-bold">GRATIS</span>
                      ) : (
                        `Rp ${currentDeliveryFee.toLocaleString('id-ID')}`
                      )}
                    </span>
                  </div>
                )}
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
                  <span>Mengirim Pesanan...</span>
                ) : (
                  <>
                    <span>
                      {orderType === 'delivery'
                        ? 'Pesan Sekarang untuk Diantar'
                        : orderType === 'takeaway'
                        ? 'Konfirmasi Pesanan Bungkus'
                        : 'Kirim Pesanan ke Dapur HR Food'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Tombol Cadangan WA ke Admin/Kasir */}
              <a
                href={`https://wa.me/${deliverySettings?.whatsappNumber || '6283838432860'}?text=${encodeURIComponent(
                  `Halo HR Food, saya ingin pesan:\n` +
                  `Mode: ${orderType === 'delivery' ? '🛵 PESAN ANTAR (DELIVERY)' : orderType === 'takeaway' ? '🛍️ BAWA PULANG' : `🍽️ MEJA ${tableNumber}`}\n` +
                  `Pemesan: ${customerName || 'Pelanggan'}\n` +
                  (customerPhone ? `No WA: ${customerPhone}\n` : '') +
                  (orderType === 'delivery' ? `Alamat: ${deliveryAddress}\nArea: ${selectedZone?.name} (Ongkir: Rp ${currentDeliveryFee.toLocaleString('id-ID')})\n` : '') +
                  `\nMenu:\n` +
                  cart.map((i) => `- ${i.quantity}x ${i.name} ${i.selectedOptions.map((o) => o.choiceLabel).join(', ')} ${i.notes ? `(${i.notes})` : ''}`).join('\n') +
                  `\n\nTotal: Rp ${cartTotal.toLocaleString('id-ID')}\nMohon diproses ya kak!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <span>💬 Kirim Rincian Pesanan ke WhatsApp Resto</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah / Set Meja Manual (Hanya untuk Dine-in) */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-2">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Makan di Tempat</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan nomor meja yang tertera pada stand akrilik di meja Anda.
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

            <div className="text-center pt-1 border-t border-slate-100">
              <button
                onClick={() => {
                  setOrderType('delivery');
                  setIsTableModalOpen(false);
                }}
                className="text-xs font-semibold text-purple-600 hover:underline"
              >
                Atau ingin pesan antar ke rumah?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Quick Chat */}
      <a
        href={`https://wa.me/${deliverySettings?.whatsappNumber || '6283838432860'}?text=${encodeURIComponent(
          'Halo HR Food, saya ingin menanyakan informasi pemesanan / menu hari ini.'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-30 flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl transition active:scale-95 border-2 border-white text-xs font-bold"
        title="Chat WhatsApp HR Food"
      >
        <span className="text-sm">💬</span>
        <span className="text-[11px]">WA Resto</span>
      </a>
    </div>
  );
}

export default function OrderingAppPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat Menu HR Food...</div>}>
      <OrderingAppContent />
    </Suspense>
  );
}
