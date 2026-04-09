/**
 * inventario.ts — Calcula el inventario actual por SKU/bodega.
 *
 * El inventario se calcula como:
 *   stock_actual = stock_inicial + entradas - salidas
 *
 * Donde:
 * - stock_inicial = cantidad razonable basada en el volumen de ventas
 * - entradas = devoluciones (cantidades negativas en transacciones tipo devolucion)
 * - salidas = ventas (cantidades positivas en transacciones tipo venta)
 *
 * Los SKUs descontinuados mantienen inventario > 0 (nadie los limpió).
 * La distribución es 65% León / 35% Querétaro.
 */

import { faker } from '@faker-js/faker';
import { DISTRIBUCION_INVENTARIO, FAKER_SEED } from './config';
import type { Producto } from './catalogo';
import type { Transaccion } from './transacciones';

faker.seed(FAKER_SEED + 400);

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface Inventario {
  sku: string;
  bodega_id: number;
  cantidad_actual: number;
  cantidad_minima: number;
  cantidad_maxima: number;
  ultima_entrada: string | null;
  ultima_salida: string | null;
}

// ─── Generador principal ────────────────────────────────────────────────────

/**
 * Calcula el inventario actual para cada SKU en cada bodega.
 *
 * @param productos - Catálogo completo (incluye duplicados de anomalías)
 * @param transacciones - Todas las transacciones generadas
 * @param bodegaIds - [id_leon, id_queretaro]
 * @param skusDescontinuados - SKUs sin movimiento reciente que deben tener stock > 0
 * @returns Array de filas de inventario para insertar
 */
export function generarInventario(
  productos: Producto[],
  transacciones: Transaccion[],
  bodegaIds: [number, number],
  skusDescontinuados: string[]
): Inventario[] {
  const [bodegaLeon, bodegaQueretaro] = bodegaIds;
  const inventario: Inventario[] = [];

  // ─── Calcular movimientos netos por SKU/bodega ────────────────────

  // Estructura: { sku: { bodega_id: { movimiento, ultimaEntrada, ultimaSalida } } }
  const movimientos = new Map<string, Map<number, {
    neto: number;
    ultimaEntrada: string | null;
    ultimaSalida: string | null;
  }>>();

  for (const tx of transacciones) {
    if (!movimientos.has(tx.sku)) {
      movimientos.set(tx.sku, new Map());
    }
    const porBodega = movimientos.get(tx.sku)!;

    if (!porBodega.has(tx.bodega_id)) {
      porBodega.set(tx.bodega_id, { neto: 0, ultimaEntrada: null, ultimaSalida: null });
    }
    const mov = porBodega.get(tx.bodega_id)!;

    if (tx.tipo === 'venta') {
      // Venta: resta inventario (cantidad es positiva en ventas)
      mov.neto -= Math.abs(tx.cantidad);
      if (!mov.ultimaSalida || tx.fecha > mov.ultimaSalida) {
        mov.ultimaSalida = tx.fecha;
      }
    } else {
      // Devolución/nota de crédito: devuelve inventario
      mov.neto += Math.abs(tx.cantidad);
      if (!mov.ultimaEntrada || tx.fecha > mov.ultimaEntrada) {
        mov.ultimaEntrada = tx.fecha;
      }
    }
  }

  // ─── Calcular stock para cada producto en cada bodega ─────────────

  const descontinuadosSet = new Set(skusDescontinuados);

  for (const producto of productos) {
    const movProducto = movimientos.get(producto.sku);

    // Estimar volumen mensual de ventas para calcular stock inicial razonable
    // Stock inicial = ~2-4 meses de inventario promedio
    const ventasTotales = movProducto
      ? Array.from(movProducto.values()).reduce((sum, m) => sum + Math.abs(m.neto), 0)
      : 0;
    const mesesPeriodo = 18;
    const ventaMensual = ventasTotales / mesesPeriodo;
    const mesesStock = faker.number.float({ min: 2, max: 4 });
    const stockInicialTotal = Math.ceil(ventaMensual * mesesStock);

    // Distribuir entre bodegas
    const stockLeon = Math.ceil(stockInicialTotal * DISTRIBUCION_INVENTARIO.leon);
    const stockQueretaro = stockInicialTotal - stockLeon;

    // Para cada bodega, calcular stock actual
    for (const [bodegaId, stockInicial] of [
      [bodegaLeon, stockLeon],
      [bodegaQueretaro, stockQueretaro],
    ] as [number, number][]) {
      const mov = movProducto?.get(bodegaId);
      let stockActual = stockInicial + (mov?.neto ?? 0);

      // SKUs descontinuados deben tener inventario > 0
      if (descontinuadosSet.has(producto.sku)) {
        stockActual = Math.max(stockActual, faker.number.int({ min: 5, max: 50 }));
      }

      // Stock nunca debería ser negativo (en la realidad se reabastece)
      stockActual = Math.max(stockActual, 0);

      // Solo crear fila si tiene stock o es producto activo
      if (stockActual > 0 || producto.activo) {
        // Cantidad mínima y máxima basadas en volumen de ventas
        const cantidadMinima = Math.max(1, Math.ceil(ventaMensual * 0.5));
        const cantidadMaxima = Math.max(cantidadMinima * 3, Math.ceil(ventaMensual * 3));

        inventario.push({
          sku: producto.sku,
          bodega_id: bodegaId,
          cantidad_actual: stockActual,
          cantidad_minima: cantidadMinima,
          cantidad_maxima: cantidadMaxima,
          ultima_entrada: mov?.ultimaEntrada ?? null,
          ultima_salida: mov?.ultimaSalida ?? null,
        });
      }
    }
  }

  return inventario;
}
