/**
 * clientes-lista.ts — Query para la tabla de clientes con métricas.
 *
 * Retorna todos los clientes con al menos una transacción,
 * ordenados por ingresos 12 meses descendente.
 */

import { supabase } from '@/lib/supabase';

export interface ClienteLista {
  cliente_id: number;
  razon_social: string;
  ciudad: string;
  tipo_cliente: string;
  ingresos_12m: number;
  ultima_compra: string;
  dias_sin_comprar: number;
  ticket_promedio: number;
  cambio_pct: number;
  vendedor_principal: string;
  es_riesgo: boolean;
}

export async function getClientesLista(): Promise<ClienteLista[]> {
  const { data, error } = await supabase.rpc('get_clientes_lista');

  if (error) {
    throw new Error(`Error consultando lista de clientes: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    cliente_id: Number(r.cliente_id) || 0,
    razon_social: (r.razon_social as string) ?? '',
    ciudad: (r.ciudad as string) ?? '',
    tipo_cliente: (r.tipo_cliente as string) ?? '',
    ingresos_12m: Number(r.ingresos_12m) || 0,
    ultima_compra: (r.ultima_compra as string) ?? '',
    dias_sin_comprar: Number(r.dias_sin_comprar) || 0,
    ticket_promedio: Number(r.ticket_promedio) || 0,
    cambio_pct: Number(r.cambio_pct) || 0,
    vendedor_principal: (r.vendedor_principal as string) ?? '—',
    es_riesgo: r.es_riesgo === true || r.es_riesgo === 'true',
  }));
}
