/**
 * cadencia-cliente-sku.ts — Historial y resumen de cadencia de un par cliente-SKU.
 *
 * Wrapper para las RPCs get_cadencia_cliente_sku (historial de compras) y
 * get_resumen_cadencia_cliente_sku (métricas agregadas + predicción de próxima
 * compra). Base para el tab de Cadencia en detalle de oportunidad de recompra.
 */

import { supabase } from '@/lib/supabase';

export interface CompraParClienteSku {
  fecha: string;
  cantidad: number;
  subtotal: number;
  /** Días desde la compra anterior del mismo par. Null para la primera compra. */
  intervaloDias: number | null;
}

export interface ResumenCadencia {
  totalCompras: number;
  primeraCompra: string | null;
  ultimaCompra: string | null;
  intervaloPromedioDias: number | null;
  intervaloMinimoDias: number | null;
  intervaloMaximoDias: number | null;
  desviacionIntervaloDias: number | null;
  diasDesdeUltimaCompra: number | null;
  fechaEstimadaProxima: string | null;
  diasRetraso: number | null;
  /** 'muy_regular' | 'regular' | 'irregular' | null */
  regularidad: string | null;
  cantidadPromedio: number | null;
  valorPromedio: number | null;
}

export async function getCadenciaClienteSku(
  clienteId: number,
  sku: string
): Promise<CompraParClienteSku[]> {
  const { data, error } = await supabase.rpc('get_cadencia_cliente_sku', {
    p_cliente_id: clienteId,
    p_sku: sku,
  });

  if (error) throw new Error(`Error consultando cadencia cliente-SKU: ${error.message}`);

  const rows: Record<string, unknown>[] = (data as Record<string, unknown>[]) || [];

  return rows.map((r) => ({
    fecha: (r.fecha as string) ?? '',
    cantidad: Number(r.cantidad) || 0,
    subtotal: Number(r.subtotal) || 0,
    intervaloDias: r.intervalo_dias === null || r.intervalo_dias === undefined
      ? null
      : Number(r.intervalo_dias),
  }));
}

export async function getResumenCadenciaClienteSku(
  clienteId: number,
  sku: string
): Promise<ResumenCadencia | null> {
  const { data, error } = await supabase.rpc('get_resumen_cadencia_cliente_sku', {
    p_cliente_id: clienteId,
    p_sku: sku,
  });

  if (error) throw new Error(`Error consultando resumen de cadencia: ${error.message}`);

  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  const r: Record<string, unknown> = Array.isArray(data) ? data[0] : data;

  const totalCompras = Number(r.total_compras) || 0;
  if (totalCompras === 0) return null;

  const numOrNull = (v: unknown): number | null =>
    v === null || v === undefined ? null : Number(v);

  const strOrNull = (v: unknown): string | null =>
    v === null || v === undefined ? null : String(v);

  return {
    totalCompras,
    primeraCompra: strOrNull(r.primera_compra),
    ultimaCompra: strOrNull(r.ultima_compra),
    intervaloPromedioDias: numOrNull(r.intervalo_promedio_dias),
    intervaloMinimoDias: numOrNull(r.intervalo_minimo_dias),
    intervaloMaximoDias: numOrNull(r.intervalo_maximo_dias),
    desviacionIntervaloDias: numOrNull(r.desviacion_intervalo_dias),
    diasDesdeUltimaCompra: numOrNull(r.dias_desde_ultima_compra),
    fechaEstimadaProxima: strOrNull(r.fecha_estimada_proxima),
    diasRetraso: numOrNull(r.dias_retraso),
    regularidad: strOrNull(r.regularidad),
    cantidadPromedio: numOrNull(r.cantidad_promedio),
    valorPromedio: numOrNull(r.valor_promedio),
  };
}
