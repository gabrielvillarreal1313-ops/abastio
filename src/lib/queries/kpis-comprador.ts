/**
 * kpis-comprador.ts — KPIs agregados del comprador para el mes actual.
 *
 * Retorna un solo objeto con métricas del mes. Algunos campos son placeholder
 * (retornan null) hasta fases futuras del pivot.
 *
 * "Mes actual" = mes de MAX(fecha) de transacciones (no fecha del sistema).
 */

import { supabase } from '@/lib/supabase';

export interface KpisComprador {
  mes_actual: string;
  valor_pos_aprobadas_mes: number;
  pos_pendientes_revision: number;
  skus_desabasto_critico: number;
  skus_desabasto_critico_mes_anterior: number | null;  // Placeholder — requiere snapshot histórico (V1)
  valor_capital_atrapado_total: number;
  tiempo_promedio_revision_horas: number | null;  // NULL si no hay POs cerradas en el mes
}

export async function getKpisComprador(): Promise<KpisComprador | null> {
  const { data, error } = await supabase.rpc('get_kpis_comprador_mes');

  if (error) throw new Error(`Error consultando KPIs del comprador: ${error.message}`);

  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  // La RPC retorna una sola fila — puede venir como array o como objeto
  const r: Record<string, unknown> = Array.isArray(data) ? data[0] : data;

  return {
    mes_actual: (r.mes_actual as string) ?? '',
    valor_pos_aprobadas_mes: Number(r.valor_pos_aprobadas_mes) || 0,
    pos_pendientes_revision: Number(r.pos_pendientes_revision) || 0,
    skus_desabasto_critico: Number(r.skus_desabasto_critico) || 0,
    skus_desabasto_critico_mes_anterior: r.skus_desabasto_critico_mes_anterior != null ? Number(r.skus_desabasto_critico_mes_anterior) : null,
    valor_capital_atrapado_total: Number(r.valor_capital_atrapado_total) || 0,
    tiempo_promedio_revision_horas: r.tiempo_promedio_revision_horas != null ? Number(r.tiempo_promedio_revision_horas) : null,
  };
}
