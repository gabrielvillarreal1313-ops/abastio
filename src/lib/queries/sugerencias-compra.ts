/**
 * sugerencias-compra.ts — Query de sugerencias de órdenes de compra.
 *
 * Detecta SKUs en desabasto (cantidad < mínimo) y calcula
 * cantidad a pedir, meses de suministro, y fecha requerida.
 */

import { supabase } from '@/lib/supabase';

export interface SugerenciaCompra {
  sku: string;
  nombre_producto: string;
  categoria: string;
  clase_abc: 'A' | 'B' | 'C';
  bodega_nombre: string;
  estado: 'desabasto' | 'ok' | 'sobrestock';
  cantidad_actual: number;
  cantidad_a_pedir: number;
  meses_de_suministro: number;
  /** Fecha requerida para SKUs en desabasto (MAX(fecha) + 14 días), null para los demás */
  fecha_requerida: string | null;
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
    bodega_nombre: (r.bodega_nombre as string) ?? '',
    estado: estado === 'desabasto' ? 'desabasto' : estado === 'sobrestock' ? 'sobrestock' : 'ok',
    cantidad_actual: Number(r.cantidad_actual) || 0,
    cantidad_a_pedir: Number(r.cantidad_a_pedir) || 0,
    meses_de_suministro: Number(r.meses_de_suministro) || 0,
    fecha_requerida: r.fecha_requerida ? String(r.fecha_requerida) : null,
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
