/**
 * forecast-skus.ts — Query de pronóstico de demanda por SKU × bodega.
 *
 * Retorna todos los SKUs activos con demanda histórica, pronóstico ponderado,
 * clasificación ABC, serie de 6 meses para sparkline, y flag de demanda reciente.
 * Cada SKU aparece una vez por bodega donde tiene registro de inventario.
 */

import { supabase } from '@/lib/supabase';

export interface PuntoSerie {
  mes: string;
  cantidad: number;
}

export interface ForecastSKU {
  sku: string;
  nombre_producto: string;
  categoria: string;
  bodega_nombre: string;
  clase_abc: 'A' | 'B' | 'C';
  demanda_mensual_historica: number;
  demanda_mensual_pronostico: number;
  serie_6_meses: PuntoSerie[];
  ingresos_totales: number;
  /** true si el SKU tuvo al menos una venta en los últimos 6 meses en esta bodega */
  tiene_demanda_reciente: boolean;
}

export interface ForecastData {
  skus: ForecastSKU[];
}

/** Parsea una fila cruda de la RPC a ForecastSKU con guards contra null */
function parseForecastRow(r: Record<string, unknown>): ForecastSKU {
  return {
    sku: (r.sku as string) ?? '',
    nombre_producto: (r.nombre_producto as string) ?? '',
    categoria: (r.categoria as string) ?? '',
    bodega_nombre: (r.bodega_nombre as string) ?? '',
    clase_abc: (r.clase_abc as 'A' | 'B' | 'C') ?? 'C',
    demanda_mensual_historica: Number(r.demanda_mensual_historica) || 0,
    demanda_mensual_pronostico: Number(r.demanda_mensual_pronostico) || 0,
    serie_6_meses: Array.isArray(r.serie_6_meses) ? (r.serie_6_meses as PuntoSerie[]) : [],
    ingresos_totales: Number(r.ingresos_totales) || 0,
    tiene_demanda_reciente: r.tiene_demanda_reciente === true || r.tiene_demanda_reciente === 'true',
  };
}

export async function getForecastSKUs(): Promise<ForecastData> {
  // PostgREST limita a 1,000 filas por request (max-rows del servidor, no configurable desde el cliente).
  // Esta RPC retorna ~1,544 filas (772 SKUs × 2 bodegas), así que paginamos con .range().
  const PAGE_SIZE = 1000;

  const { data: page1, error: err1 } = await supabase
    .rpc('get_forecast_skus')
    .range(0, PAGE_SIZE - 1);

  if (err1) {
    throw new Error(`Error consultando forecast de SKUs: ${err1.message}`);
  }

  const rows: Record<string, unknown>[] = (page1 as Record<string, unknown>[]) || [];

  // Si la primera página está llena, hay más filas — traer la siguiente
  if (rows.length === PAGE_SIZE) {
    const { data: page2, error: err2 } = await supabase
      .rpc('get_forecast_skus')
      .range(PAGE_SIZE, PAGE_SIZE * 2 - 1);

    if (err2) {
      throw new Error(`Error consultando forecast de SKUs (página 2): ${err2.message}`);
    }

    if (page2) {
      rows.push(...(page2 as Record<string, unknown>[]));
    }
  }

  const skus: ForecastSKU[] = rows.map(parseForecastRow);

  return { skus };
}
