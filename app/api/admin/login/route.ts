import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
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

  return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
}
