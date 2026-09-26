'use client';

import React, { useState } from 'react';
import { Order } from '@/types/order';
import { RESTAURANT_INFO } from '@/data/menu';
import { Printer, X, ChefHat, Receipt } from 'lucide-react';

interface ThermalReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function ThermalReceiptModal({ order, onClose }: ThermalReceiptModalProps) {
  const [printType, setPrintType] = useState<'customer' | 'kitchen'>('customer');
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');

  if (!order) return null;

  const orderType = order.orderType || 'dine_in';
  const timeFormatted = new Date(order.createdAt).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Controls (Screen Only) */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cetak Struk Thermal</h3>
              <p className="text-[11px] text-slate-400">Pilihan cetak kasir atau tiket koki dapur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Toolbar (Screen Only) */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Tipe Cetak */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setPrintType('customer')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                printType === 'customer'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Struk Tamu / Kasir</span>
            </button>
            <button
              onClick={() => setPrintType('kitchen')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                printType === 'kitchen'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Tiket Dapur (KOT)</span>
            </button>
          </div>

          {/* Ukuran Thermal */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setPaperWidth('58mm')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                paperWidth === '58mm'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Thermal Mini Bluetooth 58mm"
            >
              58mm (Mini)
            </button>
            <button
              onClick={() => setPaperWidth('80mm')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                paperWidth === '80mm'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Thermal POS Standar 80mm"
            >
              80mm (Besar)
            </button>
          </div>
        </div>

        {/* Live Visual Thermal Receipt Paper Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950 flex justify-center">
          <div
            id="printable-receipt"
            className={`${paperWidth === '58mm' ? 'print-58mm max-w-[280px]' : 'print-80mm max-w-[360px]'} w-full bg-white text-black font-mono text-xs p-4 sm:p-5 shadow-2xl rounded-sm transition-all`}
          >
            {printType === 'customer' ? (
              /* FORMAT 1: STRUK TAMU / KASIR LENGKAP */
              <div className="space-y-3">
                {/* Kop Resto */}
                <div className="text-center pb-2.5 border-b border-dashed border-black">
                  <h2 className="text-base font-black tracking-tight uppercase">{RESTAURANT_INFO.name}</h2>
                  <p className="text-[10px] uppercase font-bold text-gray-800">{RESTAURANT_INFO.tagline}</p>
                  <p className="text-[9.5px] text-gray-700 mt-0.5">{RESTAURANT_INFO.address}</p>
                  <p className="text-[9.5px] text-gray-700">WA: {RESTAURANT_INFO.phone}</p>
                  <div className="mt-1 text-[9px] text-gray-600">
                    <span>{timeFormatted}</span>
                  </div>
                </div>

                {/* Metadata Pesanan */}
                <div className="pb-2 border-b border-dashed border-black text-[11px] space-y-1">
                  <div className="flex justify-between font-black text-xs">
                    <span>
                      {orderType === 'delivery'
                        ? '🛵 DELIVERY'
                        : orderType === 'takeaway'
                        ? '🛍️ BUNGKUS'
                        : `MEJA: ${order.tableNumber}`}
                    </span>
                    <span>{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between text-[10.5px]">
                    <span>Tamu: {order.customerName}</span>
                    <span className="capitalize font-bold">{order.paymentMethod.toUpperCase()}</span>
                  </div>

                  {orderType === 'delivery' && (
                    <div className="pt-1 text-[10px] space-y-0.5 text-gray-800">
                      <p className="font-semibold">Alamat: {order.deliveryAddress}</p>
                      {order.deliveryNotes && <p>Patokan: {order.deliveryNotes}</p>}
                      {order.customerPhone && <p>No. WA: {order.customerPhone}</p>}
                    </div>
                  )}

                  <div className="pt-1 flex justify-between font-bold text-[10.5px]">
                    <span>STATUS:</span>
                    <span>{order.isPaid ? 'LUNAS' : 'BELUM BAYAR (KASIR / COD)'}</span>
                  </div>
                </div>

                {/* Daftar Item */}
                <div className="pb-2 border-b border-dashed border-black space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="text-[11px]">
                      <div className="flex justify-between font-bold">
                        <span className="pr-1">{item.quantity}x {item.name}</span>
                        <span className="whitespace-nowrap">Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}</span>
                      </div>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="text-[9.5px] text-gray-700 pl-3">
                          {item.selectedOptions.map(o => o.choiceLabel).join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-[9.5px] font-bold text-gray-800 pl-3">
                          * {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Rincian Total */}
                <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-black">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp {order.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {!!order.discountAmount && order.discountAmount > 0 && (
                    <div className="flex justify-between font-semibold text-rose-700">
                      <span>Diskon {order.discountCode ? `(${order.discountCode})` : 'Promo'}:</span>
                      <span>- Rp {order.discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {orderType === 'delivery' && (
                    <div className="flex justify-between">
                      <span>Ongkos Kirim:</span>
                      <span>Rp {(order.deliveryFee || 0).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
                    <span>TOTAL:</span>
                    <span>Rp {order.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Footer Pesan */}
                <div className="text-center pt-1 text-[9.5px] space-y-0.5 text-gray-700">
                  <p className="font-bold">Terima kasih atas pesanan Anda!</p>
                  <p>Makan Enak, Mood Naik!</p>
                  <p className="text-[8.5px] text-gray-500 mt-1">Dicetak: {new Date().toLocaleTimeString('id-ID')}</p>
                </div>
              </div>
            ) : (
              /* FORMAT 2: TIKET KOKI DAPUR (KITCHEN ORDER TICKET / KOT) */
              <div className="space-y-3">
                {/* Header Dapur */}
                <div className="text-center pb-2 border-b-2 border-black">
                  <h2 className="text-lg font-black uppercase tracking-wider">TIKET DAPUR / KOKI</h2>
                  <div className="flex justify-between items-center mt-1 text-xs font-black">
                    <span className="px-2 py-0.5 bg-black text-white rounded">
                      {orderType === 'delivery'
                        ? 'DELIVERY'
                        : orderType === 'takeaway'
                        ? 'BUNGKUS'
                        : `MEJA ${order.tableNumber}`}
                    </span>
                    <span className="text-sm font-mono">{order.orderNumber}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-gray-700">
                    <span>Tamu: {order.customerName}</span>
                    <span>{timeFormatted}</span>
                  </div>
                </div>

                {/* Items & Masakan (Font Besar & Jelas untuk Koki) */}
                <div className="py-2 border-b-2 border-black space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="pb-2 border-b border-dotted border-gray-400 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-black tracking-wide leading-tight">
                          [{item.quantity}x] {item.name.toUpperCase()}
                        </span>
                      </div>

                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="mt-1 text-xs font-bold pl-3 text-gray-900 bg-gray-100 p-1 rounded">
                          Sambal/Level: {item.selectedOptions.map(o => o.choiceLabel).join(' | ')}
                        </div>
                      )}

                      {item.notes && (
                        <div className="mt-1 text-xs font-black text-black bg-yellow-100 border border-black p-1 rounded">
                          ⚠️ CATATAN: {item.notes.toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Catatan Khusus Pengantaran jika Delivery */}
                {orderType === 'delivery' && (
                  <div className="text-[10.5px] p-2 bg-gray-100 border border-black rounded space-y-0.5">
                    <p className="font-bold">TUJUAN PENGANTARAN:</p>
                    <p className="font-semibold">{order.deliveryAddress}</p>
                    {order.deliveryNotes && <p>Patokan: {order.deliveryNotes}</p>}
                  </div>
                )}

                {/* Footer Tiket Dapur */}
                <div className="text-center text-[10px] font-bold text-gray-700">
                  <p>*** SELESAIKAN TEPAT WAKTU (&lt; 15 MENIT) ***</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons (Screen Only) */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-750 transition"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-2 shadow-lg shadow-red-950 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Sekarang ({paperWidth})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
