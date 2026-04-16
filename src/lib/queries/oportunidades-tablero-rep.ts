/**
 * oportunidades-tablero-rep.ts — Oportunidades filtradas para el tablero del rep.
 *
 * Fase 9: excluye oportunidades cotizadas/descartadas, incluye pospuestas reaparecidas.
 */

import { supabase } from '@/lib/supabase';

export interface OportunidadTableroRep {
  cliente_id: number;
  nombre_cliente: string;
  vendedor_principal: string;
  tipo_cliente: string;
  conteo_recompras: number;
  valor_recompras: number;
  conteo_cross_sell: number;
  valor_cross_sell: number;
  valor_total: number;
  fue_pospuesta: boolean;
  fecha_posposicion_original: string | null;
}

export async function getOportunidadesTableroRep(vendedorId: number): Promise<OportunidadTableroRep[]> {
  const { data, error } = await supabase.rpc('get_oportunidades_tablero_rep', {
    p_vendedor_id: vendedorId,
  });

  if (error) throw new Error(`Error consultando oportunidades del tablero: ${error.message}`);

  return (data || []).map((r: Record<string, unknown>) => ({
    cliente_id: Number(r.cliente_id) || 0,
    nombre_cliente: (r.nombre_cliente as string) ?? '',
    vendedor_principal: (r.vendedor_principal as string) ?? '',
    tipo_cliente: (r.tipo_cliente as string) ?? '',
    conteo_recompras: Number(r.conteo_recompras) || 0,
    valor_recompras: Number(r.valor_recompras) || 0,
    conteo_cross_sell: Number(r.conteo_cross_sell) || 0,
    valor_cross_sell: Number(r.valor_cross_sell) || 0,
    valor_total: Number(r.valor_total) || 0,
    fue_pospuesta: r.fue_pospuesta === true || r.fue_pospuesta === 'true',
    fecha_posposicion_original: (r.fecha_posposicion_original as string) ?? null,
  }));
}
