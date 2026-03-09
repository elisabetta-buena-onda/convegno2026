'use client';

import { useRouter } from 'next/navigation';
import { useBooking } from '../BookingContext';
import { useEffect, useState } from 'react';

export default function Step2() {
  const router = useRouter();
  const { data, updateData } = useBooking();
  const [loading, setLoading] = useState(false);
  const [accommodations, setAccommodations] = useState<any[]>([]);

  const isPernottamento = data.tipo_scelta === 'pernottamento';

  useEffect(() => {
    if (!data.tipo_scelta) {
      router.push('/prenota/step-1');
      return;
    }

    if (isPernottamento) {
      setLoading(true);
      fetch('/api/availability')
        .then(res => res.json())
        .then(apiData => {
          setAccommodations(apiData.accommodations || []);

          if (!data.alloggio && apiData.accommodations?.length > 0) {
            const firstAvailable = apiData.accommodations.find((a: any) =>
              a.structure.name === (data.struttura || 'Euroitalia') && a.inventory.length > 0 && a.inventory[0].posti_disponibili > 0
            );
            if (firstAvailable) updateData({ alloggio: firstAvailable.tipo });
          }
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const handleContinue = () => {
    if (isPernottamento && (!data.alloggio || !data.pacchetto_giorni)) return;
    if (data.tipo_scelta === 'pass' && !data.tipo_pass) return;
    if (data.adulti < 1) return;
    router.push('/prenota/step-3');
  };

  const getFilteredRooms = () => {
    return accommodations.filter(a => a.structure.name === (data.struttura || 'Euroitalia'));
  };

  const totalPersone = data.adulti + data.bambini;

  const getRoomPriceLabel = (capienza: number, roomTipo: string) => {
    if (!data.pacchetto_giorni) return '';
    const room = accommodations.find(a => a.tipo === roomTipo);
    if (!room) return '';

    const is3Days = data.pacchetto_giorni === '3_giorni';
    const price = is3Days ? room.prezzo_adulto_3g : room.prezzo_adulto_2g;
    if (price == null) return '';
    return `€${Number(price).toFixed(2)} a persona`;
  };

  return (
    <>
      <section className="mb-24 p-6 rounded-xl bg-white border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">2</span>
          <h3 className="text-lg font-bold text-slate-900">Configurazione {data.tipo_scelta === 'pernottamento' && 'Pacchetto'}{data.tipo_scelta === 'pass' && 'Pass'}{data.tipo_scelta === 'pasti' && 'Pasti'}</h3>
        </div>

        <div className="space-y-8">

          {/* DURATA PER PERNOTTAMENTO */}
          {isPernottamento && (
            <div>
              <label className="text-sm font-bold text-slate-700 mb-3 block italic uppercase tracking-wider">Durata Pacchetto</label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div onClick={() => updateData({ pacchetto_giorni: '3_giorni' })} className={`p-4 border-2 rounded-xl cursor-pointer transition-colors relative ${data.pacchetto_giorni === '3_giorni' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="font-bold block text-slate-900">3 Giorni completi</span>
                  <span className="text-xs text-slate-500 block mt-1">Dalla cena del Giovedì al pranzo della Domenica</span>
                  {data.pacchetto_giorni === '3_giorni' && <span className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm">check_circle</span>}
                </div>
                <div onClick={() => updateData({ pacchetto_giorni: '2_giorni' })} className={`p-4 border-2 rounded-xl cursor-pointer transition-colors relative ${data.pacchetto_giorni === '2_giorni' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="font-bold block text-slate-900">2 Giorni</span>
                  <span className="text-xs text-slate-500 block mt-1">Dalla cena del Venerdì al pranzo della Domenica</span>
                  {data.pacchetto_giorni === '2_giorni' && <span className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm">check_circle</span>}
                </div>
              </div>
            </div>
          )}

          {/* DURATA PER PASS */}
          {data.tipo_scelta === 'pass' && (
            <div>
              <label className="text-sm font-bold text-slate-700 mb-3 block italic uppercase tracking-wider">Tipologia Pass</label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div onClick={() => updateData({ tipo_pass: '3_giorni' })} className={`p-4 border-2 rounded-xl cursor-pointer transition-colors relative ${data.tipo_pass === '3_giorni' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="font-bold block text-slate-900">Pass 3 Giorni</span>
                  <span className="text-sm font-black text-primary block mt-1">€ 15,00</span>
                  {data.tipo_pass === '3_giorni' && <span className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm">check_circle</span>}
                </div>
                <div onClick={() => updateData({ tipo_pass: '1_giorno' })} className={`p-4 border-2 rounded-xl cursor-pointer transition-colors relative ${data.tipo_pass === '1_giorno' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="font-bold block text-slate-900">Pass 1 Giorno</span>
                  <span className="text-sm font-black text-primary block mt-1">€ 5,00</span>
                  {data.tipo_pass === '1_giorno' && <span className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm">check_circle</span>}
                </div>
              </div>
            </div>
          )}

          {/* QUANITA PASTI */}
          {data.tipo_scelta === 'pasti' && (
            <div>
              <label className="text-sm font-bold text-slate-700 mb-3 block italic uppercase tracking-wider">Acquisto Carnet Pasti</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <label className={`relative flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-colors ${data.pranzo_scelto ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Pranzi</span>
                    <span className="text-xs text-slate-500">€ 20,00 l'uno</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" checked={data.pranzo_scelto} onChange={(e) => updateData({ pranzo_scelto: e.target.checked })} className="w-6 h-6 rounded border-slate-300 text-primary focus:ring-primary shadow-sm cursor-pointer" />
                  </div>
                </label>

                <label className={`relative flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-colors ${data.cena_scelta ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Cene</span>
                    <span className="text-xs text-slate-500">€ 20,00 l'una</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" checked={data.cena_scelta} onChange={(e) => updateData({ cena_scelta: e.target.checked })} className="w-6 h-6 rounded border-slate-300 text-primary focus:ring-primary shadow-sm cursor-pointer" />
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* PERSONE (Required for all because we need names for badges) */}
          <div>
            <label className="text-sm font-bold text-slate-700 mb-3 block italic uppercase tracking-wider">Numero Persone</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">Adulti</span>
                  <span className="text-xs text-slate-500">Età 14+</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateData({ adulti: Math.max(1, data.adulti - 1) })} className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-base">remove</span>
                  </button>
                  <span className="text-base font-bold w-4 text-center text-slate-900">{data.adulti}</span>
                  <button onClick={() => updateData({ adulti: data.adulti + 1 })} className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-base">add</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">Bambini</span>
                  <span className="text-xs text-slate-500">3 - 14 anni</span>
                  {data.tipo_scelta === 'pass' && <span className="text-[10px] text-green-600 font-bold">Pass Gratuito</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateData({ bambini: Math.max(0, data.bambini - 1) })} className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-base">remove</span>
                  </button>
                  <span className="text-base font-bold w-4 text-center text-slate-900">{data.bambini}</span>
                  <button onClick={() => updateData({ bambini: data.bambini + 1 })} className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-base">add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PERSONE (Required for all because we need names for badges) */}

          {/* PERNOTTAMENTO: CAMERE E STRUTTURA */}
          {isPernottamento && (
            <div className="pt-4 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-700 mb-3 block italic uppercase tracking-wider">Seleziona Struttura</label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <label className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-colors ${data.struttura === 'Euroitalia' || !data.struttura ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <input type="radio" className="sr-only" checked={data.struttura === 'Euroitalia' || !data.struttura} onChange={() => updateData({ struttura: 'Euroitalia', alloggio: '' })} />
                  <span className="text-sm font-bold text-slate-900">Euroitalia</span>
                  <span className="text-xs text-slate-500 mt-1">Sede Principale</span>
                  {(data.struttura === 'Euroitalia' || !data.struttura) && <span className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm">radio_button_checked</span>}
                </label>

                <label className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-colors ${data.struttura === 'B&B' ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <input type="radio" className="sr-only" checked={data.struttura === 'B&B'} onChange={() => updateData({ struttura: 'B&B', alloggio: '' })} />
                  <span className="text-sm font-bold text-slate-900">B&amp;B</span>
                  <span className="text-xs text-slate-500 mt-1">Convenzionate</span>
                  {data.struttura === 'B&B' && <span className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm">radio_button_checked</span>}
                </label>
              </div>

              {loading ? (
                <div className="text-center p-4 text-slate-500">Caricamento disponibilità camere...</div>
              ) : (
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-3 block italic uppercase tracking-wider">Tipologia Sistemazione</label>
                  {!data.pacchetto_giorni && <p className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-lg">Scegli prima la durata del pacchetto in alto per vedere i prezzi.</p>}

                  <div className="grid gap-3">
                    {getFilteredRooms().map(room => {
                      const isAvailable = room.inventory[0]?.posti_disponibili > 0;
                      return (
                        <label key={room.id} className={`relative flex items-center justify-between p-4 border-2 rounded-xl transition-colors
                          ${!isAvailable ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' :
                            data.alloggio === room.tipo ? 'cursor-pointer border-primary bg-primary/5' : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300'}`}>
                          <input type="radio" className="sr-only" disabled={!isAvailable || !data.pacchetto_giorni} checked={data.alloggio === room.tipo} onChange={() => updateData({ alloggio: room.tipo })} />
                          <div>
                            <span className="text-md font-bold text-slate-900 capitalize block mb-1">{room.tipo}</span>
                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded inline-block mb-1">Capienza: {room.capienza} pers.</span>
                            {isAvailable && getRoomPriceLabel(room.capienza, room.tipo) && (
                              <p className="text-sm font-black text-primary mt-1">{getRoomPriceLabel(room.capienza, room.tipo)} <span className="text-xs text-slate-500 font-normal">({data.pacchetto_giorni.replace('_', ' ')})</span></p>
                            )}
                          </div>
                          {isAvailable ? (
                            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded border border-green-200">Disponibile</span>
                          ) : (
                            <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded border border-red-200">Esaurita</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-30">
        <div className="max-w-2xl mx-auto flex gap-4">
          <button
            onClick={() => router.back()}
            disabled={loading}
            className="w-14 h-14 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button
            onClick={handleContinue}
            disabled={
              (isPernottamento && (!data.alloggio || !data.pacchetto_giorni)) ||
              (data.tipo_scelta === 'pass' && !data.tipo_pass) ||
              data.adulti < 1
            }
            className="flex-1 bg-primary text-white h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all hover:bg-primary/90"
          >
            <span>Continua ai Dati</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </footer>
    </>
  );
}
