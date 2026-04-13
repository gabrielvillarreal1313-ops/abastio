/**
 * planeacion-inventario.ts — Query de planeación de min/max por SKU × bodega.
 *
 * Retorna inventario actual vs mínimos/máximos recomendados calculados
 * a partir de la demanda histórica. Incluye deltas porcentuales y estado.
 */

import { supabase } from '@/lib/supabase';

export interface PlaneacionSKU {
  sku: string;
  nombre_producto: string;
  categoria: string;
  clase_abc: 'A' | 'B' | 'C';
  bodega_nombre: string;
  min_actual: number;
  max_actual: number;
  cantidad_actual: number;
  min_recomendado: number;
  max_recomendado: number;
  delta_min_pct: number;
  delta_max_pct: number;
  estado: 'ok' | 'revisar';
  demanda_diaria_promedio: number;
  demanda_mensual_promedio: number;
  minimo_efectivo: number;
  maximo_efectivo: number;
  tiene_override: boolean;
  tipo_override: string | null;
  bodega_id: number;
}

export interface PlaneacionData {
  skus: PlaneacionSKU[];
}

function parsePlaneacionRow(r: Record<string, unknown>): PlaneacionSKU {
  return {
    sku: (r.sku as string) ?? '',
    nombre_producto: (r.nombre_producto as string) ?? '',
    categoria: (r.categoria as string) ?? '',
    clase_abc: (r.clase_abc as 'A' | 'B' | 'C') ?? 'C',
    bodega_nombre: (r.bodega_nombre as string) ?? '',
    min_actual: Number(r.min_actual) || 0,
    max_actual: Number(r.max_actual) || 0,
    cantidad_actual: Number(r.cantidad_actual) || 0,
    min_recomendado: Number(r.min_recomendado) || 0,
    max_recomendado: Number(r.max_recomendado) || 0,
    delta_min_pct: Number(r.delta_min_pct) || 0,
    delta_max_pct: Number(r.delta_max_pct) || 0,
    estado: r.estado === 'ok' ? 'ok' : 'revisar',
    demanda_diaria_promedio: Number(r.demanda_diaria_promedio) || 0,
    demanda_mensual_promedio: Number(r.demanda_mensual_promedio) || 0,
    minimo_efectivo: Number(r.minimo_efectivo) || 0,
    maximo_efectivo: Number(r.maximo_efectivo) || 0,
    tiene_override: r.tiene_override === true || r.tiene_override === 'true',
    tipo_override: (r.tipo_override as string) ?? null,
    bodega_id: Number(r.bodega_id) || 0,
  };
}

export async function getPlaneacionInventario(): Promise<PlaneacionData> {
  // PostgREST limita a 1,000 filas — paginamos con .range()
  const PAGE_SIZE = 1000;

  const { data: page1, error: err1 } = await supabase
    .rpc('get_planeacion_inventario')
    .range(0, PAGE_SIZE - 1);

  if (err1) {
    throw new Error(`Error consultando planeación de inventario: ${err1.message}`);
  }

  const rows: Record<string, unknown>[] = (page1 as Record<string, unknown>[]) || [];

  if (rows.length === PAGE_SIZE) {
    const { data: page2, error: err2 } = await supabase
      .rpc('get_planeacion_inventario')
      .range(PAGE_SIZE, PAGE_SIZE * 2 - 1);

    if (err2) {
      throw new Error(`Error consultando planeación de inventario (página 2): ${err2.message}`);
    }

    if (page2) {
      rows.push(...(page2 as Record<string, unknown>[]));
    }
  }

  return { skus: rows.map(parsePlaneacionRow) };
}
