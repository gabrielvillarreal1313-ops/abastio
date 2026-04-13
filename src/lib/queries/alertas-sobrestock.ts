/**
 * alertas-sobrestock.ts — SKU × bodega con más de 6 meses de inventario.
 *
 * Solo incluye SKUs con demanda en los últimos 90 días (los sin demanda
 * son deadstock y se manejan por separado en el Resumen Ejecutivo).
 * Ventana de demanda: 90 días fijos desde MAX(fecha) de transacciones.
 */

import { supabase } from '@/lib/supabase';

export interface AlertaSobrestock {
  sku: string;
  nombre_producto: string;
  categoria: string;
  bodega_id: number;
  bodega_nombre: string;
  stock_actual: number;
  demanda_mensual_promedio: number;
  meses_de_inventario: number;
  valor_capital_atrapado: number;
}

function parseRow(r: Record<string, unknown>): AlertaSobrestock {
  return {
    sku: (r.sku as string) ?? '',
    nombre_producto: (r.nombre_producto as string) ?? '',
    categoria: (r.categoria as string) ?? '',
    bodega_id: Number(r.bodega_id) || 0,
    bodega_nombre: (r.bodega_nombre as string) ?? '',
    stock_actual: Number(r.stock_actual) || 0,
    demanda_mensual_promedio: Number(r.demanda_mensual_promedio) || 0,
    meses_de_inventario: Number(r.meses_de_inventario) || 0,
    valor_capital_atrapado: Number(r.valor_capital_atrapado) || 0,
  };
}

export async function getAlertasSobrestock(): Promise<AlertaSobrestock[]> {
  const PAGE_SIZE = 1000;

  const { data: page1, error: err1 } = await supabase
    .rpc('get_alertas_sobrestock')
    .range(0, PAGE_SIZE - 1);

  if (err1) throw new Error(`Error consultando alertas de sobrestock: ${err1.message}`);

  const rows: Record<string, unknown>[] = (page1 as Record<string, unknown>[]) || [];

  if (rows.length === PAGE_SIZE) {
    const { data: page2, error: err2 } = await supabase
      .rpc('get_alertas_sobrestock')
      .range(PAGE_SIZE, PAGE_SIZE * 2 - 1);

    if (err2) throw new Error(`Error consultando alertas de sobrestock (página 2): ${err2.message}`);
    if (page2) rows.push(...(page2 as Record<string, unknown>[]));
  }

  return rows.map(parseRow);
}
