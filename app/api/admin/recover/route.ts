import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email o Username mancante' }, { status: 400 });
    }

    // Since username acts as the primary login right now, we can check by it
    // Or if the user ever adds a real email field, by email
    const adminUser = await prisma.adminUser.findFirst({
       // If there's an email column later, change this to an OR condition
       where: { username: email } 
    });

    if (!adminUser) {
      console.log(`[RECOVERY] Utente non trovato per input: ${email}`);
      // Security best practice: don't reveal if user exists or not
      return NextResponse.json({ success: true, message: 'Se l\'utente esiste, riceverà le istruzioni.' });
    }

    console.log(`[RECOVERY] Utente trovato: ${adminUser.username}. Generazione token...`);

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Update DB
    await prisma.adminUser.update({
      where: { id: adminUser.id },
      data: {
        resetToken: token,
        resetTokenExpiresAt: tokenExpiresAt
      }
    });

    // Create the magic link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;

    console.log(`[RECOVERY] Link generato: ${resetUrl}`);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
         <h2 style="color: #1a355b;">Recupero Password Admin</h2>
         <p>Ciao,</p>
         <p>Hai richiesto di reimpostare la password per l'account <strong>${adminUser.username}</strong>.</p>
         <p>Clicca sul pulsante qui sotto per creare una nuova password. Il link durerà 30 minuti.</p>
         <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #1a355b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
               Reimposta Password
            </a>
         </div>
         <p style="font-size: 12px; color: #666;">Se non hai richiesto tu il ripristino, puoi ignorare questa email.</p>
      </div>
    `;

    // Attempt to send email
    // If the input was an email, use it. Otherwise use configured admin email or fallback.
    const emailTo = email.includes('@') ? email : (process.env.SMTP_USER || process.env.EMAIL_USER || 'admin@convegno2026.it');

    console.log(`[RECOVERY] Tentativo di invio email a: ${emailTo}`);

    await sendEmail({
      to: emailTo,
      subject: 'Recupero Password - Convegno Admin',
      html: htmlContent
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[RECOVERY ERROR]:', err);
    return NextResponse.json({ error: 'Impossibile inviare la richiesta' }, { status: 500 });
  }
}
