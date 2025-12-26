// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In middleware.ts
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  console.log(`[Middleware] Path: ${pathname}, Has Token: ${!!token}`);

  // Allow auth and API routes
  if (pathname.startsWith('/auth') || pathname.startsWith('/api')) {
    console.log(`[Middleware] Allowing access to: ${pathname}`);
    return NextResponse.next();
  }

  // If no token, redirect to login
  if (!token) {
    console.log('[Middleware] No token found, redirecting to login');
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    console.log('[Middleware] Verifying token...');
    // Verify token by making a request to the /api/auth/me endpoint
    const meUrl = new URL('/api/auth/me', request.url);
    console.log(`[Middleware] Calling ${meUrl.toString()}`);
    
    const response = await fetch(meUrl, {
      headers: {
        Cookie: `token=${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });

    console.log(`[Middleware] Auth check status: ${response.status}`);

    if (!response.ok) {
      console.log(`[Middleware] Auth check failed with status: ${response.status}`);
      throw new Error('Invalid token');
    }

    const userData = await response.json();
    console.log(`[Middleware] User data:`, JSON.stringify({
      id: userData.id,
      email: userData.email,
      isAdmin: userData.isAdmin || userData.is_admin,
      isApproved: userData.is_approved
    }));
    
    // If trying to access admin routes without admin privileges
    if (pathname.startsWith('/admin')) {
      const isAdmin = Boolean(userData.isAdmin || userData.is_admin);
      console.log(`[Middleware] Admin route access - isAdmin: ${isAdmin}`);
      
      if (!isAdmin) {
        console.log('[Middleware] Non-admin user trying to access admin route, redirecting to /dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Clone the request headers and add user info
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userData.id);
    requestHeaders.set('x-user-role', (userData.isAdmin || userData.is_admin) ? 'admin' : 'user');

    console.log('[Middleware] Authentication successful, proceeding to route');
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    // Clear invalid token and redirect to login
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth/).*)',
  ],
};