'use client';

import { ReactNode } from 'react';
import { BookingProvider } from './BookingContext';
import { usePathname, useRouter } from 'next/navigation';

export default function WizardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  let stepIndex = 1;
  if (pathname.includes('step-2')) stepIndex = 2;
  if (pathname.includes('step-3')) stepIndex = 3;
  if (pathname.includes('step-4')) stepIndex = 4;
  if (pathname.includes('step-5')) stepIndex = 5;

  return (
    <BookingProvider>
      <div className="relative flex min-h-screen w-full flex-col bg-background-light text-slate-900">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center p-4 justify-between max-w-2xl mx-auto w-full">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
              <span className="material-symbols-outlined text-slate-700">arrow_back</span>
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo_CNP.jpg" alt="Logo CNP" className="h-8 w-auto rounded-md" />
              <h2 className="text-lg font-bold leading-tight tracking-tight text-slate-900">Prenotazione</h2>
            </div>
            <div className="w-10"></div>
          </div>
          
          <div className="px-4 pb-4 max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`h-2 w-full rounded-full transition-colors ${stepIndex >= 1 ? 'bg-primary' : 'bg-slate-200'}`}></div>
                <span className={`text-[10px] font-bold uppercase ${stepIndex >= 1 ? 'text-primary' : 'text-slate-400'}`}>Scelta</span>
              </div>
              <div className="w-2"></div>
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`h-2 w-full rounded-full transition-colors ${stepIndex >= 2 ? 'bg-primary' : 'bg-slate-200'}`}></div>
                <span className={`text-[10px] font-bold uppercase ${stepIndex >= 2 ? 'text-primary' : 'text-slate-400'}`}>Dettagli</span>
              </div>
              <div className="w-2"></div>
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`h-2 w-full rounded-full transition-colors ${stepIndex >= 3 ? 'bg-primary' : 'bg-slate-200'}`}></div>
                <span className={`text-[10px] font-bold uppercase ${stepIndex >= 3 ? 'text-primary' : 'text-slate-400'}`}>Dati</span>
              </div>
              <div className="w-2"></div>
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`h-2 w-full rounded-full transition-colors ${stepIndex >= 4 ? 'bg-primary' : 'bg-slate-200'}`}></div>
                <span className={`text-[10px] font-bold uppercase ${stepIndex >= 4 ? 'text-primary' : 'text-slate-400'}`}>Riepilogo</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 pb-32 max-w-2xl mx-auto w-full px-4 pt-6">
          {children}
        </main>
      </div>
    </BookingProvider>
  );
}
