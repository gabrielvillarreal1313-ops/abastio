/**
 * pos-sugeridas-pendientes.ts — Lista de POs sugeridas pendientes de revisión.
 * Retorna cabecera sin líneas (para listas y el Tablero de compras).
 */

import { supabase } from '@/lib/supabase';

export interface PoSugeridaResumen {
  id: string;
  bodega_id: number;
  bodega_nombre: string;
  estado: string;
  cantidad_items: number;
  valor_total_estimado: number;
  urgencia: 'alta' | 'media' | 'baja';
  comprador_id_revisor: string | null;
  comprador_nombre_revisor: string | null;
  generada_en: string;
  actualizada_en: string;
}

export async function getPosSugeridasPendientes(): Promise<PoSugeridaResumen[]> {
  const { data, error } = await supabase.rpc('get_pos_sugeridas_pendientes');

  if (error) throw new Error(`Error consultando POs sugeridas pendientes: ${error.message}`);

  return (data || []).map((r: Record<string, unknown>) => ({
    id: (r.id as string) ?? '',
    bodega_id: Number(r.bodega_id) || 0,
    bodega_nombre: (r.bodega_nombre as string) ?? '',
    estado: (r.estado as string) ?? 'pendiente_revision',
    cantidad_items: Number(r.cantidad_items) || 0,
    valor_total_estimado: Number(r.valor_total_estimado) || 0,
    urgencia: (r.urgencia as PoSugeridaResumen['urgencia']) ?? 'media',
    comprador_id_revisor: r.comprador_id_revisor ? String(r.comprador_id_revisor) : null,
    comprador_nombre_revisor: r.comprador_nombre_revisor ? String(r.comprador_nombre_revisor) : null,
    generada_en: (r.generada_en as string) ?? '',
    actualizada_en: (r.actualizada_en as string) ?? '',
  }));
}
