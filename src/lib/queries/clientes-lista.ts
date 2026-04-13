/**
 * clientes-lista.ts — Query para la tabla de clientes con métricas.
 *
 * Retorna todos los clientes con al menos una transacción,
 * ordenados por ingresos 12 meses descendente.
 *
 * Si el usuario logueado es rep puro (único rol = rep), filtra por su vendedor_id.
 * Multi-rol siempre ve sin filtro (perspectiva de empresa).
 */

import { supabase } from '@/lib/supabase';
import { getUsuarioActual } from '@/lib/auth/usuario-actual';

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
  // Determinar si hay que filtrar por vendedor (solo rep puro)
  let vendedorId: number | null = null;
  try {
    const usuario = await getUsuarioActual();
    if (usuario && usuario.roles.length === 1 && usuario.roles[0] === 'rep' && usuario.vendedorId !== null) {
      vendedorId = usuario.vendedorId;
    }
  } catch {
    // Si falla obtener usuario (ej: no hay sesión), continuar sin filtro
  }

  const params: Record<string, unknown> = {};
  if (vendedorId !== null) {
    params.p_vendedor_id = vendedorId;
  }

  const { data, error } = await supabase.rpc('get_clientes_lista', params);

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
