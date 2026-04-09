/**
 * deadstock.ts — Query para detección de productos sin movimiento.
 *
 * Deadstock = SKU activo con inventario > 0 y sin ventas en 90+ días
 * desde la fecha más reciente de datos (no desde NOW()).
 */

import { supabase } from '@/lib/supabase';

export interface DeadstockItem {
  sku: string;
  nombre: string;
  categoria: string;
  marca: string | null;
  inventario_total: number;
  costo_unitario: number;
  capital_inmovilizado: number;
  dias_sin_movimiento: number | null;
  ultima_venta: string | null;
  bodegas_con_stock: string;
}

export interface DeadstockData {
  items: DeadstockItem[];
  capitalTotal: number;
}

export async function getDeadstock(): Promise<DeadstockData> {
  const { data, error } = await supabase.rpc('get_deadstock');

  if (error) {
    throw new Error(`Error consultando deadstock: ${error.message}`);
  }

  const items: DeadstockItem[] = (data || []).map((r: any) => ({
    sku: r.sku,
    nombre: r.nombre,
    categoria: r.categoria,
    marca: r.marca,
    inventario_total: Number(r.inventario_total),
    costo_unitario: Number(r.costo_unitario),
    capital_inmovilizado: Number(r.capital_inmovilizado),
    dias_sin_movimiento: r.dias_sin_movimiento !== null ? Number(r.dias_sin_movimiento) : null,
    ultima_venta: r.ultima_venta,
    bodegas_con_stock: r.bodegas_con_stock || '',
  }));

  const capitalTotal = items.reduce((sum, i) => sum + i.capital_inmovilizado, 0);

  return { items, capitalTotal };
}
