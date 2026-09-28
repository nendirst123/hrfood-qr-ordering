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
  FileText,
  Tag,
  Gift,
  Percent,
  Navigation,
  Compass
} from 'lucide-react';
import { MENU_ITEMS, CATEGORIES } from '@/data/menu';
import { 
  MenuItem, 
  CartItem, 
  CartItemOptionSelected, 
  PaymentMethod, 
  OrderType, 
  DeliverySettings, 
  DeliveryZone,
  StoreConfig,
  PromoCode
} from '@/types/order';
import { ThemeToggle } from '@/components/ThemeProvider';
import { 
  calculateHaversineDistanceKm, 
  calculateDeliveryFeeFromKm, 
  LOCAL_VILLAGE_PRESETS, 
  RESTO_COORDINATES 
} from '@/lib/geo-distance';

function OrderingAppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('table') || '';
  const typeParam = (searchParams.get('type') as OrderType) || '';

  // Fitur Meja dinonaktifkan sementara (dapat diaktifkan kembali kapan saja dengan mengubah nilai ini menjadi true)
  const ENABLE_TABLE_ORDERING = false;

  // Order Mode: 'dine_in' | 'delivery' | 'takeaway'
  const [orderType, setOrderType] = useState<OrderType>(
    ENABLE_TABLE_ORDERING
      ? (typeParam === 'delivery' || typeParam === 'takeaway' ? typeParam : 'dine_in')
      : (typeParam === 'takeaway' ? 'takeaway' : 'delivery')
  );

  // State Store Status (Buka / Tutup)
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);

  // State Kupon Diskon Promo
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoInput, setPromoInput] = useState<string>('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [showPromoList, setShowPromoList] = useState<boolean>(false);

  // State Meja (Dine-in)
  const [tableNumber, setTableNumber] = useState<string>(tableParam || '01');
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(
    ENABLE_TABLE_ORDERING && !tableParam && orderType === 'dine_in'
  );
  const [tempTableInput, setTempTableInput] = useState<string>(tableParam || '01');

  // State Delivery Jarak KM Otomatis & Alamat
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('15-20 Menit Lagi');
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number>(0.8);
  const [selectedVillagePresetId, setSelectedVillagePresetId] = useState<string>('preset-desa-pusat');
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

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

  // Handler Deteksi GPS Otomatis
  const handleDetectGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatusMsg({
        text: 'Browser tidak mendukung GPS. Silakan pilih wilayah di bawah.',
        isError: true,
      });
      return;
    }

    setIsDetectingGps(true);
    setLocationStatusMsg({ text: 'Sedang membaca titik koordinat GPS Anda...', isError: false });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        const restoCoords = {
          latitude: storeConfig?.storeLatitude ?? RESTO_COORDINATES.latitude,
          longitude: storeConfig?.storeLongitude ?? RESTO_COORDINATES.longitude,
        };
        const km = calculateHaversineDistanceKm(userCoords, restoCoords);
        setDeliveryDistanceKm(km);
        setSelectedVillagePresetId('custom-gps');
        setIsDetectingGps(false);
        setLocationStatusMsg({
          text: `📍 GPS Akurat Terdeteksi! Jarak ke HR Food: ${km} km`,
          isError: false,
        });
      },
      (err) => {
        setIsDetectingGps(false);
        let msg = 'Izin akses GPS belum diaktifkan. Silakan pilih wilayah Anda dari daftar di bawah.';
        if (err.code === 2) msg = 'Sinyal posisi tidak ditemukan. Silakan pilih wilayah dari daftar.';
        else if (err.code === 3) msg = 'Waktu deteksi GPS habis. Silakan pilih wilayah dari daftar.';
        setLocationStatusMsg({ text: msg, isError: true });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Handler Pilih Preset Wilayah Sekitar
  const handleSelectVillagePreset = (presetId: string) => {
    setSelectedVillagePresetId(presetId);
    const preset = LOCAL_VILLAGE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      const km = preset.nominalKm || 1.8;
      setDeliveryDistanceKm(km);
      setLocationStatusMsg({
        text: `📍 Terpilih: ${preset.name} (~${km} km dari resto)`,
        isError: false,
      });
    }
  };

  // Sync param table & type
  useEffect(() => {
    if (tableParam && ENABLE_TABLE_ORDERING) {
      setTableNumber(tableParam);
      setTempTableInput(tableParam);
      setIsTableModalOpen(false);
    }
    if (typeParam && (typeParam === 'delivery' || typeParam === 'takeaway' || (ENABLE_TABLE_ORDERING && typeParam === 'dine_in'))) {
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

  // Fetch Store Status (Buka / Tutup & Jam Operasional)
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await fetch('/api/store-config');
        const data = await res.json();
        if (data.success && data.data) {
          setStoreConfig(data.data);
        }
      } catch (err) {
        console.error('Failed fetching store config:', err);
      }
    };
    fetchStore();
    const interval = setInterval(fetchStore, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Kupon Promo Aktif
  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await fetch('/api/promos');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPromos(data.data);
        }
      } catch (err) {
        console.error('Failed fetching promos:', err);
      }
    };
    fetchPromos();
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

  // Perhitungan Cart (Bebas Pajak PB1 + Promo Diskon)
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [cart]);

  // Kalkulasi Diskon Kupon Promo
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (cartSubtotal < (appliedPromo.minOrder || 0)) return 0;
    if (appliedPromo.type === 'percent') {
      const calc = Math.round((cartSubtotal * appliedPromo.value) / 100);
      return appliedPromo.maxDiscount ? Math.min(calc, appliedPromo.maxDiscount) : calc;
    }
    return Math.min(appliedPromo.value, cartSubtotal);
  }, [appliedPromo, cartSubtotal]);

  // Kalkulasi Ongkir Otomatis Berdasarkan Jarak KM
  const deliveryCalculation = useMemo(() => {
    return calculateDeliveryFeeFromKm(
      deliveryDistanceKm || 1.8,
      cartSubtotal,
      deliverySettings?.freeDeliveryThreshold
    );
  }, [deliveryDistanceKm, cartSubtotal, deliverySettings?.freeDeliveryThreshold]);

  const currentDeliveryFee = useMemo(() => {
    if (orderType !== 'delivery') return 0;
    return deliveryCalculation.fee;
  }, [orderType, deliveryCalculation.fee]);

  const cartTotal = Math.max(0, cartSubtotal - discountAmount + currentDeliveryFee);
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Nomor WhatsApp aktif resto ternormalisasi
  const activeWhatsApp = useMemo(() => {
    const raw = storeConfig?.storePhone || deliverySettings?.whatsappNumber || '6283838432860';
    const digits = raw.replace(/\D/g, '');
    return digits.startsWith('0') ? '62' + digits.slice(1) : digits;
  }, [storeConfig?.storePhone, deliverySettings?.whatsappNumber]);

  // Handler Terapkan Kupon Promo
  const handleApplyPromoCode = (promoToApply?: PromoCode) => {
    const code = (promoToApply ? promoToApply.code : promoInput).trim().toUpperCase();
    if (!code) {
      setPromoMessage({ text: 'Ketik kode promo terlebih dahulu!', isError: true });
      return;
    }
    const found = promos.find((p) => p.code.toUpperCase() === code && p.isActive);
    if (!found) {
      setPromoMessage({ text: 'Kode promo tidak ditemukan atau sudah tidak aktif', isError: true });
      return;
    }
    if (found.minOrder && cartSubtotal < found.minOrder) {
      setPromoMessage({
        text: `Minimal belanja Rp ${found.minOrder.toLocaleString('id-ID')} untuk kupon ${found.code}`,
        isError: true,
      });
      return;
    }
    setAppliedPromo(found);
    setPromoInput(found.code);
    setPromoMessage({
      text: `Kupon ${found.code} aktif! Hemat Rp ${(
        found.type === 'percent'
          ? Math.min(Math.round((cartSubtotal * found.value) / 100), found.maxDiscount || Infinity)
          : Math.min(found.value, cartSubtotal)
      ).toLocaleString('id-ID')}`,
      isError: false,
    });
  };

  const handleRemovePromoCode = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoMessage(null);
  };

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
        discountCode: appliedPromo?.code,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
      };

      if (orderType === 'delivery') {
        payload.deliveryAddress = deliveryAddress.trim();
        payload.deliveryNotes = deliveryNotes.trim() || undefined;
        payload.deliveryDistanceKm = deliveryDistanceKm || 1.8;
        payload.deliveryZoneName = deliveryCalculation.zoneName;
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
        const createdOrder = data.data;

        // Persist order ke localStorage agar langsung terbaca di halaman /order/[id] tanpa delay/404
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`hrfood_order_${createdOrder.id}`, JSON.stringify(createdOrder));
            localStorage.setItem('hrfood_latest_order', JSON.stringify(createdOrder));
            const existingHistory = JSON.parse(localStorage.getItem('hrfood_order_history') || '[]');
            const updatedHistory = [createdOrder, ...existingHistory.filter((o: any) => o.id !== createdOrder.id)].slice(0, 20);
            localStorage.setItem('hrfood_order_history', JSON.stringify(updatedHistory));
          } catch (e) {
            console.warn('LocalStorage save error:', e);
          }
        }

        setCart([]);
        setAppliedPromo(null);
        setPromoInput('');
        setPromoMessage(null);
        setIsCartOpen(false);
        router.push(`/order/${createdOrder.id}`);
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
  const isStoreOpen = storeConfig ? ((storeConfig as any).effectiveIsOpen ?? storeConfig.isOpen) : true;

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative shadow-xl transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/hrfood-full-logo.png" 
              alt="HR Food - Makan Enak, Mood Naik!" 
              className="h-9 object-contain"
            />
          </div>

          {/* Theme Toggle & Mode Switcher Button */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />

            {ENABLE_TABLE_ORDERING && orderType === 'dine_in' && (
              <button
                onClick={() => setIsTableModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Meja {tableNumber.padStart(2, '0')}
              </button>
            )}

            {orderType === 'delivery' && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition shadow-sm"
              >
                <Bike className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Pesan Antar</span>
              </button>
            )}

            {orderType === 'takeaway' && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition shadow-sm"
              >
                <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Bawa Pulang</span>
              </button>
            )}
          </div>
        </div>

        {/* Order Mode Tab Pill Switcher */}
        <div className={`mt-2.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl grid ${ENABLE_TABLE_ORDERING ? 'grid-cols-3' : 'grid-cols-2'} gap-1 text-[11px] font-bold`}>
          {ENABLE_TABLE_ORDERING && (
            <button
              onClick={() => setOrderType('dine_in')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
                orderType === 'dine_in'
                  ? 'bg-white dark:bg-slate-700 text-red-700 dark:text-red-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Utensils className="w-3 h-3" />
              <span>Di Meja</span>
            </button>
          )}

          <button
            onClick={() => setOrderType('delivery')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
              orderType === 'delivery'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
            className="w-full pl-9 pr-8 py-2 bg-slate-100/90 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 border border-transparent dark:border-slate-700 transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Banner Resto Tutup */}
      {!isStoreOpen && (
        <div className="mx-4 mt-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start gap-2.5 text-rose-800 dark:text-rose-200 shadow-sm animate-pulse">
          <span className="text-xl">⛔</span>
          <div className="text-xs">
            <h4 className="font-bold text-rose-900 dark:text-rose-100 text-sm">Resto Saat Ini Sedang Tutup</h4>
            <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 leading-snug">
              {storeConfig?.closedMessage || 'Jam operasional kami buka pukul 10:00 - 22:00 WIB. Anda tetap dapat melihat-lihat daftar menu hidangan kami.'}
            </p>
          </div>
        </div>
      )}

      {/* Banner Promo Hero - Menu Baru */}
      <div className="p-4 space-y-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-rose-700 to-red-800 p-4 text-white shadow-lg border border-amber-500/30">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black tracking-wide uppercase mb-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-red-600 fill-red-600" /> MENU BARU
              </span>
              <h2 className="text-base sm:text-lg font-black leading-tight text-white drop-shadow-sm">
                Telur Dadar Krispi
              </h2>
              <p className="text-[11px] text-rose-100 line-clamp-3 mt-1 leading-snug">
                Perpaduan telur dadar renyah gurih dengan taburan bawang kremes, sambal khas HR FOOD, lalapan segar, dan nasi hangat. Sederhana tapi selalu bikin nagih!
              </p>
              
              <div className="mt-3 flex items-center gap-2">
                <div className="text-xs font-black text-amber-300 bg-black/40 px-2.5 py-1 rounded-lg border border-amber-400/40">
                  Cuma Rp 12.000
                </div>
                <button
                  onClick={() => {
                    const newItem = MENU_ITEMS.find((m) => m.id === 'hr-sayur-10') || MENU_ITEMS[0];
                    handleOpenProduct(newItem);
                  }}
                  className="px-3.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-black transition shadow-md flex items-center gap-1"
                >
                  <span>Pesan Sekarang</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Poster / Dish Preview Image */}
            <div 
              onClick={() => {
                const newItem = MENU_ITEMS.find((m) => m.id === 'hr-sayur-10') || MENU_ITEMS[0];
                handleOpenProduct(newItem);
              }}
              className="relative w-26 h-26 sm:w-30 sm:h-30 rounded-2xl overflow-hidden shadow-xl border-2 border-amber-300/80 shrink-0 cursor-pointer group"
            >
              <img
                src="/menu-telur-dadar-krispi.jpg"
                alt="Telur Dadar Krispi - Menu Baru HR Food"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-1">
                <span className="text-[9px] font-black text-amber-300 uppercase tracking-tight px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs">
                  Renyah &bull; Komplit
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Sambal Khas Strip Ringkas */}
        <div 
          onClick={() => setSelectedCategory('Aneka Sambal')}
          className="bg-emerald-950 dark:bg-emerald-950/80 text-white rounded-xl px-3 py-2 shadow-sm border border-emerald-800/60 flex items-center justify-between cursor-pointer hover:bg-emerald-900/90 transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🌶️</span>
            <span className="text-xs font-bold text-amber-400">3 Sambal Khas:</span>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-200">
              <span className="bg-emerald-900/80 px-2 py-0.5 rounded-md border border-emerald-700/50">🔥 Terasi</span>
              <span className="bg-emerald-900/80 px-2 py-0.5 rounded-md border border-emerald-700/50">🧅 Bawang</span>
              <span className="bg-emerald-900/80 px-2 py-0.5 rounded-md border border-emerald-700/50">🍃 Cabe Ijo</span>
            </div>
          </div>
          <span className="text-[10px] text-emerald-300 font-medium hover:underline flex items-center gap-0.5">
            Pilih <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-red-600 text-white shadow-sm shadow-red-200 dark:shadow-none'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {selectedCategory === 'Semua' ? 'Daftar Menu' : selectedCategory} ({filteredItems.length})
          </h3>
          {selectedCategory !== 'Semua' && (
            <button 
              onClick={() => setSelectedCategory('Semua')}
              className="text-[11px] text-red-600 dark:text-red-400 font-semibold hover:underline"
            >
              Lihat Semua
            </button>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
            <span className="text-3xl">🍲</span>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Menu tidak ditemukan</p>
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
                  className={`bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-sm flex flex-col justify-between transition-all ${
                    isAvailable
                      ? 'border-slate-200/90 dark:border-slate-800 hover:shadow-md cursor-pointer active:scale-[0.98]'
                      : 'border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50'
                  }`}
                >
                  <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
                      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                          Stok Habis
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 leading-snug">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-xs font-black text-rose-600 dark:text-rose-400">
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
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-200 dark:shadow-none">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItemCount}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-tight">
                  {orderType === 'dine_in' ? `Meja ${tableNumber}` : orderType === 'delivery' ? 'Pesan Antar' : 'Bawa Pulang'} &bull; {totalItemCount} Menu
                </p>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                  Rp {cartTotal.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-200 dark:shadow-none active:scale-95 transition"
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
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
            {/* Header Produk Modal */}
            <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800">
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
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{selectedProduct.name}</h3>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    Rp {selectedProduct.price.toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedProduct.description}</p>
              </div>

              {/* Pilihan Opsi / Sambal */}
              {selectedProduct.options && selectedProduct.options.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {selectedProduct.options.map((opt) => (
                    <div key={opt.name} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
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
                                  ? 'border-red-600 bg-red-50/70 dark:bg-red-950/40 text-red-950 dark:text-red-200 font-bold'
                                  : 'border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span>{choice.label}</span>
                              {choice.extraPrice ? (
                                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
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
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Catatan untuk Dapur (Opsional)
                </label>
                <input
                  type="text"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Contoh: Sambal dipisah, jangan terlalu garing..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Jumlah Pesanan</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setProductQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-black w-6 text-center">{productQuantity}</span>
                  <button
                    onClick={() => setProductQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Tambah ke Keranjang */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Total Produk</p>
                <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                  Rp {(currentModalUnitPrice * productQuantity).toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={handleAddToCart}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md shadow-red-200 dark:shadow-none active:scale-95 transition"
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
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
            {/* Header Cart */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {orderType === 'dine_in' && `Rincian Pesanan Meja ${tableNumber}`}
                  {orderType === 'delivery' && 'Pesanan Antar (Delivery)'}
                  {orderType === 'takeaway' && 'Pesanan Bawa Pulang (Takeaway)'}
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-100 dark:border-slate-750 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.name}</h4>
                      {item.selectedOptions.length > 0 && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.selectedOptions.map((o) => `${o.choiceLabel}`).join(' • ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded mt-1 inline-block border border-amber-200/50 dark:border-amber-800/50">
                          Catatan: &ldquo;{item.notes}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() => handleRemoveCartItem(idx)}
                      className="text-[11px] text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium"
                    >
                      Hapus
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateCartQty(idx, -1)}
                        className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateCartQty(idx, 1)}
                        className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Form Data Pelanggan */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Nama Pemesan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Misal: Kak Dimas"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Nomor WhatsApp (Khusus Delivery & Takeaway) */}
                {(orderType === 'delivery' || orderType === 'takeaway') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Nomor WhatsApp Pemesan <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Untuk koordinasi kurir</span>
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}

                {/* Form Spesifik Delivery */}
                {orderType === 'delivery' && (
                  <div className="space-y-3 bg-purple-50/70 dark:bg-purple-950/40 p-3 rounded-2xl border border-purple-100 dark:border-purple-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-purple-950 dark:text-purple-200 flex items-center gap-1">
                        <Bike className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Lokasi & Jarak Pengantaran
                      </span>
                      {deliverySettings?.freeDeliveryThreshold && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Gratis ongkir &gt; Rp {deliverySettings.freeDeliveryThreshold.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>

                    {/* Tombol GPS */}
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      disabled={isDetectingGps}
                      className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-60"
                    >
                      <Navigation className={`w-4 h-4 ${isDetectingGps ? 'animate-spin' : ''}`} />
                      <span>{isDetectingGps ? 'Mendeteksi Posisi Anda...' : '📍 Gunakan Lokasi GPS Saya'}</span>
                    </button>

                    {/* Dropdown Preset Wilayah / Desa Sekitar */}
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-900 dark:text-purple-300 mb-1">
                        Atau Pilih Wilayah / Desa Pengantaran:
                      </label>
                      <select
                        value={selectedVillagePresetId}
                        onChange={(e) => handleSelectVillagePreset(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {LOCAL_VILLAGE_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.name}
                          </option>
                        ))}
                        {selectedVillagePresetId === 'custom-gps' && (
                          <option value="custom-gps">📍 Koordinat GPS Pengguna Terdeteksi</option>
                        )}
                      </select>
                    </div>

                    {/* Status Alert Notifikasi Lokasi */}
                    {locationStatusMsg && (
                      <div className={`p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 ${
                        locationStatusMsg.isError
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}>
                        <span>{locationStatusMsg.text}</span>
                      </div>
                    )}

                    {/* Card Ringkasan Jarak KM & Ongkir */}
                    <div className="bg-purple-100/80 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700/60 rounded-xl p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-black tracking-wider text-purple-700 dark:text-purple-300 block">
                          Jarak Pengantaran:
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-extrabold text-sm text-purple-950 dark:text-purple-100">
                            🛵 {deliveryDistanceKm} KM
                          </span>
                          <span className="text-[10px] text-purple-700 dark:text-purple-300">
                            ({deliveryCalculation.estimatedMinutesText})
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-black tracking-wider text-purple-700 dark:text-purple-300 block">
                          Ongkir:
                        </span>
                        <span className="font-black text-sm text-purple-900 dark:text-purple-200 mt-0.5 block">
                          {currentDeliveryFee === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">GRATIS</span>
                          ) : (
                            `Rp ${currentDeliveryFee.toLocaleString('id-ID')}`
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Alamat Pengantaran */}
                    <div>
                      <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        Alamat Lengkap Pengantaran <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Contoh: Jl. Merpati No. 12 RT 03/RW 04, samping toko fotokopi"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Patokan Rumah / Catatan Kurir */}
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-800 dark:text-purple-300 mb-1">
                        Patokan Rumah / Catatan Kurir (Opsional)
                      </label>
                      <input
                        type="text"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Contoh: Pagar hitam depan musholla, titip di sekuriti"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* Form Spesifik Takeaway */}
                {orderType === 'takeaway' && (
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 space-y-2">
                    <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      Estimasi Waktu Pengambilan
                    </label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-medium"
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

              {/* Voucher & Promo Diskon */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Tag className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Voucher Diskon & Promo</span>
                  </div>
                  {promos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPromoList(!showPromoList)}
                      className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline"
                    >
                      {showPromoList ? 'Tutup Pilihan' : 'Pilih Kupon'}
                    </button>
                  )}
                </div>

                {/* Input Kode Promo Manual */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode kupon"
                      className="w-full px-3 py-2 uppercase bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono tracking-wider"
                    />
                    {appliedPromo && (
                      <span className="absolute right-2.5 top-2.5 w-2 h-2 rounded-full bg-emerald-500"></span>
                    )}
                  </div>
                  {appliedPromo ? (
                    <button
                      type="button"
                      onClick={handleRemovePromoCode}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                    >
                      Hapus
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApplyPromoCode()}
                      className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition shadow-sm"
                    >
                      Pakai
                    </button>
                  )}
                </div>

                {/* Promo Message */}
                {promoMessage && (
                  <p className={`text-[11px] mt-1.5 font-medium ${promoMessage.isError ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {promoMessage.text}
                  </p>
                )}

                {/* Active Applied Promo Banner */}
                {appliedPromo && (
                  <div className="mt-2.5 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 font-mono">{appliedPromo.code}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 rounded font-semibold">Aktif</span>
                        </div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300">{appliedPromo.title}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                      -Rp {discountAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                {/* Quick Claimable Promo List */}
                {showPromoList && promos.length > 0 && (
                  <div className="mt-2.5 space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 bg-slate-50/80 dark:bg-slate-800/80 max-h-48 overflow-y-auto">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Kupon Tersedia:</p>
                    {promos.filter(p => p.isActive).map((p) => {
                      const isEligible = cartSubtotal >= (p.minOrder || 0);
                      const isSelected = appliedPromo?.code === p.code;
                      return (
                        <div
                          key={p.id}
                          className={`p-2 rounded-xl border transition flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700'
                              : isEligible
                              ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-300'
                              : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                {p.code}
                              </span>
                              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 truncate">
                                {p.type === 'percent' ? `Diskon ${p.value}%` : `Hemat Rp ${p.value.toLocaleString('id-ID')}`}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {p.description}
                            </p>
                          </div>
                          <div>
                            {isSelected ? (
                              <button
                                type="button"
                                onClick={handleRemovePromoCode}
                                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg"
                              >
                                Batal
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!isEligible}
                                onClick={() => handleApplyPromoCode(p)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                                  isEligible
                                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                {isEligible ? 'Pakai' : 'Min. Order'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pilihan Metode Bayar */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cashier')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'cashier'
                        ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/50 text-rose-950 dark:text-rose-200 font-bold'
                        : 'border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs">
                        {orderType === 'delivery' ? 'COD (Tunai ke Kurir)' : 'Bayar di Kasir'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-1">
                      {orderType === 'delivery' ? 'Bayar saat kurir sampai' : 'Tunai / EDC kasir'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'qris'
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 text-blue-950 dark:text-blue-200 font-bold ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#118EEA]" />
                      <span className="text-xs">QRIS DANA</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-1">
                      Scan via DANA / e-Wallet
                    </span>
                  </button>
                </div>

                {paymentMethod === 'qris' && (
                  <div className="mt-2.5 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#118EEA] text-white flex items-center justify-center font-black text-[11px] shrink-0 shadow-sm">
                        DANA
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-blue-950 dark:text-blue-100 flex items-center gap-1.5 text-xs">
                          <span>QRIS DANA (Hrfood.id)</span>
                          <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">Resmi</span>
                        </div>
                        <div className="text-[10px] text-blue-700 dark:text-blue-300 truncate">
                          NMID: ID1025429569771 &bull; A.N: Hrfood.id
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      Barcode QRIS resmi akan tampil otomatis di layar status pesanan setelah klik <strong>&quot;Kirim Pesanan&quot;</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Rincian Biaya */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-750">
                <div className="flex justify-between">
                  <span>Subtotal Pesanan</span>
                  <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                </div>
                {appliedPromo && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Diskon Kupon ({appliedPromo.code})
                    </span>
                    <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-purple-700 dark:text-purple-300 font-medium">
                    <span>Ongkos Kirim ({deliveryDistanceKm} km &bull; {deliveryCalculation.zoneName})</span>
                    <span>
                      {currentDeliveryFee === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">GRATIS</span>
                      ) : (
                        `Rp ${currentDeliveryFee.toLocaleString('id-ID')}`
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Tagihan</span>
                  <span className="text-rose-600 dark:text-rose-400">Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                  <span>Harga sudah bersih / netto</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Bebas Pajak Resto (0% PB1)</span>
                </div>
              </div>
            </div>

            {/* Footer Checkout Button */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <button
                disabled={isSubmitting || cart.length === 0 || !isStoreOpen}
                onClick={handleSubmitOrder}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-red-200 dark:shadow-none flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                {!isStoreOpen ? (
                  <span>⛔ Resto Sedang Tutup</span>
                ) : isSubmitting ? (
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
                href={`https://wa.me/${activeWhatsApp}?text=${encodeURIComponent(
                  `Halo HR Food, saya ingin pesan:\n` +
                  `Mode: ${orderType === 'delivery' ? '🛵 PESAN ANTAR (DELIVERY)' : orderType === 'takeaway' ? '🛍️ BAWA PULANG' : `🍽️ MEJA ${tableNumber}`}\n` +
                  `Pemesan: ${customerName || 'Pelanggan'}\n` +
                  (customerPhone ? `No WA: ${customerPhone}\n` : '') +
                  (orderType === 'delivery' ? `Alamat: ${deliveryAddress}\nJarak: ${deliveryDistanceKm} km (${deliveryCalculation.zoneName})\nOngkir: Rp ${currentDeliveryFee.toLocaleString('id-ID')}\n` : '') +
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xs rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-2">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Makan di Tempat</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                className="w-full text-center text-2xl font-black tracking-widest py-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              onClick={() => {
                if (tempTableInput) {
                  setTableNumber(tempTableInput.padStart(2, '0'));
                  setIsTableModalOpen(false);
                }
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Mulai Pesan Menu
            </button>

            <div className="text-center pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setOrderType('delivery');
                  setIsTableModalOpen(false);
                }}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                Atau ingin pesan antar ke rumah?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Quick Chat */}
      <a
        href={`https://wa.me/${activeWhatsApp}?text=${encodeURIComponent(
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
