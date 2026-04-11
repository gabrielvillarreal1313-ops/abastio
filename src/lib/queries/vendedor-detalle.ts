/**
 * vendedor-detalle.ts — Queries para la página de detalle de un vendedor.
 *
 * Incluye info básica + KPIs, historial de ingresos mensuales,
 * top clientes y top SKUs vendidos.
 */

import { supabase } from '@/lib/supabase';
import type { IngresoMensual } from './types';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface VendedorDetalle {
  nombre: string;
  zona: string;
  tipo: string;
  ingresos_12m: number;
  ingresos_ytd: number;
  margen_pct_12m: number;
  descuento_promedio_pct_12m: number;
  clientes_activos_12m: number;
  clientes_en_riesgo: number;
  ticket_promedio_12m: number;
  total_transacciones_12m: number;
}

export interface VendedorTopCliente {
  cliente_id: number;
  razon_social: string;
  ciudad: string;
  tipo_cliente: string;
  ingresos_12m: number;
  ultima_compra: string;
  dias_sin_comprar: number;
  es_riesgo: boolean;
}

export interface VendedorTopSKU {
  sku: string;
  nombre_producto: string;
  categoria: string;
  ingresos_totales: number;
  unidades_totales: number;
  margen_pct: number;
  clientes_distintos: number;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getVendedorDetalle(vendedorId: number): Promise<VendedorDetalle | null> {
  const { data, error } = await supabase.rpc('get_vendedor_detalle', { p_vendedor_id: vendedorId });

  if (error) {
    throw new Error(`Error consultando detalle del vendedor: ${error.message}`);
  }

  const rows = data as Record<string, unknown>[] | null;
  if (!rows || rows.length === 0) return null;

  const r = rows[0];
  return {
    nombre: (r.nombre as string) ?? '',
    zona: (r.zona as string) ?? '',
    tipo: (r.tipo as string) ?? '',
    ingresos_12m: Number(r.ingresos_12m) || 0,
    ingresos_ytd: Number(r.ingresos_ytd) || 0,
    margen_pct_12m: Number(r.margen_pct_12m) || 0,
    descuento_promedio_pct_12m: Number(r.descuento_promedio_pct_12m) || 0,
    clientes_activos_12m: Number(r.clientes_activos_12m) || 0,
    clientes_en_riesgo: Number(r.clientes_en_riesgo) || 0,
    ticket_promedio_12m: Number(r.ticket_promedio_12m) || 0,
    total_transacciones_12m: Number(r.total_transacciones_12m) || 0,
  };
}

const MESES_CORTOS = [
  '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export async function getVendedorIngresosMensuales(vendedorId: number): Promise<IngresoMensual[]> {
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

  const { data, error } = await supabase.rpc('get_vendedor_ingresos_mensuales', { p_vendedor_id: vendedorId });

  if (error) {
    throw new Error(`Error consultando ingresos mensuales del vendedor: ${error.message}`);
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

export async function getVendedorTopClientes(vendedorId: number): Promise<VendedorTopCliente[]> {
  const { data, error } = await supabase.rpc('get_vendedor_top_clientes', { p_vendedor_id: vendedorId });

  if (error) {
    throw new Error(`Error consultando top clientes del vendedor: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    cliente_id: Number(r.cliente_id) || 0,
    razon_social: (r.razon_social as string) ?? '',
    ciudad: (r.ciudad as string) ?? '',
    tipo_cliente: (r.tipo_cliente as string) ?? '',
    ingresos_12m: Number(r.ingresos_12m) || 0,
    ultima_compra: (r.ultima_compra as string) ?? '',
    dias_sin_comprar: Number(r.dias_sin_comprar) || 0,
    es_riesgo: r.es_riesgo === true || r.es_riesgo === 'true',
  }));
}

export async function getVendedorTopSKUs(vendedorId: number): Promise<VendedorTopSKU[]> {
  const { data, error } = await supabase.rpc('get_vendedor_top_skus', { p_vendedor_id: vendedorId });

  if (error) {
    throw new Error(`Error consultando top SKUs del vendedor: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    sku: (r.sku as string) ?? '',
    nombre_producto: (r.nombre_producto as string) ?? '',
    categoria: (r.categoria as string) ?? '',
    ingresos_totales: Number(r.ingresos_totales) || 0,
    unidades_totales: Number(r.unidades_totales) || 0,
    margen_pct: Number(r.margen_pct) || 0,
    clientes_distintos: Number(r.clientes_distintos) || 0,
  }));
}
