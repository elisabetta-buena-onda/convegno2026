import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Credenziali mancanti' }, { status: 400 });
  }

  let valid = false;
  
  // 1. Check if user exists in the database
  const adminUser = await prisma.adminUser.findUnique({ where: { username } });

  if (adminUser) {
     // DB admin found, verify password with bcrypt
     valid = await bcrypt.compare(password, adminUser.password);
  } else {
     // 2. Fallback to ENV variables for initial setup
     if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
     ) {
        valid = true;
        // First time login with ENV -> Migrate to DB automatically
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.adminUser.create({
           data: {
             username,
             password: hashedPassword
           }
        });
        console.log("Primo accesso effettuato. L'amministratore è stato salvato nel database.");
     }
  }

  if (valid) {
    const JWT_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || 'fallback_secret');
    const token = await new SignJWT({ user: username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, redirect: '/admin/dashboard' });
    
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 dia
      path: '/'
    });

    return response;
  }

  return NextResponse.json({ error: 'Credenziali non valide o utente inesistente' }, { status: 401 });
}
