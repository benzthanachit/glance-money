import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale } from '@/i18n/config';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Extract locale from pathname
  const pathname = request.nextUrl.pathname;
  const pathnameSegments = pathname.split('/');
  const maybeLocale = pathnameSegments[1];
  const locale = locales.includes(maybeLocale as any) ? maybeLocale : defaultLocale;
  
  // Remove locale from pathname for route checking
  const pathnameWithoutLocale = locales.includes(maybeLocale as any) 
    ? '/' + pathnameSegments.slice(2).join('/') 
    : pathname;

  if (
    !user &&
    !pathnameWithoutLocale.startsWith('/login') &&
    !pathnameWithoutLocale.startsWith('/signup') &&
    !pathnameWithoutLocale.startsWith('/auth') &&
    pathnameWithoutLocale !== '/'
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = locale === defaultLocale ? '/login' : `/${locale}/login`
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}