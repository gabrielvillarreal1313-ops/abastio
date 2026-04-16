/**
 * resumen-oportunidades-rep.ts — Contadores de oportunidades para el header del tablero.
 *
 * Fase 9: total, trabajadas hoy, pendientes, pospuestas activas, descartadas.
 */

import { supabase } from '@/lib/supabase';

export interface ResumenOportunidadesRep {
  total_oportunidades: number;
  trabajadas_hoy: number;
  pendientes: number;
  pospuestas_activas: number;
  descartadas_total: number;
}

export async function getResumenOportunidadesRep(vendedorId: number): Promise<ResumenOportunidadesRep> {
  const { data, error } = await supabase.rpc('get_resumen_oportunidades_rep', {
    p_vendedor_id: vendedorId,
  });

  if (error) throw new Error(`Error consultando resumen de oportunidades: ${error.message}`);

  const r: Record<string, unknown> = Array.isArray(data) ? data[0] ?? {} : data ?? {};

  return {
    total_oportunidades: Number(r.total_oportunidades) || 0,
    trabajadas_hoy: Number(r.trabajadas_hoy) || 0,
    pendientes: Number(r.pendientes) || 0,
    pospuestas_activas: Number(r.pospuestas_activas) || 0,
    descartadas_total: Number(r.descartadas_total) || 0,
  };
}
