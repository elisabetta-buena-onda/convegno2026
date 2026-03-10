import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    if (newPassword.length < 6) {
       return NextResponse.json({ error: 'La password deve avere almeno 6 caratteri' }, { status: 400 });
    }

    // 1. Find user by valid token that hasn't expired yet
    const adminUser = await prisma.adminUser.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiresAt: {
          gt: new Date() // Token must be greater than current date (not expired)
        }
      }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Token non valido o scaduto.' }, { status: 400 });
    }

    // 2. Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update User & Clear Token
    await prisma.adminUser.update({
      where: { id: adminUser.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null
      }
    });

    return NextResponse.json({ success: true, message: 'Password aggiornata con successo' });

  } catch (err: any) {
    console.error('Reset Password API Error:', err);
    return NextResponse.json({ error: 'Errore durante il salvataggio della nuova password' }, { status: 500 });
  }
}
