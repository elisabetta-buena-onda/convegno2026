import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { timestamp: 'desc' },
      include: { participants: true, camere: true }
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
      const oldBooking = await prisma.booking.findUnique({ 
         where: { id },
         include: { camere: true }
      });
      if (!oldBooking) throw new Error("Prenotazione non trovata");

      const booking = await prisma.$transaction(async (tx) => {
        // Simple strategy for complex updates: 
        // 1. Restore all old rooms inventory
        // 2. Delete old room relations
        // 3. Decrease new rooms inventory (if active)
        // 4. Create new room relations

        if (oldBooking.stato !== 'CANCELLATA' && oldBooking.struttura) {
             for (const room of oldBooking.camere) {
                 const oldInv = await tx.accommodationInventory.findFirst({
                   where: { accommodation_type: { tipo: room.accommodation_type, structure: { name: oldBooking.struttura } } }
                 });
                 if (oldInv) await tx.accommodationInventory.update({ where: { id: oldInv.id }, data: { posti_disponibili: { increment: room.quantita } } });
             }
        }

        const willBeActive = details.stato !== 'CANCELLATA' && details.struttura && details.camere?.length > 0;

        if (willBeActive) {
            for (const room of details.camere) {
                 const newInv = await tx.accommodationInventory.findFirst({
                   where: { accommodation_type: { tipo: room.tipo || room.accommodation_type, structure: { name: details.struttura } } }
                 });
                 if (newInv) {
                    if (newInv.posti_disponibili < room.quantita) throw new Error(`Sistemazione ${room.tipo || room.accommodation_type} esaurita`);
                    await tx.accommodationInventory.update({ where: { id: newInv.id }, data: { posti_disponibili: { decrement: room.quantita } } });
                 }
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
            adulti: parseInt(details.adulti),
            bambini: parseInt(details.bambini),
            pranzi: parseInt(details.pranzi),
            cene: parseInt(details.cene),
            totale: parseFloat(details.totale),
            stato: details.stato,
            metodo_pagamento: details.metodo_pagamento,
            participants: {
              deleteMany: {},
              create: details.participants?.map((p: any) => ({
                nome: p.nome,
                tipo: p.tipo
              })) || []
            },
            camere: {
              deleteMany: {},
              create: details.camere?.map((c: any) => ({
                accommodation_type: c.tipo || c.accommodation_type,
                quantita: c.quantita
              })) || []
            }
          }
        });
        return updated;
      });
      return NextResponse.json({ success: true, booking });
    } else {
      // CREATE MANUAL
      const booking = await prisma.$transaction(async (tx) => {
        if (details.camere && details.camere.length > 0 && details.struttura) {
           for (const room of details.camere) {
              const inv = await tx.accommodationInventory.findFirst({
                where: { accommodation_type: { tipo: room.tipo || room.accommodation_type, structure: { name: details.struttura } } }
              });
              if (inv) {
                if (inv.posti_disponibili < room.quantita) throw new Error(`Sistemazione ${room.tipo || room.accommodation_type} esaurita`);
                await tx.accommodationInventory.update({ where: { id: inv.id }, data: { posti_disponibili: { decrement: room.quantita } } });
              }
           }
        }

        return await tx.booking.create({
          data: {
            nome: details.nome,
            email: details.email,
            telefono: details.telefono,
            tipo_prenotazione: details.tipo_prenotazione,
            struttura: details.struttura,
            adulti: parseInt(details.adulti),
            bambini: parseInt(details.bambini),
            pranzi: parseInt(details.pranzi),
            cene: parseInt(details.cene),
            totale: parseFloat(details.totale),
            stato: details.stato || 'CONFERMATA',
            metodo_pagamento: details.metodo_pagamento || 'manuale',
            participants: {
              create: details.participants?.map((p: any) => ({
                nome: p.nome,
                tipo: p.tipo
              })) || []
            },
            camere: {
              create: details.camere?.map((c: any) => ({
                accommodation_type: c.tipo || c.accommodation_type,
                quantita: c.quantita
              })) || []
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
      const booking = await tx.booking.findUnique({ 
         where: { id },
         include: { camere: true }
      });
      if (booking && booking.camere.length > 0 && booking.struttura) {
        // Restore inventory
        for (const room of booking.camere) {
            const inv = await tx.accommodationInventory.findFirst({
              where: { accommodation_type: { tipo: room.accommodation_type, structure: { name: booking.struttura } } }
            });
            if (inv) await tx.accommodationInventory.update({ where: { id: inv.id }, data: { posti_disponibili: { increment: room.quantita } } });
        }
      }
      await tx.booking.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
