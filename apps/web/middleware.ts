import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected and public routes
const protectedRoutes = ['/chat'];
const authRoutes = ['/login', '/register'];
const publicRoutes = ['/', '/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🔒 Middleware: Processing request for', pathname);
  
  // Get token from cookies (more secure than localStorage for SSR)
  const token = request.cookies.get('pythia-auth-token')?.value;
  console.log('🔒 Middleware: Token exists:', !!token);
  
  // Check if the current route is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  // Check if this is the root route
  const isRootRoute = pathname === '/';
  
  // If user is trying to access protected routes without token, redirect to login
  if (isProtectedRoute && !token) {
    console.log('🔒 Middleware: Redirecting unauthenticated user to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If user has token and tries to access auth routes, redirect to chat
  if (isAuthRoute && token) {
    console.log('🔒 Middleware: Redirecting authenticated user to chat');
    return NextResponse.redirect(new URL('/chat', request.url));
  }
  
  // For root route, always allow access (landing page will handle auth state)
  if (isRootRoute) {
    console.log('🔒 Middleware: Allowing access to root route');
    return NextResponse.next();
  }
  
  // Allow all other routes to pass through
  console.log('🔒 Middleware: Allowing access to', pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 