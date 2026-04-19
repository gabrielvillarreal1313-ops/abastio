/**
 * estacionalidad-cliente-sku.ts — Detección de patrón estacional por par.
 *
 * Wrapper para get_estacionalidad_cliente_sku. Retorna 12 filas (una por mes)
 * comparando compras del año actual vs año anterior. tiene_patron = true indica
 * que el cliente compró ese producto en ese mes en ambos años (repetición
 * estacional).
 */

import { supabase } from '@/lib/supabase';

export interface EstacionalidadMes {
  mes: number;
  nombreMes: string;
  comprasAnioActual: number;
  cantidadAnioActual: number;
  valorAnioActual: number;
  comprasAnioAnterior: number;
  cantidadAnioAnterior: number;
  valorAnioAnterior: number;
  tienePatron: boolean;
}

export async function getEstacionalidadClienteSku(
  clienteId: number,
  sku: string
): Promise<EstacionalidadMes[]> {
  const { data, error } = await supabase.rpc('get_estacionalidad_cliente_sku', {
    p_cliente_id: clienteId,
    p_sku: sku,
  });

  if (error) throw new Error(`Error consultando estacionalidad cliente-SKU: ${error.message}`);

  const rows: Record<string, unknown>[] = (data as Record<string, unknown>[]) || [];

  return rows.map((r) => ({
    mes: Number(r.mes) || 0,
    nombreMes: (r.nombre_mes as string) ?? '',
    comprasAnioActual: Number(r.compras_anio_actual) || 0,
    cantidadAnioActual: Number(r.cantidad_anio_actual) || 0,
    valorAnioActual: Number(r.valor_anio_actual) || 0,
    comprasAnioAnterior: Number(r.compras_anio_anterior) || 0,
    cantidadAnioAnterior: Number(r.cantidad_anio_anterior) || 0,
    valorAnioAnterior: Number(r.valor_anio_anterior) || 0,
    tienePatron: r.tiene_patron === true || r.tiene_patron === 'true',
  }));
}
