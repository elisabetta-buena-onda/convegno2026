# Convegno Booking App 2026

Piattaforma Next.js per la gestione delle prenotazioni del Comunità Nuova Pentecoste.

## Stack Tecnologico
- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS v4
- **Backend**: API Routes Next.js, Prisma ORM
- **Database**: PostgreSQL
- **Autenticazione Admin**: JWT con HttpOnly Cookie gestita via Middleware.

## Prerequisiti
- Node.js >= 18
- Docker e Docker Compose (per il DB locale)
- PostgreSQL (se si usa un DB remoto)

## Installazione Locale

1. **Avvia il database locale:**
   Se hai Docker installato, puoi far partire un database locale con:
   ```bash
   docker-compose up -d
   ```

2. **Copia l'ambiente:**
   Il file `.env` è già incluso con parametri di default per Docker.
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/convegno2026?schema=public"
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD="supersecretpassword"
   SESSION_SECRET="something_very_secret_here"
   ```

3. **Inizializza Prisma:**
   Genera il client prisma, esegui le migrazioni e il seeder.
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run prisma:seed    # Oppure npx tsx prisma/seed.ts
   ```

4. **Avvia in sviluppo:**
   ```bash
   npm run dev
   ```

   L'app sarà disponibile su `http://localhost:3000`. L'area admin su `http://localhost:3000/admin/login`.

## Deploy su Vercel

L'app è sviluppata nativamente per Edge rendering e Serverless deployment su Vercel.

1. Esegui il push di questa cartella su un repository GitHub.
2. Collega il repository a Vercel tramite la Dashboard Vercel.
3. Inserisci le seguenti **Variabili d'Ambiente** su Vercel:
   - `DATABASE_URL` (Usa un provider come **Supabase**, **Neon** o Aiven per il Postgres remoto). Attenzione a fornire l'URL in formato connection string (es. pgbouncer).
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET` (Una stringa alfanumerica random lunga e sicura).
4. Vercel esegue in automatico `npm run build`. 
   > **Nota importante:** Assicurati di includere `npx prisma generate` nello script postinstall oppure come parte del comando d'avvio (`"build": "prisma generate && next build"` in `package.json`).
5. Prima di testare, esegui il seed nel database remoto lanciando:
   `npx prisma db push` e poi `npx tsx prisma/seed.ts` (dalla tua macchina puntando al remote URL o dalla console Vercel).

## Funzionalità Principali
- **Controllo Concorrenza Database**: L'API usa `$transaction` per evitare overbooking.
- **Limitazioni Scelte**: Gli utenti possono selezionare solo "Euroitalia" e "B&B" nei pacchetti predefiniti.
- **Sconto Famiglia**: Calcolatore automatico che blocca il limite a 10 euro a pass quando il nucleo è ≥ 4 paganti. 
- **Admin Protetta**: Interfaccia bloccata via Middleware, con esportazione CSV e monitor disbonibilità in read/write.
