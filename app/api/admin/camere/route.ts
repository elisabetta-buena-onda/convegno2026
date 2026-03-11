import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Update or Create Accommodation Type
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Find or create structure first to avoid null errors if DB isn't seeded
    const structureName = data.structureName || 'Euroitalia';
    let structure = await prisma.accommodationStructure.upsert({
      where: { name: structureName },
      update: {},
      create: { name: structureName }
    });

    if (!data.id) {
       // Create new
       const newAcc = await prisma.accommodationType.create({
         data: {
           structure_id: structure!.id,
           tipo: data.tipo,
           capienza: parseInt(data.capienza),
           min_persone: parseInt(data.min_persone || 1),
           quantita: parseInt(data.quantita),
           posti_totali: parseInt(data.capienza) * parseInt(data.quantita),
           prezzo_adulto_3g: parseFloat(data.prezzo_adulto_3g),
           prezzo_adulto_2g: parseFloat(data.prezzo_adulto_2g),
           prezzo_bambino_3g: parseFloat(data.prezzo_bambino_3g),
           prezzo_bambino_2g: parseFloat(data.prezzo_bambino_2g),
           inventory: {
             create: {
               posti_disponibili: parseInt(data.posti_disponibili)
             }
           }
         }
       });
       return NextResponse.json({ success: true, newAcc });
    } else {
       // Update existing
       const existingAcc = await prisma.accommodationType.update({
         where: { id: data.id },
         data: {
           tipo: data.tipo,
           capienza: parseInt(data.capienza),
           min_persone: parseInt(data.min_persone || 1),
           quantita: parseInt(data.quantita),
           posti_totali: parseInt(data.capienza) * parseInt(data.quantita),
           prezzo_adulto_3g: parseFloat(data.prezzo_adulto_3g),
           prezzo_adulto_2g: parseFloat(data.prezzo_adulto_2g),
           prezzo_bambino_3g: parseFloat(data.prezzo_bambino_3g),
           prezzo_bambino_2g: parseFloat(data.prezzo_bambino_2g),
         }
       });

       // Find related inventory and update availability
       const inv = await prisma.accommodationInventory.findFirst({
         where: { accommodation_type_id: data.id }
       });
       if (inv) {
         await prisma.accommodationInventory.update({
           where: { id: inv.id },
           data: { posti_disponibili: parseInt(data.posti_disponibili) }
         });
       }

       return NextResponse.json({ success: true, existingAcc });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) throw new Error('ID mancate');

    await prisma.accommodationType.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
