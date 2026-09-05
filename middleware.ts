import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Smooth custom route redirects & deep link compatibility
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/userinterface/home', request.url));
  }

  if (pathname.startsWith('/product/')) {
    const productId = pathname.replace('/product/', '');
    return NextResponse.redirect(new URL(`/userinterface/product/${productId}`, request.url));
  }

  if (pathname.startsWith('/category/')) {
    const categoryId = pathname.replace('/category/', '');
    return NextResponse.redirect(new URL(`/userinterface/category/${categoryId}`, request.url));
  }

  // 2. Initialize Response Stream
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Fix NextRequest mutation type issues by handling request context updating
          cookiesToSet.forEach(({ name, value, options }) => 
            request.cookies.set({ name, value, ...options })
          );
          
          response = NextResponse.next({
            request,
          });

          // Set the cookies cleanly onto the outbound stream response context
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set({ name, value, ...options })
          );
        },
      },
    }
  );

  // 3. Refresh Auth Token Session securely
  await supabase.auth.getUser();

  return response;
}

// 4. Matcher rules (Skipping static assets cleanly)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};