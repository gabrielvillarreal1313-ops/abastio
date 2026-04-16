/**
 * actividad-mensual-comprador.ts — Serie de 12 meses de actividad del comprador.
 *
 * Fase 5: alimenta la gráfica histórica en "Mi desempeño".
 * Incluye meses con 0 actividad (LEFT JOIN a generate_series).
 */

import { supabase } from '@/lib/supabase';

export interface ActividadMensualComprador {
  mes: string;
  aprobaciones: number;
  descartes: number;
  overrides: number;
  valor_aprobado: number;
}

export async function getActividadMensualComprador(usuarioId: string): Promise<ActividadMensualComprador[]> {
  const { data, error } = await supabase.rpc('get_actividad_mensual_comprador', {
    p_usuario_id: usuarioId,
  });

  if (error) throw new Error(`Error consultando actividad mensual del comprador: ${error.message}`);

  return (data || []).map((r: Record<string, unknown>) => ({
    mes: (r.mes as string) ?? '',
    aprobaciones: Number(r.aprobaciones) || 0,
    descartes: Number(r.descartes) || 0,
    overrides: Number(r.overrides) || 0,
    valor_aprobado: Number(r.valor_aprobado) || 0,
  }));
}
