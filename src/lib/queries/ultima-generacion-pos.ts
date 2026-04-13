/**
 * ultima-generacion-pos.ts — Timestamp de la última generación de POs sugeridas.
 * Retorna null si la tabla está vacía (nunca se han generado).
 */

import { supabase } from '@/lib/supabase';

export async function getUltimaGeneracionPos(): Promise<string | null> {
  const { data, error } = await supabase
    .from('po_sugeridas')
    .select('generada_en')
    .order('generada_en', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Error consultando última generación de POs: ${error.message}`);
  return data?.generada_en ?? null;
}
