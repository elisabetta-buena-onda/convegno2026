'use client';

import { useRouter } from 'next/navigation';
import { useBooking } from '../BookingContext';
import { useEffect, useState } from 'react';

export default function Step4() {
  const router = useRouter();
  const { data, updateData } = useBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingRoom, setFetchingRoom] = useState(true);
  const [prices, setPrices] = useState<any>(null);

  useEffect(() => {
    if (!data.tipo_scelta || !data.nome) {
      router.push('/prenota/step-1');
    }

    setFetchingRoom(true);
    fetch('/api/availability')
      .then(res => res.json())
      .then(apiData => {
        setPrices(apiData);
      })
      .finally(() => setFetchingRoom(false));
  }, []);

  const totalPersone = data.adulti + data.bambini;

  // -- CACLULATION ALGORITHM 
  let total = 0;
  let breakdown: any[] = [];

  if (!fetchingRoom && prices) {
    if (data.tipo_scelta === 'Pernotto') {
      const is3Days = data.pacchetto_giorni === '3_giorni';
      const mainRoom = prices.accommodations?.find((a: any) => a.tipo === data.camere[0]?.tipo && a.structure.name === data.struttura);

      if (mainRoom) {
        const adultPrice = is3Days ? mainRoom.prezzo_adulto_3g : mainRoom.prezzo_adulto_2g;
        const childPrice = is3Days ? mainRoom.prezzo_bambino_3g : mainRoom.prezzo_bambino_2g;

        const adultsTotal = data.adulti * adultPrice;
        const childrenTotal = data.bambini * (childPrice || 0);
        total = adultsTotal + childrenTotal;

        breakdown.push({ label: `${data.adulti} x Adulto`, val: `€ ${adultsTotal.toFixed(2)}` });
        if (data.bambini > 0) {
          breakdown.push({ label: `${data.bambini} x Bambino`, val: `€ ${childrenTotal.toFixed(2)}` });
        }

        const numRooms = data.camere.reduce((acc, c) => acc + c.quantita, 0);
        const numSingles = Math.max(0, 2 * numRooms - totalPersone);
        if (numSingles > 0) {
          const suppTotal = numSingles * 30;
          total += suppTotal;
          breakdown.push({ label: `Supplemento Singola (${numSingles})`, val: `€ ${suppTotal.toFixed(2)}` });
        }
      }
    }
    else if (data.tipo_scelta === 'pass') {
      const passConfig = prices.passPrices?.find((p: any) => p.tipo === data.tipo_pass);
      const adultPrice = passConfig ? passConfig.prezzo : (data.tipo_pass === '3_giorni' ? 15 : 5);

      total = data.adulti * adultPrice;

      breakdown.push({ label: `${data.adulti} x Pass Adulto`, val: `€ ${(data.adulti * adultPrice).toFixed(2)}` });
      if (data.bambini > 0) {
        breakdown.push({ label: `${data.bambini} x Pass Bambino`, val: 'Gratis' });
      }
    }
    else if (data.tipo_scelta === 'pasti') {
      const pConfig = prices.mealOptions?.find((m: any) => m.tipo === 'pranzo');
      const pPrice = pConfig ? pConfig.prezzo : 20;

      const numPasti = data.pranzi || 0;
      total = numPasti * pPrice;

      if (numPasti > 0) breakdown.push({ label: `${numPasti} x Pasto`, val: `€ ${total.toFixed(2)}` });
    }
  }

  const handleConfirm = async () => {
    if (!data.metodo_pagamento) {
      setError('Seleziona un metodo di pagamento prima di continuare.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const numPersone = data.adulti + data.bambini;
      const bookingData = {
        ...data,
        totale: total,
        pranzi: data.tipo_scelta === 'pasti' ? data.pranzi : data.pranzi,
        cene: data.tipo_scelta === 'pasti' ? 0 : data.cene,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const responseData = await res.json();

      if (res.ok) {
        updateData({ totale: total });
        router.push('/prenota/step-5');
      } else {
        setError(responseData.error || 'Errore durante la prenotazione. Riprova.');
      }
    } catch (err) {
      setError('Errore di connessione col server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="mb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 mb-6">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">4</span>
          <h3 className="text-lg font-bold text-slate-900">Riepilogo e Pagamento</h3>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2 shadow-sm animate-in shake">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Dettagli Scelta</h4>
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-slate-900 text-lg">{data.tipo_scelta.toUpperCase()}</span>
            </div>
            {data.tipo_scelta === 'Pernotto' && (
              <div className="text-sm text-slate-600 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block mb-1">Struttura: <span className="font-bold text-slate-900">{data.struttura}</span></span>
                <span className="block mb-1">Camere: </span>
                <ul className="list-disc pl-5 mb-1 text-slate-900 font-semibold capitalize">
                  {data.camere.map((c, i) => (
                    <li key={i}>{c.quantita}x {c.tipo}</li>
                  ))}
                </ul>
                <span className="block text-xs text-slate-500 mt-2 italic">Il pass evento e i pasti sono compresi nel prezzo del pacchetto.</span>
              </div>
            )}
            {data.tipo_scelta === 'pass' && (
              <div className="text-sm text-slate-600 mt-2">
                Tipologia: <span className="font-bold text-slate-900 capitalize">{data.tipo_pass.replace('_', ' ')}</span>
              </div>
            )}
          </div>

          <div className="p-6 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Partecipanti</h4>
            <ul className="space-y-2">
              {data.participants.map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${p.tipo === 'ADULTO' ? 'bg-primary' : 'bg-success'}`}></span>
                  <span className="font-bold text-slate-900">{p.nome}</span>
                  <span className="text-slate-400 text-xs italic">({p.tipo.toLowerCase()})</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Riepilogo Costi</h4>
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center mb-2">
                <span className="text-slate-600 font-medium">{item.label}</span>
                <span className="font-bold text-slate-900">{item.val}</span>
              </div>
            ))}
          </div>

          <div className="p-6 bg-slate-50">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-slate-900">Totale Da Pagare</span>
              <span className="text-3xl font-black text-primary">€ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* METODO PAGAMENTO E ALERT INFORMATICO */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Metodo di Pagamento</h4>
          <div className="grid gap-3">
            <label className={`relative flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${data.metodo_pagamento === 'bonifico' ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <div className="pt-0.5">
                <input type="radio" className="sr-only" checked={data.metodo_pagamento === 'bonifico'} onChange={() => updateData({ metodo_pagamento: 'bonifico' })} />
                {data.metodo_pagamento === 'bonifico' ? (
                  <span className="material-symbols-outlined text-primary">radio_button_checked</span>
                ) : (
                  <span className="material-symbols-outlined text-slate-300">radio_button_unchecked</span>
                )}
              </div>
              <div className="flex-1">
                <span className="font-bold text-slate-900 block flex items-center gap-2">Bonifico Bancario <span className="material-symbols-outlined text-slate-400 text-lg">account_balance</span></span>
                {data.metodo_pagamento === 'bonifico' && (
                  <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 ">
                    <strong>IBAN:</strong> IT26 I360 8105 1382 1993 9719 944
                    <br />
                    <strong>Intestato a:</strong> VitoMauro Toma Provenzano<br />
                    <strong>Causale:</strong> nome cognome e N° Pass.  <br />
                    <br />Una volta effettuato il pagamento, inviare la conferma/contabile del versamento.
                  </div>
                )}
              </div>
            </label>

            <label className={`relative flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${data.metodo_pagamento === 'qrcode' ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <div className="pt-0.5">
                <input type="radio" className="sr-only" checked={data.metodo_pagamento === 'qrcode'} onChange={() => updateData({ metodo_pagamento: 'qrcode' })} />
                {data.metodo_pagamento === 'qrcode' ? (
                  <span className="material-symbols-outlined text-primary">radio_button_checked</span>
                ) : (
                  <span className="material-symbols-outlined text-slate-300">radio_button_unchecked</span>
                )}
              </div>
              <div className="flex-1">
                <span className="font-bold text-slate-900 block flex items-center gap-2">Ricarica PostePay <span className="material-symbols-outlined text-slate-400 text-lg">credit_card</span></span>
                {data.metodo_pagamento === 'qrcode' && (
                  <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
                    Potrai effetturare una ricarica PostePay sia dall' app che in un punto vendita abilitato.
                    <br />
                    <br /><strong>Numero Carta:</strong> 5333 1712 1088 0684
                    <br /><strong>Intestatario:</strong> Toma Provenzano Vitomauro
                    <br /><br />Una volta effettuato il pagamento, inviare la conferma/contabile del versamento.
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex gap-3">
          <span className="material-symbols-outlined text-orange-600 mt-0.5">warning</span>
          <p className="text-sm font-medium text-orange-900 leading-relaxed">
            <strong>ATTENZIONE!</strong><br /> Se l'importo non verrà saldato entro le 1h dalla conferma, la prenotazione sarà annullata in automatico. <br />In caso di problemi contattaci al numero <strong>+39 379 220 6306</strong> oppure via mail all'indirizzo <strong>comunitanuovapentecostecasaran@gmail.com</strong>
          </p>
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
            onClick={handleConfirm}
            disabled={loading || fetchingRoom || !data.metodo_pagamento}
            className="flex-1 bg-primary text-white h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-95 disabled:opacity-70 transition-all hover:bg-primary/90"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                <span>Elaborazione...</span>
              </>
            ) : (
              <>
                <span>Conferma Ordine</span>
                <span className="material-symbols-outlined">check_circle</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </>
  );
}
