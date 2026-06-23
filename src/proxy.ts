import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Next 16 route guard (formerly middleware.ts). Refreshes the Supabase session
// and redirects logged-out visitors to /login.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.next({ request })

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublic =
    path.startsWith('/login') ||
    path.startsWith('/auth') || // OAuth callback
    path.startsWith('/api') // API routes do their own auth

  if (!user && !isPublic) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = '/login'
    return NextResponse.redirect(redirect)
  }

  return response
}

export const config = {
  // Run on all routes except Next internals and static asset files.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
