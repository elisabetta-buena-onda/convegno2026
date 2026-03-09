'use client';

import { useRouter } from 'next/navigation';
import { useBooking } from '../BookingContext';
import { useEffect } from 'react';

export default function Step3() {
  const router = useRouter();
  const { data, updateData } = useBooking();

  useEffect(() => {
    if (!data.tipo_scelta) {
      router.push('/prenota/step-1');
    }
  }, []);

  const totalPersone = data.adulti + data.bambini;

  useEffect(() => {
    if (data.participants.length !== totalPersone) {
      const newParticipants = Array(totalPersone).fill(null).map((_, i) => ({
        nome: data.participants[i]?.nome || '',
        tipo: i < data.adulti ? 'ADULTO' as const : 'BAMBINO' as const
      }));
      updateData({ participants: newParticipants });
    }
  }, [totalPersone]);

  const handleValidation = () => {
    if (!data.nome || !data.email || !data.telefono) return false;
    for (const p of data.participants) {
      if (!p.nome) return false;
    }
    return true;
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (handleValidation()) {
      router.push('/prenota/step-4');
    }
  };

  const updateParticipant = (index: number, val: string) => {
    const newParticipants = [...data.participants];
    newParticipants[index].nome = val;
    updateData({ participants: newParticipants });
  };

  return (
    <>
      <form onSubmit={handleContinue} className="mb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <section className="mb-6 p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">3</span>
            <h3 className="text-lg font-bold text-slate-900">Dati Referente</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 pl-1">Nome e Cognome</label>
              <input required type="text" value={data.nome} onChange={e => updateData({nome: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary outline-none bg-slate-50 focus:bg-white transition-colors text-slate-900" placeholder="Mario Rossi" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 pl-1">Email</label>
                <input required type="email" value={data.email} onChange={e => updateData({email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary outline-none bg-slate-50 focus:bg-white transition-colors text-slate-900" placeholder="mario@email.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 pl-1">Telefono</label>
                <input required type="tel" value={data.telefono} onChange={e => updateData({telefono: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary outline-none bg-slate-50 focus:bg-white transition-colors text-slate-900" placeholder="+39 333 1234567" />
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Nomi Partecipanti</h3>
            <p className="text-xs text-slate-500 mt-1">Inserisci i nomi di tutte le persone (necessario per i badge).</p>
          </div>

          <div className="space-y-4">
            {data.participants.map((p, index) => (
              <div key={index}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 pl-1">
                  Partecipante {index + 1} <span className="text-xs font-normal text-slate-400 capitalize">({p.tipo.toLowerCase()})</span>
                </label>
                <input 
                  required 
                  type="text" 
                  value={p.nome} 
                  onChange={e => updateParticipant(index, e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary outline-none bg-slate-50 focus:bg-white transition-colors text-slate-900" 
                  placeholder={`Nome ${p.tipo === 'ADULTO' ? 'Adulto' : 'Bambino'}`} 
                />
              </div>
            ))}
          </div>
        </section>

        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-30">
          <div className="max-w-2xl mx-auto flex gap-4">
            <button 
              type="button"
              onClick={() => router.back()}
              className="w-14 h-14 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <button 
              type="submit"
              className="flex-1 bg-primary text-white h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-95 transition-all hover:bg-primary/90"
            >
              <span>Continua al Riepilogo</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </footer>

      </form>
    </>
  );
}
