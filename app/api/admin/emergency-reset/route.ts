import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const newPassword = 'AdminPassword2026!'; // Default temporary password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const username = 'admin';

    // Upsert the admin user: create if doesn't exist, update if it does
    const admin = await prisma.adminUser.upsert({
      where: { username },
      update: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
      create: {
        username,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password di emergenza impostata correttamente.',
      username: admin.username,
      temporaryPassword: newPassword,
      instructions: 'Accedi ora con queste credenziali e CANCELLA questo file (/app/api/admin/emergency-reset/route.ts) subito dopo per sicurezza.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
