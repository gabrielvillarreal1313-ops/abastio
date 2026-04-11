/**
 * oportunidades-recompra.ts — Query para detección de recompras tardías.
 *
 * Identifica pares cliente-SKU donde el cliente compra con regularidad
 * pero ya se pasó de su intervalo normal de compra (>1.3× el intervalo promedio).
 * Solo incluye pares con 3+ transacciones e intervalo entre 15 y 90 días.
 */

import { supabase } from '@/lib/supabase';

export interface OportunidadRecompra {
  cliente_id: number;
  nombre_cliente: string;
  vendedor_principal: string;
  sku: string;
  nombre_producto: string;
  categoria: string;
  intervalo_promedio_dias: number;
  dias_desde_ultima_compra: number;
  dias_retraso: number;
  /** Promedio mensual histórico del par cliente-SKU en pesos */
  valor_estimado_mensual: number;
  ultima_compra_fecha: string;
  cantidad_ultima_compra: number;
  total_transacciones: number;
}

export interface OportunidadesRecompraData {
  oportunidades: OportunidadRecompra[];
}

function parseOportunidadRow(r: Record<string, unknown>): OportunidadRecompra {
  return {
    cliente_id: Number(r.cliente_id) || 0,
    nombre_cliente: (r.nombre_cliente as string) ?? '',
    vendedor_principal: (r.vendedor_principal as string) ?? '—',
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
  };
}

export async function getOportunidadesRecompra(): Promise<OportunidadesRecompraData> {
  // 3,021 oportunidades — requiere paginación con .range()
  const PAGE_SIZE = 1000;

  const { data: page1, error: err1 } = await supabase
    .rpc('get_oportunidades_recompra')
    .range(0, PAGE_SIZE - 1);

  if (err1) {
    throw new Error(`Error consultando oportunidades de recompra: ${err1.message}`);
  }

  const rows: Record<string, unknown>[] = (page1 as Record<string, unknown>[]) || [];

  // Paginar hasta traer todas las filas
  if (rows.length === PAGE_SIZE) {
    const { data: page2, error: err2 } = await supabase
      .rpc('get_oportunidades_recompra')
      .range(PAGE_SIZE, PAGE_SIZE * 2 - 1);

    if (err2) {
      throw new Error(`Error consultando oportunidades de recompra (página 2): ${err2.message}`);
    }

    if (page2) {
      rows.push(...(page2 as Record<string, unknown>[]));

      // Si la segunda página también está llena, traer la tercera
      if ((page2 as Record<string, unknown>[]).length === PAGE_SIZE) {
        const { data: page3, error: err3 } = await supabase
          .rpc('get_oportunidades_recompra')
          .range(PAGE_SIZE * 2, PAGE_SIZE * 3 - 1);

        if (err3) {
          throw new Error(`Error consultando oportunidades de recompra (página 3): ${err3.message}`);
        }

        if (page3) {
          rows.push(...(page3 as Record<string, unknown>[]));
        }
      }
    }
  }

  return { oportunidades: rows.map(parseOportunidadRow) };
}
