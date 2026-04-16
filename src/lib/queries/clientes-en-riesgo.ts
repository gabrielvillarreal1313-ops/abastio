/**
 * clientes-en-riesgo.ts — Query para detección de clientes en riesgo.
 *
 * Tipo A (declive): compras históricas >$150K y caída ≥50% en últimos 3 meses.
 * Tipo B (inactivo): compraba regularmente y lleva 60+ días sin comprar.
 */

import { supabase } from '@/lib/supabase';

export interface ClienteEnRiesgo {
  cliente_id: number;
  razon_social: string;
  ciudad: string;
  tipo_cliente: string;
  compra_mensual_baseline: number;
  compra_mensual_reciente: number;
  cambio_pct: number;
  dias_sin_comprar: number | null;
  tipo_riesgo: 'declive' | 'inactivo';
  ingresos_potenciales_perdidos: number;
}

export interface ClientesEnRiesgoData {
  clientes: ClienteEnRiesgo[];
  totalIngresosPotenciales: number;
}

export async function getClientesEnRiesgo(vendedorId?: number): Promise<ClientesEnRiesgoData> {
  const params: Record<string, unknown> = {};
  if (vendedorId != null) params.p_vendedor_id = vendedorId;

  const { data, error } = await supabase.rpc('get_clientes_en_riesgo', params);

  if (error) {
    throw new Error(`Error consultando clientes en riesgo: ${error.message}`);
  }

  const clientes: ClienteEnRiesgo[] = (data || []).map((r: Record<string, unknown>) => ({
    cliente_id: Number(r.cliente_id),
    razon_social: r.razon_social,
    ciudad: r.ciudad,
    tipo_cliente: r.tipo_cliente,
    compra_mensual_baseline: Number(r.compra_mensual_baseline),
    compra_mensual_reciente: Number(r.compra_mensual_reciente),
    cambio_pct: Number(r.cambio_pct),
    dias_sin_comprar: r.dias_sin_comprar !== null ? Number(r.dias_sin_comprar) : null,
    tipo_riesgo: r.tipo_riesgo,
    ingresos_potenciales_perdidos: Number(r.ingresos_potenciales_perdidos),
  }));

  const totalIngresosPotenciales = clientes.reduce(
    (sum, c) => sum + c.ingresos_potenciales_perdidos, 0
  );

  return { clientes, totalIngresosPotenciales };
}
