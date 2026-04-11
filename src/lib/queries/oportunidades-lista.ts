/**
 * oportunidades-lista.ts — Query para la tabla de oportunidades por cliente.
 *
 * Retorna una fila por cliente con conteos y valores de recompra + cross-sell.
 */

import { supabase } from '@/lib/supabase';

export interface OportunidadCliente {
  cliente_id: number;
  nombre_cliente: string;
  vendedor_principal: string;
  tipo_cliente: string;
  conteo_recompras: number;
  valor_recompras: number;
  conteo_cross_sell: number;
  valor_cross_sell: number;
  valor_total: number;
}

export async function getListaOportunidades(): Promise<OportunidadCliente[]> {
  const { data, error } = await supabase.rpc('get_lista_oportunidades');

  if (error) {
    throw new Error(`Error consultando lista de oportunidades: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    cliente_id: Number(r.cliente_id) || 0,
    nombre_cliente: (r.nombre_cliente as string) ?? '',
    vendedor_principal: (r.vendedor_principal as string) ?? '—',
    tipo_cliente: (r.tipo_cliente as string) ?? '',
    conteo_recompras: Number(r.conteo_recompras) || 0,
    valor_recompras: Number(r.valor_recompras) || 0,
    conteo_cross_sell: Number(r.conteo_cross_sell) || 0,
    valor_cross_sell: Number(r.valor_cross_sell) || 0,
    valor_total: Number(r.valor_total) || 0,
  }));
}
