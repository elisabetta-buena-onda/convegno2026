'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPrenotazioni() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [accommodations, setAccommodations] = useState<any[]>([]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/prenotazioni');
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (e) {
      alert("Errore nel caricamento delle prenotazioni");
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/availability');
      const data = await res.json();
      setAccommodations(data.accommodations || []);
    } catch (e) { }
  };

  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di questa eliminazione?")) return;
    try {
      const res = await fetch(`/api/admin/prenotazioni?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchBookings();
    } catch (e) {
      alert("Errore di connessione");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/prenotazioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBooking)
      });
      if (res.ok) {
        setEditingBooking(null);
        fetchBookings();
      } else {
        const d = await res.json();
        alert("Errore: " + (d.error || "Salvataggio fallito"));
      }
    } catch (e) {
      alert("Errore di connessione");
    }
  };

  const startNew = () => {
    setEditingBooking({
      nome: '',
      email: '',
      telefono: '',
      tipo_prenotazione: 'Pernotto_3_giorni',
      struttura: 'Euroitalia',
      camere: [],
      adulti: 1,
      bambini: 0,
      pranzi: 0,
      cene: 0,
      totale: 0,
      stato: 'CONFERMATA',
      participants: []
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center bg-white border-b border-slate-200 p-4 gap-4 shadow-sm">
        <Link href="/admin/dashboard" className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
          <span className="material-symbols-outlined text-slate-700">arrow_back</span>
        </Link>
        <h1 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">Gestione Prenotazioni</h1>
      </header>

      <main className="flex-1 p-4 pb-24 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="font-bold text-slate-800 text-sm md:text-base">Elenco Prenotazioni ({bookings.length})</h2>
            <div className="flex gap-2">
              <button onClick={startNew} className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-primary/90 transition-colors">
                <span className="material-symbols-outlined text-sm">add</span> Nuova
              </button>
              <a href="/api/admin/export" className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-900 transition-colors">
                <span className="material-symbols-outlined text-sm">download</span> Export
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500 uppercase">
                  <th className="px-4 py-3 font-bold">Data / ID</th>
                  <th className="px-4 py-3 font-bold">Referente</th>
                  <th className="px-4 py-3 font-bold">Pacchetto</th>
                  <th className="px-4 py-3 font-bold">Persone</th>
                  <th className="px-4 py-3 font-bold">Totale</th>
                  <th className="px-4 py-3 font-bold">Stato</th>
                  <th className="px-4 py-3 font-bold text-right text-xs">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-500"><span className="material-symbols-outlined animate-spin mr-2 align-middle">sync</span>Caricamento...</td></tr>
                ) : bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-4 align-top">
                      <p className="text-xs font-medium text-slate-900">{new Date(b.timestamp).toLocaleDateString()} {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {b.id.split('-')[0]}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-sm font-bold text-slate-900">{b.nome}</p>
                      <p className="text-xs text-slate-500">{b.email}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">phone</span> {b.telefono}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block border ${b.tipo_prenotazione.startsWith('Pernotto') ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {b.tipo_prenotazione.toUpperCase().replace('_', ' ')}
                      </span>
                      {b.struttura && (
                        <div className="mt-2 text-xs">
                          <p className="font-bold text-slate-700">{b.struttura}</p>
                          {b.camere?.map((c: any, idx: number) => (
                            <p key={idx} className="text-slate-500 capitalize">{c.quantita}x {c.accommodation_type || c.tipo}</p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-xs font-bold text-slate-700">{b.adulti} AD + {b.bambini} BA</p>
                      <p className="text-[10px] text-slate-400 mt-1">Pasti: {b.pranzi || 0}P / {b.cene || 0}C</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-sm font-black text-slate-900">€ {b.totale.toFixed(2)}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${b.stato === 'CONFERMATA' ? 'bg-green-100 text-green-700' :
                          b.stato === 'CANCELLATA' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                        {b.stato}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingBooking(b)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => handleDelete(b.id)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL EDIT / CREATE */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto anima-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex justify-between items-center z-10">
              <h3 className="font-black text-slate-900">
                {editingBooking.id ? 'Modifica Prenotazione' : 'Nuova Prenotazione Manuale'}
              </h3>
              <button onClick={() => setEditingBooking(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Referente</label>
                  <input required type="text" className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors" value={editingBooking.nome} onChange={e => setEditingBooking({ ...editingBooking, nome: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email</label>
                  <input required type="email" className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors" value={editingBooking.email} onChange={e => setEditingBooking({ ...editingBooking, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Telefono</label>
                  <input required type="text" className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors" value={editingBooking.telefono} onChange={e => setEditingBooking({ ...editingBooking, telefono: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Stato</label>
                  <select className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors" value={editingBooking.stato} onChange={e => setEditingBooking({ ...editingBooking, stato: e.target.value })}>
                    <option value="IN_ATTESA">IN_ATTESA</option>
                    <option value="CONFERMATA">CONFERMATA</option>
                    <option value="CANCELLATA">CANCELLATA</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo Prenotazione</label>
                    <select className="w-full border border-slate-200 rounded-lg p-2 text-xs" value={editingBooking.tipo_prenotazione} onChange={e => setEditingBooking({ ...editingBooking, tipo_prenotazione: e.target.value })}>
                      <option value="Pernotto_3_giorni">Pernot. 3 Giorni</option>
                      <option value="Pernotto_2_giorni">Pernot. 2 Giorni</option>
                      <option value="pass_3_giorni">Pass 3 Giorni</option>
                      <option value="pass_1_giorno">Pass 1 Giorno</option>
                      <option value="pasti">Solo Pasti</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Struttura</label>
                    <select className="w-full border border-slate-200 rounded-lg p-2 text-xs" value={editingBooking.struttura || ''} onChange={e => setEditingBooking({ ...editingBooking, struttura: e.target.value || null })}>
                      <option value="">Nessuna (Pass/Pasti)</option>
                      <option value="Euroitalia">Euroitalia</option>
                      <option value="B&B">B&amp;B</option>
                    </select>
                  </div>
                </div>

                {editingBooking.struttura && (
                  <div className="space-y-2 mt-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Camere Assegnate</label>
                    
                    {accommodations.filter(a => a.structure.name === editingBooking.struttura).map(room => {
                      const existingRoomIndex = editingBooking.camere?.findIndex((c: any) => (c.tipo || c.accommodation_type) === room.tipo);
                      const quantita = existingRoomIndex >= 0 ? editingBooking.camere[existingRoomIndex].quantita : 0;
                      
                      const updateQty = (delta: number) => {
                        let newCamere = [...(editingBooking.camere || [])];
                        if (existingRoomIndex >= 0) {
                          const newQ = newCamere[existingRoomIndex].quantita + delta;
                          if (newQ <= 0) newCamere.splice(existingRoomIndex, 1);
                          else newCamere[existingRoomIndex].quantita = newQ;
                        } else if (delta > 0) {
                          newCamere.push({ accommodation_type: room.tipo, quantita: delta });
                        }
                        setEditingBooking({ ...editingBooking, camere: newCamere });
                      };

                      return (
                        <div key={room.id} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0 last:pb-0">
                           <span className="text-xs font-bold text-slate-700 capitalize w-1/2 truncate">{room.tipo}</span>
                           <div className="flex items-center gap-2">
                             <button type="button" disabled={quantita <= 0} onClick={() => updateQty(-1)} className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center disabled:opacity-30"><span className="material-symbols-outlined text-xs">remove</span></button>
                             <span className="text-xs font-bold w-4 text-center">{quantita}</span>
                             <button type="button" onClick={() => updateQty(1)} className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><span className="material-symbols-outlined text-xs">add</span></button>
                           </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2">
                  <label className="flex flex-col text-[8px] font-black uppercase text-slate-400">Adulti <input type="number" className="border p-2 rounded text-xs" value={editingBooking.adulti} onChange={e => setEditingBooking({ ...editingBooking, adulti: parseInt(e.target.value) })} /></label>
                  <label className="flex flex-col text-[8px] font-black uppercase text-slate-400">Bambini <input type="number" className="border p-2 rounded text-xs" value={editingBooking.bambini} onChange={e => setEditingBooking({ ...editingBooking, bambini: parseInt(e.target.value) })} /></label>
                  <label className="flex flex-col text-[8px] font-black uppercase text-slate-400">Pranzi <input type="number" className="border p-2 rounded text-xs" value={editingBooking.pranzi} onChange={e => setEditingBooking({ ...editingBooking, pranzi: parseInt(e.target.value) })} /></label>
                  <label className="flex flex-col text-[8px] font-black uppercase text-slate-400">Cene <input type="number" className="border p-2 rounded text-xs" value={editingBooking.cene} onChange={e => setEditingBooking({ ...editingBooking, cene: parseInt(e.target.value) })} /></label>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <label className="text-[10px] font-bold text-primary uppercase">Totale Euro</label>
                  <input step="0.01" type="number" className="w-full border-2 border-primary/20 rounded-xl p-3 text-lg font-black text-primary outline-none focus:border-primary transition-colors" value={editingBooking.totale} onChange={e => setEditingBooking({ ...editingBooking, totale: parseFloat(e.target.value) })} />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setEditingBooking(null)} className="flex-1 h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors">Annulla</button>
                <button type="submit" className="flex-[2] h-12 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all">Salva Prenotazione</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
