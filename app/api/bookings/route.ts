import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

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

    // Send actual email using the utility
    try {
      await sendEmail({
        to: booking.email,
        subject: 'Conferma Prenotazione - 31°Convocazione Nazionale',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #1a355b;">Conferma Prenotazione</h2>
            <p>Ciao <strong>${booking.nome}</strong>,</p>
            <p>Grazie per aver effettuato la prenotazione per il convegno.</p>
            <div style="background-color: #f6f7f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Identificativo Ordine:</strong> ${booking.id}</p>
              <p><strong>Importo Totale:</strong> € ${booking.totale.toFixed(2)}</p>
              <p><strong>Metodo di Pagamento:</strong> ${booking.metodo_pagamento?.toUpperCase() || ''}</p>
            </div>
            ${booking.metodo_pagamento === 'bonifico' ? `
              <div style="border-left: 4px solid #1a355b; padding-left: 15px; margin: 20px 0;">
                <p><strong>Coordinate per il Bonifico:</strong></p>
                <p>IBAN: IT89 0123 4567 8901 2345 6789 012<br>
                Intestato a: Associazione Buena Onda</p>
              </div>
            ` : ''}
            ${booking.metodo_pagamento === 'qrcode' ? `
              <div style="border-left: 4px solid #1a355b; padding-left: 15px; margin: 20px 0;">
                <p><strong>Coordinate per PostePay:</strong></p>
                <p>Numero Carta: 4023 6004 1234 5678<br>
                Codice Fiscale: GNN LBT 79L68 L219F</p>
              </div>
            ` : ''}
            <p style="color: #d9534f; font-weight: bold;">
              ATTENZIONE: Se l'importo non verrà saldato entro 24h, la prenotazione sarà annullata automaticamente.
            </p>
            <p>Per assistenza: +39 379 189 2530</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #777;">Questo è un messaggio automatico, non rispondere a questa email.</p>
          </div>
        `
      });
      console.log(`Email inviata con successo a ${booking.email}`);
    } catch (emailErr) {
      console.error('Errore invio email conferma:', emailErr);
      // Non blocchiamo la risposta della prenotazione se l'invio email fallisce
    }

    return NextResponse.json({ success: true, booking });

  } catch (error: any) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 });
  }
}
