/**
 * items-desabasto-critico.ts — SKU × bodega cuyo stock actual está por debajo del mínimo recomendado.
 *
 * Mínimo recomendado = demanda_diaria_promedio × 21 (7 safety + 14 lead time).
 * Ventana de demanda: 90 días fijos desde MAX(fecha) de transacciones.
 * Excluye SKUs sin demanda en la ventana.
 *
 * Mutuamente excluyente con get_items_proximos_desabasto:
 * si stock < mínimo → desabasto crítico. Si stock >= mínimo → NO aparece aquí.
 */

import { supabase } from '@/lib/supabase';

export interface ItemDesabastoCritico {
  sku: string;
  nombre_producto: string;
  categoria: string;
  bodega_id: number;
  bodega_nombre: string;
  stock_actual: number;
  minimo_recomendado: number;
  demanda_diaria_promedio: number;
  dias_hasta_stockout: number;
  valor_impacto_mensual: number;
}

function parseRow(r: Record<string, unknown>): ItemDesabastoCritico {
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

export async function getItemsDesabastoCritico(): Promise<ItemDesabastoCritico[]> {
  // Paginación defensiva por si excede 1,000 filas
  const PAGE_SIZE = 1000;

  const { data: page1, error: err1 } = await supabase
    .rpc('get_items_desabasto_critico')
    .range(0, PAGE_SIZE - 1);

  if (err1) throw new Error(`Error consultando desabasto crítico: ${err1.message}`);

  const rows: Record<string, unknown>[] = (page1 as Record<string, unknown>[]) || [];

  if (rows.length === PAGE_SIZE) {
    const { data: page2, error: err2 } = await supabase
      .rpc('get_items_desabasto_critico')
      .range(PAGE_SIZE, PAGE_SIZE * 2 - 1);

    if (err2) throw new Error(`Error consultando desabasto crítico (página 2): ${err2.message}`);
    if (page2) rows.push(...(page2 as Record<string, unknown>[]));
  }

  return rows.map(parseRow);
}
