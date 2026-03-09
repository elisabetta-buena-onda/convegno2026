'use client';

import { useRouter } from 'next/navigation';
import { useBooking } from '../BookingContext';

const opzioniMacro = [
  { id: 'pernottamento', icon: 'hotel', title: 'Pacchetti con pernottamento', desc: 'Incluso pass evento e soggiorno per 2 o 3 giorni.' },
  { id: 'pass', icon: 'local_activity', title: 'Solo pass (senza pernottamento)', desc: 'Accesso all\'evento per 1 o 3 giorni.' },
  { id: 'pasti', icon: 'restaurant', title: 'Pasti per pendolari', desc: 'Carnet pasti singoli per pranzo o cena.' }
];

export default function Step1() {
  const router = useRouter();
  const { data, updateData } = useBooking();

  const handleSelect = (id: any) => {
    // Reset dependant fields
    updateData({ 
      tipo_scelta: id, 
      pacchetto_giorni: '', 
      tipo_pass: '',
      alloggio: '',
      struttura: 'Euroitalia',
      adulti: id === 'pasti' ? 1 : 2, // default adults
      bambini: 0,
      pranzi: 0,
      cene: 0
    });
  };

  const handleContinue = () => {
    if (!data.tipo_scelta) return;
    router.push('/prenota/step-2');
  };

  return (
    <>
      <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">1</span>
          <h3 className="text-lg font-bold text-slate-900">Scelta Tipologia</h3>
        </div>
        
        <div className="space-y-4">
          {opzioniMacro.map((p) => {
            const isSelected = data.tipo_scelta === p.id;
            
            return (
              <div 
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`flex flex-col cursor-pointer overflow-hidden rounded-xl border-2 transition-all shadow-sm ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="p-4 flex items-center gap-4 bg-white/50">
                  <div className={`w-12 h-12 flex justify-center items-center rounded-full ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <span className="material-symbols-outlined text-2xl">{p.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-slate-900">{p.title}</p>
                    <p className="text-sm text-slate-500">{p.desc}</p>
                  </div>
                  <div>
                    {isSelected ? (
                      <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-slate-300 text-2xl">radio_button_unchecked</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-30">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={handleContinue}
            disabled={!data.tipo_scelta}
            className="w-full bg-primary text-white h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all hover:bg-primary/90"
          >
            <span>Continua ai Dettagli</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </footer>
    </>
  );
}
