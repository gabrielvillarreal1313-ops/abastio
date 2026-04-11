/**
 * cotizacion-mutations.ts — Operaciones de escritura para cotizaciones.
 *
 * Cada función llama a una RPC de Postgres que maneja la lógica de negocio
 * (cálculos de precios, recálculo de totales, etc.)
 */

import { supabase } from '@/lib/supabase';

/** Crea una cotización vacía y retorna su UUID */
export async function crearCotizacion(
  clienteId: number,
  vendedorId: number,
  notas?: string,
  fechaVencimiento?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('crear_cotizacion', {
    p_cliente_id: clienteId,
    p_vendedor_id: vendedorId,
    p_notas: notas ?? null,
    p_fecha_vencimiento: fechaVencimiento ?? null,
  });

  if (error) {
    throw new Error(`Error creando cotización: ${error.message}`);
  }

  return data as string;
}

/** Agrega una línea a una cotización y retorna el UUID de la línea */
export async function agregarLineaCotizacion(
  cotizacionId: string,
  sku: string,
  cantidad: number,
  precioUnitario: number,
  costoUnitario: number,
  descuentoPct?: number,
  origen?: 'recompra' | 'cross_sell' | 'manual',
): Promise<string> {
  const { data, error } = await supabase.rpc('agregar_linea_cotizacion', {
    p_cotizacion_id: cotizacionId,
    p_sku: sku,
    p_cantidad: cantidad,
    p_precio_unitario: precioUnitario,
    p_costo_unitario: costoUnitario,
    p_descuento_pct: descuentoPct ?? 0,
    p_origen: origen ?? 'manual',
  });

  if (error) {
    throw new Error(`Error agregando línea a cotización: ${error.message}`);
  }

  return data as string;
}

/** Elimina una línea y recalcula totales del header */
export async function eliminarLineaCotizacion(lineaId: string): Promise<void> {
  const { error } = await supabase.rpc('eliminar_linea_cotizacion', {
    p_linea_id: lineaId,
  });

  if (error) {
    throw new Error(`Error eliminando línea de cotización: ${error.message}`);
  }
}

/** Cambia el estado de una cotización */
export async function actualizarEstadoCotizacion(
  cotizacionId: string,
  nuevoEstado: 'borrador' | 'enviada' | 'completada' | 'cancelada',
): Promise<void> {
  const { error } = await supabase.rpc('actualizar_estado_cotizacion', {
    p_cotizacion_id: cotizacionId,
    p_nuevo_estado: nuevoEstado,
  });

  if (error) {
    throw new Error(`Error actualizando estado de cotización: ${error.message}`);
  }
}

/** Duplica una cotización completa (header + líneas) como borrador */
export async function duplicarCotizacion(cotizacionId: string): Promise<string> {
  const { data, error } = await supabase.rpc('duplicar_cotizacion', {
    p_cotizacion_id: cotizacionId,
  });

  if (error) {
    throw new Error(`Error duplicando cotización: ${error.message}`);
  }

  return data as string;
}

/** Actualiza el header de una cotización borrador */
export async function actualizarCotizacionHeader(
  cotizacionId: string,
  vendedorId: number,
  notas?: string,
  fechaVencimiento?: string,
): Promise<void> {
  const { error } = await supabase.rpc('actualizar_cotizacion_header', {
    p_cotizacion_id: cotizacionId,
    p_vendedor_id: vendedorId,
    p_notas: notas ?? null,
    p_fecha_vencimiento: fechaVencimiento ?? null,
  });

  if (error) {
    throw new Error(`Error actualizando header de cotización: ${error.message}`);
  }
}

/** Elimina un borrador completo (header + líneas). Solo funciona con estado 'borrador'. */
export async function eliminarCotizacion(cotizacionId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('eliminar_cotizacion', {
    p_cotizacion_id: cotizacionId,
  });

  if (error) {
    throw new Error(`Error eliminando cotización: ${error.message}`);
  }

  return data === true || data === 'true';
}

/** Reemplaza todas las líneas de una cotización borrador */
export async function reemplazarLineasCotizacion(
  cotizacionId: string,
  lineas: Array<{
    sku: string;
    nombre_producto: string;
    cantidad: number;
    unidad?: string;
    precio_unitario: number;
    costo_unitario: number;
    descuento_pct: number;
    origen: string;
  }>,
): Promise<void> {
  const { error } = await supabase.rpc('reemplazar_lineas_cotizacion', {
    p_cotizacion_id: cotizacionId,
    p_lineas: lineas,
  });

  if (error) {
    throw new Error(`Error reemplazando líneas de cotización: ${error.message}`);
  }
}
