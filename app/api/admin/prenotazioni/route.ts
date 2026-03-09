import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { timestamp: 'desc' },
      include: { participants: true }
    });
    return NextResponse.json({ bookings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { id, ...details } = data;

    if (id) {
      // UPDATE
      const oldBooking = await prisma.booking.findUnique({ where: { id } });
      if (!oldBooking) throw new Error("Prenotazione non trovata");

      const booking = await prisma.$transaction(async (tx) => {
        // 1. Determine if inventory needs adjustment
        const roomChanged = oldBooking.alloggio !== details.alloggio || oldBooking.struttura !== details.struttura;
        const statusChanged = oldBooking.stato !== details.stato;
        
        const wasActive = oldBooking.stato !== 'CANCELLATA' && !!oldBooking.alloggio;
        const willBeActive = details.stato !== 'CANCELLATA' && !!details.alloggio;

        // Restore old if it was active and (room changed OR status became inactive)
        if (wasActive && (roomChanged || !willBeActive)) {
           const oldInv = await tx.accommodationInventory.findFirst({
             where: { accommodation_type: { tipo: oldBooking.alloggio as string, structure: { name: oldBooking.struttura as string } } }
           });
           if (oldInv) await tx.accommodationInventory.update({ where: { id: oldInv.id }, data: { posti_disponibili: { increment: 1 } } });
        }

        // Occupy new if it will be active and (room changed OR status became active)
        if (willBeActive && (roomChanged || !wasActive)) {
           const newInv = await tx.accommodationInventory.findFirst({
             where: { accommodation_type: { tipo: details.alloggio, structure: { name: details.struttura } } }
           });
           if (newInv) {
              if (newInv.posti_disponibili < 1) throw new Error("Sistemazione esaurita");
              await tx.accommodationInventory.update({ where: { id: newInv.id }, data: { posti_disponibili: { decrement: 1 } } });
           }
        }

        const updated = await tx.booking.update({
          where: { id },
          data: {
            nome: details.nome,
            email: details.email,
            telefono: details.telefono,
            tipo_prenotazione: details.tipo_prenotazione,
            struttura: details.struttura,
            alloggio: details.alloggio,
            adulti: parseInt(details.adulti),
            bambini: parseInt(details.bambini),
            pranzi: parseInt(details.pranzi),
            cene: parseInt(details.cene),
            totale: parseFloat(details.totale),
            stato: details.stato,
            metodo_pagamento: details.metodo_pagamento,
            participants: {
              deleteMany: {},
              create: details.participants.map((p: any) => ({
                nome: p.nome,
                tipo: p.tipo
              }))
            }
          }
        });
        return updated;
      });
      return NextResponse.json({ success: true, booking });
    } else {
      // CREATE MANUAL
      const booking = await prisma.$transaction(async (tx) => {
        if (details.alloggio && details.struttura) {
          const inv = await tx.accommodationInventory.findFirst({
            where: { accommodation_type: { tipo: details.alloggio, structure: { name: details.struttura } } }
          });
          if (inv) {
            if (inv.posti_disponibili < 1) throw new Error("Sistemazione esaurita");
            await tx.accommodationInventory.update({ where: { id: inv.id }, data: { posti_disponibili: { decrement: 1 } } });
          }
        }

        return await tx.booking.create({
          data: {
            nome: details.nome,
            email: details.email,
            telefono: details.telefono,
            tipo_prenotazione: details.tipo_prenotazione,
            struttura: details.struttura,
            alloggio: details.alloggio,
            adulti: parseInt(details.adulti),
            bambini: parseInt(details.bambini),
            pranzi: parseInt(details.pranzi),
            cene: parseInt(details.cene),
            totale: parseFloat(details.totale),
            stato: details.stato || 'CONFERMATA',
            metodo_pagamento: details.metodo_pagamento || 'manuale',
            participants: {
              create: details.participants.map((p: any) => ({
                nome: p.nome,
                tipo: p.tipo
              }))
            }
          }
        });
      });
      return NextResponse.json({ success: true, booking });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) throw new Error("ID mancante");

    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id } });
      if (booking && booking.alloggio && booking.struttura) {
        // Restore inventory
        const inv = await tx.accommodationInventory.findFirst({
          where: { accommodation_type: { tipo: booking.alloggio, structure: { name: booking.struttura } } }
        });
        if (inv) await tx.accommodationInventory.update({ where: { id: inv.id }, data: { posti_disponibili: { increment: 1 } } });
      }
      await tx.booking.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
