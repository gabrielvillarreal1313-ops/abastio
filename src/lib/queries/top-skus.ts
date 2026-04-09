/**
 * top-skus.ts — Queries para Top 10 SKUs por ingresos y por margen.
 *
 * Usa el mes más reciente COMPLETO (no parcial) para que los rankings
 * sean comparables. Si el mes más reciente es parcial, retrocede al anterior.
 */

import { supabase } from '@/lib/supabase';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface TopSKUIngresos {
  sku: string;
  nombre: string;
  categoria: string;
  ingresos_totales: number;
  unidades_vendidas: number;
  margen_pct: number;
}

export interface TopSKUMargen {
  sku: string;
  nombre: string;
  categoria: string;
  margen_pct: number;
  unidades_vendidas: number;
  ingresos_totales: number;
}

export interface TopSKUsData {
  porIngresos: TopSKUIngresos[];
  porMargen: TopSKUMargen[];
  etiquetaMes: string;
  /** SKUs en top margen que SÍ están en top ingresos */
  skusEnAmbos: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function rangoMes(año: number, mes: number): { inicio: string; fin: string } {
  const inicio = `${año}-${String(mes).padStart(2, '0')}-01T00:00:00+00`;
  let fAño = año;
  let fMes = mes + 1;
  if (fMes > 12) { fMes = 1; fAño++; }
  const fin = `${fAño}-${String(fMes).padStart(2, '0')}-01T00:00:00+00`;
  return { inicio, fin };
}

// ─── Query principal ────────────────────────────────────────────────────────

export async function getTopSKUs(): Promise<TopSKUsData> {
  // Determinar el mes más reciente completo
  const { data: maxRow, error: errMax } = await supabase
    .from('transacciones')
    .select('fecha')
    .order('fecha', { ascending: false })
    .limit(1)
    .single();

  if (errMax || !maxRow) {
    throw new Error(`No se pudo obtener fecha más reciente: ${errMax?.message}`);
  }

  const maxFecha = new Date(maxRow.fecha);
  let mes = maxFecha.getMonth() + 1;
  let año = maxFecha.getFullYear();
  const diaMax = maxFecha.getDate();
  const diasDelMes = new Date(año, mes, 0).getDate();

  // Si el mes está incompleto, retroceder al anterior
  if (diaMax < diasDelMes) {
    mes--;
    if (mes === 0) { mes = 12; año--; }
  }

  const { inicio, fin } = rangoMes(año, mes);

  // Queries RPC en paralelo
  const [resIngresos, resMargen] = await Promise.all([
    supabase.rpc('get_top_skus_por_ingresos', { fecha_desde: inicio, fecha_hasta: fin }),
    supabase.rpc('get_top_skus_por_margen', { fecha_desde: inicio, fecha_hasta: fin }),
  ]);

  if (resIngresos.error) throw new Error(`Error top ingresos: ${resIngresos.error.message}`);
  if (resMargen.error) throw new Error(`Error top margen: ${resMargen.error.message}`);

  const porIngresos: TopSKUIngresos[] = (resIngresos.data || []).map((r: any) => ({
    sku: r.sku,
    nombre: r.nombre,
    categoria: r.categoria,
    ingresos_totales: Number(r.ingresos_totales),
    unidades_vendidas: Number(r.unidades_vendidas),
    margen_pct: Number(r.margen_pct),
  }));

  const porMargen: TopSKUMargen[] = (resMargen.data || []).map((r: any) => ({
    sku: r.sku,
    nombre: r.nombre,
    categoria: r.categoria,
    margen_pct: Number(r.margen_pct),
    unidades_vendidas: Number(r.unidades_vendidas),
    ingresos_totales: Number(r.ingresos_totales),
  }));

  // Calcular SKUs del top margen que SÍ están en top ingresos
  const skusIngresos = new Set(porIngresos.map((s) => s.sku));
  const skusEnAmbos = porMargen.filter((s) => skusIngresos.has(s.sku)).length;

  return {
    porIngresos,
    porMargen,
    etiquetaMes: `${MESES[mes]} ${año}`,
    skusEnAmbos,
  };
}
