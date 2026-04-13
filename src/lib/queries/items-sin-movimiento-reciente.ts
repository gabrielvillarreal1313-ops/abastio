/**
 * items-sin-movimiento-reciente.ts — SKUs con stock que dejaron de vender recientemente.
 *
 * Sin venta en los últimos 30 días pero SÍ vendieron en los últimos 90 días.
 * Alerta temprana: distingue de deadstock (90+ días sin venta) que es más crónico.
 * Mutuamente excluyente con deadstock.
 */

import { supabase } from '@/lib/supabase';

export interface ItemSinMovimientoReciente {
  sku: string;
  nombre_producto: string;
  categoria: string;
  inventario_total: number;
  costo_unitario: number;
  valor_inmovilizado: number;
  dias_sin_venta: number;
  ultima_venta: string | null;
}

function parseRow(r: Record<string, unknown>): ItemSinMovimientoReciente {
  return {
    sku: (r.sku as string) ?? '',
    nombre_producto: (r.nombre_producto as string) ?? '',
    categoria: (r.categoria as string) ?? '',
    inventario_total: Number(r.inventario_total) || 0,
    costo_unitario: Number(r.costo_unitario) || 0,
    valor_inmovilizado: Number(r.valor_inmovilizado) || 0,
    dias_sin_venta: Number(r.dias_sin_venta) || 0,
    ultima_venta: r.ultima_venta ? String(r.ultima_venta) : null,
  };
}

export async function getItemsSinMovimientoReciente(): Promise<ItemSinMovimientoReciente[]> {
  const { data, error } = await supabase.rpc('get_items_sin_movimiento_reciente');

  if (error) throw new Error(`Error consultando items sin movimiento reciente: ${error.message}`);

  return (data || []).map((r: Record<string, unknown>) => parseRow(r));
}
