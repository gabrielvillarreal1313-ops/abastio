/**
 * min-max-overrides.ts — Operaciones sobre overrides de min/max por par producto-bodega.
 *
 * Fase 4B-1: infraestructura backend. La tabla existe pero las RPCs de cálculo
 * de inventario aún no la consultan (eso llega en 4B-2).
 */

import { supabase } from '@/lib/supabase';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface MinMaxOverride {
  id: string;
  tipo_seleccion: 'recomendado' | 'actual_erp' | 'personalizado';
  minimo: number;
  maximo: number;
  notas: string | null;
  usuario_id: string;
  usuario_nombre: string;
  creado_en: string;
  actualizado_en: string;
}

export interface UpsertMinMaxParams {
  producto_id: string;
  bodega_id: number;
  tipo_seleccion: 'recomendado' | 'actual_erp' | 'personalizado';
  minimo: number;
  maximo: number;
  notas: string | null;
  usuario_id: string;
}

export interface BulkPar {
  producto_id: string;
  bodega_id: number;
}

export interface BulkResultado {
  procesados: number;
  errores: number;
}

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Lee el override vigente para un par producto-bodega.
 * Retorna null si no existe override.
 */
export async function getMinMaxOverride(
  productoId: string,
  bodegaId: number
): Promise<MinMaxOverride | null> {
  const { data, error } = await supabase.rpc('get_min_max_override', {
    p_producto_id: productoId,
    p_bodega_id: bodegaId,
  });

  if (error) throw new Error(`Error consultando override: ${error.message}`);

  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  const r: Record<string, unknown> = Array.isArray(data) ? data[0] : data;

  return {
    id: (r.id as string) ?? '',
    tipo_seleccion: ((r.tipo_seleccion as string) ?? 'recomendado') as MinMaxOverride['tipo_seleccion'],
    minimo: Number(r.minimo) || 0,
    maximo: Number(r.maximo) || 0,
    notas: (r.notas as string) ?? null,
    usuario_id: (r.usuario_id as string) ?? '',
    usuario_nombre: (r.usuario_nombre as string) ?? '',
    creado_en: (r.creado_en as string) ?? '',
    actualizado_en: (r.actualizado_en as string) ?? '',
  };
}

/**
 * Crea o actualiza un override. Registra la acción en acciones_comprador.
 * Retorna el id del override.
 */
export async function upsertMinMaxOverride(params: UpsertMinMaxParams): Promise<string> {
  const { data, error } = await supabase.rpc('upsert_min_max_override', {
    p_producto_id: params.producto_id,
    p_bodega_id: params.bodega_id,
    p_tipo_seleccion: params.tipo_seleccion,
    p_minimo: params.minimo,
    p_maximo: params.maximo,
    p_notas: params.notas,
    p_usuario_id: params.usuario_id,
  });

  if (error) throw new Error(`Error guardando override: ${error.message}`);

  // La RPC retorna un uuid escalar
  return (data as string) ?? '';
}

/**
 * Aplica el tipo "recomendado" en bulk a múltiples pares producto-bodega.
 * Calcula los valores recomendados sobre la marcha.
 */
export async function bulkAplicarRecomendados(
  pares: BulkPar[],
  usuarioId: string
): Promise<BulkResultado> {
  const { data, error } = await supabase.rpc('bulk_aplicar_recomendados', {
    p_pares: pares,
    p_usuario_id: usuarioId,
  });

  if (error) throw new Error(`Error aplicando recomendados en bulk: ${error.message}`);

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return { procesados: 0, errores: 0 };
  }

  const r: Record<string, unknown> = Array.isArray(data) ? data[0] : data;

  return {
    procesados: Number(r.procesados) || 0,
    errores: Number(r.errores) || 0,
  };
}
