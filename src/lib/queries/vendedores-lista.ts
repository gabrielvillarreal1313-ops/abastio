/**
 * vendedores-lista.ts — Query para la tabla de vendedores con métricas mensuales.
 *
 * Retorna todos los vendedores activos con KPIs del mes completo más reciente.
 */

import { supabase } from '@/lib/supabase';

export interface VendedorLista {
  vendedor_id: number;
  nombre: string;
  zona: string;
  tipo: string;
  ingresos_mes_actual: number;
  ingresos_mes_anterior: number;
  cambio_pct: number;
  margen_pct: number;
  descuento_promedio_pct: number;
  clientes_activos: number;
  ingresos_12m: number;
  ticket_promedio: number;
}

export async function getVendedoresLista(): Promise<VendedorLista[]> {
  const { data, error } = await supabase.rpc('get_vendedores_lista');

  if (error) {
    throw new Error(`Error consultando lista de vendedores: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    vendedor_id: Number(r.vendedor_id) || 0,
    nombre: (r.nombre as string) ?? '',
    zona: (r.zona as string) ?? '',
    tipo: (r.tipo as string) ?? '',
    ingresos_mes_actual: Number(r.ingresos_mes_actual) || 0,
    ingresos_mes_anterior: Number(r.ingresos_mes_anterior) || 0,
    cambio_pct: Number(r.cambio_pct) || 0,
    margen_pct: Number(r.margen_pct) || 0,
    descuento_promedio_pct: Number(r.descuento_promedio_pct) || 0,
    clientes_activos: Number(r.clientes_activos) || 0,
    ingresos_12m: Number(r.ingresos_12m) || 0,
    ticket_promedio: Number(r.ticket_promedio) || 0,
  }));
}
