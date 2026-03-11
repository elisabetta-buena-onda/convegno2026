'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminCamere() {
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    structureName: 'Euroitalia',
    tipo: '',
    capienza: 0,
    min_persone: 1,
    quantita: 0,
    posti_disponibili: 0,
    prezzo_adulto_3g: 200,
    prezzo_adulto_2g: 160,
    prezzo_bambino_3g: 170,
    prezzo_bambino_2g: 130
  });

  const [isAdding, setIsAdding] = useState(false);

  const fetchRooms = () => {
    setLoading(true);
    fetch('/api/availability')
      .then(res => res.json())
      .then(data => setAccommodations(data.accommodations || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleEdit = (room: any) => {
    setEditingId(room.id);
    setIsAdding(false);
    setFormData({
      id: room.id,
      structureName: room.structure.name,
      tipo: room.tipo,
      capienza: room.capienza ?? 0,
      min_persone: room.min_persone ?? 1,
      quantita: room.quantita ?? 0,
      posti_disponibili: room.inventory[0]?.posti_disponibili || 0,
      prezzo_adulto_3g: room.prezzo_adulto_3g ?? 200,
      prezzo_adulto_2g: room.prezzo_adulto_2g ?? 160,
      prezzo_bambino_3g: room.prezzo_bambino_3g ?? 170,
      prezzo_bambino_2g: room.prezzo_bambino_2g ?? 130
    });
  };

  const handleAddStart = (structureName: string) => {
    setIsAdding(true);
    setEditingId('new');
    setFormData({
      id: '',
      structureName: structureName,
      tipo: '',
      capienza: 2,
      min_persone: 1,
      quantita: 10,
      posti_disponibili: 10,
      prezzo_adulto_3g: 200,
      prezzo_adulto_2g: 160,
      prezzo_bambino_3g: 170,
      prezzo_bambino_2g: 130
    });
  };

  const updateNumericField = (field: string, value: string, isFloat = false) => {
    const parsed = isFloat ? parseFloat(value) : parseInt(value);
    setFormData(prev => ({
      ...prev,
      [field]: isNaN(parsed) ? 0 : parsed
    }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/admin/camere', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setEditingId(null);
        setIsAdding(false);
        fetchRooms();
      } else {
        alert("Errore durante il salvataggio");
      }
    } catch (e) {
      alert("Errore di connessione");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa camera?")) return;
    try {
      const res = await fetch(`/api/admin/camere?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchRooms();
      }
    } catch (e) {
      alert("Errore di connessione");
    }
  };

  const renderInput = (field: keyof typeof formData, label: string, isFloat = false, width = "w-16") => (
    <label className={`flex flex-col text-xs text-slate-500 font-bold`}>
      {label}
      <input 
        type="number" 
        min={field.startsWith('prezzo') ? "0" : "1"}
        step={isFloat ? "0.01" : "1"}
        className={`border p-2 rounded ${width} text-black mt-1`} 
        value={isNaN(formData[field] as any) ? '' : formData[field]} 
        onChange={e => updateNumericField(field, e.target.value, isFloat)} 
      />
    </label>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center bg-white border-b border-slate-200 p-4 gap-4 shadow-sm">
        <Link href="/admin/dashboard" className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
          <span className="material-symbols-outlined text-slate-700">arrow_back</span>
        </Link>
        <h1 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">Gestione Camere e Disponibilità</h1>
      </header>

      <main className="flex-1 p-4 pb-24 max-w-5xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center p-12"><span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span></div>
        ) : (
          <div className="grid gap-6">
            
            {['Euroitalia', 'B&B'].map(structure => (
              <div key={structure} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">apartment</span>
                    {structure}
                  </h2>
                  <button onClick={() => handleAddStart(structure)} className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold hover:bg-primary/90 transition-colors">
                    <span className="material-symbols-outlined text-[14px]">add</span> Aggiungi
                  </button>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {/* FORM AGGIUNTA / MODIFICA INLINE */}
                  {editingId === 'new' && formData.structureName === structure && (
                     <div className="p-4 bg-blue-50/50 flex flex-col md:flex-row gap-4">
                        <input type="text" placeholder="Nome Sistemazione (es. Singola)" className="border p-2 rounded w-full flex-1" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} />
                        <div className="flex gap-2">
                          {renderInput('capienza', 'Cap')}
                          {renderInput('min_persone', 'Min')}
                          {renderInput('quantita', 'Qtà')}
                          {renderInput('posti_disponibili', 'Disp')}
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
                          {renderInput('prezzo_adulto_3g', 'Adul. 3G €', true, 'w-full')}
                          {renderInput('prezzo_adulto_2g', 'Adul. 2G €', true, 'w-full')}
                          {renderInput('prezzo_bambino_3g', 'Bamb. 3G €', true, 'w-full')}
                          {renderInput('prezzo_bambino_2g', 'Bamb. 2G €', true, 'w-full')}
                        </div>
                        <div className="flex items-end gap-2 shrink-0">
                           <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm">Salva</button>
                           <button onClick={() => {setEditingId(null); setIsAdding(false);}} className="bg-slate-300 text-slate-800 px-4 py-2 rounded font-bold text-sm">Annulla</button>
                        </div>
                     </div>
                  )}

                  {accommodations.filter(a => a.structure.name === structure).map((room) => {
                    const inv = room.inventory[0];
                    const isEditingThis = editingId === room.id;

                    if (isEditingThis) {
                      return (
                        <div key={room.id} className="p-4 bg-orange-50/50 flex flex-col md:flex-row gap-4 border-l-4 border-orange-400">
                          <input type="text" className="border p-2 rounded w-full flex-1" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} />
                          <div className="flex gap-2">
                            {renderInput('capienza', 'Cap')}
                            {renderInput('min_persone', 'Min')}
                            {renderInput('quantita', 'Qtà')}
                            {renderInput('posti_disponibili', 'Disp')}
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
                            {renderInput('prezzo_adulto_3g', 'Adul. 3G €', true, 'w-full')}
                            {renderInput('prezzo_adulto_2g', 'Adul. 2G €', true, 'w-full')}
                            {renderInput('prezzo_bambino_3g', 'Bamb. 3G €', true, 'w-full')}
                            {renderInput('prezzo_bambino_2g', 'Bamb. 2G €', true, 'w-full')}
                          </div>
                          <div className="flex items-end gap-2 shrink-0">
                            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm">Salva</button>
                            <button onClick={() => setEditingId(null)} className="bg-slate-300 text-slate-800 px-4 py-2 rounded font-bold text-sm">Annulla</button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={room.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                        <div>
                          <p className="font-bold text-slate-900 capitalize text-lg">{room.tipo}</p>
                          <p className="text-sm text-slate-500 mt-1">Capienza: {room.capienza} pers. | Minimo: {room.min_persone || 1} pers. | Totale Camere: {room.quantita}</p>
                          <div className="flex gap-4 mt-2 text-[10px] uppercase font-bold text-slate-400">
                             <span>3G: Ad. €{room.prezzo_adulto_3g} / Ba. €{room.prezzo_bambino_3g}</span>
                             <span>2G: Ad. €{room.prezzo_adulto_2g} / Ba. €{room.prezzo_bambino_2g}</span>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                           <div className="flex flex-col items-center bg-slate-100 p-2 rounded-lg border border-slate-200">
                             <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">Disponibili</span>
                             <span className="font-black text-xl text-primary">{inv?.posti_disponibili || 0}</span>
                           </div>
                           
                           {inv?.posti_disponibili <= 0 && (
                             <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold">Esaurita</span>
                           )}

                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleEdit(room)} className="text-slate-400 hover:text-primary transition-colors p-2 bg-white border border-slate-200 shadow-sm rounded-lg" title="Modifica">
                               <span className="material-symbols-outlined text-sm">edit</span>
                             </button>
                             <button onClick={() => handleDelete(room.id)} className="text-slate-400 hover:text-red-600 transition-colors p-2 bg-white border border-slate-200 shadow-sm rounded-lg" title="Elimina">
                               <span className="material-symbols-outlined text-sm">delete</span>
                             </button>
                           </div>
                        </div>
                      </div>
                    );
                  })}

                  {accommodations.filter(a => a.structure.name === structure).length === 0 && editingId !== 'new' && (
                     <div className="p-8 text-center text-slate-500 text-sm">Nessuna camera registrata per questa struttura.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
