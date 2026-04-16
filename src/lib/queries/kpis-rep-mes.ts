/**
 * kpis-rep-mes.ts — KPIs del mes actual para un vendedor específico.
 *
 * Fase 7: alimenta el Tablero de ventas del rep.
 * "Mes actual" = mes de MAX(fecha) de transacciones (regla 10 de CLAUDE.md).
 */

import { supabase } from '@/lib/supabase';

export interface KpisRepMes {
  mes_actual: string;
  ingresos_mes: number;
  ingresos_mes_anterior: number;
  margen_pct_mes: number;
  transacciones_mes: number;
  clientes_activos_mes: number;
  cotizaciones_mes: number;
  cotizaciones_mes_anterior: number;
  ticket_promedio_mes: number;
}

export async function getKpisRepMes(vendedorId: number): Promise<KpisRepMes | null> {
  const { data, error } = await supabase.rpc('get_kpis_rep_mes', {
    p_vendedor_id: vendedorId,
  });

  if (error) throw new Error(`Error consultando KPIs del rep: ${error.message}`);

  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  const r: Record<string, unknown> = Array.isArray(data) ? data[0] : data;

  return {
    mes_actual: (r.mes_actual as string) ?? '',
    ingresos_mes: Number(r.ingresos_mes) || 0,
    ingresos_mes_anterior: Number(r.ingresos_mes_anterior) || 0,
    margen_pct_mes: Number(r.margen_pct_mes) || 0,
    transacciones_mes: Number(r.transacciones_mes) || 0,
    clientes_activos_mes: Number(r.clientes_activos_mes) || 0,
    cotizaciones_mes: Number(r.cotizaciones_mes) || 0,
    cotizaciones_mes_anterior: Number(r.cotizaciones_mes_anterior) || 0,
    ticket_promedio_mes: Number(r.ticket_promedio_mes) || 0,
  };
}
