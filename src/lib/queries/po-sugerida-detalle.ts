/**
 * po-sugerida-detalle.ts — Detalle completo de una PO sugerida incluyendo líneas JSONB.
 */

import { supabase } from '@/lib/supabase';

/** Forma de cada línea dentro del JSONB array */
export interface LineaPoSugerida {
  sku: string;
  nombre_producto: string;
  cantidad_sugerida: number;
  cantidad_ajustada: number;
  costo_unitario_proxy: number;
  total_linea: number;
  stock_actual: number;
  minimo_recomendado: number;
  meses_de_suministro: number | null;
  lead_time_dias: number;
}

export interface PoSugeridaDetalle {
  id: string;
  bodega_id: number;
  bodega_nombre: string;
  estado: 'pendiente_revision' | 'aprobada' | 'descartada';
  lineas: LineaPoSugerida[];
  cantidad_items: number;
  valor_total_estimado: number;
  urgencia: 'alta' | 'media' | 'baja';
  comprador_id_revisor: string | null;
  comprador_nombre_revisor: string | null;
  fecha_revision: string | null;
  notas: string | null;
  generada_en: string;
  actualizada_en: string;
}

function parseLinea(l: Record<string, unknown>): LineaPoSugerida {
  return {
    sku: (l.sku as string) ?? '',
    nombre_producto: (l.nombre_producto as string) ?? '',
    cantidad_sugerida: Number(l.cantidad_sugerida) || 0,
    cantidad_ajustada: Number(l.cantidad_ajustada) || 0,
    costo_unitario_proxy: Number(l.costo_unitario_proxy) || 0,
    total_linea: Number(l.total_linea) || 0,
    stock_actual: Number(l.stock_actual) || 0,
    minimo_recomendado: Number(l.minimo_recomendado) || 0,
    meses_de_suministro: l.meses_de_suministro != null ? Number(l.meses_de_suministro) : null,
    lead_time_dias: Number(l.lead_time_dias) || 14, // fallback 14 para POs creadas antes de este campo
  };
}

function parseDetalle(r: Record<string, unknown>): PoSugeridaDetalle {
  const lineasRaw = Array.isArray(r.lineas) ? r.lineas : [];
  return {
    id: (r.id as string) ?? '',
    bodega_id: Number(r.bodega_id) || 0,
    bodega_nombre: (r.bodega_nombre as string) ?? '',
    estado: (r.estado as PoSugeridaDetalle['estado']) ?? 'pendiente_revision',
    lineas: lineasRaw.map((l: Record<string, unknown>) => parseLinea(l)),
    cantidad_items: Number(r.cantidad_items) || 0,
    valor_total_estimado: Number(r.valor_total_estimado) || 0,
    urgencia: (r.urgencia as PoSugeridaDetalle['urgencia']) ?? 'media',
    comprador_id_revisor: r.comprador_id_revisor ? String(r.comprador_id_revisor) : null,
    comprador_nombre_revisor: r.comprador_nombre_revisor ? String(r.comprador_nombre_revisor) : null,
    fecha_revision: r.fecha_revision ? String(r.fecha_revision) : null,
    notas: r.notas ? String(r.notas) : null,
    generada_en: (r.generada_en as string) ?? '',
    actualizada_en: (r.actualizada_en as string) ?? '',
  };
}

export async function getPoSugeridaDetalle(poId: string): Promise<PoSugeridaDetalle | null> {
  const { data, error } = await supabase.rpc('get_po_sugerida_detalle', { p_po_id: poId });

  if (error) throw new Error(`Error consultando detalle de PO sugerida: ${error.message}`);
  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  const row = Array.isArray(data) ? data[0] : data;
  return parseDetalle(row as Record<string, unknown>);
}
