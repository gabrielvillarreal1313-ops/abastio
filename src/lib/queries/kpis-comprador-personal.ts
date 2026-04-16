/**
 * kpis-comprador-personal.ts — KPIs del mes actual filtrados por un comprador específico.
 *
 * Fase 5: alimenta la página "Mi desempeño" del comprador.
 * "Mes actual" = mes de MAX(fecha) de transacciones (regla 10 de CLAUDE.md).
 */

import { supabase } from '@/lib/supabase';

export interface KpisCompradorPersonal {
  mes_actual: string;
  pos_aprobadas_mes: number;
  pos_descartadas_mes: number;
  valor_aprobado_mes: number;
  overrides_mes: number;
  tiempo_promedio_revision_horas: number | null;
  pos_aprobadas_mes_anterior: number;
  valor_aprobado_mes_anterior: number;
}

export async function getKpisCompradorPersonal(usuarioId: string): Promise<KpisCompradorPersonal | null> {
  const { data, error } = await supabase.rpc('get_kpis_comprador_personal', {
    p_usuario_id: usuarioId,
  });

  if (error) throw new Error(`Error consultando KPIs personales del comprador: ${error.message}`);

  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  const r: Record<string, unknown> = Array.isArray(data) ? data[0] : data;

  return {
    mes_actual: (r.mes_actual as string) ?? '',
    pos_aprobadas_mes: Number(r.pos_aprobadas_mes) || 0,
    pos_descartadas_mes: Number(r.pos_descartadas_mes) || 0,
    valor_aprobado_mes: Number(r.valor_aprobado_mes) || 0,
    overrides_mes: Number(r.overrides_mes) || 0,
    tiempo_promedio_revision_horas: r.tiempo_promedio_revision_horas != null ? Number(r.tiempo_promedio_revision_horas) : null,
    pos_aprobadas_mes_anterior: Number(r.pos_aprobadas_mes_anterior) || 0,
    valor_aprobado_mes_anterior: Number(r.valor_aprobado_mes_anterior) || 0,
  };
}
