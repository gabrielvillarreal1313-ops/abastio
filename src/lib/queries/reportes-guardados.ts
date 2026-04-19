/**
 * reportes-guardados.ts — Persistencia de reportes del Explorer.
 *
 * Fase 13-1: wrappers para las RPCs de reportes guardados. Un reporte captura
 * una configuración del Explorer (dimensión activa + filtros + sorting) con
 * nombre y descripción, y opcionalmente se puede anclar al dashboard del dueño.
 */

import { supabase } from '@/lib/supabase';
import type { DimensionExplorer, FiltrosExplorer } from '@/lib/queries/explorer';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface ConfiguracionReporte {
  dimension: DimensionExplorer;
  filtros: FiltrosExplorer;
  sort_column?: string;
  sort_direction?: 'asc' | 'desc';
}

export interface ReporteGuardado {
  id: string;
  nombre: string;
  descripcion: string | null;
  configuracion: ConfiguracionReporte;
  anclado: boolean;
  orden_ancla: number | null;
  creado_en: string;
  actualizado_en: string;
}

// ─── Parseo defensivo ───────────────────────────────────────────────────────

function parseConfiguracion(raw: unknown): ConfiguracionReporte {
  if (!raw || typeof raw !== 'object') {
    return { dimension: 'bodegas', filtros: {} };
  }
  const r = raw as Record<string, unknown>;
  const dim = (r.dimension as DimensionExplorer) ?? 'bodegas';
  const filtros = (r.filtros && typeof r.filtros === 'object')
    ? (r.filtros as FiltrosExplorer)
    : {};
  const sortDir = r.sort_direction === 'asc' || r.sort_direction === 'desc'
    ? (r.sort_direction as 'asc' | 'desc')
    : undefined;
  return {
    dimension: dim,
    filtros,
    sort_column: typeof r.sort_column === 'string' ? r.sort_column : undefined,
    sort_direction: sortDir,
  };
}

function parseReporte(r: Record<string, unknown>): ReporteGuardado {
  return {
    id: (r.id as string) ?? '',
    nombre: (r.nombre as string) ?? '',
    descripcion:
      r.descripcion === null || r.descripcion === undefined ? null : String(r.descripcion),
    configuracion: parseConfiguracion(r.configuracion),
    anclado: r.anclado === true || r.anclado === 'true',
    orden_ancla:
      r.orden_ancla === null || r.orden_ancla === undefined ? null : Number(r.orden_ancla),
    creado_en: (r.creado_en as string) ?? '',
    actualizado_en: (r.actualizado_en as string) ?? '',
  };
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getReportesUsuario(usuarioId: string): Promise<ReporteGuardado[]> {
  const { data, error } = await supabase.rpc('get_reportes_usuario', {
    p_usuario_id: usuarioId,
  });

  if (error) throw new Error(`Error consultando reportes: ${error.message}`);

  const rows: Record<string, unknown>[] = (data as Record<string, unknown>[]) || [];
  return rows.map(parseReporte);
}

export async function getReportesAnclados(usuarioId: string): Promise<ReporteGuardado[]> {
  const { data, error } = await supabase.rpc('get_reportes_anclados', {
    p_usuario_id: usuarioId,
  });

  if (error) throw new Error(`Error consultando reportes anclados: ${error.message}`);

  const rows: Record<string, unknown>[] = (data as Record<string, unknown>[]) || [];
  return rows.map(parseReporte);
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function guardarReporte(
  usuarioId: string,
  nombre: string,
  descripcion: string | null,
  configuracion: ConfiguracionReporte
): Promise<string> {
  const { data, error } = await supabase.rpc('guardar_reporte', {
    p_usuario_id: usuarioId,
    p_nombre: nombre,
    p_descripcion: descripcion,
    p_configuracion: configuracion,
  });

  if (error) throw new Error(`Error guardando reporte: ${error.message}`);

  return (data as string) ?? '';
}

export async function toggleAnclaReporte(
  reporteId: string,
  usuarioId: string,
  anclado: boolean
): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_ancla_reporte', {
    p_reporte_id: reporteId,
    p_usuario_id: usuarioId,
    p_anclado: anclado,
  });

  if (error) throw new Error(`Error actualizando ancla del reporte: ${error.message}`);

  return data === true || data === 'true';
}

export async function eliminarReporte(
  reporteId: string,
  usuarioId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('eliminar_reporte', {
    p_reporte_id: reporteId,
    p_usuario_id: usuarioId,
  });

  if (error) throw new Error(`Error eliminando reporte: ${error.message}`);

  return data === true || data === 'true';
}

export interface PatchReporte {
  nombre?: string;
  descripcion?: string | null;
  configuracion?: ConfiguracionReporte;
}

export async function actualizarReporte(
  reporteId: string,
  usuarioId: string,
  patch: PatchReporte
): Promise<boolean> {
  const { data, error } = await supabase.rpc('actualizar_reporte', {
    p_reporte_id: reporteId,
    p_usuario_id: usuarioId,
    p_nombre: patch.nombre ?? null,
    p_descripcion: patch.descripcion ?? null,
    p_configuracion: patch.configuracion ?? null,
  });

  if (error) throw new Error(`Error actualizando reporte: ${error.message}`);

  return data === true || data === 'true';
}
