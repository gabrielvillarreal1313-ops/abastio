/**
 * po-sugeridas-mutations.ts — Operaciones de escritura sobre POs sugeridas.
 *
 * Incluye: generar, tomar revisión, aprobar, descartar, actualizar líneas.
 * Importante: NO usar JSON.stringify() al pasar lineas — Supabase JS serializa automáticamente.
 */

import { supabase } from '@/lib/supabase';
import type { PoSugeridaDetalle, LineaPoSugerida } from '@/lib/queries/po-sugerida-detalle';

// ─── Generar POs sugeridas ──────────────────────────────────────────────────

/** Genera POs sugeridas a partir de get_sugerencias_compra(). Retorna conteo de POs nuevas. */
export async function generarPosSugeridas(): Promise<number> {
  const { data, error } = await supabase.rpc('generar_pos_sugeridas');
  if (error) throw new Error(`Error generando POs sugeridas: ${error.message}`);
  return Number(data) || 0;
}

// ─── Tomar revisión ─────────────────────────────────────────────────────────

export interface ResultadoTomarRevision {
  poId: string;
  revisorActualId: string;
  tomada: boolean;
}

/** Asigna un revisor a una PO. Si ya tiene otro revisor, retorna tomada=false. */
export async function tomarRevisionPo(poId: string, usuarioId: string): Promise<ResultadoTomarRevision> {
  const { data, error } = await supabase.rpc('tomar_revision_po', {
    p_po_id: poId,
    p_usuario_id: usuarioId,
  });

  if (error) throw new Error(`Error tomando revisión de PO: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  return {
    poId: (row?.po_id as string) ?? poId,
    revisorActualId: (row?.comprador_id_revisor_actual as string) ?? '',
    tomada: row?.tomada === true,
  };
}

// ─── Aprobar PO ─────────────────────────────────────────────────────────────

/** Aprueba una PO sugerida. Solo el revisor asignado puede aprobar. */
export async function aprobarPo(poId: string, usuarioId: string, notas?: string): Promise<PoSugeridaDetalle> {
  const { data, error } = await supabase.rpc('aprobar_po', {
    p_po_id: poId,
    p_usuario_id: usuarioId,
    p_notas: notas ?? null,
  });

  if (error) throw new Error(`Error aprobando PO: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  return parsePoRow(row as Record<string, unknown>);
}

// ─── Descartar PO ───────────────────────────────────────────────────────────

/** Descarta una PO sugerida. Solo el revisor asignado puede descartar. */
export async function descartarPo(poId: string, usuarioId: string, notas?: string): Promise<PoSugeridaDetalle> {
  const { data, error } = await supabase.rpc('descartar_po', {
    p_po_id: poId,
    p_usuario_id: usuarioId,
    p_notas: notas ?? null,
  });

  if (error) throw new Error(`Error descartando PO: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  return parsePoRow(row as Record<string, unknown>);
}

// ─── Actualizar líneas ──────────────────────────────────────────────────────

/**
 * Reemplaza las líneas de una PO y recalcula metadatos.
 * IMPORTANTE: NO usar JSON.stringify(lineas) — Supabase JS serializa automáticamente.
 */
export async function actualizarLineasPo(
  poId: string,
  usuarioId: string,
  lineas: LineaPoSugerida[]
): Promise<PoSugeridaDetalle> {
  const { data, error } = await supabase.rpc('actualizar_lineas_po', {
    p_po_id: poId,
    p_usuario_id: usuarioId,
    p_lineas: lineas, // Supabase JS serializa automáticamente — NO usar JSON.stringify()
  });

  if (error) throw new Error(`Error actualizando líneas de PO: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  return parsePoRow(row as Record<string, unknown>);
}

// ─── Helper de parseo ───────────────────────────────────────────────────────

function parsePoRow(r: Record<string, unknown>): PoSugeridaDetalle {
  const lineasRaw = Array.isArray(r.lineas) ? r.lineas : [];
  return {
    id: (r.id as string) ?? '',
    bodega_id: Number(r.bodega_id) || 0,
    bodega_nombre: (r.bodega_nombre as string) ?? '',
    estado: (r.estado as PoSugeridaDetalle['estado']) ?? 'pendiente_revision',
    lineas: lineasRaw.map((l: Record<string, unknown>) => ({
      sku: (l.sku as string) ?? '',
      nombre_producto: (l.nombre_producto as string) ?? '',
      cantidad_sugerida: Number(l.cantidad_sugerida) || 0,
      cantidad_ajustada: Number(l.cantidad_ajustada) || 0,
      costo_unitario_proxy: Number(l.costo_unitario_proxy) || 0,
      total_linea: Number(l.total_linea) || 0,
      stock_actual: Number(l.stock_actual) || 0,
      minimo_recomendado: Number(l.minimo_recomendado) || 0,
      meses_de_suministro: l.meses_de_suministro != null ? Number(l.meses_de_suministro) : null,
      lead_time_dias: Number(l.lead_time_dias) || 14,
    })),
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
