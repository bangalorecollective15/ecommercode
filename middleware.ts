import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Smooth custom route redirects & deep link compatibility (with trailing slash)
  if (pathname === '' || pathname === '/') {
    return NextResponse.redirect(new URL('/userinterface/home/', request.url), 308);
  }

  if (pathname.startsWith('/product/')) {
    const productId = pathname.replace('/product/', '').replace(/\/$/, '');
    return NextResponse.redirect(new URL(`/userinterface/product/${productId}/`, request.url), 308);
  }

  if (pathname.startsWith('/category/')) {
    const categoryId = pathname.replace('/category/', '').replace(/\/$/, '');
    return NextResponse.redirect(new URL(`/userinterface/category/${categoryId}/`, request.url), 308);
  }

  // 2. Initialize Response Stream
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 3. Skip Supabase auth refresh for public customer-facing storefront routes unless auth cookies exist
  const isPublicRoute =
    pathname.startsWith('/userinterface') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/reset-password');

  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith('sb-') && (c.name.includes('auth-token') || c.name.includes('token'))
  );

  // If public route with no auth cookies, return immediately without blocking network call
  if (isPublicRoute && !hasAuthCookie) {
    return response;
  }

  // If auth cookie exists or this is an admin route, refresh auth token
  if (hasAuthCookie || !isPublicRoute) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => 
                request.cookies.set({ name, value, ...options })
              );
              
              response = NextResponse.next({
                request,
              });

              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set({ name, value, ...options })
              );
            },
          },
        }
      );

      if (hasAuthCookie) {
        await supabase.auth.getUser();
      }
    } catch {
      // Don't crash middleware if auth fails
    }
  }

  return response;
}

// 4. Matcher rules (Skipping static assets cleanly)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)',
  ],
};