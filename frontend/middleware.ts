import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware is intentionally a pass-through.
 *
 * Why: In the cross-origin production setup (Vercel frontend + Render backend),
 * the httpOnly auth cookie is set on the Render domain. Vercel's edge middleware
 * never receives it, so any cookie-based check here always fails and redirects
 * authenticated users back to /signin.
 *
 * Auth protection is handled client-side by the AuthContext guards in
 * app/admin/layout.tsx and app/dashboard/layout.tsx, which validate the session
 * via API calls to the backend with credentials:'include'.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};

