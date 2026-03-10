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
              <p style="color: #64748b; margin-top: 5px;">31° Convocazione Nazionale </p>
            </div>

            <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
              <h4 style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 15px; margin-top: 0;">Dettagli Scelta</h4>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="font-weight: bold; color: #0f172a; font-size: 18px;">${data.tipo_scelta.toUpperCase()}</span>
              </div>
              
              ${data.tipo_scelta === 'Pernotto' ? `
                <div style="font-size: 14px; color: #475569; margin-top: 10px; background-color: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9;">
                  <p style="margin: 0 0 5px 0;">Struttura: <span style="font-weight: bold; color: #0f172a;">${data.struttura}</span></p>
                  <p style="margin: 0 0 5px 0;">Camere:</p>
                  <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #0f172a; font-weight: 600;">
                    ${data.camere.map((c: any) => `<li style="text-transform: capitalize; margin-bottom: 3px;">${c.quantita}x ${c.tipo}</li>`).join('')}
                  </ul>
                  <p style="font-size: 12px; color: #64748b; margin: 10px 0 0 0; font-style: italic;">Il pass evento e i pasti sono compresi nel prezzo del pacchetto.</p>
                </div>
              ` : `
                <div style="font-size: 14px; color: #475569; margin-top: 10px;">
                  Tipologia: <span style="font-weight: bold; color: #0f172a; text-transform: capitalize;">${data.tipo_pass?.replace('_', ' ') || ''}</span>
                </div>
              `}

              <div style="margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <h4 style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 15px; margin-top: 0;">Partecipanti</h4>
                <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px;">
                  ${data.participants.map((p: any) => `
                    <li style="margin-bottom: 8px; display: flex; align-items: center;">
                       <span style="width: 8px; height: 8px; border-radius: 50%; background-color: #1a355b; display: inline-block; margin-right: 10px;"></span>
                       <span style="font-weight: bold; color: #0f172a; margin-right: 5px;">${p.nome}</span>
                       <span style="color: #64748b; font-size: 12px; font-style: italic;">(${p.tipo.toLowerCase()})</span>
                    </li>
                  `).join('')}
                </ul>
              </div>

              <div style="margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <h4 style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; margin-top: 0;">Riepilogo Costi</h4>
                <!-- Cost breakdown can be added here if dynamic values are available in API context -->
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f8fafc; border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 16px; font-weight: bold; color: #0f172a;">Totale Da Pagare</span>
                  <span style="font-size: 24px; font-weight: 900; color: #1a355b;">€ ${booking.totale.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
              <h4 style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 15px; margin-top: 0;">Metodo di Pagamento</h4>
              <p style="font-size: 14px; margin-bottom: 15px; color: #475569;">Hai scelto di pagare tramite <strong>${metodoLabel}</strong>.</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #1a355b; padding: 20px; border-radius: 8px;">
                ${booking.metodo_pagamento === 'bonifico' ? `
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b;">
                    <strong>IBAN:</strong> IT26 I360 8105 1382 1993 9719 944<br />
                    <strong>Intestato a:</strong> VitoMauro Toma Provenzano<br />
                    <strong>Causale:</strong> ${booking.nome} - N° Pass.<br /><br />
                    <span style="color: #64748b;">Una volta effettuato il pagamento, inviare la ricevuta del bonifico.</span>
                   </p>
                ` : `
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b;">
                    <strong>Numero Carta PostePay:</strong> 5333 1712 1088 0684<br />
                    <strong>Intestatario:</strong> Toma Provenzano Vitomauro<br /><br />
                    <span style="color: #64748b;">Effettua la ricarica e invia conferma/contabile su WhatsApp.</span>
                  </p>
                `}
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fff7ed; border-radius: 12px; border: 1px solid #ffedd5; display: flex; align-items: flex-start; gap: 10px;">
                <div style="color: #ea580c; font-size: 14px; line-height: 1.5;">
                  <strong style="display: block; margin-bottom: 5px;">⚠️ ATTENZIONE!</strong>
                  Se l'importo non verrà saldato entro 1h dalla conferma, la prenotazione sarà annullata in automatico.<br />
                  In caso di problemi contattare <strong>+39 389 922 5900</strong>
                </div>
              </div>
            </div>

            <div style="text-align: center; color: #64748b; font-size: 12px;">
              <p>Per assistenza: <strong>+39 389 922 5900</strong></p>
              <p style="margin-top: 10px;">ID Ordine: ${booking.id}</p>
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
