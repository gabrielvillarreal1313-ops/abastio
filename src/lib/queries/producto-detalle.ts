/**
 * producto-detalle.ts — Queries para la página de detalle de un producto.
 *
 * Incluye info básica + KPIs, historial de ingresos mensuales, y top clientes.
 */

import { supabase } from '@/lib/supabase';
import type { IngresoMensual } from './types';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ProductoDetalle {
  sku: string;
  nombre: string;
  categoria: string;
  marca: string;
  proveedor_principal: string;
  unidad_medida: string;
  precio_lista: number;
  costo_unitario_producto: number;
  ingresos_12m: number;
  ingresos_ytd: number;
  unidades_12m: number;
  margen_pct: number;
  margen_pct_historico: number;
  ticket_promedio_unidades: number;
  cantidad_actual_leon: number;
  cantidad_actual_queretaro: number;
  cantidad_minima: number;
  cantidad_maxima: number;
  total_clientes_12m: number;
  ultima_venta: string;
  dias_sin_vender: number;
}

export interface ProductoTopCliente {
  cliente_id: number;
  razon_social: string;
  ciudad: string;
  tipo_cliente: string;
  ingresos_totales: number;
  unidades_totales: number;
  ultima_compra: string;
  patron_compra: string;
  intervalo_promedio_dias: number;
  dias_desde_ultima_compra: number;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getProductoDetalle(sku: string): Promise<ProductoDetalle | null> {
  const { data, error } = await supabase.rpc('get_producto_detalle', { p_sku: sku });

  if (error) {
    throw new Error(`Error consultando detalle del producto: ${error.message}`);
  }

  const rows = data as Record<string, unknown>[] | null;
  if (!rows || rows.length === 0) return null;

  const r = rows[0];
  return {
    sku: (r.sku as string) ?? '',
    nombre: (r.nombre as string) ?? '',
    categoria: (r.categoria as string) ?? '',
    marca: (r.marca as string) ?? '',
    proveedor_principal: (r.proveedor_principal as string) ?? '',
    unidad_medida: (r.unidad_medida as string) ?? '',
    precio_lista: Number(r.precio_lista) || 0,
    costo_unitario_producto: Number(r.costo_unitario_producto) || 0,
    ingresos_12m: Number(r.ingresos_12m) || 0,
    ingresos_ytd: Number(r.ingresos_ytd) || 0,
    unidades_12m: Number(r.unidades_12m) || 0,
    margen_pct: Number(r.margen_pct) || 0,
    margen_pct_historico: Number(r.margen_pct_historico) || 0,
    ticket_promedio_unidades: Number(r.ticket_promedio_unidades) || 0,
    cantidad_actual_leon: Number(r.cantidad_actual_leon) || 0,
    cantidad_actual_queretaro: Number(r.cantidad_actual_queretaro) || 0,
    cantidad_minima: Number(r.cantidad_minima) || 0,
    cantidad_maxima: Number(r.cantidad_maxima) || 0,
    total_clientes_12m: Number(r.total_clientes_12m) || 0,
    ultima_venta: (r.ultima_venta as string) ?? '',
    dias_sin_vender: Number(r.dias_sin_vender) || 0,
  };
}

const MESES_CORTOS = [
  '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export async function getProductoIngresosMensuales(sku: string): Promise<IngresoMensual[]> {
  const { data: maxRow } = await supabase
    .from('transacciones')
    .select('fecha')
    .order('fecha', { ascending: false })
    .limit(1)
    .single();

  const maxFecha = maxRow ? new Date(maxRow.fecha) : new Date();
  const mesActual = maxFecha.getMonth() + 1;
  const añoActual = maxFecha.getFullYear();
  const diaMax = maxFecha.getDate();
  const diasDelMes = new Date(añoActual, mesActual, 0).getDate();
  const esParcial = diaMax < diasDelMes;

  const { data, error } = await supabase.rpc('get_producto_ingresos_mensuales', { p_sku: sku });

  if (error) {
    throw new Error(`Error consultando ingresos mensuales del producto: ${error.message}`);
  }

  const porMes = new Map<string, { ingresos: number; costos: number }>();
  for (const row of (data || []) as Record<string, unknown>[]) {
    porMes.set(row.mes as string, {
      ingresos: Number(row.total_ingresos) || 0,
      costos: Number(row.total_costos) || 0,
    });
  }

  const resultado: IngresoMensual[] = [];
  let a = añoActual - 1;
  let m = mesActual;

  for (let i = 0; i < 13; i++) {
    const key = `${a}-${String(m).padStart(2, '0')}`;
    const datos = porMes.get(key) || { ingresos: 0, costos: 0 };
    const margen = datos.ingresos > 0
      ? ((datos.ingresos - datos.costos) / datos.ingresos) * 100
      : 0;

    const esUltimo = m === mesActual && a === añoActual;

    resultado.push({
      mes: `${MESES_CORTOS[m]} ${String(a).slice(2)}`,
      ingresos: Math.round(datos.ingresos),
      costos: Math.round(datos.costos),
      margen: parseFloat(margen.toFixed(1)),
      parcial: esUltimo && esParcial,
    });

    m++;
    if (m > 12) { m = 1; a++; }
  }

  return resultado;
}

export async function getProductoTopClientes(sku: string): Promise<ProductoTopCliente[]> {
  const { data, error } = await supabase.rpc('get_producto_top_clientes', { p_sku: sku });

  if (error) {
    throw new Error(`Error consultando top clientes del producto: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    cliente_id: Number(r.cliente_id) || 0,
    razon_social: (r.razon_social as string) ?? '',
    ciudad: (r.ciudad as string) ?? '',
    tipo_cliente: (r.tipo_cliente as string) ?? '',
    ingresos_totales: Number(r.ingresos_totales) || 0,
    unidades_totales: Number(r.unidades_totales) || 0,
    ultima_compra: (r.ultima_compra as string) ?? '',
    patron_compra: (r.patron_compra as string) ?? 'Compra esporádicamente',
    intervalo_promedio_dias: Number(r.intervalo_promedio_dias) || 0,
    dias_desde_ultima_compra: Number(r.dias_desde_ultima_compra) || 0,
  }));
}
