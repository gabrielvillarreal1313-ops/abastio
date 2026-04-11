/**
 * precio-cliente-sku.ts — Consulta el último precio que un cliente pagó por un SKU.
 * Si nunca lo compró, retorna el precio de lista del producto.
 */

import { supabase } from '@/lib/supabase';

export interface PrecioClienteSKU {
  precio_unitario: number;
  costo_unitario: number;
  /** 'historial' si viene de transacciones, 'lista' si viene de tabla productos */
  fuente: 'historial' | 'lista';
}

export async function getPrecioClienteSKU(clienteId: number, sku: string): Promise<PrecioClienteSKU> {
  const { data, error } = await supabase.rpc('get_precio_cliente_sku', {
    p_cliente_id: clienteId,
    p_sku: sku,
  });

  if (error) {
    throw new Error(`Error consultando precio cliente-SKU: ${error.message}`);
  }

  const rows = data as Record<string, unknown>[] | null;
  if (!rows || rows.length === 0) {
    return { precio_unitario: 0, costo_unitario: 0, fuente: 'lista' };
  }

  const r = rows[0];
  return {
    precio_unitario: Number(r.precio_unitario) || 0,
    costo_unitario: Number(r.costo_unitario) || 0,
    fuente: r.fuente === 'historial' ? 'historial' : 'lista',
  };
}
