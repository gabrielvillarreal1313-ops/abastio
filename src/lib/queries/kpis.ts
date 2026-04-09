/**
 * kpis.ts — Query para los KPIs del resumen ejecutivo del dashboard.
 *
 * Usa la función RPC get_kpis_periodo() para agregar en SQL,
 * evitando el límite de 1000 filas de PostgREST.
 *
 * "Mes actual" = el mes más reciente donde hay datos en transacciones.
 * Si el mes está incompleto, la comparación vs mes anterior es
 * apples-to-apples: solo los primeros N días de ambos meses.
 */

import { supabase } from '@/lib/supabase';
import type { KPIsResumen } from './types';

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function diasEnMes(año: number, mes: number): number {
  return new Date(año, mes, 0).getDate();
}

export async function getKPIsResumen(): Promise<KPIsResumen> {
  // ─── Determinar el mes más reciente con datos ───────────────────

  const { data: maxFechaRow, error: errFecha } = await supabase
    .from('transacciones')
    .select('fecha')
    .order('fecha', { ascending: false })
    .limit(1)
    .single();

  if (errFecha || !maxFechaRow) {
    throw new Error(`No se pudo obtener la fecha más reciente: ${errFecha?.message}`);
  }

  const maxFecha = new Date(maxFechaRow.fecha);
  const mesActual = maxFecha.getMonth() + 1;
  const añoActual = maxFecha.getFullYear();
  const diaMaxDatos = maxFecha.getDate();
  const totalDiasMes = diasEnMes(añoActual, mesActual);
  const mesParcial = diaMaxDatos < totalDiasMes;

  const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
  const añoAnterior = mesActual === 1 ? añoActual - 1 : añoActual;

  // ─── Rangos de fecha ────────────────────────────────────────────

  const inicioMesActual = `${añoActual}-${String(mesActual).padStart(2, '0')}-01T00:00:00+00`;
  const finMesActual = mesActual === 12
    ? `${añoActual + 1}-01-01T00:00:00+00`
    : `${añoActual}-${String(mesActual + 1).padStart(2, '0')}-01T00:00:00+00`;

  const inicioMesAnterior = `${añoAnterior}-${String(mesAnterior).padStart(2, '0')}-01T00:00:00+00`;
  let finMesAnterior: string;

  if (mesParcial) {
    const diaCorte = Math.min(diaMaxDatos, diasEnMes(añoAnterior, mesAnterior));
    finMesAnterior = `${añoAnterior}-${String(mesAnterior).padStart(2, '0')}-${String(diaCorte + 1).padStart(2, '0')}T00:00:00+00`;
  } else {
    finMesAnterior = inicioMesActual;
  }

  // ─── Queries RPC en paralelo (agregación en SQL) ────────────────

  const [resActual, resAnterior] = await Promise.all([
    supabase.rpc('get_kpis_periodo', {
      fecha_desde: inicioMesActual,
      fecha_hasta: finMesActual,
    }),
    supabase.rpc('get_kpis_periodo', {
      fecha_desde: inicioMesAnterior,
      fecha_hasta: finMesAnterior,
    }),
  ]);

  if (resActual.error) throw new Error(`Error KPIs mes actual: ${resActual.error.message}`);
  if (resAnterior.error) throw new Error(`Error KPIs mes anterior: ${resAnterior.error.message}`);

  // RPC retorna un array con una sola fila
  const actual = resActual.data?.[0] || { total_ingresos: 0, total_costos: 0, total_folios: 0, total_clientes: 0 };
  const anterior = resAnterior.data?.[0] || { total_ingresos: 0, total_costos: 0, total_folios: 0, total_clientes: 0 };

  const ingresos = Number(actual.total_ingresos);
  const costos = Number(actual.total_costos);
  const folios = Number(actual.total_folios);
  const clientes = Number(actual.total_clientes);
  const ingresosAnterior = Number(anterior.total_ingresos);

  const margenPct = ingresos > 0 ? ((ingresos - costos) / ingresos) * 100 : 0;
  const ticket = folios > 0 ? ingresos / folios : 0;
  const cambio = ingresosAnterior > 0
    ? ((ingresos - ingresosAnterior) / ingresosAnterior) * 100
    : 0;

  const mesAnteriorNombre = MESES[mesAnterior].toLowerCase();

  return {
    ingresosMesActual: ingresos,
    ingresosMesAnterior: ingresosAnterior,
    cambioIngresosPct: cambio,
    margenBrutoPct: margenPct,
    transaccionesUnicas: folios,
    ticketPromedio: ticket,
    clientesActivos: clientes,
    etiquetaMesActual: `${MESES[mesActual]} ${añoActual}`,
    mesParcial,
    diasConDatos: diaMaxDatos,
    diasDelMes: totalDiasMes,
    etiquetaComparacion: mesParcial
      ? `vs mismo periodo de ${mesAnteriorNombre}`
      : `vs ${mesAnteriorNombre}`,
  };
}
