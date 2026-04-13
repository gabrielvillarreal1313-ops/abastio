/**
 * sugerencias-compra.ts — Query de sugerencias de órdenes de compra.
 *
 * Detecta SKUs en desabasto (stock < demanda_diaria × 21), sobrestock (>6 meses),
 * ok, y sin_movimiento (sin demanda en 90 días). Fórmula unificada con las RPCs
 * del Tablero de compras (Fase 2).
 */

import { supabase } from '@/lib/supabase';

export interface SugerenciaCompra {
  sku: string;
  nombre_producto: string;
  categoria: string;
  clase_abc: 'A' | 'B' | 'C';
  bodega_id: number;
  bodega_nombre: string;
  estado: 'desabasto' | 'ok' | 'sobrestock' | 'sin_movimiento';
  cantidad_actual: number;
  cantidad_a_pedir: number | null;
  meses_de_suministro: number | null;
  /** Fecha requerida para SKUs en desabasto (MAX(fecha) + 14 días), null para los demás */
  fecha_requerida: string | null;
  demanda_diaria_promedio: number;
  minimo_recomendado: number;
  lead_time_dias: number;
}

export interface SugerenciasCompraData {
  items: SugerenciaCompra[];
}

function parseSugerenciaRow(r: Record<string, unknown>): SugerenciaCompra {
  const estado = r.estado as string;
  return {
    sku: (r.sku as string) ?? '',
    nombre_producto: (r.nombre_producto as string) ?? '',
    categoria: (r.categoria as string) ?? '',
    clase_abc: (r.clase_abc as 'A' | 'B' | 'C') ?? 'C',
    bodega_id: Number(r.bodega_id) || 0,
    bodega_nombre: (r.bodega_nombre as string) ?? '',
    estado: estado === 'desabasto' ? 'desabasto'
      : estado === 'sobrestock' ? 'sobrestock'
      : estado === 'sin_movimiento' ? 'sin_movimiento'
      : 'ok',
    cantidad_actual: Number(r.cantidad_actual) || 0,
    cantidad_a_pedir: r.cantidad_a_pedir != null ? Number(r.cantidad_a_pedir) : null,
    meses_de_suministro: r.meses_de_suministro != null ? Number(r.meses_de_suministro) : null,
    fecha_requerida: r.fecha_requerida ? String(r.fecha_requerida) : null,
    demanda_diaria_promedio: Number(r.demanda_diaria_promedio) || 0,
    minimo_recomendado: Number(r.minimo_recomendado) || 0,
    lead_time_dias: Number(r.lead_time_dias) ?? 14,
  };
}

export async function getSugerenciasCompra(): Promise<SugerenciasCompraData> {
  // PostgREST limita a 1,000 filas — paginamos con .range()
  const PAGE_SIZE = 1000;

  const { data: page1, error: err1 } = await supabase
    .rpc('get_sugerencias_compra')
    .range(0, PAGE_SIZE - 1);

  if (err1) {
    throw new Error(`Error consultando sugerencias de compra: ${err1.message}`);
  }

  const rows: Record<string, unknown>[] = (page1 as Record<string, unknown>[]) || [];

  if (rows.length === PAGE_SIZE) {
    const { data: page2, error: err2 } = await supabase
      .rpc('get_sugerencias_compra')
      .range(PAGE_SIZE, PAGE_SIZE * 2 - 1);

    if (err2) {
      throw new Error(`Error consultando sugerencias de compra (página 2): ${err2.message}`);
    }

    if (page2) {
      rows.push(...(page2 as Record<string, unknown>[]));
    }
  }

  return { items: rows.map(parseSugerenciaRow) };
}
