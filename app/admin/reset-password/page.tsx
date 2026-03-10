'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Protect against direct visits without token
  useEffect(() => {
    if (!token) {
      router.push('/admin/login');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Le password non coincidono');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('La password deve contenere almeno 6 caratteri');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Password aggiornata con successo! Ora puoi effettuare il login.');
        setTimeout(() => {
          router.push('/admin/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Token non valido o scaduto. Richiedi un nuovo link.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Errore di connessione al server.');
    }
  };

  if (!token) return <div className="min-h-screen bg-[#f6f7f8]" />; // Hide UI while redirecting

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-[#f6f7f8]">
      {/* Top Branding Section */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-[#1a355b] p-2 rounded-lg text-white">
            <span className="material-symbols-outlined text-3xl">church</span>
          </div>
          <h1 className="text-[#1a355b] text-2xl font-bold tracking-tight">Convegno Admin</h1>
        </div>
      </div>

      {/* Password Reset Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">Nuova Password</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Inserisci la tua nuova password per l'account.
          </p>
        </div>

        {status === 'success' ? (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm text-center mb-6">
            <span className="material-symbols-outlined text-4xl block mb-2 mx-auto">check_circle</span>
            {message}
            <p className="mt-2 text-xs">Reindirizzamento al login in corso...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {status === 'error' && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {message}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Nuova Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1a355b] transition-colors">
                    <span className="material-symbols-outlined text-xl">lock</span>
                  </div>
                  <input 
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a355b]/20 focus:border-[#1a355b] transition-all text-base" 
                    id="password" 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="confirm">
                  Conferma Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1a355b] transition-colors">
                    <span className="material-symbols-outlined text-xl">lock_reset</span>
                  </div>
                  <input 
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a355b]/20 focus:border-[#1a355b] transition-all text-base" 
                    id="confirm" 
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={status === 'loading'}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                className="w-full flex items-center justify-center h-12 px-6 bg-[#1a355b] text-white font-bold rounded-lg hover:bg-[#1a355b]/90 transition-colors shadow-sm tracking-wide disabled:opacity-50" 
                type="submit"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                ) : (
                  'Salva Password'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
