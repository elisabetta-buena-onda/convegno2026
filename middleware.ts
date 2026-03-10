import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || 'fallback_secret');

export async function middleware(request: NextRequest) {
  // Whitelist public admin routes
  const isPublicAdminRoute = 
    request.nextUrl.pathname.startsWith('/admin/login') ||
    request.nextUrl.pathname.startsWith('/admin/recupero') ||
    request.nextUrl.pathname.startsWith('/admin/reset-password');

  const isPublicAdminApiRoute =
    request.nextUrl.pathname.startsWith('/api/admin/login') ||
    request.nextUrl.pathname.startsWith('/api/admin/recover') ||
    request.nextUrl.pathname.startsWith('/api/admin/reset-password') ||
    request.nextUrl.pathname.startsWith('/api/admin/emergency-reset');

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') && !isPublicAdminRoute;
  const isAdminApiRoute = request.nextUrl.pathname.startsWith('/api/admin') && !isPublicAdminApiRoute;

  if (isAdminRoute || isAdminApiRoute) {
    const token = request.cookies.get('admin_session')?.value;

    if (!token) {
      if (isAdminApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (err) {
      if (isAdminApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin_session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
