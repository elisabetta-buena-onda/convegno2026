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
      const isPernotto = data.tipo_scelta === 'Pernotto';
      const pacchettoLabel = data.pacchetto_giorni === '3_giorni' ? '3 Giorni (Full)' : '2 Giorni';
      const metodoLabel = booking.metodo_pagamento === 'bonifico' ? 'Bonifico Bancario' : 'Ricarica PostePay';
      
      const participantsList = data.participants.map((p: any) => `
        <li style="margin-bottom: 5px;">
          <strong>${p.nome}</strong> (${p.tipo})
        </li>
      `).join('');

      const camereList = isPernotto ? data.camere.map((c: any) => `
        <li style="margin-bottom: 5px;">${c.quantita}x ${c.tipo}</li>
      `).join('') : '';

      await sendEmail({
        to: booking.email,
        subject: `Conferma Prenotazione #${booking.id.slice(0, 8)} - 31°Convocazione Nazionale`,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a355b; margin: 0; font-size: 24px;">Conferma Prenotazione</h1>
              <p style="color: #64748b; margin-top: 5px;">31° Convocazione Nazionale - Associazione Buena Onda</p>
            </div>

            <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 25px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1a355b; font-size: 18px; margin-top: 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Dettagli Prenotazione</h2>
              <p>Ciao <strong>${booking.nome}</strong>, la tua prenotazione è stata ricevuta con successo ed è in attesa di conferma (previa verifica del pagamento).</p>
              
              <div style="margin-top: 20px;">
                <p style="margin-bottom: 5px; font-weight: 600; color: #1a355b; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">Scelta Selezionata</p>
                <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px;">
                  <p style="margin: 0; font-weight: bold; font-size: 16px;">${data.tipo_scelta === 'Pernotto' ? 'PACCHETTO PERNOTTO' : 'SOLO PASS / PASTI'}</p>
                  ${isPernotto ? `
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #475569;">
                      <strong>Struttura:</strong> ${data.struttura}<br>
                      <strong>Pacchetto:</strong> ${pacchettoLabel}<br>
                      <strong>Camere:</strong>
                      <ul style="margin: 5px 0 0 0; padding-left: 20px; font-size: 14px;">
                        ${camereList}
                      </ul>
                    </p>
                  ` : `
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #475569;">Tipo: ${data.tipo_pass || 'Pass Evento'}</p>
                  `}
                </div>
              </div>

              <div style="margin-top: 20px;">
                <p style="margin-bottom: 5px; font-weight: 600; color: #1a355b; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">Partecipanti</p>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569;">
                  ${participantsList}
                </ul>
              </div>

              <div style="margin-top: 20px; border-top: 2px solid #f1f5f9; pt: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                   <span style="font-size: 16px; font-weight: 600;">Totale da Pagare:</span>
                   <span style="font-size: 22px; font-weight: 800; color: #1a355b;">€ ${booking.totale.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1a355b; font-size: 18px; margin-top: 0; margin-bottom: 15px;">Istruzioni per il Pagamento</h2>
              <p style="font-size: 14px; margin-bottom: 15px;">Hai scelto di pagare tramite <strong>${metodoLabel}</strong>.</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #1a355b; padding: 15px; border-radius: 4px;">
                ${booking.metodo_pagamento === 'bonifico' ? `
                  <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                    <strong>IBAN:</strong> IT89 0123 4567 8901 2345 6789 012<br>
                    <strong>Intestato a:</strong> Associazione Buena Onda<br>
                    <strong>Causale:</strong> Prenotazione Convegno #${booking.id.slice(0, 8)} - ${booking.nome}
                  </p>
                ` : `
                  <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                    <strong>Numero Carta PostePay:</strong> 4023 6004 1234 5678<br>
                    <strong>Codice Fiscale:</strong> GNN LBT 79L68 L219F<br>
                    <strong>Nota:</strong> Effettua la ricarica e invia contabile su WhatsApp.
                  </p>
                `}
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fff1f2; border-radius: 8px; border: 1px solid #fecdd3;">
                <p style="margin: 0; color: #be123c; font-size: 13px; font-weight: 600; text-align: center;">
                  ⚠️ ATTENZIONE: Se l'importo non verrà saldato entro 24h, la prenotazione sarà annullata automaticamente per liberare i posti.
                </p>
              </div>
            </div>

            <div style="text-align: center; color: #64748b; font-size: 12px;">
              <p>Per assistenza: <strong>+39 379 189 2530</strong></p>
              <p style="margin-top: 10px;">ID Ordine: ${booking.id}</p>
              <p>© ${new Date().getFullYear()} Associazione Buena Onda - Convegno Nazionale Famiglia</p>
            </div>
          </div>
        `
      });
      console.log(`Email inviata con successo a ${booking.email}`);
    } catch (emailErr) {
      console.error('Errore invio email conferma:', emailErr);
    }

    return NextResponse.json({ success: true, booking });

  } catch (error: any) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 });
  }
}
