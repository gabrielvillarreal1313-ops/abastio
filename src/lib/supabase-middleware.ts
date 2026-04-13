/**
 * supabase-middleware.ts — Cliente Supabase para el middleware de Next.js.
 *
 * El middleware no tiene acceso a cookies() de next/headers,
 * sino que recibe el request y debe modificar el response.
 */

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Crea un cliente Supabase para uso en middleware.
 * Refresca la sesión automáticamente si el token está por expirar.
 * Retorna el cliente y el response con cookies actualizadas.
 */
export function createSupabaseMiddleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Escribir cookies en el request (para que Server Components las vean)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Crear nuevo response con el request actualizado
          supabaseResponse = NextResponse.next({ request });
          // Escribir cookies en el response (para que el browser las guarde)
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return { supabase, response: supabaseResponse };
}
