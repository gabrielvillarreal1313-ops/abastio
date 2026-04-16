/**
 * oportunidades-trabajadas.ts — Mutación para registrar acciones del rep sobre oportunidades.
 *
 * Fase 9: tracking de cotizadas, descartadas, y pospuestas.
 */

import { supabase } from '@/lib/supabase';

export interface RegistrarOportunidadParams {
  vendedor_id: number;
  cliente_id: number;
  accion: 'cotizada' | 'descartada' | 'pospuesta';
  notas?: string | null;
  fecha_reaparicion?: string | null; // 'YYYY-MM-DD' para pospuestas
  cotizacion_id?: string | null;
}

export async function registrarOportunidadTrabajada(params: RegistrarOportunidadParams): Promise<string> {
  const { data, error } = await supabase.rpc('registrar_oportunidad_trabajada', {
    p_vendedor_id: params.vendedor_id,
    p_cliente_id: params.cliente_id,
    p_accion: params.accion,
    p_notas: params.notas ?? null,
    p_fecha_reaparicion: params.fecha_reaparicion ?? null,
    p_cotizacion_id: params.cotizacion_id ?? null,
  });

  if (error) throw new Error(`Error registrando oportunidad trabajada: ${error.message}`);

  return (data as string) ?? '';
}
