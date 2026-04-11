/**
 * cotizacion-detalle.ts — Queries para detalle de una cotización.
 */

import { supabase } from '@/lib/supabase';

export interface CotizacionDetalle {
  id: string;
  numero_cotizacion: number;
  cliente_id: number;
  nombre_cliente: string;
  ciudad_cliente: string;
  tipo_cliente: string;
  vendedor_id: number;
  nombre_vendedor: string;
  estado: 'borrador' | 'enviada' | 'completada' | 'cancelada';
  fecha_creacion: string;
  fecha_envio: string | null;
  fecha_vencimiento: string;
  subtotal: number;
  margen_bruto_pct: number;
  ganancia_bruta: number;
  total_lineas: number;
  notas: string;
}

export interface CotizacionLinea {
  id: string;
  sku: string;
  nombre_producto: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  costo_unitario: number;
  descuento_pct: number;
  precio_final: number;
  total_linea: number;
  margen_pct: number;
  origen: 'recompra' | 'cross_sell' | 'manual';
}

export async function getCotizacionDetalle(cotizacionId: string): Promise<CotizacionDetalle | null> {
  const { data, error } = await supabase.rpc('get_cotizacion_detalle', { p_cotizacion_id: cotizacionId });

  if (error) {
    throw new Error(`Error consultando detalle de cotización: ${error.message}`);
  }

  const rows = data as Record<string, unknown>[] | null;
  if (!rows || rows.length === 0) return null;

  const r = rows[0];
  return {
    id: (r.id as string) ?? '',
    numero_cotizacion: Number(r.numero_cotizacion) || 0,
    cliente_id: Number(r.cliente_id) || 0,
    nombre_cliente: (r.nombre_cliente as string) ?? '',
    ciudad_cliente: (r.ciudad_cliente as string) ?? '',
    tipo_cliente: (r.tipo_cliente as string) ?? '',
    vendedor_id: Number(r.vendedor_id) || 0,
    nombre_vendedor: (r.nombre_vendedor as string) ?? '',
    estado: ((r.estado as string) ?? 'borrador') as CotizacionDetalle['estado'],
    fecha_creacion: (r.fecha_creacion as string) ?? '',
    fecha_envio: r.fecha_envio ? String(r.fecha_envio) : null,
    fecha_vencimiento: (r.fecha_vencimiento as string) ?? '',
    subtotal: Number(r.subtotal) || 0,
    margen_bruto_pct: Number(r.margen_bruto_pct) || 0,
    ganancia_bruta: Number(r.ganancia_bruta) || 0,
    total_lineas: Number(r.total_lineas) || 0,
    notas: (r.notas as string) ?? '',
  };
}

export async function getCotizacionLineas(cotizacionId: string): Promise<CotizacionLinea[]> {
  const { data, error } = await supabase.rpc('get_cotizacion_lineas', { p_cotizacion_id: cotizacionId });

  if (error) {
    throw new Error(`Error consultando líneas de cotización: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    id: (r.id as string) ?? '',
    sku: (r.sku as string) ?? '',
    nombre_producto: (r.nombre_producto as string) ?? '',
    cantidad: Number(r.cantidad) || 0,
    unidad: (r.unidad as string) ?? 'PZA',
    precio_unitario: Number(r.precio_unitario) || 0,
    costo_unitario: Number(r.costo_unitario) || 0,
    descuento_pct: Number(r.descuento_pct) || 0,
    precio_final: Number(r.precio_final) || 0,
    total_linea: Number(r.total_linea) || 0,
    margen_pct: Number(r.margen_pct) || 0,
    origen: ((r.origen as string) ?? 'manual') as CotizacionLinea['origen'],
  }));
}
