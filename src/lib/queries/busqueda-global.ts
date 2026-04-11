/**
 * busqueda-global.ts — Busca simultáneamente en clientes, productos y cotizaciones.
 * Usa la RPC busqueda_global() que retorna JSON con resultados agrupados.
 */

import { supabase } from '@/lib/supabase';

export interface ClienteBusqueda {
  id: number;
  nombre: string;
  tipo: string;
  ciudad: string | null;
}

export interface ProductoBusqueda {
  sku: string;
  nombre: string;
  categoria: string;
}

export interface CotizacionBusqueda {
  id: string;
  numero_cotizacion: number;
  cliente_nombre: string;
  estado: string;
  subtotal: number;
}

export interface ResultadoBusquedaGlobal {
  clientes: ClienteBusqueda[];
  conteo_clientes: number;
  productos: ProductoBusqueda[];
  conteo_productos: number;
  cotizaciones: CotizacionBusqueda[];
}

export async function busquedaGlobal(termino: string): Promise<ResultadoBusquedaGlobal> {
  const { data, error } = await supabase.rpc('busqueda_global', {
    p_termino: termino,
  });

  if (error) throw new Error(error.message);

  // La RPC retorna JSON — puede venir como objeto directo o como string
  const resultado = typeof data === 'string' ? JSON.parse(data) : data;

  return {
    clientes: resultado?.clientes ?? [],
    conteo_clientes: resultado?.conteo_clientes ?? 0,
    productos: resultado?.productos ?? [],
    conteo_productos: resultado?.conteo_productos ?? 0,
    cotizaciones: resultado?.cotizaciones ?? [],
  };
}
