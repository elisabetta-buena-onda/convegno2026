import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background-light font-display">

      <nav className="sticky top-0 z-50 bg-white backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo_CNP.jpg" alt="Logo CNP" className="h-10 w-auto" />
            <h2 className="text-primary text-lg font-bold tracking-tight">Comunità Nuova Pentecoste</h2>
          </div>
          <Link href="/admin/login" className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            Admin
          </Link>
        </div>
      </nav>

      <header
        className="relative flex items-end pb-12 md:pb-24 px-4 overflow-hidden bg-primary bg-cover bg-[position:70%_center] md:bg-center bg-no-repeat h-[60vh] md:h-[500px]"
        style={{ backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%), url('/fondale_convegno2026.jpeg')" }}
      >
        <div className="max-w-4xl mx-auto w-full relative z-10">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight drop-shadow-xl text-balance">
              31° CONVEGNO <br className="hidden md:block" />
              NAZIONALE <span className="text-white/80 font-bold">CNP</span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/prenota" className="bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95 hover:shadow-xl">
                <span>Prenota il tuo posto!</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-primary text-3xl font-bold tracking-tight mb-2">Opzioni Disponibili</h2>
            <p className="text-slate-500">I pacchetti acquistabili tramite questa piattaforma.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="group flex flex-col bg-slate-50 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-200">
              <div className="p-8 flex flex-col h-full bg-white">
                <span className="material-symbols-outlined text-4xl text-primary mb-4">hotel</span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Pacchetti Pernottamento</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  Soluzioni inclusive da 2 o 3 giorni in struttura convenzionata, complete di pass e pasti.
                </p>
                <div className="text-primary font-black text-2xl">da € 10 <span className="text-sm text-slate-400 font-normal">/adulto</span></div>
              </div>
            </div>

            <div className="group flex flex-col bg-slate-50 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-200">
              <div className="p-8 flex flex-col h-full bg-white">
                <span className="material-symbols-outlined text-4xl text-primary mb-4">local_activity</span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Solo Pass Evento</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  Ideale se hai già trovato un alloggio. Accesso completo a tutte le sessioni dei tre giorni.
                </p>
                <div className="text-primary font-black text-2xl">€ 15 <span className="text-sm text-slate-400 font-normal">/adulto</span></div>
              </div>
            </div>

            <div className="group flex flex-col bg-slate-50 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-200">
              <div className="p-8 flex flex-col h-full bg-white">
                <span className="material-symbols-outlined text-4xl text-primary mb-4">restaurant</span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Pasti Pendolari</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  Seleziona i pasti principali se intendi partecipare alle sessioni in giornata.
                </p>
                <div className="text-primary font-black text-2xl">€ 5 <span className="text-sm text-slate-400 font-normal">/pasto</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-200 py-8 text-center text-slate-400 text-sm bg-white">
        © Comunità Nuova Pentecoste. Tutti i diritti riservati.
      </footer>
    </div>
  );
}
