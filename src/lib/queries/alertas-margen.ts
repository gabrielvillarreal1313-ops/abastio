/**
 * alertas-margen.ts — Query para detección de categorías con erosión de margen.
 *
 * Compara margen bruto de los últimos 3 meses vs los 9 meses anteriores.
 * Solo incluye categorías con ≥50 transacciones recientes y caída >3pp.
 */

import { supabase } from '@/lib/supabase';

export interface AlertaMargen {
  categoria: string;
  margen_historico_pct: number;
  margen_reciente_pct: number;
  caida_pp: number;
  skus_afectados: number;
  transacciones_recientes: number;
  /** Crítica si caída >5pp, advertencia si entre 3 y 5pp */
  severidad: 'critica' | 'advertencia';
}

export interface AlertasMargenData {
  alertas: AlertaMargen[];
  tieneCriticas: boolean;
}

export async function getAlertasMargen(): Promise<AlertasMargenData> {
  const { data, error } = await supabase.rpc('get_alertas_margen');

  if (error) {
    throw new Error(`Error consultando alertas de margen: ${error.message}`);
  }

  const alertas: AlertaMargen[] = (data || []).map((r: Record<string, unknown>) => {
    const caida = Number(r.caida_pp);
    return {
      categoria: r.categoria as string,
      margen_historico_pct: Number(r.margen_historico_pct),
      margen_reciente_pct: Number(r.margen_reciente_pct),
      caida_pp: caida,
      skus_afectados: Number(r.skus_afectados),
      transacciones_recientes: Number(r.transacciones_recientes),
      severidad: caida > 5 ? 'critica' : 'advertencia',
    };
  });

  const tieneCriticas = alertas.some((a) => a.severidad === 'critica');

  return { alertas, tieneCriticas };
}
