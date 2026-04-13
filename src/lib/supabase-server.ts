/**
 * supabase-server.ts — Cliente Supabase para Server Components y Server Actions.
 *
 * Usa @supabase/ssr para manejar cookies de autenticación en el servidor.
 * NO reemplaza src/lib/supabase.ts — ese sigue usándose para queries públicas
 * que no necesitan contexto de usuario autenticado.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Crea un cliente Supabase server-side que lee/escribe cookies de sesión.
 * Llamar dentro de Server Components, Server Actions, o Route Handlers.
 */
export function createSupabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // En Server Components (read-only), set falla silenciosamente.
            // Las cookies se escriben correctamente en Server Actions y Route Handlers.
          }
        },
      },
    }
  );
}
