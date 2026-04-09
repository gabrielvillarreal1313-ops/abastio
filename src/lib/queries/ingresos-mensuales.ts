/**
 * ingresos-mensuales.ts — Query para la gráfica de ingresos y margen mensual.
 *
 * Usa la función RPC get_ingresos_mensuales() para agregar en SQL,
 * evitando el límite de 1000 filas de PostgREST.
 *
 * Retorna los últimos 12 meses completos + el mes parcial actual (13 puntos).
 */

import { supabase } from '@/lib/supabase';
import type { IngresoMensual } from './types';

const MESES_CORTOS = [
  '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

function retrocederMeses(año: number, mes: number, n: number): { año: number; mes: number } {
  let m = mes - n;
  let a = año;
  while (m <= 0) {
    m += 12;
    a--;
  }
  return { año: a, mes: m };
}

export async function getIngresosMensuales(): Promise<IngresoMensual[]> {
  // ─── Determinar el mes más reciente con datos ───────────────────

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
  const mesActual = maxFecha.getMonth() + 1;
  const añoActual = maxFecha.getFullYear();
  const diaMax = maxFecha.getDate();
  const diasDelMes = new Date(añoActual, mesActual, 0).getDate();
  const esParcial = diaMax < diasDelMes;

  // 12 meses atrás desde el mes actual = 13 puntos total
  const primerMes = retrocederMeses(añoActual, mesActual, 12);

  // Rango completo para la query SQL
  const fechaDesde = `${primerMes.año}-${String(primerMes.mes).padStart(2, '0')}-01T00:00:00+00`;
  const fechaHasta = mesActual === 12
    ? `${añoActual + 1}-01-01T00:00:00+00`
    : `${añoActual}-${String(mesActual + 1).padStart(2, '0')}-01T00:00:00+00`;

  // ─── Query RPC (agregación en SQL) ──────────────────────────────

  const { data, error } = await supabase.rpc('get_ingresos_mensuales', {
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
  });

  if (error) {
    throw new Error(`Error en get_ingresos_mensuales: ${error.message}`);
  }

  // Indexar resultados SQL por clave "YYYY-MM"
  const porMes = new Map<string, { ingresos: number; costos: number }>();
  for (const row of data || []) {
    porMes.set(row.mes, {
      ingresos: Number(row.total_ingresos),
      costos: Number(row.total_costos),
    });
  }

  // ─── Construir array ordenado de 13 meses ──────────────────────

  const resultado: IngresoMensual[] = [];
  let a = primerMes.año;
  let m = primerMes.mes;

  for (let i = 0; i < 13; i++) {
    const key = `${a}-${String(m).padStart(2, '0')}`;
    const datos = porMes.get(key) || { ingresos: 0, costos: 0 };
    const margen = datos.ingresos > 0
      ? ((datos.ingresos - datos.costos) / datos.ingresos) * 100
      : 0;

    const esUltimo = m === mesActual && a === añoActual;
    const añoCorto = String(a).slice(2);

    resultado.push({
      mes: `${MESES_CORTOS[m]} ${añoCorto}`,
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
