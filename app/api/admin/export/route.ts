import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: { participants: true },
      orderBy: { timestamp: 'desc' }
    });

    const csvHeader = 'ID,Data,Nome,Email,Telefono,Tipo Pacchetto,Struttura,Alloggio,Totale,Stato,Adulti,Bambini,Nomi Partecipanti\n';
    
    const csvRows = bookings.map((b: any) => {
      const names = b.participants.map((p: any) => p.nome).join(' | ');
      return `"${b.id}","${b.timestamp.toISOString()}","${b.nome}","${b.email}","${b.telefono}","${b.tipo_prenotazione}","${b.struttura || ''}","${b.alloggio || ''}","${b.totale}","${b.stato}","${b.adulti}","${b.bambini}","${names}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="prenotazioni_convegno.csv"',
      },
    });
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
