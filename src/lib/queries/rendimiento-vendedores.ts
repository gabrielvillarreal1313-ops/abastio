/**
 * rendimiento-vendedores.ts — Query para rendimiento por vendedor.
 *
 * Usa el mes más reciente COMPLETO (no parcial).
 */

import { supabase } from '@/lib/supabase';

export interface VendedorRendimiento {
  vendedor_id: number;
  nombre: string;
  zona: string;
  tipo: string;
  ingresos_totales: number;
  num_transacciones: number;
  ticket_promedio: number;
  margen_pct: number;
  descuento_promedio_pct: number;
  num_clientes_unicos: number;
  ingresos_vs_mes_anterior_pct: number;
}

export interface RendimientoVendedoresData {
  vendedores: VendedorRendimiento[];
  etiquetaMes: string;
}

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

export async function getRendimientoVendedores(): Promise<RendimientoVendedoresData> {
  // Determinar mes más reciente completo
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

  if (diaMax < diasDelMes) {
    mes--;
    if (mes === 0) { mes = 12; año--; }
  }

  const { inicio, fin } = rangoMes(año, mes);

  const { data, error } = await supabase.rpc('get_rendimiento_vendedores', {
    fecha_desde: inicio,
    fecha_hasta: fin,
  });

  if (error) {
    throw new Error(`Error rendimiento vendedores: ${error.message}`);
  }

  const vendedores: VendedorRendimiento[] = (data || []).map((r: Record<string, unknown>) => ({
    vendedor_id: Number(r.vendedor_id),
    nombre: r.nombre,
    zona: r.zona,
    tipo: r.tipo,
    ingresos_totales: Number(r.ingresos_totales),
    num_transacciones: Number(r.num_transacciones),
    ticket_promedio: Number(r.ticket_promedio),
    margen_pct: Number(r.margen_pct),
    descuento_promedio_pct: Number(r.descuento_promedio_pct),
    num_clientes_unicos: Number(r.num_clientes_unicos),
    ingresos_vs_mes_anterior_pct: Number(r.ingresos_vs_mes_anterior_pct),
  }));

  return {
    vendedores,
    etiquetaMes: `${MESES[mes]} ${año}`,
  };
}
