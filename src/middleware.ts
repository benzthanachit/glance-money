import { type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware';
import { updateSession } from '@/lib/supabase/middleware'
import { locales, defaultLocale } from '@/i18n/config';

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes and static files
  if (request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.includes('.')) {
    return;
  }

  // Handle internationalization first
  const intlResponse = intlMiddleware(request);
  
  // If intl middleware returns a response (redirect), use it
  if (intlResponse) {
    return intlResponse;
  }

  // Then handle Supabase session
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - images - .svg, .png, .jpg, .jpeg, .gif, .webp
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}