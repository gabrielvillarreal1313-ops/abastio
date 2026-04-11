/**
 * cotizaciones-lista.ts — Query para la lista de cotizaciones.
 */

import { supabase } from '@/lib/supabase';

export interface CotizacionLista {
  id: string;
  numero_cotizacion: number;
  cliente_id: number;
  nombre_cliente: string;
  vendedor_id: number;
  nombre_vendedor: string;
  estado: 'borrador' | 'enviada' | 'completada' | 'cancelada';
  fecha_creacion: string;
  fecha_vencimiento: string;
  subtotal: number;
  margen_bruto_pct: number;
  ganancia_bruta: number;
  total_lineas: number;
  notas: string;
}

export async function getCotizacionesLista(): Promise<CotizacionLista[]> {
  const { data, error } = await supabase.rpc('get_cotizaciones_lista');

  if (error) {
    throw new Error(`Error consultando cotizaciones: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    id: (r.id as string) ?? '',
    numero_cotizacion: Number(r.numero_cotizacion) || 0,
    cliente_id: Number(r.cliente_id) || 0,
    nombre_cliente: (r.nombre_cliente as string) ?? '',
    vendedor_id: Number(r.vendedor_id) || 0,
    nombre_vendedor: (r.nombre_vendedor as string) ?? '',
    estado: ((r.estado as string) ?? 'borrador') as CotizacionLista['estado'],
    fecha_creacion: (r.fecha_creacion as string) ?? '',
    fecha_vencimiento: (r.fecha_vencimiento as string) ?? '',
    subtotal: Number(r.subtotal) || 0,
    margen_bruto_pct: Number(r.margen_bruto_pct) || 0,
    ganancia_bruta: Number(r.ganancia_bruta) || 0,
    total_lineas: Number(r.total_lineas) || 0,
    notas: (r.notas as string) ?? '',
  }));
}
