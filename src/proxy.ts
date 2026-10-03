import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'masarat_session';

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || 'fallback-secret-masarat-consultations-super-secure-key-32chars';
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let sessionUser: { sub: string; role: string; email: string } | null = null;

  if (sessionCookie) {
    try {
      const secret = getSecretKey();
      const { payload } = await jwtVerify(sessionCookie, secret, {
        algorithms: ['HS256'],
      });
      sessionUser = payload as unknown as { sub: string; role: string; email: string };
    } catch {
      sessionUser = null;
    }
  }

  // 1. Admin paths protection
  if (pathname.startsWith('/admin')) {
    if (!sessionUser) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    if (sessionUser.role !== 'SUPER_ADMIN' && sessionUser.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/consultant', request.url));
    }
  }

  // 2. Consultant paths protection
  if (pathname.startsWith('/consultant')) {
    if (!sessionUser) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    if (sessionUser.role !== 'CONSULTANT' && sessionUser.role !== 'SUPER_ADMIN' && sessionUser.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. Login page redirection if already authenticated
  if (pathname === '/login' && sessionUser) {
    if (sessionUser.role === 'SUPER_ADMIN' || sessionUser.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (sessionUser.role === 'CONSULTANT') {
      return NextResponse.redirect(new URL('/consultant', request.url));
    }
  }

  // 4. Response with security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self)');

  return response;
}

export { proxy as middleware };

export const config = {
  matcher: ['/admin/:path*', '/consultant/:path*', '/login'],
};
