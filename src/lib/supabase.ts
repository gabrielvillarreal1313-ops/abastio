import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Cliente Supabase configurado para que NUNCA cachee las respuestas en Next.js.
 *
 * Sin esto, Next.js 14 cachea las llamadas fetch del cliente Supabase
 * en Server Components, causando que los datos no se refresquen después
 * de mutaciones (crear, editar, cancelar cotizaciones, etc.)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        cache: 'no-store',
      });
    },
  },
});
