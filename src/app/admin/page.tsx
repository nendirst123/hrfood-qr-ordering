'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RESTAURANT_INFO, CATEGORIES } from '@/data/menu';
import { MenuItem, Order, DeliverySettings, DeliveryZone, StoreConfig, PromoCode } from '@/types/order';
import { playNewOrderChime, startOrderRinging, stopOrderRinging, isOrderRinging } from '@/lib/audio-chime';
import { generateCustomerWhatsAppUrl, generateCourierWhatsAppUrl } from '@/lib/whatsapp-helper';
import ThermalReceiptModal from '@/components/ThermalReceiptModal';
import { ThemeToggle } from '@/components/ThemeProvider';
import { Bell, Volume2, VolumeX, Store, Clock, Power, MapPin, Navigation, Compass, ExternalLink, Phone, MessageCircle } from 'lucide-react';
import AdminPinGate from '@/components/AdminPinGate';

interface ReportData {
  date: string;
  totalOmzet: number;
  potentialOmzet: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  payment: {
    cashTotal: number;
    qrisTotal: number;
  };
  topItems: { name: string; qty: number; revenue: number; image: string }[];
  sambalStats: Record<string, number>;
  recentOrders: Order[];
}

function AdminDashboardInner() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'catalog' | 'delivery' | 'stock' | 'promo'>('analytics');

  // Promo Codes State
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isSavingPromo, setIsSavingPromo] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoType, setPromoType] = useState<'fixed' | 'percent'>('fixed');
  const [promoValue, setPromoValue] = useState<number | string>('');
  const [promoMinOrder, setPromoMinOrder] = useState<number | string>('');
  const [promoMaxDiscount, setPromoMaxDiscount] = useState<number | string>('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoActive, setPromoActive] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Audio Bell State (30s Continuous Loop & Stop Control)
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isBellRinging, setIsBellRinging] = useState(false);
  const prevOrderCountRef = useRef(0);
  const bellTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seenAdminOrderIdsRef = useRef<Set<string>>(new Set());
  const initialAdminLoadRef = useRef<boolean>(false);

  const handleToggleBellTest = () => {
    if (isBellRinging) {
      stopOrderRinging();
      setIsBellRinging(false);
      if (bellTimeoutRef.current) clearTimeout(bellTimeoutRef.current);
    } else {
      setAudioEnabled(true);
      startOrderRinging(30);
      setIsBellRinging(true);
      if (bellTimeoutRef.current) clearTimeout(bellTimeoutRef.current);
      bellTimeoutRef.current = setTimeout(() => {
        setIsBellRinging(false);
      }, 30000);
    }
  };

  // Store Configuration State (Buka / Tutup & Jam Operasional)
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [formIsOpen, setFormIsOpen] = useState(true);
  const [formAllSoldOut, setFormAllSoldOut] = useState(false);
  const [formAutoSchedule, setFormAutoSchedule] = useState(false);
  const [formOpenTime, setFormOpenTime] = useState('10:00');
  const [formCloseTime, setFormCloseTime] = useState('22:00');
  const [formClosedMessage, setFormClosedMessage] = useState('');
  const [formStoreAddress, setFormStoreAddress] = useState('Bunijaya, Kec. Gununghalu, Kab. Bandung Barat, Jawa Barat (Resto HR Food)');
  const [formStoreLatitude, setFormStoreLatitude] = useState<number | string>(-7.0101905);
  const [formStoreLongitude, setFormStoreLongitude] = useState<number | string>(107.2760032);
  const [formStorePhone, setFormStorePhone] = useState('0838-3843-2860');
  const [isDetectingStoreGps, setIsDetectingStoreGps] = useState(false);
  const [storeGpsStatus, setStoreGpsStatus] = useState<string | null>(null);

  // Delivery Settings State
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneDesc, setZoneDesc] = useState('');
  const [zoneFee, setZoneFee] = useState<number | string>('');
  const [zoneTime, setZoneTime] = useState('');
  const [zoneActive, setZoneActive] = useState(true);

  // Date Filter & Reset State
  const [reportDate, setReportDate] = useState<string>('today');
  const [customReportDate, setCustomReportDate] = useState<string>('');
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Modal State untuk Tambah & Edit Menu
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form State untuk Tambah Menu
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Ayam & Bebek');
  const [formPrice, setFormPrice] = useState<number | string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Saklar Stok Filter & Search State
  const [stockSearch, setStockSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'sold_out'>('all');

  // Helper LocalStorage untuk Ketersediaan Menu (Self-Healing Persistence)
  const getLocalAvailabilityMap = (): Record<string, { isAvailable: boolean; updatedAt: number }> => {
    try {
      const raw = localStorage.getItem('hrfood_menu_availability_map');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  };

  const saveLocalAvailabilityMap = (map: Record<string, { isAvailable: boolean; updatedAt: number }>) => {
    try {
      localStorage.setItem('hrfood_menu_availability_map', JSON.stringify(map));
    } catch (e) {}
  };

  // Helper LocalStorage untuk Menu yang Dihapus & Diubah (Self-Healing Persistence)
  const getLocalDeletedMenuIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem('hrfood_deleted_menu_ids');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch (e) {}
    return new Set();
  };

  const saveLocalDeletedMenuIds = (set: Set<string>) => {
    try {
      localStorage.setItem('hrfood_deleted_menu_ids', JSON.stringify(Array.from(set)));
    } catch (e) {}
  };

  const getLocalMenuOverrides = (): Record<string, MenuItem> => {
    try {
      const raw = localStorage.getItem('hrfood_menu_overrides');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  };

  const saveLocalMenuOverrides = (overrides: Record<string, MenuItem>) => {
    try {
      localStorage.setItem('hrfood_menu_overrides', JSON.stringify(overrides));
    } catch (e) {}
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Ambil cache laporan dan ketersediaan menu dari localStorage pada mount awal
  useEffect(() => {
    try {
      const cached = localStorage.getItem('hrfood_admin_report_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) {
          setReport(parsed);
          if (Array.isArray(parsed.recentOrders)) {
            parsed.recentOrders.forEach((o: Order) => seenAdminOrderIdsRef.current.add(o.id));
          }
          setLoading(false);
        }
      }

      // Terapkan cache status stok habis lokal segera
      const cachedAvail = localStorage.getItem('hrfood_menu_availability_map');
      const cachedDeleted = localStorage.getItem('hrfood_deleted_menu_ids');
      const cachedOverrides = localStorage.getItem('hrfood_menu_overrides');
      const deletedSet = cachedDeleted ? new Set<string>(JSON.parse(cachedDeleted)) : new Set<string>();
      const overridesMap = cachedOverrides ? JSON.parse(cachedOverrides) : {};
      const parsedAvail = cachedAvail ? JSON.parse(cachedAvail) : {};

      setMenuItems(prev => {
        const filtered = prev.filter(m => !deletedSet.has(m.id));
        return filtered.map(m => {
          let item = overridesMap[m.id] ? { ...m, ...overridesMap[m.id], id: m.id } : { ...m };
          const entry = parsedAvail[m.id];
          if (entry && typeof entry.isAvailable === 'boolean') {
            item.isAvailable = entry.isAvailable;
          }
          return item;
        });
      });
    } catch (e) {}
  }, []);

  const fetchData = async (overrideDate?: string) => {
    try {
      const activeDate = overrideDate !== undefined ? overrideDate : (reportDate === 'custom' ? customReportDate : reportDate);
      const [resReport, resMenu, resDelivery, resStore, resPromos] = await Promise.all([
        fetch(`/api/reports?date=${activeDate}`),
        fetch('/api/menu'),
        fetch('/api/delivery'),
        fetch('/api/store-config'),
        fetch('/api/promos?all=1'),
      ]);
      const dataReport = await resReport.json();
      const dataMenu = await resMenu.json();
      const dataDelivery = await resDelivery.json();
      const dataStore = await resStore.json();
      const dataPromos = await resPromos.json();

      if (dataReport.success && dataReport.data) {
        const incomingReport = dataReport.data;

        setReport((prevReport) => {
          // Jika instance lambda serverless baru mengembalikan data kosong sementara state sebelumnya memiliki data
          if (
            prevReport &&
            prevReport.totalOrders > 0 &&
            incomingReport.totalOrders === 0 &&
            prevReport.recentOrders &&
            prevReport.recentOrders.length > 0
          ) {
            // Self-healing: sinkronkan data yang kita miliki kembali ke backend
            fetch('/api/orders/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orders: prevReport.recentOrders }),
            }).catch(() => {});
            return prevReport;
          }

          // Cek dering lonceng untuk pesanan baru yang belum pernah dilihat
          let hasNewActiveOrder = false;
          if (Array.isArray(incomingReport.recentOrders)) {
            incomingReport.recentOrders.forEach((order: Order) => {
              if (!seenAdminOrderIdsRef.current.has(order.id)) {
                seenAdminOrderIdsRef.current.add(order.id);
                const orderAgeMs = Date.now() - new Date(order.createdAt).getTime();
                if (
                  initialAdminLoadRef.current &&
                  orderAgeMs < 15 * 60 * 1000 &&
                  (order.status === 'pending_payment' || order.status === 'cooking')
                ) {
                  hasNewActiveOrder = true;
                }
              }
            });
          }

          if (!initialAdminLoadRef.current) {
            initialAdminLoadRef.current = true;
          }

          if (hasNewActiveOrder && audioEnabled) {
            startOrderRinging(30);
            setIsBellRinging(true);
            if (bellTimeoutRef.current) clearTimeout(bellTimeoutRef.current);
            bellTimeoutRef.current = setTimeout(() => {
              setIsBellRinging(false);
            }, 30000);
          }

          try {
            localStorage.setItem('hrfood_admin_report_cache', JSON.stringify(incomingReport));
          } catch (e) {}

          return incomingReport;
        });

        prevOrderCountRef.current = incomingReport.totalOrders;
      }
      if (dataMenu.success && Array.isArray(dataMenu.items)) {
        const localMap = getLocalAvailabilityMap();
        const localDeleted = getLocalDeletedMenuIds();
        const localOverrides = getLocalMenuOverrides();
        let needsSyncToServer = false;
        const syncPayload: Record<string, { isAvailable: boolean; updatedAt: number }> = {};

        // 1. Sinkronkan deleted IDs dari server
        if (Array.isArray(dataMenu.deletedIds)) {
          dataMenu.deletedIds.forEach((id: string) => localDeleted.add(id));
        }

        // Cek apakah lokal punya deleted ID yang belum diketahui server
        const serverDeletedSet = new Set(dataMenu.deletedIds || []);
        Array.from(localDeleted).forEach((id) => {
          if (!serverDeletedSet.has(id)) {
            needsSyncToServer = true;
          }
        });
        saveLocalDeletedMenuIds(localDeleted);

        // 2. Sinkronkan overrides dari server
        if (dataMenu.overrides && typeof dataMenu.overrides === 'object') {
          Object.entries(dataMenu.overrides).forEach(([id, srvOvr]: [string, any]) => {
            const locOvr = localOverrides[id];
            const srvTime = srvOvr?.updatedAt ? new Date(srvOvr.updatedAt).getTime() : 0;
            const locTime = locOvr?.updatedAt ? new Date(locOvr.updatedAt).getTime() : 0;
            if (!locOvr || srvTime > locTime) {
              localOverrides[id] = srvOvr;
            } else if (locTime > srvTime) {
              needsSyncToServer = true;
            }
          });
        }
        // Cek apakah lokal punya overrides yang belum ada di server
        Object.keys(localOverrides).forEach((id) => {
          if (!dataMenu.overrides || !dataMenu.overrides[id]) {
            needsSyncToServer = true;
          }
        });
        saveLocalMenuOverrides(localOverrides);

        // 3. Filter out semua menu yang ada di daftar deletedIds
        const nonDeletedItems = dataMenu.items.filter((item: MenuItem) => !localDeleted.has(item.id));

        // 4. Gabungkan menu dengan overrides & availability
        const seenIds = new Set<string>();
        const mergedMenuItems: MenuItem[] = nonDeletedItems.map((srvItem: MenuItem) => {
          seenIds.add(srvItem.id);
          const override = localOverrides[srvItem.id];
          const baseItem = override ? { ...srvItem, ...override, id: srvItem.id } : srvItem;

          const localEntry = localMap[baseItem.id];
          if (!localEntry) {
            localMap[baseItem.id] = {
              isAvailable: baseItem.isAvailable !== false,
              updatedAt: baseItem.updatedAt ? new Date(baseItem.updatedAt).getTime() : 0,
            };
            return baseItem;
          }

          const srvAvail = baseItem.isAvailable !== false;
          const srvTime = baseItem.updatedAt ? new Date(baseItem.updatedAt).getTime() : 0;

          if (localEntry.updatedAt > srvTime) {
            if (localEntry.isAvailable !== srvAvail) {
              needsSyncToServer = true;
              syncPayload[baseItem.id] = localEntry;
            }
            return {
              ...baseItem,
              isAvailable: localEntry.isAvailable,
            };
          } else {
            localMap[baseItem.id] = {
              isAvailable: srvAvail,
              updatedAt: srvTime || localEntry.updatedAt,
            };
            return baseItem;
          }
        });

        // 5. Tambahkan custom items dari overrides yang belum ada di server
        Object.values(localOverrides).forEach((customItem: MenuItem) => {
          if (!localDeleted.has(customItem.id) && !seenIds.has(customItem.id)) {
            seenIds.add(customItem.id);
            const avail = localMap[customItem.id];
            mergedMenuItems.push({
              ...customItem,
              isAvailable: avail !== undefined ? avail.isAvailable : customItem.isAvailable !== false,
            });
          }
        });

        saveLocalAvailabilityMap(localMap);
        setMenuItems(mergedMenuItems);

        // Self-healing: pulihkan serverless instance jika ada data stok habis, menu edit, atau menu hapus yang belum tersimpan di server
        if (needsSyncToServer) {
          fetch('/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              syncMenuData: {
                deletedIds: Array.from(localDeleted),
                overrides: localOverrides,
                syncAvailability: Object.keys(syncPayload).length > 0 ? syncPayload : undefined,
              }
            }),
          }).catch(() => {});
        }
      }

      if (dataDelivery.success) setDeliverySettings(dataDelivery.data);
      if (dataPromos.success && Array.isArray(dataPromos.data)) setPromos(dataPromos.data);
      if (dataStore.success && dataStore.data) {
        setStoreConfig(dataStore.data);
        if (!isStoreModalOpen) {
          setFormIsOpen(dataStore.data.isOpen);
          setFormAllSoldOut(!!dataStore.data.allSoldOut);
          setFormAutoSchedule(!!dataStore.data.autoSchedule);
          setFormOpenTime(dataStore.data.openTime || '10:00');
          setFormCloseTime(dataStore.data.closeTime || '22:00');
          setFormClosedMessage(dataStore.data.closedMessage || '');
          setFormStoreAddress(dataStore.data.storeAddress || 'Bunijaya, Kec. Gununghalu, Kab. Bandung Barat, Jawa Barat (Resto HR Food)');
          setFormStoreLatitude(dataStore.data.storeLatitude ?? -7.0101905);
          setFormStoreLongitude(dataStore.data.storeLongitude ?? 107.2760032);
          setFormStorePhone(dataStore.data.storePhone || '0838-3843-2860');
        }
      }
    } catch (err) {
      console.error('Failed fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 8000);
    return () => clearInterval(interval);
  }, [reportDate, customReportDate]);

  // Ekspor Transaksi ke CSV (Excel Compatible)
  const handleExportCSV = () => {
    if (!report?.recentOrders || report.recentOrders.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor pada tanggal yang dipilih.');
      return;
    }

    const headers = [
      'No',
      'Order ID',
      'Waktu Transaksi',
      'Tipe Pesanan',
      'Meja / Tujuan',
      'Nama Pemesan',
      'WhatsApp',
      'Alamat Pengantaran',
      'Rincian Menu',
      'Subtotal',
      'Kode Promo',
      'Diskon Promo',
      'Ongkir',
      'Total Tagihan',
      'Metode Bayar',
      'Status Pembayaran',
      'Status Pesanan'
    ];

    const rows = report.recentOrders.map((o, idx) => [
      idx + 1,
      o.orderNumber,
      `"${new Date(o.createdAt).toLocaleString('id-ID')}"`,
      o.orderType === 'delivery' ? 'Delivery' : o.orderType === 'takeaway' ? 'Takeaway' : 'Dine-In',
      o.orderType === 'delivery' ? 'Pesan Antar' : `Meja ${o.tableNumber}`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${(o.customerPhone || '').replace(/"/g, '""')}"`,
      `"${(o.deliveryAddress || '').replace(/"/g, '""')}"`,
      `"${o.items.map(it => `${it.quantity}x ${it.name}`).join('; ')}"`,
      o.subtotal,
      o.discountCode || '-',
      o.discountAmount ? `-Rp ${o.discountAmount}` : 'Rp 0',
      o.deliveryFee || 0,
      o.total,
      o.paymentMethod.toUpperCase(),
      o.isPaid ? 'LUNAS' : 'BELUM BAYAR',
      o.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_penjualan_hrfood_${reportDate}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Unduh Laporan PDF Rapi
  const handleExportPDF = () => {
    const activeDate = reportDate === 'custom' ? customReportDate : reportDate;
    const link = document.createElement('a');
    link.setAttribute('href', `/api/reports/pdf?date=${activeDate || 'today'}`);
    link.setAttribute('download', `laporan-hrfood.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Unduh Backup JSON Pesanan
  const handleDownloadBackup = () => {
    if (!report?.recentOrders) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report.recentOrders, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_hrfood_orders_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Konfirmasi Reset Pesanan ke 0
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      handleDownloadBackup();
      const res = await fetch('/api/orders/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        seenAdminOrderIdsRef.current.clear();
        try {
          localStorage.removeItem('hrfood_admin_report_cache');
          localStorage.removeItem('hrfood_kds_orders_cache');
        } catch (e) {}
        setReport({
          date: new Date().toISOString().split('T')[0],
          totalOmzet: 0,
          potentialOmzet: 0,
          totalOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
          payment: { cashTotal: 0, qrisTotal: 0 },
          topItems: [],
          sambalStats: {},
          recentOrders: [],
        });
        fetchData();
        setIsResetModalOpen(false);
        alert('Pesanan berhasil direset ke 0! Penomoran pesanan baru berikutnya akan kembali mulai dari ORD-001.');
      } else {
        alert('Gagal mereset: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsResetting(false);
    }
  };

  // Upload Gambar Menu
  const handleFileUpload = async (file: File, isEditing = false) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (isEditing && editingItem) {
          setEditingItem({ ...editingItem, image: data.url });
        } else {
          setFormImage(data.url);
        }
      } else {
        alert('Gagal mengunggah foto: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Terjadi kesalahan saat mengunggah foto');
    } finally {
      setIsUploading(false);
    }
  };

  // Tambah Menu Baru
  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice || !formCategory) {
      alert('Nama menu, kategori, dan harga wajib diisi!');
      return;
    }

    const now = Date.now();
    const tempId = `hr-custom-${now}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: MenuItem = {
      id: tempId,
      name: formName.trim(),
      category: formCategory.trim(),
      price: Number(formPrice),
      description: formDescription.trim(),
      image: formImage || '/menu/ayam-kampung.jpg',
      isPopular: formIsPopular,
      isAvailable: true,
      updatedAt: now,
    };

    // 1. Simpan langsung ke localStorage (Local-First)
    const localOverrides = getLocalMenuOverrides();
    localOverrides[tempId] = newItem;
    saveLocalMenuOverrides(localOverrides);

    const localDeleted = getLocalDeletedMenuIds();
    if (localDeleted.has(tempId)) {
      localDeleted.delete(tempId);
      saveLocalDeletedMenuIds(localDeleted);
    }

    // 2. Optimistic UI update
    setMenuItems(prev => [...prev, newItem]);
    setIsAddModalOpen(false);
    setFormName('');
    setFormPrice('');
    setFormDescription('');
    setFormImage('');
    setFormIsPopular(false);

    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const serverItem = data.data;
        if (serverItem.id !== tempId) {
          delete localOverrides[tempId];
          localOverrides[serverItem.id] = serverItem;
          saveLocalMenuOverrides(localOverrides);
          setMenuItems(prev => prev.map(m => m.id === tempId ? serverItem : m));
        }
      }
      fetchData();
      alert('Menu baru berhasil ditambahkan!');
    } catch (err) {
      console.error('Create menu error:', err);
      alert('Menu baru tersimpan di perangkat ini!');
    }
  };

  // Simpan Edit Menu
  const handleUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const now = Date.now();
    const updatedWithTime: MenuItem = {
      ...editingItem,
      updatedAt: now,
    };

    // 1. Simpan langsung ke localStorage (Local-First)
    const localOverrides = getLocalMenuOverrides();
    localOverrides[editingItem.id] = updatedWithTime;
    saveLocalMenuOverrides(localOverrides);

    const localDeleted = getLocalDeletedMenuIds();
    if (localDeleted.has(editingItem.id)) {
      localDeleted.delete(editingItem.id);
      saveLocalDeletedMenuIds(localDeleted);
    }

    // 2. Optimistic UI update
    setMenuItems(prev => prev.map(m => m.id === editingItem.id ? updatedWithTime : m));
    setIsEditModalOpen(false);
    setEditingItem(null);

    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWithTime),
      });
      const data = await res.json();
      fetchData();
      alert('Menu berhasil diperbarui!');
    } catch (err) {
      console.error('Update menu error:', err);
      alert('Perubahan menu tersimpan di perangkat ini!');
    }
  };

  // Hapus Menu
  const handleDeleteMenu = async (item: MenuItem) => {
    if (!confirm(`Hapus permanen menu "${item.name}" dari katalog?`)) return;

    // 1. Simpan langsung ke localStorage (Local-First)
    const localDeleted = getLocalDeletedMenuIds();
    localDeleted.add(item.id);
    saveLocalDeletedMenuIds(localDeleted);

    const localOverrides = getLocalMenuOverrides();
    if (localOverrides[item.id]) {
      delete localOverrides[item.id];
      saveLocalMenuOverrides(localOverrides);
    }

    // 2. Optimistic UI update
    setMenuItems(prev => prev.filter(m => m.id !== item.id));

    try {
      const res = await fetch(`/api/menu?id=${item.id}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, deletedIds: Array.from(localDeleted) })
      });
      const data = await res.json();
      fetchData();
      alert(`Menu "${item.name}" berhasil dihapus.`);
    } catch (err) {
      console.error('Delete menu error:', err);
      alert(`Menu "${item.name}" berhasil dihapus dari perangkat ini.`);
    }
  };

  // Toggle Stok Habis
  const handleToggleStock = async (item: MenuItem) => {
    const nextState = !item.isAvailable;
    const now = Date.now();
    setUpdatingId(item.id);
    setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: nextState, updatedAt: new Date(now).toISOString() } : m));

    // Update local availability map
    const localMap = getLocalAvailabilityMap();
    localMap[item.id] = { isAvailable: nextState, updatedAt: now };
    saveLocalAvailabilityMap(localMap);

    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isAvailable: nextState, updatedAt: now }),
      });
      const data = await res.json();
      if (!data.success) {
        localMap[item.id] = { isAvailable: !nextState, updatedAt: now };
        saveLocalAvailabilityMap(localMap);
        setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: !nextState } : m));
      }
    } catch (err) {
      console.error('Failed toggling stock:', err);
      localMap[item.id] = { isAvailable: !nextState, updatedAt: now };
      saveLocalAvailabilityMap(localMap);
      setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: !nextState } : m));
    } finally {
      setUpdatingId(null);
    }
  };

  // Konfirmasi Pembayaran Kasir
  const handleConfirmPayment = async (orderId: string, paymentMethod: 'cash' | 'qris') => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: true, paymentMethod }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed confirming payment:', err);
    }
  };

  // Buka Modal Cetak Struk Thermal
  const handlePrintReceipt = (order: Order) => {
    setPrintingOrder(order);
  };

  // STORE CONFIGURATION HANDLERS
  const handleToggleStoreStatus = async () => {
    if (!storeConfig) return;
    const newIsOpen = !storeConfig.isOpen;
    setStoreConfig(prev => prev ? { ...prev, isOpen: newIsOpen } : null);
    setFormIsOpen(newIsOpen);
    try {
      await fetch('/api/store-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: newIsOpen }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveStoreConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStore(true);
    try {
      const payload: StoreConfig = {
        isOpen: formIsOpen,
        allSoldOut: formAllSoldOut,
        autoSchedule: formAutoSchedule,
        openTime: formOpenTime,
        closeTime: formCloseTime,
        closedMessage: formClosedMessage,
        storeAddress: formStoreAddress,
        storeLatitude: Number(formStoreLatitude) || -7.0101905,
        storeLongitude: Number(formStoreLongitude) || 107.2760032,
        storePhone: formStorePhone,
      };
      const res = await fetch('/api/store-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setStoreConfig(data.data);
        setIsStoreModalOpen(false);
        alert('Pengaturan status toko, alamat fisik, koordinat GPS, dan nomor WhatsApp berhasil disimpan!');
      } else {
        alert('Gagal menyimpan: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleDetectStoreGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStoreGpsStatus('Browser Anda tidak mendukung deteksi GPS.');
      return;
    }
    setIsDetectingStoreGps(true);
    setStoreGpsStatus('Sedang membaca koordinat GPS perangkat Anda...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setFormStoreLatitude(lat);
        setFormStoreLongitude(lng);
        setIsDetectingStoreGps(false);
        setStoreGpsStatus(`✅ Titik GPS Toko Berhasil Terkunci: ${lat}, ${lng}`);
      },
      (err) => {
        setIsDetectingStoreGps(false);
        setStoreGpsStatus('⚠️ Gagal mendeteksi GPS. Pastikan izin akses lokasi aktif di browser.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // DELIVERY SETTINGS MANAGEMENT
  const handleSaveDeliveryGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverySettings) return;

    setIsSavingDelivery(true);
    try {
      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliverySettings),
      });
      const data = await res.json();
      if (data.success) {
        alert('Pengaturan delivery & ongkir berhasil disimpan!');
      } else {
        alert('Gagal menyimpan pengaturan: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const handleToggleDeliveryService = async () => {
    if (!deliverySettings) return;
    const updated = { ...deliverySettings, isEnabled: !deliverySettings.isEnabled };
    setDeliverySettings(updated);

    try {
      await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenZoneModal = (zone?: DeliveryZone) => {
    if (zone) {
      setEditingZone(zone);
      setZoneName(zone.name);
      setZoneDesc(zone.description);
      setZoneFee(zone.fee);
      setZoneTime(zone.estimatedTime);
      setZoneActive(zone.isActive);
    } else {
      setEditingZone(null);
      setZoneName('');
      setZoneDesc('');
      setZoneFee(10000);
      setZoneTime('20 - 35 Menit');
      setZoneActive(true);
    }
    setIsZoneModalOpen(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverySettings) return;
    if (!zoneName.trim() || zoneFee === '') {
      alert('Nama area dan tarif ongkir wajib diisi!');
      return;
    }

    const currentZones = [...(deliverySettings.zones || [])];
    if (editingZone) {
      const idx = currentZones.findIndex(z => z.id === editingZone.id);
      if (idx >= 0) {
        currentZones[idx] = {
          ...editingZone,
          name: zoneName.trim(),
          description: zoneDesc.trim(),
          fee: Number(zoneFee) || 0,
          estimatedTime: zoneTime.trim() || '20 - 35 Menit',
          isActive: zoneActive,
        };
      }
    } else {
      const newZone: DeliveryZone = {
        id: `zone-${Date.now()}`,
        name: zoneName.trim(),
        description: zoneDesc.trim(),
        fee: Number(zoneFee) || 0,
        estimatedTime: zoneTime.trim() || '20 - 35 Menit',
        isActive: zoneActive,
      };
      currentZones.push(newZone);
    }

    const updatedSettings = { ...deliverySettings, zones: currentZones };
    setDeliverySettings(updatedSettings);
    setIsZoneModalOpen(false);

    try {
      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      const data = await res.json();
      if (data.success) {
        alert(editingZone ? 'Zona ongkir berhasil diperbarui!' : 'Zona ongkir baru berhasil ditambahkan!');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan zona ke server.');
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!deliverySettings) return;
    if (!confirm('Hapus zona ongkir ini?')) return;

    const filtered = deliverySettings.zones.filter(z => z.id !== zoneId);
    const updatedSettings = { ...deliverySettings, zones: filtered };
    setDeliverySettings(updatedSettings);

    try {
      await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleZoneActive = async (zone: DeliveryZone) => {
    if (!deliverySettings) return;
    const currentZones = deliverySettings.zones.map(z => 
      z.id === zone.id ? { ...z, isActive: !z.isActive } : z
    );
    const updatedSettings = { ...deliverySettings, zones: currentZones };
    setDeliverySettings(updatedSettings);

    try {
      await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Handler Kupon Promo
  const handleOpenPromoModal = (promo?: PromoCode) => {
    if (promo) {
      setEditingPromo(promo);
      setPromoCode(promo.code);
      setPromoTitle(promo.title);
      setPromoType(promo.type);
      setPromoValue(promo.value);
      setPromoMinOrder(promo.minOrder || '');
      setPromoMaxDiscount(promo.maxDiscount || '');
      setPromoDesc(promo.description || '');
      setPromoActive(promo.isActive !== false);
    } else {
      setEditingPromo(null);
      setPromoCode('');
      setPromoTitle('');
      setPromoType('fixed');
      setPromoValue('');
      setPromoMinOrder('');
      setPromoMaxDiscount('');
      setPromoDesc('');
      setPromoActive(true);
    }
    setIsPromoModalOpen(true);
  };

  const handleTogglePromoActive = async (id: string) => {
    try {
      const res = await fetch('/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Gagal mengubah status kupon');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi server');
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kupon promo ini?')) return;
    try {
      const res = await fetch(`/api/promos?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Gagal menghapus kupon promo');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi server');
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) {
      alert('Kode promo wajib diisi!');
      return;
    }
    if (!promoTitle.trim()) {
      alert('Judul promo wajib diisi!');
      return;
    }
    if (!promoValue || Number(promoValue) <= 0) {
      alert('Nilai potongan promo harus lebih dari 0!');
      return;
    }

    setIsSavingPromo(true);
    try {
      const payload: any = {
        id: editingPromo ? editingPromo.id : undefined,
        code: promoCode.trim().toUpperCase(),
        title: promoTitle.trim(),
        type: promoType,
        value: Number(promoValue),
        minOrder: promoMinOrder ? Number(promoMinOrder) : 0,
        maxDiscount: promoType === 'percent' && promoMaxDiscount ? Number(promoMaxDiscount) : undefined,
        description: promoDesc.trim(),
        isActive: promoActive,
      };

      const res = await fetch('/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsPromoModalOpen(false);
        fetchData();
      } else {
        alert(data.error || 'Gagal menyimpan promo');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi server');
    } finally {
      setIsSavingPromo(false);
    }
  };

  const toIdr = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
  };

  const filteredMenu = menuItems.filter(item => {
    const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalSoldOut = menuItems.filter(m => m.isAvailable === false).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      {/* 30-Second Ringing Bell Alert Banner */}
      {isBellRinging && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white px-3 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-xl border-b border-red-400 animate-pulse">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl animate-bounce">🔔</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  PESANAN BARU MASUK! LONCENG BERDERING (30 DETIK)
                </span>
                <span className="px-1.5 py-0.5 bg-black/30 text-amber-300 text-[10px] font-black rounded-md">
                  Kring-Kring-Kring...
                </span>
              </div>
              <p className="text-[11px] text-red-100 hidden sm:block truncate">
                Lonceng berbunyi terus menerus selama 30 detik untuk memastikan kasir & koki mendengar.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopOrderRinging();
              setIsBellRinging(false);
              if (bellTimeoutRef.current) clearTimeout(bellTimeoutRef.current);
            }}
            className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 rounded-xl text-xs font-black shadow-md transition active:scale-95 flex items-center gap-1 flex-shrink-0 ml-2"
          >
            <span>🛑 Stop Bel</span>
          </button>
        </div>
      )}

      {/* Top Header - Responsive */}
      <header className="bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/95 p-1 flex items-center justify-center shadow-md shadow-red-950/60 flex-shrink-0">
              <img src="/hrfood-emblem.png" alt="HR Food" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {RESTAURANT_INFO.name}
                </h1>
                <span className="bg-red-600/30 text-red-400 border border-red-500/40 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Owner POS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block truncate">
                {RESTAURANT_INFO.tagline} &bull; Jam: <span className="font-mono text-emerald-600 dark:text-emerald-400">{currentTime}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 flex-wrap justify-end">
            {/* Theme Toggle (Light / Dark Mode) */}
            <ThemeToggle />

            {/* Saklar Status Toko */}
            <button
              onClick={() => setIsStoreModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition shadow-sm ${
                storeConfig?.isOpen
                  ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 hover:bg-emerald-900/80'
                  : 'bg-rose-950/70 border-rose-700 text-rose-300 hover:bg-rose-900/80'
              }`}
              title="Atur Jam Operasional & Status Buka/Tutup Resto"
            >
              <Store className="w-3.5 h-3.5" />
              <span>{storeConfig?.isOpen ? '🟢 BUKA' : '🔴 TUTUP'}</span>
            </button>

            {/* Alarm Audio Toggle */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                audioEnabled
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
              title={audioEnabled ? 'Alarm Suara Kasir Aktif' : 'Alarm Senyap'}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{audioEnabled ? 'Alarm: On' : 'Mute'}</span>
            </button>

            {/* Tes Bell (30 Detik Kring-Kring) */}
            <button
              onClick={handleToggleBellTest}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 shadow-sm ${
                isBellRinging
                  ? 'bg-red-600 text-white border-red-500 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-amber-600 dark:text-amber-300 border-slate-300 dark:border-slate-700'
              }`}
              title="Uji Coba Lonceng Kasir 30 Detik (Klik untuk Nyalakan/Matikan)"
            >
              <Bell className={`w-3.5 h-3.5 ${isBellRinging ? 'animate-bounce text-white' : 'text-amber-500 dark:text-amber-400'}`} />
              <span className="hidden sm:inline">{isBellRinging ? 'Stop Bel' : 'Tes Bel (30s)'}</span>
            </button>

            <Link
              href="/kitchen"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow transition"
              title="Buka Layar Dapur KDS"
            >
              <span>🍳</span>
              <span className="hidden xs:inline">Dapur (KDS)</span>
            </Link>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition shadow-sm"
              title="Cetak Ringkasan Penjualan Hari Ini"
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">Closing Kasir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        {/* KPI METRIC CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-emerald-500/10 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Omzet Lunas</span>
              <span className="text-base sm:text-xl">💰</span>
            </div>
            <div className="text-base sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
              {toIdr(report?.totalOmzet || 0)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Potensi: <span className="text-slate-700 dark:text-slate-300 font-semibold">{toIdr(report?.potentialOmzet || 0)}</span>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-blue-500/10 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Transaksi</span>
              <span className="text-base sm:text-xl">🧾</span>
            </div>
            <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {report?.totalOrders || 0} <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">Order</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{report?.completedOrders || 0} Selesai</span> &bull; {report?.activeOrders || 0} Aktif
            </p>
          </div>

          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-purple-500/10 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Delivery</span>
              <span className="text-base sm:text-xl">🛵</span>
            </div>
            <div className="text-sm sm:text-xl font-black text-purple-600 dark:text-purple-300">
              {deliverySettings?.isEnabled ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" /> AKTIF ONLINE
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400">NON-AKTIF</span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {deliverySettings?.zones?.length || 0} Zona Tarif Terdaftar
            </p>
          </div>

          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-red-500/10 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Katalog Menu</span>
              <span className="text-base sm:text-xl">🍗</span>
            </div>
            <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {menuItems.length} <span className="text-[11px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400">Menu</span>
            </div>
            <p className="text-[10px] sm:text-[11px] mt-1 truncate">
              {totalSoldOut > 0 ? (
                <span className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 px-1.5 py-0.5 rounded">
                  ⚠️ {totalSoldOut} Habis
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Semua tersedia</span>
              )}
            </p>
          </div>
        </div>

        {/* 4 Tab Navigasi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex-shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-red-600 text-white shadow-red-900/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-transparent'
              }`}
            >
              <span>📊</span>
              <span>Rekap Omzet & Kasir</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex-shrink-0 ${
                activeTab === 'catalog'
                  ? 'bg-red-600 text-white shadow-red-900/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-transparent'
              }`}
            >
              <span>📝</span>
              <span>Kelola Menu (Owner)</span>
            </button>

            <button
              onClick={() => setActiveTab('delivery')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex-shrink-0 ${
                activeTab === 'delivery'
                  ? 'bg-purple-600 text-white shadow-purple-900/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-transparent'
              }`}
            >
              <span>🛵</span>
              <span>Kelola Ongkir & Delivery</span>
            </button>

            <button
              onClick={() => setActiveTab('stock')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex-shrink-0 relative ${
                activeTab === 'stock'
                  ? 'bg-red-600 text-white shadow-red-900/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-transparent'
              }`}
            >
              <span>🔴</span>
              <span>Saklar Stok</span>
              {totalSoldOut > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1">
                  {totalSoldOut}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('promo')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex-shrink-0 relative ${
                activeTab === 'promo'
                  ? 'bg-amber-600 text-white shadow-amber-900/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-transparent'
              }`}
            >
              <span>🎟️</span>
              <span>Promo & Kupon</span>
              {promos.filter(p => p.isActive).length > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1">
                  {promos.filter(p => p.isActive).length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'catalog' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <span>➕</span> Tambah Menu Baru
            </button>
          )}

          {activeTab === 'delivery' && (
            <button
              onClick={() => handleOpenZoneModal()}
              className="bg-purple-600 hover:bg-purple-500 text-white font-black px-4 py-2 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <span>➕</span> Tambah Zona Ongkir
            </button>
          )}

          {activeTab === 'promo' && (
            <button
              onClick={() => handleOpenPromoModal()}
              className="bg-amber-600 hover:bg-amber-500 text-white font-black px-4 py-2 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <span>➕</span> Tambah Kupon Promo
            </button>
          )}
        </div>

        {/* TAB 1: REKAP OMZET & KASIR */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Filter Hari & Aksi Cepat (CSV Export & Reset Sesi) */}
            <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>📅</span> Filter Laporan:
                </span>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
                  <button
                    onClick={() => { setReportDate('today'); setCustomReportDate(''); }}
                    className={`px-3 py-1 rounded-lg transition ${
                      reportDate === 'today' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    🟢 Hari Ini
                  </button>

                  <button
                    onClick={() => { setReportDate('yesterday'); setCustomReportDate(''); }}
                    className={`px-3 py-1 rounded-lg transition ${
                      reportDate === 'yesterday' ? 'bg-amber-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    🟡 Kemarin
                  </button>

                  <button
                    onClick={() => { setReportDate('all'); setCustomReportDate(''); }}
                    className={`px-3 py-1 rounded-lg transition ${
                      reportDate === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    🌐 Semua
                  </button>
                </div>

                <input
                  type="date"
                  value={customReportDate}
                  onChange={(e) => {
                    setCustomReportDate(e.target.value);
                    setReportDate(e.target.value ? 'custom' : 'today');
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-mono shadow-sm"
                  title="Pilih tanggal laporan tertentu"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex-1 md:flex-none px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 active:scale-95"
                  title="Unduh file Excel / CSV data transaksi"
                >
                  <span>📥</span> Unduh Laporan (CSV)
                </button>

                <button
                  onClick={handleExportPDF}
                  className="flex-1 md:flex-none px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 active:scale-95"
                  title="Unduh laporan rapi format PDF"
                >
                  <span>📄</span> Unduh PDF
                </button>

                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="flex-1 md:flex-none px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/80 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 active:scale-95"
                  title="Reset Semua Pesanan & Mulai dari ORD-001"
                >
                  <span>🔄</span> Reset Sesi (Mulai dari 0)
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>🏆</span> Peringkat Menu Terlaris Hari Ini
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Berdasarkan jumlah porsi yang dipesan pelanggan</p>
                    </div>
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      Top Best Seller
                    </span>
                  </div>

                  {report?.topItems && report.topItems.length > 0 ? (
                    <div className="space-y-3">
                      {report.topItems.slice(0, 6).map((item, idx) => {
                        const maxQty = report.topItems[0].qty || 1;
                        const pct = Math.round((item.qty / maxQty) * 100);
                        return (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-750 p-3 rounded-xl flex items-center gap-3.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                              idx === 0 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20' :
                              idx === 1 ? 'bg-slate-300 text-slate-900' :
                              idx === 2 ? 'bg-amber-700 text-white' :
                              'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name}</h3>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{toIdr(item.revenue)}</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <div className="text-right pl-2">
                              <span className="font-black text-sm text-amber-600 dark:text-amber-400">{item.qty}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Porsi</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      Belum ada transaksi hari ini. Pesanan baru akan langsung otomatis tercatat di sini!
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl">
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                    <span>🌶️</span> Statistik Pilihan Sambal Tamu
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Varian sambal khas HR Food yang paling digemari</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-4 rounded-xl text-center">
                      <span className="text-2xl mb-1 block">🌶️</span>
                      <h3 className="font-bold text-xs text-red-700 dark:text-red-300">Sambal Terasi</h3>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{report?.sambalStats['Sambal Terasi'] || 0}</p>
                      <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">Paling Klasik & Nagih</span>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 rounded-xl text-center">
                      <span className="text-2xl mb-1 block">🧄</span>
                      <h3 className="font-bold text-xs text-amber-700 dark:text-amber-300">Sambal Bawang</h3>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{report?.sambalStats['Sambal Bawang'] || 0}</p>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Segar & Gurih</span>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-xl text-center">
                      <span className="text-2xl mb-1 block">🟢</span>
                      <h3 className="font-bold text-xs text-emerald-700 dark:text-emerald-300">Sambal Cabe Ijo</h3>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{report?.sambalStats['Sambal Cabe Ijo'] || 0}</p>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Pedas Mantap</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* List Transaksi Kasir Hari Ini */}
              <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>⏱️</span> Transaksi Hari Ini
                  </h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {report?.recentOrders?.length || 0} Order
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[580px] pr-1">
                  {report?.recentOrders && report.recentOrders.length > 0 ? (
                    report.recentOrders.map(order => {
                      const timeStr = new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      const orderType = order.orderType || 'dine_in';

                      return (
                        <div key={order.id} className="bg-slate-800/90 border border-slate-750 p-3.5 rounded-xl space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              {orderType === 'delivery' ? (
                                <span className="font-black text-xs px-2 py-0.5 rounded bg-purple-600 text-white">
                                  🛵 DELIVERY
                                </span>
                              ) : orderType === 'takeaway' ? (
                                <span className="font-black text-xs px-2 py-0.5 rounded bg-emerald-600 text-white">
                                  🛍️ BUNGKUS
                                </span>
                              ) : (
                                <span className="font-black text-sm text-amber-400">MEJA {order.tableNumber}</span>
                              )}
                              <span className="text-[11px] text-slate-400 ml-2 font-mono">{order.orderNumber}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{timeStr}</span>
                          </div>

                          <div className="text-xs text-slate-300">
                            <p className="font-bold text-white truncate">👤 {order.customerName}</p>
                            {orderType === 'delivery' && (
                              <p className="text-[11px] text-purple-300 mt-0.5">
                                📍 {order.deliveryAddress}
                              </p>
                            )}
                          </div>

                          <div className="text-xs text-slate-300 space-y-1">
                            {order.items.map((it, i) => (
                              <div key={i} className="flex justify-between text-[11px]">
                                <span className="truncate pr-2">{it.quantity}x {it.name}</span>
                                <span className="text-slate-400">{toIdr(it.unitPrice * it.quantity)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-slate-700/80 pt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
                            <div className="flex items-center justify-between sm:justify-start gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                order.isPaid ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                              }`}>
                                {order.isPaid ? 'Lunas (' + (order.paymentMethod === 'qris' ? 'QRIS' : 'Tunai') + ')' : 'Belum Lunas'}
                              </span>
                              <span className="font-black text-emerald-400 text-xs sm:hidden">{toIdr(order.total)}</span>
                            </div>

                            <div className="flex items-center gap-1.5 justify-end flex-wrap">
                              <span className="font-black text-emerald-400 hidden sm:inline mr-2">{toIdr(order.total)}</span>

                              {/* Tombol Chat WA Customer & Kurir */}
                              {order.customerPhone && (
                                <a
                                  href={generateCustomerWhatsAppUrl(order)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 px-2 rounded-lg bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/50 text-xs font-semibold flex items-center gap-1"
                                  title="Chat WhatsApp Pelanggan (Format Pesanan)"
                                >
                                  <span>💬</span>
                                  <span className="hidden xs:inline">WA Tamu</span>
                                </a>
                              )}

                              {orderType === 'delivery' && (
                                <a
                                  href={generateCourierWhatsAppUrl(order)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 px-2 rounded-lg bg-indigo-600/40 text-indigo-300 hover:bg-indigo-600/60 text-xs font-semibold flex items-center gap-1"
                                  title="Kirim Tugas ke Kurir via WhatsApp"
                                >
                                  <span>🛵</span>
                                  <span className="hidden xs:inline">Kurir</span>
                                </a>
                              )}

                              <button
                                onClick={() => handlePrintReceipt(order)}
                                className="p-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-650 text-slate-300 hover:text-white transition text-xs font-semibold flex items-center gap-1"
                                title="Cetak Struk Thermal (58mm/80mm & Tiket Dapur)"
                              >
                                <span>🖨️</span>
                                <span className="hidden xs:inline">Struk</span>
                              </button>

                              {!order.isPaid && (
                                <>
                                  <button
                                    onClick={() => handleConfirmPayment(order.id, 'cash')}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                                    title="Tandai Lunas Tunai"
                                  >
                                    <span>💵</span> Tunai
                                  </button>
                                  <button
                                    onClick={() => handleConfirmPayment(order.id, 'qris')}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                                    title="Tandai Lunas QRIS"
                                  >
                                    <span>📱</span> QRIS
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-14 text-slate-500 text-xs">
                      Belum ada transaksi masuk hari ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KELOLA KATALOG MENU (OWNER CRUD) */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl flex flex-wrap items-center justify-between gap-4 transition-colors">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[200px] flex-1 max-w-xs">
                <input
                  type="text"
                  placeholder="Cari menu di katalog..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenu.map(item => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-750">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.isPopular && (
                        <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-black px-1 rounded shadow">
                          FAVORIT
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name}</h3>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {toIdr(item.price)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">{item.description}</p>
                      <span className="inline-block text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full mt-2">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${item.isAvailable !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                        {item.isAvailable !== false ? 'Tersedia' : 'Habis'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingItem({ ...item });
                          setIsEditModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>✏️</span> Edit
                      </button>

                      <button
                        onClick={() => handleDeleteMenu(item)}
                        className="px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80 rounded-lg text-xs font-bold transition"
                        title="Hapus Menu"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: KELOLA ONGKIR & DELIVERY */}
        {activeTab === 'delivery' && (
          <div className="space-y-6">
            {/* KARTU KHUSUS: LOKASI FISIK RESTO & TITIK GPS TOKO */}
            <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-750 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      Lokasi Resto & Titik GPS Toko
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pangkal titik nol untuk menghitung jarak kilometer & ongkos kirim ke pembeli
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsStoreModalOpen(true)}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <span>📍</span> Ubah Lokasi & GPS Toko
                  </button>
                  <a
                    href={`https://www.google.com/maps?q=${storeConfig?.storeLatitude || -7.0101905},${storeConfig?.storeLongitude || 107.2760032}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Buka Maps</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Alamat Fisik Resto:
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                    {storeConfig?.storeAddress || 'Bunijaya, Kec. Gununghalu, Kab. Bandung Barat, Jawa Barat (Resto HR Food)'}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Koordinat GPS Toko:
                  </span>
                  <p className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
                    {storeConfig?.storeLatitude ?? -7.0101905}, {storeConfig?.storeLongitude ?? 107.2760032}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    WhatsApp Resto / Owner:
                  </span>
                  <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {storeConfig?.storePhone || '0838-3843-2860'}
                  </p>
                </div>
              </div>
            </div>

            {/* Header Delivery Toggle Card */}
            <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-750 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>🛵</span> Konfigurasi Layanan Pesan Antar Online
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Aktifkan pengantaran makanan ke rumah, atur nomor WhatsApp kurir, dan biaya per zona wilayah
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Status Layanan:
                  </span>
                  <button
                    onClick={handleToggleDeliveryService}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow ${
                      deliverySettings?.isEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-900 text-rose-700 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                    }`}
                  >
                    <span>{deliverySettings?.isEnabled ? '✅ BUKA PESANAN' : '🔒 TUTUP SEMENTARA'}</span>
                  </button>
                </div>
              </div>

              {/* Form Parameter Delivery */}
              {deliverySettings && (
                <form onSubmit={handleSaveDeliveryGeneral} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor WhatsApp Kurir / Resto *
                    </label>
                    <input
                      type="text"
                      value={deliverySettings.whatsappNumber || ''}
                      onChange={e => setDeliverySettings({ ...deliverySettings, whatsappNumber: e.target.value })}
                      placeholder="Contoh: 6283838432860"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Gunakan kode negara (62...)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Minimal Belanja Delivery (Rp)
                    </label>
                    <input
                      type="number"
                      value={deliverySettings.minOrderAmount || 0}
                      onChange={e => setDeliverySettings({ ...deliverySettings, minOrderAmount: Number(e.target.value) })}
                      placeholder="Contoh: 15000"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Batas minimum pesanan diantar</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Gratis Ongkir Jika Belanja &gt; (Rp)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={deliverySettings.freeDeliveryThreshold || 0}
                        onChange={e => setDeliverySettings({ ...deliverySettings, freeDeliveryThreshold: Number(e.target.value) })}
                        placeholder="Contoh: 150000"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isSavingDelivery}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition whitespace-nowrap active:scale-95"
                      >
                        {isSavingDelivery ? '...' : '💾 Simpan'}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Promo subsidi gratis ongkir</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mode Tarif Ongkir
                    </label>
                    <select
                      value={deliverySettings.feeMode || 'per_zone'}
                      onChange={e => setDeliverySettings({ ...deliverySettings, feeMode: e.target.value as 'per_zone' | 'per_km' })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="per_km">Per KM (jarak × tarif)</option>
                      <option value="per_zone">Per Zona (flat per area)</option>
                    </select>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Per KM: 1,2 km × Rp5.000 = Rp6.000</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tarif per KM (Rp)
                    </label>
                    <input
                      type="number"
                      value={deliverySettings.perKmRate ?? 5000}
                      onChange={e => setDeliverySettings({ ...deliverySettings, perKmRate: Number(e.target.value) })}
                      placeholder="Contoh: 5000"
                      disabled={(deliverySettings.feeMode || 'per_zone') !== 'per_km'}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono disabled:opacity-40"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Berlaku jika mode Per KM</span>
                  </div>
                </form>
              )}
            </div>

            {/* List Zona Ongkir */}
            <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Daftar Zona Tarif Pengantaran ({deliverySettings?.zones?.length || 0})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Atur ongkir berdasarkan radius jarak atau area kelurahan/kota</p>
                </div>
                <button
                  onClick={() => handleOpenZoneModal()}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
                >
                  <span>➕</span> Tambah Zona
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {deliverySettings?.zones?.map(zone => (
                  <div
                    key={zone.id}
                    className={`bg-slate-50 dark:bg-slate-800/90 border rounded-2xl p-4 shadow-sm flex flex-col justify-between transition ${
                      zone.isActive ? 'border-purple-400/50 dark:border-purple-500/50' : 'border-slate-200 dark:border-slate-700 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{zone.name}</h4>
                        <span className="text-sm font-black text-purple-700 dark:text-purple-400 whitespace-nowrap">
                          {toIdr(zone.fee)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">{zone.description}</p>
                      <span className="inline-block text-[11px] font-mono bg-purple-100 dark:bg-slate-750 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 px-2 py-0.5 rounded-lg">
                        ⏱️ Estimasi: {zone.estimatedTime}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-750 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleZoneActive(zone)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition ${
                          zone.isActive
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {zone.isActive ? '✓ Aktif' : 'Non-Aktif'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenZoneModal(zone)}
                          className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold transition"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80 rounded-lg text-xs font-bold transition"
                          title="Hapus Zona"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SAKLAR STOK CEPAT */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl flex items-center justify-between transition-colors">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Saklar Stok Menu Cepat
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Klik satu tombol untuk mengubah status menu habis / tersedia seketika</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Habis: <strong className="text-red-600 dark:text-red-400">{totalSoldOut}</strong></span>
              </div>
            </div>

            {/* Filter & Search Bar Saklar Stok */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari nama menu atau kategori..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                {stockSearch && (
                  <button
                    onClick={() => setStockSearch('')}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    stockFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Semua ({menuItems.length})
                </button>
                <button
                  onClick={() => setStockFilter('available')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    stockFilter === 'available'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  Tersedia ({menuItems.filter(m => m.isAvailable !== false).length})
                </button>
                <button
                  onClick={() => setStockFilter('sold_out')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    stockFilter === 'sold_out'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                  }`}
                >
                  Habis ({totalSoldOut})
                </button>
              </div>
            </div>

            {(() => {
              const displayedStockItems = menuItems.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(stockSearch.toLowerCase()) || 
                  (item.category && item.category.toLowerCase().includes(stockSearch.toLowerCase()));
                if (!matchesSearch) return false;
                if (stockFilter === 'available') return item.isAvailable !== false;
                if (stockFilter === 'sold_out') return item.isAvailable === false;
                return true;
              });

              if (displayedStockItems.length === 0) {
                return (
                  <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                    Tidak ada menu yang sesuai dengan filter atau kata kunci "{stockSearch}".
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {displayedStockItems.map(item => {
                    const isAvailable = item.isAvailable !== false;
                    const isUpdating = updatingId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`bg-white dark:bg-slate-800/90 border rounded-2xl p-3 shadow-sm flex flex-col justify-between transition ${
                          isAvailable ? 'border-slate-200 dark:border-slate-700' : 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex-shrink-0 border border-slate-200 dark:border-slate-800">
                            <img src={item.image} alt={item.name} className={`w-full h-full object-cover ${!isAvailable && 'grayscale'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</h4>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{toIdr(item.price)}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase ${isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {isAvailable ? '● Tersedia' : '✕ Habis'}
                          </span>

                          <button
                            disabled={isUpdating}
                            onClick={() => handleToggleStock(item)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition shadow ${
                              isAvailable
                                ? 'bg-red-600 hover:bg-red-500 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            {isUpdating ? '...' : isAvailable ? 'Tandai Habis' : 'Tersedia'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 5: MANAJEMEN KUPON & PROMO */}
        {activeTab === 'promo' && (
          <div className="space-y-6">
            {/* Header Promo Banner Card */}
            <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>🎟️</span> Kelola Voucher Promo & Diskon Belanja
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Buat kode promo hemat, diskon persentase, atau potongan tetap untuk pelanggan dine-in maupun delivery.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kupon Aktif:
                  </span>
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold">
                    {promos.filter(p => p.isActive).length} dari {promos.length} Kupon
                  </span>
                  <button
                    onClick={() => handleOpenPromoModal()}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
                  >
                    <span>➕</span> Tambah Kupon
                  </button>
                </div>
              </div>

              {/* Info Tips Pajak Resto */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <span>💡</span>
                <span>
                  <strong>Bebas Pajak (0% PB1):</strong> Perhitungan pajak resto 10% sudah dinonaktifkan sesuai kebutuhan wilayah. Promo diskon akan memotong subtotal secara transparan!
                </span>
              </div>
            </div>

            {/* Grid List Voucher Promo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promos.map(promo => {
                const isPercent = promo.type === 'percent';
                return (
                  <div
                    key={promo.id}
                    className={`bg-white dark:bg-slate-800/90 border rounded-2xl p-4 shadow-sm dark:shadow-lg flex flex-col justify-between transition relative overflow-hidden ${
                      promo.isActive ? 'border-amber-400/50 dark:border-amber-500/40' : 'border-slate-200 dark:border-slate-700 opacity-60'
                    }`}
                  >
                    {/* Top Ribbon / Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono font-black text-sm rounded-lg tracking-wider">
                            {promo.code}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            isPercent ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {isPercent ? 'Diskon %' : 'Potongan Rp'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTogglePromoActive(promo.id)}
                          className={`text-[10px] font-black px-2 py-1 rounded-lg transition ${
                            promo.isActive
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {promo.isActive ? '✓ Aktif' : 'Non-Aktif'}
                        </button>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{promo.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">{promo.description}</p>

                      {/* Detail Nilai Potongan & Syarat */}
                      <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                          <span>Nilai Diskon:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {isPercent ? `${promo.value}%` : toIdr(promo.value)}
                          </span>
                        </div>
                        {promo.minOrder ? (
                          <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                            <span>Min. Belanja:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">{toIdr(promo.minOrder)}</span>
                          </div>
                        ) : null}
                        {isPercent && promo.maxDiscount ? (
                          <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                            <span>Maks. Potongan:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">{toIdr(promo.maxDiscount)}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-750 flex items-center justify-between">
                      <button
                        onClick={() => handleDeletePromo(promo.id)}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold transition flex items-center gap-1"
                      >
                        🗑️ Hapus
                      </button>

                      <button
                        onClick={() => handleOpenPromoModal(promo)}
                        className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        ✏️ Edit Promo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* MODAL TAMBAH MENU BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8 transition-colors">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <span>➕</span> Tambah Menu Baru ke Katalog
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Menu baru otomatis langsung muncul di layar pemesanan meja tamu.</p>

            <form onSubmit={handleCreateMenu} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Menu *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ayam Bakar Madu Spesial"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori *</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  >
                    {CATEGORIES.filter(c => c !== 'Semua').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Harga (Rp) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 18000"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Menu</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan bumbu, rasa, atau porsi..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Foto Menu</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="URL gambar atau upload..."
                    value={formImage}
                    onChange={e => setFormImage(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], false)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-650 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    {isUploading ? 'Uploading...' : '📁 Upload'}
                  </button>
                </div>
                {formImage && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Foto terpasang</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addPopular"
                  checked={formIsPopular}
                  onChange={e => setFormIsPopular(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
                <label htmlFor="addPopular" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Tandai sebagai Menu Favorit (🔥 Ada lencana Favorit)
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-750">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow transition"
                >
                  Simpan Menu Baru
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT MENU & HARGA */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8 transition-colors">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <span>✏️</span> Edit Menu & Harga
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Perubahan harga dan nama menu akan langsung tersinkron ke semua meja.</p>

            <form onSubmit={handleUpdateMenu} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Menu *</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori *</label>
                  <select
                    value={editingItem.category}
                    onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  >
                    {CATEGORIES.filter(c => c !== 'Semua').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Harga Satuan (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={editingItem.price}
                    onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ubah Foto Menu</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editingItem.image}
                    onChange={e => setEditingItem({ ...editingItem, image: e.target.value })}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="file"
                    ref={editFileInputRef}
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], true)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-650 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    {isUploading ? 'Uploading...' : '📁 Upload'}
                  </button>
                </div>
                {editingItem.image && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={editingItem.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Foto terpasang</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editPopular"
                  checked={editingItem.isPopular || false}
                  onChange={e => setEditingItem({ ...editingItem, isPopular: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
                <label htmlFor="editPopular" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Tandai sebagai Menu Favorit (🔥 Ada lencana Favorit)
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-750">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow transition"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT ZONA ONGKIR */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8 transition-colors">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <span>🛵</span> {editingZone ? 'Edit Zona Pengantaran' : 'Tambah Zona Pengantaran Baru'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Atur nama wilayah, deskripsi cakupan, tarif ongkir, dan estimasi waktu kurir.
            </p>

            <form onSubmit={handleSaveZone} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Zona / Area *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Zona 1 - Radius Dekat (< 2 km)"
                  value={zoneName}
                  onChange={e => setZoneName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tarif Ongkir (Rp) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 5000"
                    value={zoneFee}
                    onChange={e => setZoneFee(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Estimasi Waktu</label>
                  <input
                    type="text"
                    placeholder="Contoh: 15 - 25 Menit"
                    value={zoneTime}
                    onChange={e => setZoneTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Cakupan Area</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Sekitar perumahan griya asri, balai desa, dan kantor dinas..."
                  value={zoneDesc}
                  onChange={e => setZoneDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="zoneActiveToggle"
                  checked={zoneActive}
                  onChange={e => setZoneActive(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
                <label htmlFor="zoneActiveToggle" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Zona Aktif (Dapat dipilih pelanggan saat checkout)
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-750">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-xs shadow transition"
                >
                  {editingZone ? 'Simpan Perubahan' : 'Tambah Zona'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(false)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRINT RINGKASAN CLOSING HARIAN */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div id="printable-receipt" className="print-80mm bg-white text-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl font-mono text-xs">
            <div className="text-center pb-3 border-b border-dashed border-slate-400 mb-3">
              <h2 className="text-base font-black uppercase">{RESTAURANT_INFO.name}</h2>
              <p className="text-[11px] text-slate-600">{RESTAURANT_INFO.tagline}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Tanggal: {report?.date} &bull; Jam: {currentTime}
              </p>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">*** LAPORAN CLOSING KASIR ***</p>
            </div>

            <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-3 mb-3">
              <div className="flex justify-between">
                <span>Total Transaksi:</span>
                <span className="font-bold">{report?.totalOrders || 0} Order</span>
              </div>
              <div className="flex justify-between">
                <span>Pesanan Selesai:</span>
                <span>{report?.completedOrders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Pesanan Aktif:</span>
                <span>{report?.activeOrders || 0}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                <span>OMZET LUNAS:</span>
                <span>{toIdr(report?.totalOmzet || 0)}</span>
              </div>
            </div>

            <div className="space-y-1 border-b border-dashed border-slate-400 pb-3 mb-3 text-[11px]">
              <div className="font-bold mb-1">METODE BAYAR:</div>
              <div className="flex justify-between">
                <span>- Tunai Kasir:</span>
                <span>{toIdr(report?.payment.cashTotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>- QRIS Non-Tunai:</span>
                <span>{toIdr(report?.payment.qrisTotal || 0)}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-slate-400 pb-3 mb-3">
              <div className="font-bold text-[11px] mb-1.5">REKAP MENU TERJUAL:</div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {report?.topItems && report.topItems.length > 0 ? (
                  report.topItems.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[10.5px]">
                      <span className="truncate pr-2">{it.qty}x {it.name}</span>
                      <span>{toIdr(it.revenue)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic">Tidak ada menu terjual</div>
                )}
              </div>
            </div>

            <div className="text-center pt-2 text-[10px] text-slate-600">
              <p>Kasir On Duty: _________________</p>
              <p className="mt-3 italic">&ldquo;Makan Enak, Mood Naik!&rdquo;</p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-sans font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <span>🖨️</span> Cetak Sekarang
              </button>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-sans font-bold py-2 rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL RESET PESANAN ADMIN (MULAI DARI 0) */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <span className="text-xl">⚠️</span>
                <h3 className="text-base font-black">Reset Sesi / Mulai dari Nol</h3>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Aksi ini akan <strong>mengosongkan seluruh antrean transaksi</strong>. Penomoran pesanan baru berikutnya akan otomatis <strong>kembali mulai dari ORD-001</strong>.
              </p>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl space-y-1">
                <p className="text-slate-500 dark:text-slate-400">Transaksi Terdaftar: <strong className="text-slate-900 dark:text-white">{report?.recentOrders?.length || 0} Order</strong></p>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ File cadangan JSON akan diunduh otomatis sebelum database dibersihkan.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-750">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <span>💾</span> Unduh Cadangan JSON Sekarang
              </button>

              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-red-950 transition flex items-center justify-center gap-2"
              >
                <span>🔄</span> {isResetting ? 'Mereset Data...' : 'Konfirmasi: Kosongkan & Mulai dari ORD-001'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THERMAL RECEIPT MODAL (58mm / 80mm & Tiket Dapur / Struk Kasir) */}
      <ThermalReceiptModal
        order={printingOrder}
        onClose={() => setPrintingOrder(null)}
      />

      {/* MODAL PENGATURAN STATUS TOKO, LOKASI & KONTAK WHATSAPP */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative my-8 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-750 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Pengaturan Toko & Lokasi Resto</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Jam buka, titik koordinat GPS fisik resto & kontak WA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStoreConfig} className="space-y-4 text-xs">
              {/* Bagian 1: Saklar Buka / Tutup Cepat */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-900 dark:text-white text-xs block">Status Buka Resto Saat Ini</label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Kontrol langsung apakah pelanggan bisa memesan</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsOpen(!formIsOpen)}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 shadow ${
                      formIsOpen
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{formIsOpen ? '🟢 BUKA' : '🔴 TUTUP'}</span>
                  </button>
                </div>
              </div>

              {/* Bagian 1b: Tandai Semua Menu Habis */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-900 dark:text-white text-xs block">Semua Menu Habis</label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Satu tombol: semua menu tampil habis. Stok per item tetap tersimpan.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormAllSoldOut(!formAllSoldOut)}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 shadow ${
                      formAllSoldOut
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>{formAllSoldOut ? '🔥 SEMUA HABIS' : '✅ Stok Normal'}</span>
                  </button>
                </div>
              </div>

              {/* Bagian 2: Lokasi Fisik & Titik GPS Toko (Solusi Ongkir & Jarak Kejauhan) */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-300 font-bold">
                    <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Titik Lokasi Resto HR Food (Pusat Pengantaran)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-purple-200/80 leading-relaxed">
                  Titik koordinat ini digunakan sebagai <strong>titik nol/pangkal</strong> untuk menghitung jarak kilometer delivery ke rumah pembeli secara akurat.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Lengkap Fisik Toko *
                  </label>
                  <input
                    type="text"
                    required
                    value={formStoreAddress}
                    onChange={e => setFormStoreAddress(e.target.value)}
                    placeholder="Contoh: Jl. Babakan No. 12, Krajan, Resto HR Food"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Tombol Ambil GPS Saya Saat Ini */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDetectStoreGps}
                    disabled={isDetectingStoreGps}
                    className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{isDetectingStoreGps ? 'Mendeteksi GPS...' : '📍 Gunakan Lokasi GPS Saya Saat Ini'}</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps?q=${formStoreLatitude},${formStoreLongitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    title="Buka titik ini di Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Cek di Google Maps</span>
                  </a>
                </div>

                {storeGpsStatus && (
                  <p className="text-[11px] text-purple-800 dark:text-purple-300 font-semibold bg-purple-100/60 dark:bg-purple-900/40 p-2 rounded-lg">
                    {storeGpsStatus}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formStoreLatitude}
                      onChange={e => setFormStoreLatitude(e.target.value)}
                      placeholder="-7.0101905"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formStoreLongitude}
                      onChange={e => setFormStoreLongitude(e.target.value)}
                      placeholder="107.2760032"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 3: Nomor WhatsApp Resmi Resto / Owner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-bold">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Nomor WhatsApp Resmi Resto / Owner</span>
                </div>
                <div>
                  <input
                    type="text"
                    required
                    value={formStorePhone}
                    onChange={e => setFormStorePhone(e.target.value)}
                    placeholder="Contoh: 0838-3843-2860 atau 6283838432860"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-emerald-300/80 mt-1">
                    Nomor ini menjadi tujuan seluruh tombol chat WhatsApp pesanan, bantuan kasir, dan pemesanan online.
                  </p>
                </div>
              </div>

              {/* Bagian 4: Auto Buka / Tutup Jadwal */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-900 dark:text-white block">Auto Buka/Tutup Terjadwal (Jam Operasional)</label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Otomatis tentukan status buka berdasarkan jam WIB</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAutoSchedule}
                    onChange={e => setFormAutoSchedule(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Jam Buka (WIB)</label>
                    <input
                      type="time"
                      value={formOpenTime}
                      onChange={e => setFormOpenTime(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Jam Tutup (WIB)</label>
                    <input
                      type="time"
                      value={formCloseTime}
                      onChange={e => setFormCloseTime(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Pesan saat Resto Tutup */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pesan Pengumuman saat Tutup</label>
                <textarea
                  rows={2}
                  value={formClosedMessage}
                  onChange={e => setFormClosedMessage(e.target.value)}
                  placeholder="Maaf, resto kami sedang tutup..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSavingStore}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs shadow transition active:scale-95"
                >
                  {isSavingStore ? 'Menyimpan...' : '💾 Simpan Pengaturan Toko & Lokasi'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT KUPON PROMO */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8 transition-colors">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <span>🎟️</span> {editingPromo ? 'Edit Kupon Promo' : 'Tambah Kupon Promo Baru'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {editingPromo ? 'Perbarui informasi dan ketentuan kupon promo.' : 'Kupon baru langsung dapat digunakan oleh pelanggan saat checkout.'}
            </p>

            <form onSubmit={handleSavePromo} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kode Promo / Kupon *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: DISKONJUMAT"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono uppercase tracking-wider font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Judul / Nama Promo *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Diskon Jumat Berkah 15%"
                  value={promoTitle}
                  onChange={e => setPromoTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipe Potongan *</label>
                  <select
                    value={promoType}
                    onChange={e => setPromoType(e.target.value as 'fixed' | 'percent')}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="fixed">Nominal Tetap (Rp)</option>
                    <option value="percent">Persentase (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {promoType === 'percent' ? 'Besar Diskon (%) *' : 'Nominal Potongan (Rp) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={promoType === 'percent' ? 100 : undefined}
                    placeholder={promoType === 'percent' ? 'Contoh: 10' : 'Contoh: 5000'}
                    value={promoValue}
                    onChange={e => setPromoValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Min. Belanja (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Contoh: 25000"
                    value={promoMinOrder}
                    onChange={e => setPromoMinOrder(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">0 jika tanpa minimal</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Maks. Potongan (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    disabled={promoType !== 'percent'}
                    placeholder={promoType === 'percent' ? 'Contoh: 10000' : 'Hanya untuk %'}
                    value={promoMaxDiscount}
                    onChange={e => setPromoMaxDiscount(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono ${
                      promoType !== 'percent' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">Khusus tipe persentase</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi & Syarat Ketentuan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Diskon 10% maksimal potongan Rp 8.000 dengan minimal order Rp 35.000"
                  value={promoDesc}
                  onChange={e => setPromoDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="promoActiveCheck"
                  checked={promoActive}
                  onChange={e => setPromoActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 bg-white dark:bg-slate-750 border-slate-300 dark:border-slate-600 focus:ring-amber-500"
                />
                <label htmlFor="promoActiveCheck" className="text-xs text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                  Kupon Promo Langsung Aktif
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={isSavingPromo}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs shadow transition"
                >
                  {isSavingPromo ? 'Menyimpan...' : (editingPromo ? 'Simpan Perubahan' : 'Tambah Kupon')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminPinGate>
      <AdminDashboardInner />
    </AdminPinGate>
  );
}
