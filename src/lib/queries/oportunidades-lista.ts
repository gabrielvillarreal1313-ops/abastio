/**
 * oportunidades-lista.ts — Query para la tabla de oportunidades por cliente.
 *
 * Retorna una fila por cliente con conteos y valores de recompra + cross-sell.
 *
 * Si el usuario logueado es rep puro (único rol = rep), filtra por su vendedor_id.
 * Multi-rol siempre ve sin filtro (perspectiva de empresa).
 */

import { supabase } from '@/lib/supabase';
import { getUsuarioActual } from '@/lib/auth/usuario-actual';

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

/**
 * @param vendedorIdOverride — Si se pasa, filtra por este vendedor sin consultar al usuario.
 *   Útil cuando el caller ya sabe el vendedor_id (ej: Tablero de ventas).
 *   Si no se pasa, aplica la lógica original: filtra solo si el usuario es rep puro.
 */
export async function getListaOportunidades(vendedorIdOverride?: number | null): Promise<OportunidadCliente[]> {
  // Si el caller pasó vendedorId explícito, usarlo directamente
  let vendedorId: number | null = vendedorIdOverride ?? null;

  // Si no se pasó override, determinar desde el usuario logueado (solo rep puro)
  if (vendedorIdOverride === undefined) {
    try {
      const usuario = await getUsuarioActual();
      if (usuario && usuario.roles.length === 1 && usuario.roles[0] === 'rep' && usuario.vendedorId !== null) {
        vendedorId = usuario.vendedorId;
      }
    } catch {
      // Si falla obtener usuario, continuar sin filtro
    }
  }

  const params: Record<string, unknown> = {};
  if (vendedorId !== null) {
    params.p_vendedor_id = vendedorId;
  }

  const { data, error } = await supabase.rpc('get_lista_oportunidades', params);

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
