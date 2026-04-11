/**
 * cliente-compro-una-vez.ts — SKUs que un cliente compró exactamente 1 vez.
 * Para el panel de recomendaciones del wizard de cotizaciones.
 */

import { supabase } from '@/lib/supabase';

export interface ComproUnaVez {
  sku: string;
  nombre_producto: string;
  categoria: string;
  fecha_compra: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
}

export async function getClienteComproUnaVez(clienteId: number): Promise<ComproUnaVez[]> {
  const { data, error } = await supabase.rpc('get_cliente_compro_una_vez', { p_cliente_id: clienteId });

  if (error) {
    throw new Error(`Error consultando productos comprados una vez: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    sku: (r.sku as string) ?? '',
    nombre_producto: (r.nombre_producto as string) ?? '',
    categoria: (r.categoria as string) ?? '',
    fecha_compra: (r.fecha_compra as string) ?? '',
    cantidad: Number(r.cantidad) || 0,
    precio_unitario: Number(r.precio_unitario) || 0,
    costo_unitario: Number(r.costo_unitario) || 0,
  }));
}
