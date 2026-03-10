import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const booking = await prisma.$transaction(async (tx) => {
      const needsAccommodation = data.tipo_scelta === 'Pernotto';

      if (needsAccommodation) {
        if (!data.camere || data.camere.length === 0) {
          throw new Error('Nessuna camera selezionata.');
        }

        // Loop and validate/decrement all selected rooms
        for (const camera of data.camere) {
          const inventory = await tx.accommodationInventory.findFirst({
            where: {
              accommodation_type: {
                tipo: camera.tipo,
                structure: { name: data.struttura }
              }
            }
          });

          if (!inventory || inventory.posti_disponibili < camera.quantita) {
            throw new Error(`La camera ${camera.tipo} non ha sufficiente disponibilità.`);
          }

          // Decrement availability
          await tx.accommodationInventory.update({
            where: { id: inventory.id },
            data: { posti_disponibili: { decrement: camera.quantita } }
          });
        }
      }

      // Encode booking detail
      let resolvedPrenotazione = data.tipo_scelta;
      if (data.tipo_scelta === 'Pernotto') resolvedPrenotazione += `_${data.pacchetto_giorni}`;
      if (data.tipo_scelta === 'pass') resolvedPrenotazione += `_${data.tipo_pass}`;

      // Create the booking
      const newBooking = await tx.booking.create({
        data: {
          nome: data.nome,
          email: data.email,
          telefono: data.telefono,
          tipo_prenotazione: resolvedPrenotazione,
          struttura: needsAccommodation ? data.struttura : null,
          adulti: data.adulti,
          bambini: data.bambini,
          pranzi: data.pranzi || 0,
          cene: data.cene || 0,
          metodo_pagamento: data.metodo_pagamento,
          totale: data.totale,
          stato: 'IN_ATTESA',
          participants: {
            create: data.participants.map((p: any) => ({
              nome: p.nome,
              tipo: p.tipo
            }))
          },
          camere: needsAccommodation ? {
            create: data.camere.map((c: any) => ({
              accommodation_type: c.tipo,
              quantita: c.quantita
            }))
          } : undefined
        }
      });

      return newBooking;
    });

    // Mock Email sending
    console.log(`
      [MOCK EMAIL PRENOTAZIONE # ${booking.id}]
      A: ${booking.nome} <${booking.email}>
      Oggetto: Conferma Prenotazione Convegno Famiglia
      
      Ciao ${booking.nome},
      Grazie per aver effettuato la prenotazione per il convegno. 
      Ecco il riepilogo:
      Identificativo Ordine: ${booking.id}
      Importo Totale: Euro ${booking.totale.toFixed(2)}
      Metodo Scelto: ${booking.metodo_pagamento?.toUpperCase() || ''}

      * ALERT INFORMATICO IMPORTANTE: *
      Se l'importo non verrà saldato entro 24h questa prenotazione sarà annullata automaticamente.
      Per assistenza: +39 3434546643542.
      
      Grazie, il Team
    `);

    return NextResponse.json({ success: true, booking });

  } catch (error: any) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 });
  }
}
