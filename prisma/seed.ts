import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Initialize Accommodations Structures
  const euroitalia = await prisma.accommodationStructure.upsert({
    where: { name: 'Euroitalia' },
    update: {},
    create: { name: 'Euroitalia' },
  })
  
  const bb = await prisma.accommodationStructure.upsert({
    where: { name: 'B&B' },
    update: {},
    create: { name: 'B&B' },
  })

  // 2. Initialize Accommodation Types and Inventory
  const euroTypes = [
    { tipo: 'camere 2/3 persone', capienza: 3, quantita: 8 },
    { tipo: 'trullo 2 persone', capienza: 2, quantita: 1 },
    { tipo: 'monolocale 2 persone', capienza: 2, quantita: 2 },
    { tipo: 'villetta 3 persone', capienza: 3, quantita: 1 },
    { tipo: 'villetta 4 persone', capienza: 4, quantita: 1 },
  ]
  
  for (const t of euroTypes) {
    const at = await prisma.accommodationType.create({
      data: {
        structure_id: euroitalia.id,
        tipo: t.tipo,
        capienza: t.capienza,
        quantita: t.quantita,
        posti_totali: t.capienza * t.quantita,
      }
    })
    await prisma.accommodationInventory.create({
      data: {
        accommodation_type_id: at.id,
        posti_disponibili: t.capienza * t.quantita,
      }
    })
  }

  const bbTypes = [
    { tipo: 'singola', capienza: 1, quantita: 1 },
    { tipo: 'doppia', capienza: 2, quantita: 2 },
    { tipo: 'tripla', capienza: 3, quantita: 1 },
  ]
  
  for (const t of bbTypes) {
    const at = await prisma.accommodationType.create({
      data: {
        structure_id: bb.id,
        tipo: t.tipo,
        capienza: t.capienza,
        quantita: t.quantita,
        posti_totali: t.capienza * t.quantita,
      }
    })
    await prisma.accommodationInventory.create({
      data: {
        accommodation_type_id: at.id,
        posti_disponibili: t.capienza * t.quantita,
      }
    })
  }

  // 3. Initialize Availability for Passes and Meals (Global limits)
  const availabilities = ['pass_3g', 'pass_2g', 'solo_pass', 'pasti']
  for (const a of availabilities) {
    await prisma.availability.upsert({
      where: { tipo: a },
      update: {},
      create: { tipo: a, posti_disponibili: 500 }, // Assume 500 max capacity
    })
  }

  // 4. Initialize Pass Prices
  await prisma.eventPassPrice.upsert({ where: { tipo: '3_giorni' }, update: {}, create: { tipo: '3_giorni', prezzo: 15 } })
  await prisma.eventPassPrice.upsert({ where: { tipo: '1_giorno' }, update: {}, create: { tipo: '1_giorno', prezzo: 5 } })

  // 5. Initialize Meal Prices
  await prisma.mealOption.upsert({ where: { tipo: 'pranzo' }, update: {}, create: { tipo: 'pranzo', prezzo: 20 } })
  await prisma.mealOption.upsert({ where: { tipo: 'cena' }, update: {}, create: { tipo: 'cena', prezzo: 20 } })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
