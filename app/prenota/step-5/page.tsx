'use client';

import { useRouter } from 'next/navigation';
import { useBooking } from '../BookingContext';
import { useEffect } from 'react';

export default function Step5() {
  const router = useRouter();
  const { data, resetData } = useBooking();

  useEffect(() => {
    if (data.totale === 0 && data.tipo_scelta === '') {
      router.push('/');
    }
  }, []);

  const handleFinish = () => {
    resetData();
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-500 pb-20">
      <div className="w-24 h-24 bg-green-100 text-green-700 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      </div>

      <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Ricevuta con successo</h2>
      <p className="text-slate-600 max-w-md mb-8 leading-relaxed">
        Grazie {data.nome}, abbiamo elaborato la tua richiesta.
        Ti abbiamo inviato un'email riepilogativa all'indirizzo <strong>{data.email}</strong>, assicurati di controllare anche la cartella spam.
      </p>

      {/* QR CODE PAGAMENTO */}
      {data.metodo_pagamento === 'qrcode' && (
        <div className="bg-white p-6 rounded-2xl w-full max-w-sm mb-6 border border-slate-200">
          <p className="text-lg font-bold text-slate-900 mb-4 text-center">Inquadra per pagare ora</p>
          <div className="w-48 h-48 bg-slate-50 mx-auto flex justify-center items-center rounded-xl mb-4 border border-dashed border-slate-300">
            <span className="material-symbols-outlined text-5xl text-slate-300">qr_code_2</span>
          </div>
          <p className="text-xs text-slate-500 text-center leading-relaxed">Se non riesci ad inquadrare dal telefono, <a href="#" className="text-primary font-bold underline">clicca qui per il link diretto</a> al checkout (PayPal, PostePay, Satispay).</p>
        </div>
      )}

      {data.metodo_pagamento === 'bonifico' && (
        <div className="bg-white p-6 rounded-2xl w-full max-w-sm mb-6 border border-slate-200 text-left">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Dati Bonifico</p>
          <p className="text-slate-900 text-sm font-bold mb-1">IBAN: IT26 I360 8105 1382 1993 9719 944
          </p>
          <p className="text-slate-600 text-sm mb-3">Intestato a: VitoMauro Toma Provenzano</p>
          <p className="text-slate-500 text-xs italic">Causale: nome cognome e N° Pass. <br /> Una volta effettuato il pagamento, inviare la conferma/contabile del versamento.</p>
        </div>
      )}

      <div className="bg-slate-50 p-6 rounded-2xl w-full max-w-sm mb-8 border border-slate-200">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Da Saldare</p>
        <p className="text-3xl font-black text-primary">€ {data.totale.toFixed(2)}</p>
      </div>

      <button
        onClick={handleFinish}
        className="bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <span>Torna alla Home</span>
        <span className="material-symbols-outlined">home</span>
      </button>
    </div>
  );
}
