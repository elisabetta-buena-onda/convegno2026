import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const accommodations = await prisma.accommodationType.findMany({
      include: {
        structure: true,
        inventory: true
      }
    });

    const passPrices = await prisma.eventPassPrice.findMany();
    const mealOptions = await prisma.mealOption.findMany();

    return NextResponse.json({ accommodations, passPrices, mealOptions });
  } catch (error) {
    console.error('Availability Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
