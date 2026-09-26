'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RESTAURANT_INFO, CATEGORIES } from '@/data/menu';
import { MenuItem, Order } from '@/types/order';

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

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'stock' | 'catalog'>('analytics');
  const [report, setReport] = useState<ReportData | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

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

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const [resReport, resMenu] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/menu')
      ]);
      const dataReport = await resReport.json();
      const dataMenu = await resMenu.json();

      if (dataReport.success) setReport(dataReport.data);
      if (dataMenu.success) setMenuItems(dataMenu.items);
    } catch (err) {
      console.error('Failed fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Upload Gambar
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

    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          category: formCategory,
          price: Number(formPrice),
          description: formDescription,
          image: formImage || '/menu/ayam-kampung.jpg',
          isPopular: formIsPopular,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        // Reset Form
        setFormName('');
        setFormPrice('');
        setFormDescription('');
        setFormImage('');
        setFormIsPopular(false);
        fetchData();
        alert('Menu baru berhasil ditambahkan ke katalog!');
      } else {
        alert('Gagal menambah menu: ' + data.error);
      }
    } catch (err) {
      console.error('Create menu error:', err);
      alert('Terjadi kesalahan saat menambah menu');
    }
  };

  // Simpan Edit Menu
  const handleSaveEditMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditModalOpen(false);
        setEditingItem(null);
        fetchData();
        alert('Perubahan menu & harga berhasil disimpan!');
      } else {
        alert('Gagal mengupdate menu: ' + data.error);
      }
    } catch (err) {
      console.error('Update menu error:', err);
      alert('Terjadi kesalahan saat menyimpan perubahan');
    }
  };

  // Hapus Menu
  const handleDeleteMenu = async (item: MenuItem) => {
    if (!confirm(`Yakin ingin menghapus menu "${item.name}" dari katalog?`)) return;

    try {
      const res = await fetch(`/api/menu?id=${item.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMenuItems(prev => prev.filter(m => m.id !== item.id));
        alert(`Menu "${item.name}" berhasil dihapus.`);
      } else {
        alert('Gagal menghapus menu.');
      }
    } catch (err) {
      console.error('Delete menu error:', err);
      alert('Terjadi kesalahan saat menghapus menu.');
    }
  };

  // Toggle Stok Habis
  const handleToggleStock = async (item: MenuItem) => {
    const nextState = !item.isAvailable;
    setUpdatingId(item.id);
    setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: nextState } : m));

    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isAvailable: nextState }),
      });
      const data = await res.json();
      if (!data.success) {
        setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: !nextState } : m));
      }
    } catch (err) {
      console.error('Failed toggling stock:', err);
      setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: !nextState } : m));
    } finally {
      setUpdatingId(null);
    }
  };

  // Konfirmasi Pembayaran Kasir langsung dari /admin
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

  const handlePrintReceipt = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 200);
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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      {/* Top Header - Fully Responsive */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Brand Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-xl p-1 shadow-md flex-shrink-0">
                <Image src="/hrfood-emblem.png" alt="HR Food Emblem" fill className="object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">{RESTAURANT_INFO.name}</h1>
                  <span className="bg-red-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Kasir & Owner
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-amber-400 font-medium line-clamp-1">{RESTAURANT_INFO.tagline}</p>
              </div>
            </div>

            {/* Jam Digital di Mobile */}
            <div className="sm:hidden bg-slate-800/90 border border-slate-700 px-2 py-1 rounded-lg text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{currentTime || '00:00'}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
            {/* Jam Digital di Desktop */}
            <div className="hidden sm:flex bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{currentTime || '00:00:00'}</span>
            </div>

            <Link
              href="/kitchen"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 flex-shrink-0"
            >
              <span>🍳</span>
              <span>Dapur (KDS)</span>
            </Link>

            <Link
              href="/?table=01"
              target="_blank"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 flex-shrink-0"
            >
              <span>📱</span>
              <span className="hidden xs:inline">Menu Tamu</span>
            </Link>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 sm:px-4 py-1.5 rounded-lg text-xs shadow-lg transition flex items-center gap-1 flex-shrink-0"
            >
              <span>🖨️</span>
              <span>Closing Kasir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        {/* KPI METRIC CARDS - 2x2 Grid di HP, 4 Kolom di Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700/80 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-emerald-500/10 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Omzet Lunas</span>
              <span className="text-base sm:text-xl">💰</span>
            </div>
            <div className="text-base sm:text-2xl font-black text-emerald-400 tracking-tight truncate">
              {toIdr(report?.totalOmzet || 0)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
              Potensi: <span className="text-slate-300 font-semibold">{toIdr(report?.potentialOmzet || 0)}</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700/80 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-blue-500/10 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Transaksi</span>
              <span className="text-base sm:text-xl">🧾</span>
            </div>
            <div className="text-base sm:text-2xl font-black text-white tracking-tight">
              {report?.totalOrders || 0} <span className="text-[11px] sm:text-xs font-medium text-slate-400">Order</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
              <span className="text-emerald-400 font-bold">{report?.completedOrders || 0} Selesai</span> &bull; {report?.activeOrders || 0} Aktif
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700/80 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-amber-500/10 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Metode Bayar</span>
              <span className="text-base sm:text-xl">💳</span>
            </div>
            <div className="space-y-0.5 sm:space-y-1 mt-0.5 sm:mt-1">
              <div className="flex justify-between items-center text-[10px] sm:text-xs">
                <span className="text-slate-300">💵 Tunai:</span>
                <span className="font-bold text-amber-300 truncate">{toIdr(report?.payment.cashTotal || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] sm:text-xs">
                <span className="text-slate-300">📱 QRIS:</span>
                <span className="font-bold text-blue-400 truncate">{toIdr(report?.payment.qrisTotal || 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700/80 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-red-500/10 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Katalog Menu</span>
              <span className="text-base sm:text-xl">🍗</span>
            </div>
            <div className="text-base sm:text-2xl font-black text-white tracking-tight">
              {menuItems.length} <span className="text-[11px] sm:text-xs font-medium text-emerald-400">Menu</span>
            </div>
            <p className="text-[10px] sm:text-[11px] mt-1 truncate">
              {totalSoldOut > 0 ? (
                <span className="text-red-400 font-bold bg-red-950/60 border border-red-800/80 px-1.5 py-0.5 rounded">
                  ⚠️ {totalSoldOut} Habis
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold">Semua tersedia</span>
              )}
            </p>
          </div>
        </div>

        {/* 3 Tab Navigasi - Responsive Mobile Scrollable */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex-shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-red-600 text-white shadow-red-900/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
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
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
              }`}
            >
              <span>📝</span>
              <span>Kelola Menu (Owner)</span>
            </button>

            <button
              onClick={() => setActiveTab('stock')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex-shrink-0 relative ${
                activeTab === 'stock'
                  ? 'bg-red-600 text-white shadow-red-900/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
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
          </div>

          {/* Tombol Tambah Menu jika di Tab Katalog */}
          {activeTab === 'catalog' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <span>➕</span> Tambah Menu Baru
            </button>
          )}
        </div>

        {/* TAB 1: ANALYTICS & REKAP */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-black text-white flex items-center gap-2">
                        <span>🏆</span> Peringkat Menu Terlaris Hari Ini
                      </h2>
                      <p className="text-xs text-slate-400">Berdasarkan jumlah porsi yang dipesan pelanggan</p>
                    </div>
                    <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
                      Top Best Seller
                    </span>
                  </div>

                  {report?.topItems && report.topItems.length > 0 ? (
                    <div className="space-y-3">
                      {report.topItems.slice(0, 6).map((item, idx) => {
                        const maxQty = report.topItems[0].qty || 1;
                        const pct = Math.round((item.qty / maxQty) * 100);
                        return (
                          <div key={idx} className="bg-slate-800/70 border border-slate-750 p-3 rounded-xl flex items-center gap-3.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                              idx === 0 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20' :
                              idx === 1 ? 'bg-slate-300 text-slate-900' :
                              idx === 2 ? 'bg-amber-700 text-white' :
                              'bg-slate-700 text-slate-300'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
                                <span className="text-xs font-bold text-emerald-400">{toIdr(item.revenue)}</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <div className="text-right pl-2">
                              <span className="font-black text-sm text-amber-400">{item.qty}</span>
                              <span className="text-[10px] text-slate-400 block">Porsi</span>
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

                <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h2 className="text-base font-black text-white flex items-center gap-2 mb-1">
                    <span>🌶️</span> Statistik Pilihan Sambal Tamu
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">Varian sambal khas HR Food yang paling digemari</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-red-950/40 border border-red-800/60 p-4 rounded-xl text-center">
                      <span className="text-2xl mb-1 block">🌶️</span>
                      <h3 className="font-bold text-xs text-red-300">Sambal Terasi</h3>
                      <p className="text-2xl font-black text-white mt-1">{report?.sambalStats['Sambal Terasi'] || 0}</p>
                      <span className="text-[10px] text-red-400">Paling Klasik & Nagih</span>
                    </div>

                    <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl text-center">
                      <span className="text-2xl mb-1 block">🧄</span>
                      <h3 className="font-bold text-xs text-amber-300">Sambal Bawang</h3>
                      <p className="text-2xl font-black text-white mt-1">{report?.sambalStats['Sambal Bawang'] || 0}</p>
                      <span className="text-[10px] text-amber-400">Segar & Gurih</span>
                    </div>

                    <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl text-center">
                      <span className="text-2xl mb-1 block">🟢</span>
                      <h3 className="font-bold text-xs text-emerald-300">Sambal Cabe Ijo</h3>
                      <p className="text-2xl font-black text-white mt-1">{report?.sambalStats['Sambal Cabe Ijo'] || 0}</p>
                      <span className="text-[10px] text-emerald-400">Pedas Mantap</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <span>⏱️</span> Transaksi Hari Ini
                  </h2>
                  <span className="text-xs text-slate-400 font-mono">
                    {report?.recentOrders?.length || 0} Order
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[560px] pr-1">
                  {report?.recentOrders && report.recentOrders.length > 0 ? (
                    report.recentOrders.map(order => {
                      const timeStr = new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={order.id} className="bg-slate-800/90 border border-slate-750 p-3.5 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-black text-sm text-amber-400">MEJA {order.tableNumber}</span>
                              <span className="text-[11px] text-slate-400 ml-2 font-mono">{order.orderNumber}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{timeStr}</span>
                          </div>

                          <div className="text-xs text-slate-300 space-y-1 mb-2">
                            {order.items.map((it, i) => (
                              <div key={i} className="flex justify-between text-[11px]">
                                <span className="truncate pr-2">{it.quantity}x {it.name}</span>
                                <span className="text-slate-400">{toIdr(it.unitPrice * it.quantity)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-slate-700/80 pt-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
                            <div className="flex items-center justify-between sm:justify-start gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                order.isPaid ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                              }`}>
                                {order.isPaid ? 'Lunas (' + (order.paymentMethod === 'qris' ? 'QRIS' : 'Tunai') + ')' : 'Belum Lunas'}
                              </span>
                              <span className="font-black text-emerald-400 text-xs sm:hidden">{toIdr(order.total)}</span>
                            </div>

                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="font-black text-emerald-400 hidden sm:inline mr-2">{toIdr(order.total)}</span>

                              <button
                                onClick={() => handlePrintReceipt(order)}
                                className="p-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-650 text-slate-300 hover:text-white transition text-xs font-semibold flex items-center gap-1"
                                title="Cetak Struk Kasir"
                              >
                                <span>🖨️</span>
                                <span className="hidden xs:inline">Struk</span>
                              </button>

                              {!order.isPaid && (
                                <>
                                  <button
                                    onClick={() => handleConfirmPayment(order.id, 'cash')}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                                    title="Tandai Lunas Tunai"
                                  >
                                    <span>💵</span> Tunai
                                  </button>
                                  <button
                                    onClick={() => handleConfirmPayment(order.id, 'qris')}
                                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
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
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  placeholder="Cari nama menu..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Menu Grid dengan Aksi Edit & Hapus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMenu.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-850 border border-slate-750 hover:border-slate-650 rounded-2xl p-4 transition shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-800 mb-3 group">
                      <Image
                        src={item.image || '/menu/ayam-kampung.jpg'}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                      />
                      {item.isPopular && (
                        <span className="absolute top-2 left-2 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded shadow">
                          🔥 Favorit
                        </span>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.isAvailable !== false ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {item.isAvailable !== false ? 'Tersedia' : 'Habis'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-amber-400 font-semibold block uppercase tracking-wider">{item.category}</span>
                      <h3 className="font-bold text-sm text-white mt-0.5 truncate">{item.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                      <div className="mt-2 text-base font-black text-emerald-400">
                        {toIdr(item.price)}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi Owner */}
                  <div className="border-t border-slate-750 pt-3 mt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEditingItem({ ...item });
                        setIsEditModalOpen(true);
                      }}
                      className="flex-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-bold py-1.5 rounded-lg transition text-center flex items-center justify-center gap-1"
                    >
                      <span>✏️</span> Edit Harga & Foto
                    </button>

                    <button
                      onClick={() => handleDeleteMenu(item)}
                      className="bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-800/40 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      title="Hapus Menu"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MANAJEMEN STOK (SAKLAR HABIS) */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  placeholder="Cari nama menu..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMenu.map(item => {
                const isAvailable = item.isAvailable !== false;
                const isUpdating = updatingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`border rounded-2xl p-4 transition-all duration-200 shadow-md ${
                      isAvailable
                        ? 'bg-slate-850 border-slate-750 hover:border-slate-600'
                        : 'bg-red-950/20 border-red-900/60 opacity-80'
                    }`}
                  >
                    <div className="flex gap-3 items-center mb-3">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                        <Image
                          src={item.image || '/menu/ayam-kampung.jpg'}
                          alt={item.name}
                          fill
                          className={`object-cover ${!isAvailable ? 'grayscale' : ''}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-amber-400 font-semibold block">{item.category}</span>
                        <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
                        <p className="text-xs font-black text-emerald-400 mt-0.5">{toIdr(item.price)}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-750 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className={`text-xs font-bold ${isAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isAvailable ? 'Tersedia' : 'Habis (Sold Out)'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleStock(item)}
                        disabled={isUpdating}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                          isAvailable
                            ? 'bg-red-600/90 hover:bg-red-600 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {isUpdating ? '...' : isAvailable ? 'Tandai Habis' : 'Jadikan Tersedia'}
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
          <div className="bg-slate-850 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8">
            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-1">
              <span>➕</span> Tambah Menu Baru ke Katalog
            </h2>
            <p className="text-xs text-slate-400 mb-4">Menu baru otomatis langsung muncul di layar pemesanan meja tamu.</p>

            <form onSubmit={handleCreateMenu} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nama Menu *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ayam Bakar Madu Spesial"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kategori *</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    {CATEGORIES.filter(c => c !== 'Semua').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Harga (Rp) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 18000"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Deskripsi Menu</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan bumbu, rasa, atau porsi..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Upload Foto / URL Foto */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Foto Menu</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="URL gambar atau upload..."
                    value={formImage}
                    onChange={e => setFormImage(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
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
                    className="bg-slate-750 hover:bg-slate-700 border border-slate-650 px-3 py-2 rounded-xl text-xs font-bold text-slate-200"
                  >
                    {isUploading ? 'Uploading...' : '📁 Upload'}
                  </button>
                </div>
                {formImage && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700">
                      <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] text-emerald-400 font-medium">✓ Foto terpasang</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addPopular"
                  checked={formIsPopular}
                  onChange={e => setFormIsPopular(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-800 border-slate-700"
                />
                <label htmlFor="addPopular" className="text-xs text-slate-300 font-medium">
                  Tandai sebagai Menu Favorit (🔥 Ada lencana Favorit)
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-750">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow transition"
                >
                  Simpan Menu Baru
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
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
          <div className="bg-slate-850 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8">
            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-1">
              <span>✏️</span> Edit Menu & Harga
            </h2>
            <p className="text-xs text-slate-400 mb-4">Ubah harga, nama, atau foto lauk. Perubahan langsung aktif di HP tamu.</p>

            <form onSubmit={handleSaveEditMenu} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nama Menu *</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kategori *</label>
                  <select
                    value={editingItem.category}
                    onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    {CATEGORIES.filter(c => c !== 'Semua').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Harga Menu (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={editingItem.price}
                    onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-amber-500/80 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Deskripsi Menu</label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Upload Foto / URL Foto */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Foto Menu (Ganti Foto)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editingItem.image}
                    onChange={e => setEditingItem({ ...editingItem, image: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
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
                    className="bg-slate-750 hover:bg-slate-700 border border-slate-650 px-3 py-2 rounded-xl text-xs font-bold text-slate-200"
                  >
                    {isUploading ? 'Uploading...' : '📁 Upload'}
                  </button>
                </div>
                {editingItem.image && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700">
                      <img src={editingItem.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] text-slate-400">Pratinjau foto terkini</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editPopular"
                  checked={!!editingItem.isPopular}
                  onChange={e => setEditingItem({ ...editingItem, isPopular: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-800 border-slate-700"
                />
                <label htmlFor="editPopular" className="text-xs text-slate-300 font-medium">
                  Tandai sebagai Menu Favorit (🔥 Ada lencana Favorit)
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-750">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow transition"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRINT LAPORAN CLOSING KASIR */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative font-mono text-xs">
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
              <h2 className="font-black text-base uppercase tracking-wider text-red-700">{RESTAURANT_INFO.name}</h2>
              <p className="text-[10px] text-slate-600 font-sans">{RESTAURANT_INFO.tagline}</p>
              <p className="text-[10px] text-slate-500">WA: {RESTAURANT_INFO.phone}</p>
              <div className="mt-2 text-[11px] font-bold bg-slate-100 py-1 rounded">
                LAPORAN TUTUP KASIR (Z-REPORT)
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Tanggal: {new Date().toLocaleDateString('id-ID')} &bull; Jam: {currentTime}
              </p>
            </div>

            <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-3 mb-3">
              <div className="flex justify-between">
                <span>Total Order:</span>
                <span className="font-bold">{report?.totalOrders || 0} Transaksi</span>
              </div>
              <div className="flex justify-between">
                <span>Total Omzet Lunas:</span>
                <span className="font-bold text-sm text-red-700">{toIdr(report?.totalOmzet || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>- Uang Tunai (Cash):</span>
                <span>{toIdr(report?.payment.cashTotal || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
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
              <p className="mt-3 italic">"Makan Enak, Mood Naik!"</p>
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

      {/* PRINTABLE RECEIPT KASIR PER TRANSAKSI */}
      {printingOrder && (
        <div id="printable-cashier-receipt" className="hidden print:block text-black bg-white font-mono text-xs p-2">
          <div className="text-center pb-2 border-b border-dashed border-black">
            <h2 className="text-sm font-bold uppercase">{RESTAURANT_INFO.name}</h2>
            <p className="text-[10px]">{RESTAURANT_INFO.tagline}</p>
            <p className="text-[10px]">WA / Kasir: {RESTAURANT_INFO.phone}</p>
            <p className="text-[9px]">{new Date(printingOrder.createdAt).toLocaleString('id-ID')}</p>
          </div>

          <div className="py-2 border-b border-dashed border-black">
            <div className="flex justify-between font-bold text-sm">
              <span>MEJA: {printingOrder.tableNumber}</span>
              <span>{printingOrder.orderNumber}</span>
            </div>
            <p className="text-[11px]">Tamu: {printingOrder.customerName}</p>
            <p className="text-[10px]">
              Status: {printingOrder.isPaid ? 'LUNAS (' + printingOrder.paymentMethod.toUpperCase() + ')' : 'BELUM BAYAR'}
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
                    Catatan: {item.notes}
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
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
              <span>TOTAL:</span>
              <span>Rp {printingOrder.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="text-center pt-3 border-t border-dashed border-black text-[9px]">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>&ldquo;Makan Enak, Mood Naik!&rdquo;</p>
          </div>
        </div>
      )}
    </div>
  );
}
