/**
 * explorer.ts — Vista multidimensional de datos transaccionales.
 *
 * Wrapper para la RPC parametrizada `get_explorer` que pivota ventas por
 * cualquier dimensión soportada (bodegas, vendedores, clientes, categorías,
 * productos, meses, ciudades) con métricas YTD vs LYTD, deltas, margen bruto,
 * y sparkline mensual. Soporta filtros cruzados para drill-down.
 *
 * Filtrado por vendedor (Fase 16):
 * Cuando `vendedorId` es null/undefined, retorna datos de toda la empresa.
 * Cuando `vendedorId` tiene valor, retorna solo datos relevantes para ese
 * vendedor según reglas por dimensión:
 *  - bodegas: TODAS las bodegas, métricas solo de sus transacciones (las
 *    bodegas sin actividad del rep aparecen con $0 y sparkline vacía)
 *  - vendedores: solo su fila
 *  - clientes: solo clientes a los que ha vendido (en ventana YTD/LYTD)
 *  - productos: solo productos que ha vendido
 *  - categorias: solo categorías de productos que ha vendido
 *  - meses: TODOS los 12 meses, métricas solo de sus transacciones
 *  - ciudades: solo ciudades de sus clientes
 *
 * En V1 esto será configurable por tenant vía `configuracion_empresa`.
 * Hoy es comportamiento fijo cableado al frontend (regla 18 de CLAUDE.md).
 */

import { supabase } from '@/lib/supabase';

export type DimensionExplorer =
  | 'bodegas'
  | 'vendedores'
  | 'clientes'
  | 'categorias'
  | 'productos'
  | 'meses'
  | 'ciudades';

export interface FiltrosExplorer {
  bodega_id?: number;
  vendedor_id?: number;
  cliente_id?: number;
  categoria?: string;
  sku?: string;
  ciudad?: string;
}

export interface PuntoSparkline {
  mes: number;
  valor: number;
}

export interface FilaExplorer {
  dimension_id: string;
  dimension_label: string;
  dimension_extra: string | null;
  ventas_ytd: number;
  ventas_lytd: number;
  ventas_delta: number;
  ventas_delta_pct: number | null;
  gm_ytd: number;
  gm_lytd: number;
  gm_delta: number;
  gm_delta_pct: number | null;
  sparkline_data: PuntoSparkline[];
}

function parseSparkline(raw: unknown): PuntoSparkline[] {
  // El campo viene como JSONB — Supabase lo deserializa a array. Guardas
  // defensivas por si la forma no cumple el contrato esperado.
  if (!Array.isArray(raw)) return [];
  try {
    return (raw as Record<string, unknown>[])
      .filter((p) => p && typeof p === 'object')
      .map((p) => ({
        mes: Number(p.mes) || 0,
        valor: Number(p.valor) || 0,
      }));
  } catch {
    return [];
  }
}

function parseFila(r: Record<string, unknown>): FilaExplorer {
  const numOrNull = (v: unknown): number | null =>
    v === null || v === undefined ? null : Number(v);

  return {
    dimension_id: (r.dimension_id as string) ?? '',
    dimension_label: (r.dimension_label as string) ?? '',
    dimension_extra:
      r.dimension_extra === null || r.dimension_extra === undefined
        ? null
        : String(r.dimension_extra),
    ventas_ytd: Number(r.ventas_ytd) || 0,
    ventas_lytd: Number(r.ventas_lytd) || 0,
    ventas_delta: Number(r.ventas_delta) || 0,
    ventas_delta_pct: numOrNull(r.ventas_delta_pct),
    gm_ytd: Number(r.gm_ytd) || 0,
    gm_lytd: Number(r.gm_lytd) || 0,
    gm_delta: Number(r.gm_delta) || 0,
    gm_delta_pct: numOrNull(r.gm_delta_pct),
    sparkline_data: parseSparkline(r.sparkline_data),
  };
}

export async function getExplorer(
  dimension: DimensionExplorer,
  filtros?: FiltrosExplorer,
  vendedorId?: number | null
): Promise<FilaExplorer[]> {
  const { data, error } = await supabase.rpc('get_explorer', {
    p_dimension: dimension,
    p_filtros: filtros ?? {},
    p_vendedor_id: vendedorId ?? null,
  });

  if (error) {
    throw new Error(`Error consultando Explorer (${dimension}): ${error.message}`);
  }

  const rows: Record<string, unknown>[] = (data as Record<string, unknown>[]) || [];
  return rows.map(parseFila);
}
