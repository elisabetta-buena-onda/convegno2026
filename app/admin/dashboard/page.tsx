import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const totPrenotazioni = await prisma.booking.count();
  const res = await prisma.booking.aggregate({ _sum: { totale: true } });
  const totEntrate = (res._sum.totale || 0).toFixed(2);
  const partecipanti = await prisma.participant.count();

  return (
    <div className="flex flex-col min-h-screen p-6 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <img src="/logo_CNP.jpg" alt="Logo CNP" className="h-12 w-auto rounded-xl shadow-sm" />
          <div>
            <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Panoramica andamento convegno</p>
          </div>
        </div>
        <a href="/api/admin/logout" className="text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors">
          Logout
        </a>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Prenotazioni</p>
          <p className="text-4xl font-black text-primary">{totPrenotazioni}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Partecipanti Tot.</p>
          <p className="text-4xl font-black text-primary">{partecipanti}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Incasso</p>
          <p className="text-4xl font-black text-primary">€ {totEntrate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/prenotazioni" className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-primary hover:shadow-md transition-all flex justify-between items-center cursor-pointer">
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">Gestione Prenotazioni</h3>
            <p className="text-sm text-slate-500 mt-1">Elenco, filtri, export CSV</p>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">arrow_forward_ios</span>
        </Link>
        <Link href="/admin/camere" className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-primary hover:shadow-md transition-all flex justify-between items-center cursor-pointer">
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">Gestione Camere</h3>
            <p className="text-sm text-slate-500 mt-1">Modifica inventario posti letto</p>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">arrow_forward_ios</span>
        </Link>
      </div>
    </div>
  );
}
