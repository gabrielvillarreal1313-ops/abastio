/**
 * pos-por-revisor.ts — POs asignadas a un comprador (todas, sin importar estado).
 *
 * Fase 4C: alimenta la sección "Mi actividad" del comprador.
 * Ordenadas: pendiente_revision primero, luego por actualizada_en DESC.
 */

import { supabase } from '@/lib/supabase';

export interface PoRevisorResumen {
  id: string;
  bodega_id: number;
  bodega_nombre: string;
  estado: string;
  cantidad_items: number;
  valor_total_estimado: number;
  urgencia: 'alta' | 'media' | 'baja';
  notas: string | null;
  generada_en: string;
  actualizada_en: string;
}

export async function getPosPorRevisor(usuarioId: string): Promise<PoRevisorResumen[]> {
  const { data, error } = await supabase.rpc('get_pos_por_revisor', {
    p_usuario_id: usuarioId,
  });

  if (error) throw new Error(`Error consultando POs por revisor: ${error.message}`);

  return (data || []).map((r: Record<string, unknown>) => ({
    id: (r.id as string) ?? '',
    bodega_id: Number(r.bodega_id) || 0,
    bodega_nombre: (r.bodega_nombre as string) ?? '',
    estado: (r.estado as string) ?? 'pendiente_revision',
    cantidad_items: Number(r.cantidad_items) || 0,
    valor_total_estimado: Number(r.valor_total_estimado) || 0,
    urgencia: (r.urgencia as PoRevisorResumen['urgencia']) ?? 'media',
    notas: r.notas ? String(r.notas) : null,
    generada_en: (r.generada_en as string) ?? '',
    actualizada_en: (r.actualizada_en as string) ?? '',
  }));
}
