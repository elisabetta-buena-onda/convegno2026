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
      // Security best practice: don't reveal if user exists or not
      // Just pretend it succeeded so attackers can't enumerate usernames
      return NextResponse.json({ success: true, message: 'Istruzioni inviate (se l\'utente esiste)' });
    }

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
    // Requires NEXT_PUBLIC_BASE_URL in production, fallback to host header
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;

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

    // Attempt to send email (it will mock in console if SMTP is not provided)
    // We send to the typed email, assuming the username typed was actually an email address
    // Otherwise fallback to process.env.EMAIL_USER if set, for testing
    const emailTo = email.includes('@') ? email : (process.env.EMAIL_USER || process.env.SMTP_USER || 'admin@convegno2026.it');

    await sendEmail({
      to: emailTo,
      subject: 'Recupero Password - Convegno Admin',
      html: htmlContent
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Password Recovery API Error:', err);
    return NextResponse.json({ error: 'Impossibile inviare la richiesta' }, { status: 500 });
  }
}
