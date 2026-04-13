/**
 * items-proximos-desabasto.ts — SKU × bodega próximos a caer en desabasto.
 *
 * Stock actual >= mínimo recomendado (NO es desabasto crítico todavía),
 * PERO días hasta stockout < horizonte configurado (default: 14 días).
 *
 * Mutuamente excluyente con get_items_desabasto_critico.
 * Ventana de demanda: 90 días fijos desde MAX(fecha) de transacciones.
 */

import { supabase } from '@/lib/supabase';
import type { ItemDesabastoCritico } from '@/lib/queries/items-desabasto-critico';

// Mismo shape que desabasto crítico para reutilizar componentes de UI
export type ItemProximoDesabasto = ItemDesabastoCritico;

function parseRow(r: Record<string, unknown>): ItemProximoDesabasto {
  return {
    sku: (r.sku as string) ?? '',
    nombre_producto: (r.nombre_producto as string) ?? '',
    categoria: (r.categoria as string) ?? '',
    bodega_id: Number(r.bodega_id) || 0,
    bodega_nombre: (r.bodega_nombre as string) ?? '',
    stock_actual: Number(r.stock_actual) || 0,
    minimo_recomendado: Number(r.minimo_recomendado) || 0,
    demanda_diaria_promedio: Number(r.demanda_diaria_promedio) || 0,
    dias_hasta_stockout: Number(r.dias_hasta_stockout) || 0,
    valor_impacto_mensual: Number(r.valor_impacto_mensual) || 0,
  };
}

export async function getItemsProximosDesabasto(horizonteDias: number = 14): Promise<ItemProximoDesabasto[]> {
  const PAGE_SIZE = 1000;

  const { data: page1, error: err1 } = await supabase
    .rpc('get_items_proximos_desabasto', { p_horizonte_dias: horizonteDias })
    .range(0, PAGE_SIZE - 1);

  if (err1) throw new Error(`Error consultando próximos a desabasto: ${err1.message}`);

  const rows: Record<string, unknown>[] = (page1 as Record<string, unknown>[]) || [];

  if (rows.length === PAGE_SIZE) {
    const { data: page2, error: err2 } = await supabase
      .rpc('get_items_proximos_desabasto', { p_horizonte_dias: horizonteDias })
      .range(PAGE_SIZE, PAGE_SIZE * 2 - 1);

    if (err2) throw new Error(`Error consultando próximos a desabasto (página 2): ${err2.message}`);
    if (page2) rows.push(...(page2 as Record<string, unknown>[]));
  }

  return rows.map(parseRow);
}
