/**
 * calculo-recomendado.ts — Componentes de la fórmula de min/max recomendado.
 *
 * Expone los valores reales que usa _calcular_recomendados para que el popover
 * del modal de override pueda mostrar la fórmula expandida al usuario.
 */

import { supabase } from '@/lib/supabase';

export interface CalculoRecomendado {
  demandaDiariaPromedio: number;
  ventanaDias: number;
  diasCoberturaMinimo: number;
  diasCoberturaMaximo: number;
  minimoCalculado: number;
  maximoCalculado: number;
}

export async function getCalculoRecomendado(
  productoId: string,
  bodegaId: number
): Promise<CalculoRecomendado | null> {
  const { data, error } = await supabase.rpc('get_calculo_recomendado', {
    p_producto_id: productoId,
    p_bodega_id: bodegaId,
  });

  if (error) throw new Error(`Error consultando cálculo recomendado: ${error.message}`);

  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  const r: Record<string, unknown> = Array.isArray(data) ? data[0] : data;

  return {
    demandaDiariaPromedio: Number(r.demanda_diaria_promedio) || 0,
    ventanaDias: Number(r.ventana_dias) || 90,
    diasCoberturaMinimo: Number(r.dias_cobertura_minimo) || 21,
    diasCoberturaMaximo: Number(r.dias_cobertura_maximo) || 60,
    minimoCalculado: Number(r.minimo_calculado) || 0,
    maximoCalculado: Number(r.maximo_calculado) || 0,
  };
}
