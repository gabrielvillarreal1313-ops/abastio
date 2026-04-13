/**
 * middleware.ts — Protección de rutas del dashboard.
 *
 * - /dashboard/* → requiere sesión activa, si no redirige a /login
 * - /login → si ya hay sesión, redirige al dashboard
 * - / y todo lo demás → público
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseMiddleware } from '@/lib/supabase-middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddleware(request);
  const pathname = request.nextUrl.pathname;

  // Refrescar sesión (necesario para mantener cookies actualizadas)
  const { data: { user } } = await supabase.auth.getUser();

  // Rutas bajo /dashboard → requieren sesión
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // /login → si ya hay sesión, redirigir al dashboard
  if (pathname === '/login') {
    if (user) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas EXCEPTO:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - Archivos públicos con extensión (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
