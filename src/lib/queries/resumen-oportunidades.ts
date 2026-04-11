/**
 * resumen-oportunidades.ts — Queries agregadas de oportunidades para el Resumen Ejecutivo.
 *
 * Retorna totales y top clientes sin traer las miles de filas individuales.
 */

import { supabase } from '@/lib/supabase';

// ─── Resumen agregado ───────────────────────────────────────────────────────

export interface ResumenOportunidades {
  totalRecompra: number;
  totalCrossSell: number;
  countRecompra: number;
  countCrossSell: number;
  valorTotal: number;
}

export async function getResumenOportunidades(): Promise<ResumenOportunidades> {
  const { data, error } = await supabase.rpc('get_resumen_oportunidades');

  if (error) {
    throw new Error(`Error consultando resumen de oportunidades: ${error.message}`);
  }

  const rows = data as Record<string, unknown>[] | null;
  if (!rows || rows.length === 0) {
    return { totalRecompra: 0, totalCrossSell: 0, countRecompra: 0, countCrossSell: 0, valorTotal: 0 };
  }

  const r = rows[0];
  const totalRecompra = Number(r.total_recompra) || 0;
  const totalCrossSell = Number(r.total_cross_sell) || 0;

  return {
    totalRecompra,
    totalCrossSell,
    countRecompra: Number(r.count_recompra) || 0,
    countCrossSell: Number(r.count_cross_sell) || 0,
    valorTotal: totalRecompra + totalCrossSell,
  };
}

// ─── Top clientes por oportunidad ───────────────────────────────────────────

export interface TopClienteOportunidad {
  cliente_id: number;
  nombre_cliente: string;
  vendedor_principal: string;
  oportunidades_recompra: number;
  valor_recompra: number;
  oportunidades_cross_sell: number;
  valor_cross_sell: number;
  valor_total: number;
  /** Total de oportunidades (recompra + cross-sell) */
  total_oportunidades: number;
}

export async function getTopClientesOportunidades(limite: number = 5): Promise<TopClienteOportunidad[]> {
  const { data, error } = await supabase.rpc('get_top_clientes_oportunidades', { p_limite: limite });

  if (error) {
    throw new Error(`Error consultando top clientes por oportunidad: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    cliente_id: Number(r.cliente_id) || 0,
    nombre_cliente: (r.nombre_cliente as string) ?? '',
    vendedor_principal: (r.vendedor_principal as string) ?? '—',
    oportunidades_recompra: Number(r.oportunidades_recompra) || 0,
    valor_recompra: Number(r.valor_recompra) || 0,
    oportunidades_cross_sell: Number(r.oportunidades_cross_sell) || 0,
    valor_cross_sell: Number(r.valor_cross_sell) || 0,
    valor_total: Number(r.valor_total) || 0,
    total_oportunidades: (Number(r.oportunidades_recompra) || 0) + (Number(r.oportunidades_cross_sell) || 0),
  }));
}
