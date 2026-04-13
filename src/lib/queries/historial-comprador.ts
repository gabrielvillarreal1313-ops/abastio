/**
 * historial-comprador.ts — Historial de acciones del comprador.
 *
 * Consulta la tabla acciones_comprador vía RPC con filtros opcionales.
 * Polimórfico: maneja entidad_tipo 'po_sugerida' y 'min_max_override'.
 * Límite de 500 filas en el SQL — no necesita paginación con .range().
 */

import { supabase } from '@/lib/supabase';

export interface HistorialAccion {
  accion_id: string;
  tipo_accion: 'po_toma_revision' | 'po_aprobacion' | 'po_descarte' | 'po_modificacion' | 'min_max_override';
  creada_en: string;
  po_id: string;
  po_referencia: string;
  bodega_nombre: string;
  valor_monetario: number | null;
  estado_po_actual: string | null;
  notas: string | null;
  metadata: Record<string, unknown>;
  entidad_tipo: 'po_sugerida' | 'min_max_override';
  producto_id: string | null;
}

export interface FiltrosHistorial {
  fechaDesde?: string;  // 'YYYY-MM-DD'
  fechaHasta?: string;  // 'YYYY-MM-DD'
  tipoAccion?: string;
  entidadTipo?: string;
  entidadId?: string;
}

export async function getHistorialComprador(
  usuarioId: string,
  filtros?: FiltrosHistorial
): Promise<HistorialAccion[]> {
  const params: Record<string, unknown> = {
    p_usuario_id: usuarioId,
  };
  if (filtros?.fechaDesde) params.p_fecha_desde = filtros.fechaDesde;
  if (filtros?.fechaHasta) params.p_fecha_hasta = filtros.fechaHasta;
  if (filtros?.tipoAccion) params.p_tipo_accion = filtros.tipoAccion;
  if (filtros?.entidadTipo) params.p_entidad_tipo = filtros.entidadTipo;
  if (filtros?.entidadId) params.p_entidad_id = filtros.entidadId;

  const { data, error } = await supabase.rpc('get_historial_comprador', params);

  if (error) throw new Error(`Error consultando historial del comprador: ${error.message}`);

  return (data || []).map((r: Record<string, unknown>) => ({
    accion_id: (r.accion_id as string) ?? '',
    tipo_accion: ((r.tipo_accion as string) ?? 'po_toma_revision') as HistorialAccion['tipo_accion'],
    creada_en: (r.creada_en as string) ?? '',
    po_id: (r.po_id as string) ?? '',
    po_referencia: (r.po_referencia as string) ?? '',
    bodega_nombre: (r.bodega_nombre as string) ?? '',
    valor_monetario: r.valor_monetario != null ? Number(r.valor_monetario) : null,
    estado_po_actual: (r.estado_po_actual as string) ?? null,
    notas: (r.notas as string) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    entidad_tipo: ((r.entidad_tipo as string) ?? 'po_sugerida') as HistorialAccion['entidad_tipo'],
    producto_id: (r.producto_id as string) ?? null,
  }));
}
