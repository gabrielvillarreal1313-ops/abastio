/**
 * historial-oportunidades-rep.ts — Historial de acciones del rep sobre oportunidades.
 *
 * Fase 9: muestra cotizadas, descartadas, y pospuestas con filtros de fecha.
 */

import { supabase } from '@/lib/supabase';

export interface HistorialOportunidadRep {
  id: string;
  cliente_id: number;
  cliente_nombre: string;
  accion: 'cotizada' | 'descartada' | 'pospuesta';
  notas: string | null;
  fecha_reaparicion: string | null;
  cotizacion_id: string | null;
  creada_en: string;
}

export async function getHistorialOportunidadesRep(
  vendedorId: number,
  fechaDesde?: string,
  fechaHasta?: string,
): Promise<HistorialOportunidadRep[]> {
  const params: Record<string, unknown> = {
    p_vendedor_id: vendedorId,
  };
  if (fechaDesde) params.p_fecha_desde = fechaDesde;
  if (fechaHasta) params.p_fecha_hasta = fechaHasta;

  const { data, error } = await supabase.rpc('get_historial_oportunidades_rep', params);

  if (error) throw new Error(`Error consultando historial de oportunidades: ${error.message}`);

  return (data || []).map((r: Record<string, unknown>) => ({
    id: (r.id as string) ?? '',
    cliente_id: Number(r.cliente_id) || 0,
    cliente_nombre: (r.cliente_nombre as string) ?? '',
    accion: ((r.accion as string) ?? 'descartada') as HistorialOportunidadRep['accion'],
    notas: (r.notas as string) ?? null,
    fecha_reaparicion: (r.fecha_reaparicion as string) ?? null,
    cotizacion_id: (r.cotizacion_id as string) ?? null,
    creada_en: (r.creada_en as string) ?? '',
  }));
}
