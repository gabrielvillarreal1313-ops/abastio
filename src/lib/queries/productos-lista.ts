/**
 * productos-lista.ts — Query para la tabla de productos con métricas.
 *
 * Retorna todos los SKUs activos con al menos una venta histórica,
 * ordenados por ingresos 12 meses descendente.
 */

import { supabase } from '@/lib/supabase';

export interface ProductoLista {
  sku: string;
  nombre: string;
  categoria: string;
  marca: string;
  proveedor_principal: string;
  unidad_medida: string;
  precio_lista: number;
  costo_unitario: number;
  ingresos_12m: number;
  unidades_12m: number;
  margen_pct: number;
  clase_abc: 'A' | 'B' | 'C';
  cantidad_actual: number;
  ultima_venta: string;
  dias_sin_vender: number;
}

function parseProductoRow(r: Record<string, unknown>): ProductoLista {
  return {
    sku: (r.sku as string) ?? '',
    nombre: (r.nombre as string) ?? '',
    categoria: (r.categoria as string) ?? '',
    marca: (r.marca as string) ?? '',
    proveedor_principal: (r.proveedor_principal as string) ?? '',
    unidad_medida: (r.unidad_medida as string) ?? '',
    precio_lista: Number(r.precio_lista) || 0,
    costo_unitario: Number(r.costo_unitario) || 0,
    ingresos_12m: Number(r.ingresos_12m) || 0,
    unidades_12m: Number(r.unidades_12m) || 0,
    margen_pct: Number(r.margen_pct) || 0,
    clase_abc: (r.clase_abc as 'A' | 'B' | 'C') ?? 'C',
    cantidad_actual: Number(r.cantidad_actual) || 0,
    ultima_venta: (r.ultima_venta as string) ?? '',
    dias_sin_vender: Number(r.dias_sin_vender) || 0,
  };
}

export async function getProductosLista(): Promise<ProductoLista[]> {
  // 772 productos — no requiere paginación (< 1,000)
  const { data, error } = await supabase.rpc('get_productos_lista');

  if (error) {
    throw new Error(`Error consultando lista de productos: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => parseProductoRow(r));
}
