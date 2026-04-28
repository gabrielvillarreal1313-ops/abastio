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

export type TipoGrafica =
  | 'barras_horizontales'
  | 'barras_verticales'
  | 'lineas'
  | 'area'
  | 'donut';

export type MetricaGrafica =
  | 'ventas_ytd'
  | 'ventas_lytd'
  | 'delta_ventas_abs'
  | 'delta_ventas_pct'
  | 'gm_ytd'
  | 'gm_lytd'
  | 'delta_gm_abs'
  | 'delta_gm_pct';

export type TopNGrafica = 5 | 10 | 15 | 25 | 50 | 'todos';

/**
 * Configuración de gráfica para reportes guardados.
 *
 * Reglas de validación (aplicadas en UI, no en backend):
 * - Líneas y Área solo válidas cuando la dimensión del reporte es 'meses'
 * - Barras horizontales y Donut no válidas en dimensión 'meses'
 * - Donut solo válida con métricas absolutas (no deltas: delta_ventas_abs, delta_ventas_pct, delta_gm_abs, delta_gm_pct)
 * - comparar_lytd se fuerza false (y deshabilita en UI) cuando tipo === 'donut' o cuando metrica es delta
 * - top_n === 'todos' se capa internamente a 100 filas con aviso visual
 */
export interface ConfiguracionGrafica {
  tipo: TipoGrafica;
  metrica: MetricaGrafica;
  top_n: TopNGrafica;
  comparar_lytd: boolean;
}

export type VistaReporte = 'tabla' | 'grafica';

export interface ConfiguracionReporte {
  dimension: DimensionExplorer;
  filtros: FiltrosExplorer;
  sort_column?: string;
  sort_direction?: 'asc' | 'desc';
  vista?: VistaReporte;
  grafica?: ConfiguracionGrafica;
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

const TIPOS_GRAFICA: TipoGrafica[] = [
  'barras_horizontales',
  'barras_verticales',
  'lineas',
  'area',
  'donut',
];

const METRICAS_GRAFICA: MetricaGrafica[] = [
  'ventas_ytd',
  'ventas_lytd',
  'delta_ventas_abs',
  'delta_ventas_pct',
  'gm_ytd',
  'gm_lytd',
  'delta_gm_abs',
  'delta_gm_pct',
];

const TOP_N_VALIDOS: TopNGrafica[] = [5, 10, 15, 25, 50, 'todos'];

function parseGrafica(raw: unknown): ConfiguracionGrafica | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const g = raw as Record<string, unknown>;
  const tipo = TIPOS_GRAFICA.includes(g.tipo as TipoGrafica)
    ? (g.tipo as TipoGrafica)
    : 'barras_verticales';
  const metrica = METRICAS_GRAFICA.includes(g.metrica as MetricaGrafica)
    ? (g.metrica as MetricaGrafica)
    : 'ventas_ytd';
  const topN = TOP_N_VALIDOS.includes(g.top_n as TopNGrafica)
    ? (g.top_n as TopNGrafica)
    : 10;
  return {
    tipo,
    metrica,
    top_n: topN,
    comparar_lytd: g.comparar_lytd === true || g.comparar_lytd === 'true',
  };
}

function parseConfiguracion(raw: unknown): ConfiguracionReporte {
  if (!raw || typeof raw !== 'object') {
    return { dimension: 'bodegas', filtros: {}, vista: 'tabla' };
  }
  const r = raw as Record<string, unknown>;
  const dim = (r.dimension as DimensionExplorer) ?? 'bodegas';
  const filtros = (r.filtros && typeof r.filtros === 'object')
    ? (r.filtros as FiltrosExplorer)
    : {};
  const sortDir = r.sort_direction === 'asc' || r.sort_direction === 'desc'
    ? (r.sort_direction as 'asc' | 'desc')
    : undefined;
  // Reportes pre-existentes sin `vista` se interpretan como tabla.
  const vista: VistaReporte = r.vista === 'grafica' ? 'grafica' : 'tabla';
  const grafica = vista === 'grafica' ? parseGrafica(r.grafica) : undefined;
  return {
    dimension: dim,
    filtros,
    sort_column: typeof r.sort_column === 'string' ? r.sort_column : undefined,
    sort_direction: sortDir,
    vista,
    grafica,
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
