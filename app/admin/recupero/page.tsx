'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RecuperoPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/admin/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('Se l\'email corrisponde a un amministratore, riceverai a breve un link per reimpostare la password.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Si è verificato un errore. Riprova più tardi.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Errore di connessione al server.');
    }
  };

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

      {/* Password Recovery Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">Recupero Password</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Inserisci l'username o l'email dell'amministratore per ricevere le istruzioni di ripristino.
          </p>
        </div>

        {status === 'success' ? (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm text-center mb-6">
            <span className="material-symbols-outlined text-4xl block mb-2 mx-auto">check_circle</span>
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {status === 'error' && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {message}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Username / Email Amministratore
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1a355b] transition-colors">
                  <span className="material-symbols-outlined text-xl">person</span>
                </div>
                <input 
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a355b]/20 focus:border-[#1a355b] transition-all text-base" 
                  id="email" 
                  name="email" 
                  placeholder="admin@dominio.it" 
                  required 
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                />
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
                  'Invia istruzioni'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Navigation Link */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link href="/admin/login" className="inline-flex items-center gap-2 text-[#1a355b] font-medium hover:underline group">
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span>Torna al Login</span>
          </Link>
        </div>
      </div>
      
      {/* Support Info */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-xs">
          © {new Date().getFullYear()} Convegno Admin Portal. Tutti i diritti riservati.
        </p>
      </div>
    </div>
  );
}
