'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { 
  Printer, 
  ArrowLeft, 
  ChefHat, 
  QrCode as QrIcon, 
  Sparkles, 
  Utensils, 
  CheckCircle,
  ExternalLink,
  Flame
} from 'lucide-react';

interface TableQR {
  tableNumber: string;
  url: string;
  qrDataUrl: string;
}

export default function TableQRGeneratorPage() {
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [startTable, setStartTable] = useState<number>(1);
  const [endTable, setEndTable] = useState<number>(12);
  const [tableList, setTableList] = useState<TableQR[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Default origin base URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Generate QR Codes
  const generateQRCodes = async () => {
    setIsGenerating(true);
    const results: TableQR[] = [];

    const effectiveBase = baseUrl.trim() || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    for (let i = startTable; i <= endTable; i++) {
      const tableStr = i.toString().padStart(2, '0');
      const targetUrl = `${effectiveBase}/?table=${tableStr}`;

      try {
        const qrDataUrl = await QRCode.toDataURL(targetUrl, {
          width: 300,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });

        results.push({
          tableNumber: tableStr,
          url: targetUrl,
          qrDataUrl,
        });
      } catch (err) {
        console.error('Failed generating QR for table', tableStr, err);
      }
    }

    setTableList(results);
    setIsGenerating(false);
  };

  useEffect(() => {
    if (baseUrl) {
      generateQRCodes();
    }
  }, [baseUrl, startTable, endTable]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Top Navbar Control (Disembunyikan saat print) */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 print:hidden sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/kitchen"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Kembali ke Kitchen KDS"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <QrIcon className="w-5 h-5 text-rose-600" />
                Generator Kartu QR Code Meja Cafe
              </h1>
              <p className="text-xs text-slate-500">
                Cetak kartu akrilik meja untuk dipindai tamu saat memesan makanan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Semua Kartu Meja (PDF / Print)</span>
            </button>
          </div>
        </div>

        {/* Configuration Toolbar */}
        <div className="max-w-6xl mx-auto mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Domain / Base URL (Gunakan IP WiFi Lokal / Domain Cafe)
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://192.168.1.100:3000 atau https://cafe.com"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Meja Awal</label>
              <input
                type="number"
                min="1"
                max="99"
                value={startTable}
                onChange={(e) => setStartTable(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Meja Akhir</label>
              <input
                type="number"
                min="1"
                max="99"
                value={endTable}
                onChange={(e) => setEndTable(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={generateQRCodes}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
            >
              Perbarui Tampilan Kartu
            </button>
          </div>
        </div>
      </header>

      {/* Grid of Printable Table Cards */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tableList.map((item) => (
            <div
              key={item.tableNumber}
              className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-md flex flex-col justify-between text-center p-6 relative print:border-black print:shadow-none print:break-inside-avoid"
            >
              {/* Header Card Brand */}
              <div>
                <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                  <img src="/hrfood-emblem.png" alt="HR Food Logo" className="w-full h-full object-contain" />
                </div>
                <img src="/hrfood-title.png" alt="HR Food" className="h-8 mx-auto object-contain mb-1" />
                <p className="text-[11px] text-emerald-700 font-black">Masakan Rumahan Rasa Juara! 🌶️</p>
                <p className="text-[10px] text-slate-500 font-medium">WA / Delivery: 0838-3843-2860</p>
              </div>

              {/* Big Table Badge */}
              <div className="my-3">
                <div className="inline-block bg-slate-950 text-amber-400 px-6 py-1.5 rounded-full font-black text-lg tracking-wider shadow-inner border border-slate-800">
                  MEJA {item.tableNumber}
                </div>
              </div>

              {/* QR Code Container */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mx-auto inline-block shadow-sm">
                <img
                  src={item.qrDataUrl}
                  alt={`QR Meja ${item.tableNumber}`}
                  className="w-48 h-48 object-contain mx-auto"
                />
              </div>

              {/* How to order guide */}
              <div className="mt-4 pt-3 border-t border-dashed border-slate-200 text-left space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[9px]">1</span>
                  Buka Kamera HP & Arahkan ke QR Code
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[9px]">2</span>
                  Pilih Lauk, Varian Sambal & Level Pedas
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[9px]">3</span>
                  Bayar di Kasir atau via QRIS Instan
                </div>
              </div>

              {/* Direct Test Link (Screen Only) */}
              <div className="mt-3 print:hidden">
                <a
                  href={item.url}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800"
                >
                  Tes Buka Menu Meja {item.tableNumber} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
