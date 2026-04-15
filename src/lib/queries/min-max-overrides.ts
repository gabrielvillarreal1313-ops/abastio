/**
 * min-max-overrides.ts — Operaciones de override de min/max.
 *
 * Refactor 4B-refactor-1: escribe directamente en inventario.cantidad_minima/maxima.
 * El historial de cambios vive en acciones_comprador con entidad_tipo = 'inventario'.
 */

import { supabase } from '@/lib/supabase';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface UpsertMinMaxParams {
  producto_id: string;
  bodega_id: number;
  tipo_seleccion: 'recomendado' | 'personalizado';
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

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Aplica un override de min/max escribiendo directamente en inventario.
 * Registra la acción en acciones_comprador.
 */
export async function upsertMinMaxOverride(params: UpsertMinMaxParams): Promise<void> {
  const { error } = await supabase.rpc('upsert_min_max_override', {
    p_producto_id: params.producto_id,
    p_bodega_id: params.bodega_id,
    p_tipo_seleccion: params.tipo_seleccion,
    p_minimo: params.minimo,
    p_maximo: params.maximo,
    p_notas: params.notas,
    p_usuario_id: params.usuario_id,
  });

  if (error) throw new Error(`Error guardando override: ${error.message}`);
}

/**
 * Aplica el tipo "recomendado" en bulk a múltiples pares producto-bodega.
 * Calcula los valores recomendados sobre la marcha y escribe en inventario.
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
