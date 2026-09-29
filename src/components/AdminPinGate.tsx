'use client';

import React, { useState, useEffect } from 'react';
import { Lock, LogIn, Loader2 } from 'lucide-react';

/**
 * Gerbang PIN untuk halaman admin & dapur.
 * PIN diverifikasi server (POST /api/admin/login) lalu session
 * disimpan di cookie httpOnly — PIN tidak pernah tersimpan di browser.
 */
export default function AdminPinGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'locked' | 'open'>('checking');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setState(d.isAdmin ? 'open' : 'locked'))
      .catch(() => setState('locked'));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.success) {
        setState('open');
      } else {
        setError(data.error || 'PIN salah.');
      }
    } catch {
      setError('Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  if (state === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-stone-950">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (state === 'locked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-stone-950 p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-8 space-y-5"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">Area Terbatas</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Masukkan PIN admin untuk membuka halaman ini.
            </p>
          </div>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN admin"
            className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-amber-500"
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            Masuk
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
