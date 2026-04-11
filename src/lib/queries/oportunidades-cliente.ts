/**
 * oportunidades-cliente.ts — Queries de oportunidades para un cliente específico.
 *
 * Recompras tardías y cross-sell filtradas por cliente_id en Postgres.
 */

import { supabase } from '@/lib/supabase';

// ─── Recompras tardías ──────────────────────────────────────────────────────

export interface RecompraCliente {
  sku: string;
  nombre_producto: string;
  categoria: string;
  intervalo_promedio_dias: number;
  dias_desde_ultima_compra: number;
  dias_retraso: number;
  valor_estimado_mensual: number;
  ultima_compra_fecha: string;
  cantidad_ultima_compra: number;
  total_transacciones: number;
}

export async function getRecomprasCliente(clienteId: number): Promise<RecompraCliente[]> {
  const { data, error } = await supabase.rpc('get_oportunidades_recompra_cliente', {
    p_cliente_id: clienteId,
  });

  if (error) {
    throw new Error(`Error consultando recompras del cliente: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    sku: (r.sku as string) ?? '',
    nombre_producto: (r.nombre_producto as string) ?? '',
    categoria: (r.categoria as string) ?? '',
    intervalo_promedio_dias: Number(r.intervalo_promedio_dias) || 0,
    dias_desde_ultima_compra: Number(r.dias_desde_ultima_compra) || 0,
    dias_retraso: Number(r.dias_retraso) || 0,
    valor_estimado_mensual: Number(r.valor_estimado_mensual) || 0,
    ultima_compra_fecha: (r.ultima_compra_fecha as string) ?? '',
    cantidad_ultima_compra: Number(r.cantidad_ultima_compra) || 0,
    total_transacciones: Number(r.total_transacciones) || 0,
  }));
}

// ─── Cross-sell ─────────────────────────────────────────────────────────────

export interface SKURecomendado {
  sku: string;
  nombre: string;
  ingresos_promedio_mensual: number;
}

export interface CrossSellCliente {
  categoria_oportunidad: string;
  pct_clientes_similares: number;
  cantidad_clientes_similares: string;
  valor_potencial_mensual: number;
  top_skus: SKURecomendado[];
}

export async function getCrossSellCliente(clienteId: number): Promise<CrossSellCliente[]> {
  const { data, error } = await supabase.rpc('get_oportunidades_cross_sell_cliente', {
    p_cliente_id: clienteId,
  });

  if (error) {
    throw new Error(`Error consultando cross-sell del cliente: ${error.message}`);
  }

  return (data || []).map((r: Record<string, unknown>) => {
    const rawSkus = r.top_skus;
    const topSkus: SKURecomendado[] = Array.isArray(rawSkus)
      ? (rawSkus as Record<string, unknown>[]).map((s) => ({
          sku: (s.sku as string) ?? '',
          nombre: (s.nombre as string) ?? '',
          ingresos_promedio_mensual: Number(s.ingresos_promedio_mensual) || 0,
        }))
      : [];

    return {
      categoria_oportunidad: (r.categoria_oportunidad as string) ?? '',
      pct_clientes_similares: Number(r.pct_clientes_similares) || 0,
      cantidad_clientes_similares: (r.cantidad_clientes_similares as string) ?? '',
      valor_potencial_mensual: Number(r.valor_potencial_mensual) || 0,
      top_skus: topSkus,
    };
  });
}

// ─── Datos combinados para el tab ───────────────────────────────────────────

export interface OportunidadesClienteData {
  recompras: RecompraCliente[];
  crossSell: CrossSellCliente[];
  totalRecompra: number;
  totalCrossSell: number;
}

export async function getOportunidadesCliente(clienteId: number): Promise<OportunidadesClienteData> {
  const [recompras, crossSell] = await Promise.all([
    getRecomprasCliente(clienteId),
    getCrossSellCliente(clienteId),
  ]);

  return {
    recompras,
    crossSell,
    totalRecompra: recompras.reduce((s, r) => s + r.valor_estimado_mensual, 0),
    totalCrossSell: crossSell.reduce((s, c) => s + c.valor_potencial_mensual, 0),
  };
}
