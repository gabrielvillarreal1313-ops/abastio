/**
 * oportunidades-cross-sell.ts — Query para detección de oportunidades de cross-sell.
 *
 * Identifica SKUs que >60% de clientes del mismo tipo compran pero un cliente
 * específico no. Agrupa por categoría y retorna los top 3 SKUs recomendados
 * por categoría con su valor potencial mensual estimado.
 *
 * "Clientes similares" = clientes del mismo tipo_cliente (constructor, plomero, etc.)
 */

import { supabase } from '@/lib/supabase';

export interface SKURecomendado {
  sku: string;
  nombre: string;
  ingresos_promedio_mensual: number;
}

export interface OportunidadCrossSell {
  cliente_id: number;
  nombre_cliente: string;
  vendedor_principal: string;
  categoria_oportunidad: string;
  pct_clientes_similares: number;
  cantidad_clientes_similares: string;
  valor_potencial_mensual: number;
  top_skus: SKURecomendado[];
}

export interface OportunidadesCrossSellData {
  oportunidades: OportunidadCrossSell[];
}

function parseSKURecomendado(raw: Record<string, unknown>): SKURecomendado {
  return {
    sku: (raw.sku as string) ?? '',
    nombre: (raw.nombre as string) ?? '',
    ingresos_promedio_mensual: Number(raw.ingresos_promedio_mensual) || 0,
  };
}

function parseOportunidadRow(r: Record<string, unknown>): OportunidadCrossSell {
  // top_skus viene como JSONB array de Postgres
  const rawSkus = r.top_skus;
  const topSkus: SKURecomendado[] = Array.isArray(rawSkus)
    ? (rawSkus as Record<string, unknown>[]).map(parseSKURecomendado)
    : [];

  return {
    cliente_id: Number(r.cliente_id) || 0,
    nombre_cliente: (r.nombre_cliente as string) ?? '',
    vendedor_principal: (r.vendedor_principal as string) ?? '—',
    categoria_oportunidad: (r.categoria_oportunidad as string) ?? '',
    pct_clientes_similares: Number(r.pct_clientes_similares) || 0,
    cantidad_clientes_similares: (r.cantidad_clientes_similares as string) ?? '',
    valor_potencial_mensual: Number(r.valor_potencial_mensual) || 0,
    top_skus: topSkus,
  };
}

export async function getOportunidadesCrossSell(): Promise<OportunidadesCrossSellData> {
  // ~2,880 oportunidades — requiere paginación con .range()
  const PAGE_SIZE = 1000;

  const { data: page1, error: err1 } = await supabase
    .rpc('get_oportunidades_cross_sell')
    .range(0, PAGE_SIZE - 1);

  if (err1) {
    throw new Error(`Error consultando oportunidades de cross-sell: ${err1.message}`);
  }

  const rows: Record<string, unknown>[] = (page1 as Record<string, unknown>[]) || [];

  if (rows.length === PAGE_SIZE) {
    const { data: page2, error: err2 } = await supabase
      .rpc('get_oportunidades_cross_sell')
      .range(PAGE_SIZE, PAGE_SIZE * 2 - 1);

    if (err2) {
      throw new Error(`Error consultando oportunidades de cross-sell (página 2): ${err2.message}`);
    }

    if (page2) {
      rows.push(...(page2 as Record<string, unknown>[]));

      if ((page2 as Record<string, unknown>[]).length === PAGE_SIZE) {
        const { data: page3, error: err3 } = await supabase
          .rpc('get_oportunidades_cross_sell')
          .range(PAGE_SIZE * 2, PAGE_SIZE * 3 - 1);

        if (err3) {
          throw new Error(`Error consultando oportunidades de cross-sell (página 3): ${err3.message}`);
        }

        if (page3) {
          rows.push(...(page3 as Record<string, unknown>[]));
        }
      }
    }
  }

  return { oportunidades: rows.map(parseOportunidadRow) };
}
