'use client';

import { useRouter } from 'next/navigation';
import { useBooking } from '../BookingContext';
import { useEffect, useState } from 'react';

export default function Step2() {
  const router = useRouter();
  const { data, updateData } = useBooking();
  const [loading, setLoading] = useState(false);
  const [accommodations, setAccommodations] = useState<any[]>([]);

  const isPernotto = data.tipo_scelta === 'Pernotto';

  useEffect(() => {
    if (!data.tipo_scelta) {
      router.push('/prenota/step-1');
      return;
    }

    if (isPernotto) {
      setLoading(true);
      fetch('/api/availability')
        .then(res => res.json())
        .then(apiData => {
          setAccommodations(apiData.accommodations || []);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const totalPersone = data.adulti + data.bambini;

  // capacity validation
  const getTotalCapacity = () => {
    return data.camere.reduce((acc, curr) => {
      const room = accommodations.find(a => a.tipo === curr.tipo && a.structure.name === data.struttura);
      return acc + (room ? room.capienza * curr.quantita : 0);
    }, 0);
  };

  const totalCapacity = getTotalCapacity();
  const isCapacityValid = totalCapacity >= totalPersone;

  const handleContinue = () => {
    if (isPernotto && (data.camere.length === 0 || !data.pacchetto_giorni)) return;
    if (isPernotto && !isCapacityValid) return;
    if (data.tipo_scelta === 'pass' && !data.tipo_pass) return;
    if (data.tipo_scelta === 'pasti' && !data.pranzo_scelto && !data.cena_scelta) return;
    if (data.adulti < 1) return;
    router.push('/prenota/step-3');
  };

  const getFilteredRooms = () => {
    return accommodations.filter(a => a.structure.name === (data.struttura || 'Euroitalia'));
  };

  const updateRoomQuantity = (tipo: string, delta: number) => {
    const existingIndex = data.camere.findIndex(c => c.tipo === tipo);
    let newCamere = [...data.camere];

    if (existingIndex >= 0) {
      const newQuantity = newCamere[existingIndex].quantita + delta;
      if (newQuantity <= 0) {
        newCamere.splice(existingIndex, 1);
      } else {
        newCamere[existingIndex].quantita = newQuantity;
      }
    } else if (delta > 0) {
      newCamere.push({ tipo, quantita: delta });
    }

    updateData({ camere: newCamere });
  };

  const getRoomQuantity = (tipo: string) => {
    const room = data.camere.find(c => c.tipo === tipo);
    return room ? room.quantita : 0;
  };

  const getRoomPriceLabel = (roomTipo: string) => {
    if (!data.pacchetto_giorni) return '';
    const room = accommodations.find(a => a.tipo === roomTipo);
    if (!room) return '';

    const is3Days = data.pacchetto_giorni === '3_giorni';
    let basePrice = is3Days ? room.prezzo_adulto_3g : room.prezzo_adulto_2g;

    // Supplement logic: if only 1 person total, add 30
    if (totalPersone === 1) {
      basePrice += 30;
    }

    if (basePrice == null) return '';
    return `€${Number(basePrice).toFixed(2)} a persona`;
  };

  const hasEuroitaliaAvailability = accommodations
    .filter(a => a.structure.name === 'Euroitalia')
    .some(a => (a.inventory[0]?.posti_disponibili || 0) > 0);

  return (
    <>
      <section className="mb-24 p-6 rounded-xl bg-white border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">2</span>
          <h3 className="text-lg font-bold text-slate-900">Configurazione {data.tipo_scelta === 'Pernotto' && 'Pacchetto'}{data.tipo_scelta === 'pass' && 'Pass'}{data.tipo_scelta === 'pasti' && 'Pasti'}</h3>
        </div>

        <div className="space-y-8">

          {/* DURATA PER Pernotto */}
          {isPernotto && (
            <div>
              <label className="text-sm font-bold text-slate-700 mb-3 block italic uppercase tracking-wider">Seleziona Durata Pacchetto</label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div onClick={() => updateData({ pacchetto_giorni: '3_giorni' })} className={`p-4 border-2 rounded-xl cursor-pointer transition-colors relative ${data.pacchetto_giorni === '3_giorni' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="font-bold block text-slate-900">3 Giorni</span>
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

          {/* PERSONE */}
          <div>
            <label className="text-sm font-bold text-slate-700 mb-3 block italic uppercase tracking-wider">seleziona Numero Persone</label>
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

          {/* SELEZIONE PASTI */}
          {data.tipo_scelta === 'pasti' && (
            <div className="pt-4 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-700 mb-3 block italic uppercase tracking-wider">Seleziona Opzioni Pasti</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all relative flex items-center gap-4 ${data.pranzo_scelto ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-[#1a355b]/30 text-[#1a355b] focus:ring-[#1a355b] cursor-pointer"
                    checked={data.pranzo_scelto}
                    onChange={() => updateData({ pranzo_scelto: !data.pranzo_scelto })}
                  />
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">restaurant</span>
                    <div>
                      <span className="font-bold block text-slate-900">Pranzo</span>
                      <span className="text-xs text-slate-500 block">€ 20,00 a persona</span>
                    </div>
                  </div>
                </label>
                <label
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all relative flex items-center gap-4 ${data.cena_scelta ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-[#1a355b]/30 text-[#1a355b] focus:ring-[#1a355b] cursor-pointer"
                    checked={data.cena_scelta}
                    onChange={() => updateData({ cena_scelta: !data.cena_scelta })}
                  />
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">dinner_dining</span>
                    <div>
                      <span className="font-bold block text-slate-900">Cena</span>
                      <span className="text-xs text-slate-500 block">€ 20,00 a persona</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Pernotto: CAMERE E STRUTTURA */}
          {isPernotto && (
            <div className="pt-4 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-700 mb-3 block italic uppercase tracking-wider">Seleziona Struttura</label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <label className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-colors ${data.struttura === 'Euroitalia' || !data.struttura ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <input type="radio" className="sr-only" checked={data.struttura === 'Euroitalia' || !data.struttura} onChange={() => updateData({ struttura: 'Euroitalia', camere: [] })} />
                  <span className="text-sm font-bold text-slate-900">Euroitalia</span>
                  <span className="text-xs text-slate-500 mt-1">Sede Principale</span>
                  {(data.struttura === 'Euroitalia' || !data.struttura) && <span className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm">radio_button_checked</span>}
                </label>

                {(!hasEuroitaliaAvailability || data.struttura === 'B&B') && (
                  <label className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-colors ${data.struttura === 'B&B' ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <input type="radio" className="sr-only" checked={data.struttura === 'B&B'} onChange={() => updateData({ struttura: 'B&B', camere: [] })} />
                    <span className="text-sm font-bold text-slate-900">B&amp;B</span>
                    <span className="text-xs text-slate-500 mt-1">Convenzionate</span>
                    {data.struttura === 'B&B' && <span className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm">radio_button_checked</span>}
                  </label>
                )}
              </div>

              {loading ? (
                <div className="text-center p-4 text-slate-500">Caricamento disponibilità camere...</div>
              ) : (
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-3 block italic uppercase tracking-wider">seleziona Tipologia Sistemazione</label>
                  {!data.pacchetto_giorni && <p className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-lg">Scegli prima la durata del pacchetto in alto per vedere i prezzi.</p>}

                  <div className="grid gap-3 mb-4">
                    {getFilteredRooms().map(room => {
                      const postiDisponibili = room.inventory[0]?.posti_disponibili || 0;
                      const isAvailable = postiDisponibili > 0;
                      const quantita = getRoomQuantity(room.tipo);

                      // Constraint: guests >= min_persone
                      const isOccupancyValid = totalPersone >= (room.min_persone || 1);
                      const isDisabled = !isOccupancyValid || (!isAvailable && quantita === 0);

                      return (
                        <div key={room.id} className={`relative flex items-center justify-between p-4 border-2 rounded-xl transition-all
                          ${isDisabled ? 'opacity-50 bg-slate-50 border-slate-200 grayscale' :
                            quantita > 0 ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>

                          <div className="flex-1">
                            <span className="text-md font-bold text-slate-900 capitalize block mb-1">{room.tipo}</span>
                            <div className="flex flex-wrap gap-2 items-center mb-1">
                              <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter">Capienza: {room.capienza} pers.</span>
                              <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter">{postiDisponibili} disponibili</span>
                              {!isOccupancyValid && (
                                <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">group_off</span> Minimo {room.min_persone || 1} persone
                                </span>
                              )}
                            </div>
                            {isAvailable && getRoomPriceLabel(room.tipo) && (
                              <p className="text-sm font-black text-primary mt-1">{getRoomPriceLabel(room.tipo)} <span className="text-xs text-slate-500 font-normal">({data.pacchetto_giorni.replace('_', ' ')})</span></p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            <button
                              disabled={quantita <= 0 || !data.pacchetto_giorni}
                              onClick={() => updateRoomQuantity(room.tipo, -1)}
                              className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary"
                            >
                              <span className="material-symbols-outlined text-base">remove</span>
                            </button>
                            <span className="text-base font-bold w-4 text-center text-slate-900">{quantita}</span>
                            <button
                              disabled={!isOccupancyValid || quantita >= postiDisponibili || !data.pacchetto_giorni}
                              onClick={() => updateRoomQuantity(room.tipo, 1)}
                              className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary"
                            >
                              <span className="material-symbols-outlined text-base">add</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {data.camere.length > 0 && !isCapacityValid && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium flex gap-2">
                      <span className="material-symbols-outlined">error</span>
                      <span>Le camere selezionate (capienza totale: {totalCapacity}) non sono sufficienti per ospitare tutte le persone indicate ({totalPersone}).</span>
                    </div>
                  )}
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
            className="w-14 h-14 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button
            onClick={handleContinue}
            disabled={
              (isPernotto && (data.camere.length === 0 || !data.pacchetto_giorni || !isCapacityValid)) ||
              (data.tipo_scelta === 'pass' && !data.tipo_pass) ||
              (data.tipo_scelta === 'pasti' && !data.pranzo_scelto && !data.cena_scelta) ||
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
