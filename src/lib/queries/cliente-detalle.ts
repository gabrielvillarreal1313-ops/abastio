/**
 * cliente-detalle.ts — Queries para la página de detalle de un cliente.
 *
 * Incluye info básica + KPIs, historial de ingresos mensuales, y top SKUs.
 */

import { supabase } from '@/lib/supabase';
import type { IngresoMensual } from './types';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ClienteDetalle {
  razon_social: string;
  ciudad: string;
  tipo_cliente: string;
  limite_credito: number;
  dias_credito: number;
  lista_precios: string;
  ingresos_12m: number;
  ingresos_ytd: number;
  margen_promedio_pct: number;
  ticket_promedio: number;
  total_transacciones_12m: number;
  dias_sin_comprar: number;
  vendedor_principal: string;
  es_riesgo: boolean;
}

export interface ClienteTopSKU {
  sku: string;
  nombre_producto: string;
  categoria: string;
  ingresos_totales: number;
  unidades_totales: number;
  margen_pct: number;
  ultima_compra: string;
  patron_compra: string;
  intervalo_promedio_dias: number;
  dias_desde_ultima_compra: number;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getClienteDetalle(clienteId: number): Promise<ClienteDetalle | null> {
  const { data, error } = await supabase.rpc('get_cliente_detalle', { p_cliente_id: clienteId });

  if (error) {
    throw new Error(`Error consultando detalle del cliente: ${error.message}`);
  }

  const rows = data as Record<string, unknown>[] | null;
  if (!rows || rows.length === 0) return null;

  const r = rows[0];
  return {
    razon_social: (r.razon_social as string) ?? '',
    ciudad: (r.ciudad as string) ?? '',
    tipo_cliente: (r.tipo_cliente as string) ?? '',
    limite_credito: Number(r.limite_credito) || 0,
    dias_credito: Number(r.dias_credito) || 0,
    lista_precios: (r.lista_precios as string) ?? 'C',
    ingresos_12m: Number(r.ingresos_12m) || 0,
    ingresos_ytd: Number(r.ingresos_ytd) || 0,
    margen_promedio_pct: Number(r.margen_promedio_pct) || 0,
    ticket_promedio: Number(r.ticket_promedio) || 0,
    total_transacciones_12m: Number(r.total_transacciones_12m) || 0,
    dias_sin_comprar: Number(r.dias_sin_comprar) || 0,
    vendedor_principal: (r.vendedor_principal as string) ?? '—',
    es_riesgo: r.es_riesgo === true || r.es_riesgo === 'true',
  };
}

const MESES_CORTOS = [
  '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export async function getClienteIngresosMensuales(clienteId: number): Promise<IngresoMensual[]> {
  // Obtener fecha máxima para determinar mes parcial
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

  const { data, error } = await supabase.rpc('get_cliente_ingresos_mensuales', {
    p_cliente_id: clienteId,
  });

  if (error) {
    throw new Error(`Error consultando ingresos mensuales del cliente: ${error.message}`);
  }

  // Indexar resultados por "YYYY-MM"
  const porMes = new Map<string, { ingresos: number; costos: number }>();
  for (const row of (data || []) as Record<string, unknown>[]) {
    porMes.set(row.mes as string, {
      ingresos: Number(row.total_ingresos) || 0,
      costos: Number(row.total_costos) || 0,
    });
  }

  // Construir 13 meses
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

export async function getClienteTopSKUs(clienteId: number): Promise<ClienteTopSKU[]> {
  const { data, error } = await supabase.rpc('get_cliente_top_skus', { p_cliente_id: clienteId });

  if (error) {
    throw new Error(`Error consultando top SKUs del cliente: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    sku: (r.sku as string) ?? '',
    nombre_producto: (r.nombre_producto as string) ?? '',
    categoria: (r.categoria as string) ?? '',
    ingresos_totales: Number(r.ingresos_totales) || 0,
    unidades_totales: Number(r.unidades_totales) || 0,
    margen_pct: Number(r.margen_pct) || 0,
    ultima_compra: (r.ultima_compra as string) ?? '',
    patron_compra: (r.patron_compra as string) ?? 'Compra esporádicamente',
    intervalo_promedio_dias: Number(r.intervalo_promedio_dias) || 0,
    dias_desde_ultima_compra: Number(r.dias_desde_ultima_compra) || 0,
  }));
}
