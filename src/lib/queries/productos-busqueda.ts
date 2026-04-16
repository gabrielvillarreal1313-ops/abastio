/**
 * productos-busqueda.ts — Buscador de productos para el wizard de cotizaciones.
 */

import { supabase } from '@/lib/supabase';

export interface ProductoBusqueda {
  sku: string;
  nombre: string;
  categoria: string;
  precio_lista: number;
  costo_unitario: number;
  stock_total: number;
}

export async function buscarProductos(termino: string): Promise<ProductoBusqueda[]> {
  if (!termino.trim()) return [];

  const { data, error } = await supabase.rpc('get_productos_busqueda', { p_termino: termino });

  if (error) {
    throw new Error(`Error buscando productos: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    sku: (r.sku as string) ?? '',
    nombre: (r.nombre as string) ?? '',
    categoria: (r.categoria as string) ?? '',
    precio_lista: Number(r.precio_lista) || 0,
    costo_unitario: Number(r.costo_unitario) || 0,
    stock_total: Number(r.stock_total) || 0,
  }));
}
