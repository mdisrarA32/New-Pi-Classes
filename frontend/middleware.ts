import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Protect student dashboard routes (/dashboard, /student/*)
  const isStudentRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/student');
  // Protect admin dashboard routes (/admin/*)
  const isAdminRoute = pathname.startsWith('/admin');

  if (isStudentRoute || isAdminRoute) {
    if (!token) {
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/student/:path*', '/admin/:path*'],
};
