/**
 * overrides-recientes.ts — Últimos overrides de min/max hechos por un comprador.
 *
 * Fase 4C: alimenta la sección "Mi actividad" del comprador.
 * Resuelve producto y bodega desde el metadata JSONB de acciones_comprador.
 */

import { supabase } from '@/lib/supabase';

export interface OverrideReciente {
  accion_id: string;
  creada_en: string;
  producto_id: string;
  producto_sku: string;
  producto_nombre: string;
  bodega_id: number;
  bodega_nombre: string;
  tipo_seleccion: string;
  min_anterior: number;
  min_nuevo: number;
  max_anterior: number;
  max_nuevo: number;
  notas: string | null;
}

export async function getOverridesRecientes(
  usuarioId: string,
  limite: number = 20
): Promise<OverrideReciente[]> {
  const { data, error } = await supabase.rpc('get_overrides_recientes', {
    p_usuario_id: usuarioId,
    p_limite: limite,
  });

  if (error) throw new Error(`Error consultando overrides recientes: ${error.message}`);

  return (data || []).map((r: Record<string, unknown>) => ({
    accion_id: (r.accion_id as string) ?? '',
    creada_en: (r.creada_en as string) ?? '',
    producto_id: (r.producto_id as string) ?? '',
    producto_sku: (r.producto_sku as string) ?? '',
    producto_nombre: (r.producto_nombre as string) ?? '',
    bodega_id: Number(r.bodega_id) || 0,
    bodega_nombre: (r.bodega_nombre as string) ?? '',
    tipo_seleccion: (r.tipo_seleccion as string) ?? '',
    min_anterior: Number(r.min_anterior) || 0,
    min_nuevo: Number(r.min_nuevo) || 0,
    max_anterior: Number(r.max_anterior) || 0,
    max_nuevo: Number(r.max_nuevo) || 0,
    notas: r.notas ? String(r.notas) : null,
  }));
}
