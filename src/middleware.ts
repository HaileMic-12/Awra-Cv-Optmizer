import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  // 1. Get the path the user is trying to visit
  const path = request.nextUrl.pathname;

  // 2. Define your protected routes here
  const isProtectedRoute = path.startsWith('/chat') || path.startsWith('/dashboard') || path.startsWith('/tracker');

  // 3. Check for our custom auth cookie
  const isAuthenticated = request.cookies.has('awra_auth');

  // 4. If they try to access a protected route without the cookie, boot them to login
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. If they are logged in and try to visit the login/signup pages, send them to chat
  const isAuthRoute = path === '/login' || path === '/signup' || path === '/';
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return NextResponse.next();
}

// 6. Tell Next.js which routes this middleware should actually run on
export const config = {
  matcher: [
    '/chat/:path*', 
    '/dashboard/:path*', 
    '/tracker/:path*',
    '/login',
    '/signup',
    '/'
  ],
};