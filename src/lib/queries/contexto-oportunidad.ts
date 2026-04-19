/**
 * contexto-oportunidad.ts — Contexto legible de oportunidad de recompra.
 *
 * Wrapper para get_contexto_oportunidad_recompra. Sintetiza cadencia y
 * estacionalidad del par cliente-SKU en texto legible para mostrar inline
 * junto a cada oportunidad de recompra en la UI.
 */

import { supabase } from '@/lib/supabase';

export type NivelUrgencia = 'media' | 'alta' | 'critica';
export type RegularidadPar = 'muy_regular' | 'regular' | 'irregular';

export interface ContextoOportunidad {
  textoCadencia: string;
  textoEstacionalidad: string | null;
  nivelUrgencia: NivelUrgencia;
  regularidad: RegularidadPar;
}

export async function getContextoOportunidadRecompra(
  clienteId: number,
  sku: string
): Promise<ContextoOportunidad | null> {
  const { data, error } = await supabase.rpc('get_contexto_oportunidad_recompra', {
    p_cliente_id: clienteId,
    p_sku: sku,
  });

  if (error) throw new Error(`Error consultando contexto de oportunidad: ${error.message}`);

  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  const r: Record<string, unknown> = Array.isArray(data) ? data[0] : data;

  const nivel = (r.nivel_urgencia as string) ?? 'media';
  const reg = (r.regularidad as string) ?? 'irregular';

  return {
    textoCadencia: (r.texto_cadencia as string) ?? '',
    textoEstacionalidad: r.texto_estacionalidad === null || r.texto_estacionalidad === undefined
      ? null
      : String(r.texto_estacionalidad),
    nivelUrgencia: (nivel === 'alta' || nivel === 'critica' ? nivel : 'media') as NivelUrgencia,
    regularidad: (reg === 'muy_regular' || reg === 'regular' ? reg : 'irregular') as RegularidadPar,
  };
}
