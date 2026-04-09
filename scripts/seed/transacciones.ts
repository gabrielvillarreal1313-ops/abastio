/**
 * transacciones.ts — Motor de generación de transacciones día por día.
 *
 * Itera cada día del período (18 meses), genera ~30-40 transacciones por día hábil
 * con ~4-6 líneas cada una, respetando:
 * - Perfiles de compra por tipo de cliente
 * - Perfiles de descuento por vendedor
 * - Estacionalidad por categoría
 * - Cross-sell cemento→varilla
 * - Incremento de costos de plomería desde la fecha configurada
 * - Declive del cliente "Constructora Valle del Bajío"
 */

import { faker } from '@faker-js/faker';
import {
  FECHA_INICIO,
  FECHA_FIN,
  LINEAS_DIA_MIN,
  LINEAS_DIA_MAX,
  LINEAS_DIA_DOMINGO_MAX,
  LINEAS_POR_TRANSACCION_MIN,
  LINEAS_POR_TRANSACCION_MAX,
  PERFILES_VENDEDORES,
  ESTACIONALIDAD,
  PROBABILIDAD_DEVOLUCION,
  PROBABILIDAD_NOTA_CREDITO,
  CROSS_SELL_CEMENTO_VARILLA,
  PERFIL_COMPRA_CLIENTE,
  CANTIDADES_POR_UNIDAD,
  DESCUENTO_POR_LISTA,
  ANOMALIAS,
  FAKER_SEED,
} from './config';
import type { Producto } from './catalogo';
import type { Cliente } from './clientes';

faker.seed(FAKER_SEED + 200);

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface Transaccion {
  folio: string;
  fecha: string; // ISO string para Supabase timestamptz
  tipo: 'venta' | 'devolucion' | 'nota_credito';
  cliente_id: number;
  vendedor_id: number;
  bodega_id: number;
  sku: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number | null;
  descuento_pct: number;
  subtotal: number;
}

interface ContextoGeneracion {
  productos: Producto[];
  /** Productos indexados por categoría para selección rápida */
  productosPorCategoria: Map<string, Producto[]>;
  /** SKUs de cemento para cross-sell */
  skusCemento: string[];
  /** SKUs de varilla para cross-sell */
  skusVarilla: string[];
  /** SKUs de plomería afectados por incremento de costos */
  skusPlomeriaAfectados: Set<string>;
  /** Clientes con su tipo e ID en DB */
  clientesConId: Array<Cliente & { id: number }>;
  /** Mapa vendedor_id → array de cliente_ids asignados */
  asignacionVendedores: Map<number, number[]>;
  /** ID del cliente "Constructora Valle del Bajío" para el escenario de declive */
  clienteDeclineId: number | null;
  /** IDs de bodegas: [León, Querétaro] */
  bodegaIds: [number, number];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Genera un folio con formato PREFIX-YYYYMM-NNNNN */
function generarFolio(tipo: 'venta' | 'devolucion' | 'nota_credito', fecha: Date, secuencia: number): string {
  const prefijo = tipo === 'venta' ? 'VTA' : tipo === 'devolucion' ? 'DEV' : 'NC';
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const seq = String(secuencia).padStart(5, '0');
  return `${prefijo}-${yyyy}${mm}-${seq}`;
}

/** Retorna true si el día es hábil (lunes=1 a sábado=6) */
function esDiaHabil(fecha: Date): boolean {
  return fecha.getDay() !== 0; // 0 = domingo
}

/** Obtiene el factor de estacionalidad para una categoría en un mes dado */
function factorEstacionalidad(categoria: string, mes: number): number {
  const factores = ESTACIONALIDAD[categoria];
  if (!factores) return 1.0;
  return factores[mes] ?? 1.0;
}

/**
 * Selecciona una categoría para una línea de transacción basándose en:
 * 1. Perfil de compra del tipo de cliente (pesos)
 * 2. Estacionalidad del mes actual
 */
function seleccionarCategoria(tipoCliente: string, mes: number): string {
  const perfil = PERFIL_COMPRA_CLIENTE[tipoCliente] || PERFIL_COMPRA_CLIENTE['otro'];
  const categorias = Object.keys(perfil);
  const pesos = categorias.map((cat) => perfil[cat] * factorEstacionalidad(cat, mes));
  const sumaPesos = pesos.reduce((a, b) => a + b, 0);

  const random = faker.number.float({ min: 0, max: sumaPesos });
  let acumulado = 0;
  for (let i = 0; i < categorias.length; i++) {
    acumulado += pesos[i];
    if (random <= acumulado) return categorias[i];
  }
  return categorias[categorias.length - 1];
}

/**
 * Selecciona un vendedor ponderado por su pesoVolumen.
 * Retorna el índice del vendedor (0-based, que corresponde a vendedor_id = índice + 1).
 */
function seleccionarVendedor(): number {
  const pesos = PERFILES_VENDEDORES.map((p) => p.pesoVolumen);
  const suma = pesos.reduce((a, b) => a + b, 0);
  const random = faker.number.float({ min: 0, max: suma });
  let acumulado = 0;
  for (let i = 0; i < pesos.length; i++) {
    acumulado += pesos[i];
    if (random <= acumulado) return i;
  }
  return pesos.length - 1;
}

/**
 * Calcula el costo unitario para un producto en una fecha dada.
 * Si el producto es de plomería y la fecha es posterior al incremento,
 * aplica el +15% de incremento del proveedor.
 */
function obtenerCostoEnFecha(
  producto: Producto,
  fecha: Date,
  skusAfectados: Set<string>
): number {
  const costoBase = producto.costo_unitario;
  if (
    producto.categoria === 'Plomería' &&
    skusAfectados.has(producto.sku) &&
    fecha >= ANOMALIAS.plomeria.fechaIncremento
  ) {
    return parseFloat((costoBase * (1 + ANOMALIAS.plomeria.incrementoCosto)).toFixed(2));
  }
  return costoBase;
}

// ─── Generador principal ────────────────────────────────────────────────────

/**
 * Genera todas las transacciones del período.
 *
 * @param productos - Catálogo completo de productos
 * @param clientes - Clientes insertados con sus IDs de DB
 * @param asignaciones - Mapa vendedorIndex → clienteIndices
 * @param bodegaIds - [id_leon, id_queretaro]
 * @param vendedorIds - IDs reales de vendedores en DB (en orden de PERFILES_VENDEDORES)
 * @returns Array de transacciones listas para insertar
 */
export function generarTransacciones(
  productos: Producto[],
  clientes: Array<Cliente & { id: number }>,
  asignaciones: Map<number, number[]>,
  bodegaIds: [number, number],
  vendedorIds: number[]
): Transaccion[] {
  // ─── Preparar contexto de generación ──────────────────────────────

  const productosPorCategoria = new Map<string, Producto[]>();
  for (const p of productos) {
    if (!productosPorCategoria.has(p.categoria)) {
      productosPorCategoria.set(p.categoria, []);
    }
    productosPorCategoria.get(p.categoria)!.push(p);
  }

  // SKUs de cemento y varilla para cross-sell
  const skusCemento = productos
    .filter((p) => p.nombre.toLowerCase().includes('cemento'))
    .map((p) => p.sku);
  const skusVarilla = productos
    .filter((p) => p.nombre.toLowerCase().includes('varilla'))
    .map((p) => p.sku);

  // SKUs de plomería afectados por incremento (~40 al azar)
  const productosPlomeria = productos.filter((p) => p.categoria === 'Plomería');
  const skusPlomeriaAfectados = new Set(
    faker.helpers.arrayElements(productosPlomeria, Math.min(ANOMALIAS.plomeria.skusAfectados, productosPlomeria.length))
      .map((p) => p.sku)
  );

  // Identificar al cliente en declive
  const clienteDeclineId = clientes.find(
    (c) => c.razon_social === ANOMALIAS.clienteEnDeclive.nombre
  )?.id ?? null;

  const ctx: ContextoGeneracion = {
    productos,
    productosPorCategoria,
    skusCemento,
    skusVarilla,
    skusPlomeriaAfectados,
    clientesConId: clientes,
    asignacionVendedores: asignaciones,
    clienteDeclineId,
    bodegaIds,
  };

  // ─── Iterar día por día ───────────────────────────────────────────

  const transacciones: Transaccion[] = [];
  let folioSecuencia = 1;
  const fechaActual = new Date(FECHA_INICIO);

  while (fechaActual <= FECHA_FIN) {
    const esDomingo = fechaActual.getDay() === 0;

    // Determinar cuántas líneas generar hoy
    const lineasHoy = esDomingo
      ? faker.number.int({ min: 0, max: LINEAS_DIA_DOMINGO_MAX })
      : faker.number.int({ min: LINEAS_DIA_MIN, max: LINEAS_DIA_MAX });

    if (lineasHoy === 0) {
      fechaActual.setDate(fechaActual.getDate() + 1);
      continue;
    }

    let lineasGeneradas = 0;

    while (lineasGeneradas < lineasHoy) {
      // Determinar cuántas líneas tendrá esta transacción
      const lineasEnTransaccion = Math.min(
        faker.number.int({ min: LINEAS_POR_TRANSACCION_MIN, max: LINEAS_POR_TRANSACCION_MAX }),
        lineasHoy - lineasGeneradas
      );

      // Seleccionar vendedor y cliente
      const vendedorIndex = seleccionarVendedor();
      const vendedorId = vendedorIds[vendedorIndex]; // ID real de DB
      const perfil = PERFILES_VENDEDORES[vendedorIndex];
      const clientesDelVendedor = ctx.asignacionVendedores.get(vendedorIndex) || [];

      if (clientesDelVendedor.length === 0) {
        // Si este vendedor no tiene clientes, saltar
        lineasGeneradas += lineasEnTransaccion;
        continue;
      }

      const clienteIndex = faker.helpers.arrayElement(clientesDelVendedor);
      const cliente = ctx.clientesConId[clienteIndex];
      if (!cliente) {
        lineasGeneradas += lineasEnTransaccion;
        continue;
      }

      // Bodega: vendedores de Querétaro usan bodega Querétaro, resto León
      const bodegaId = perfil.zona === 'Querétaro' ? ctx.bodegaIds[1] : ctx.bodegaIds[0];

      // Determinar tipo de transacción
      const randomTipo = faker.number.float({ min: 0, max: 1 });
      let tipo: 'venta' | 'devolucion' | 'nota_credito' = 'venta';
      if (randomTipo > 1 - PROBABILIDAD_NOTA_CREDITO) {
        tipo = 'nota_credito';
      } else if (randomTipo > 1 - PROBABILIDAD_NOTA_CREDITO - PROBABILIDAD_DEVOLUCION) {
        tipo = 'devolucion';
      }

      const folio = generarFolio(tipo, fechaActual, folioSecuencia++);
      const mes = fechaActual.getMonth() + 1;

      // Hora aleatoria entre 8:00 y 18:00
      const hora = faker.number.int({ min: 8, max: 17 });
      const minuto = faker.number.int({ min: 0, max: 59 });
      const fechaTransaccion = new Date(fechaActual);
      fechaTransaccion.setHours(hora, minuto, 0, 0);
      const fechaISO = fechaTransaccion.toISOString();

      // ─── Verificar escenario de declive ─────────────────────────
      // Si es el cliente en declive y la fecha es posterior al declive,
      // reducir líneas significativamente
      let lineasEfectivas = lineasEnTransaccion;
      if (
        cliente.id === ctx.clienteDeclineId &&
        fechaActual >= ANOMALIAS.clienteEnDeclive.fechaDeclive
      ) {
        // Reducir volumen: ratio ~55K/280K ≈ 0.2
        if (faker.number.float({ min: 0, max: 1 }) > 0.2) {
          // 80% de las veces, saltar esta transacción del cliente en declive
          lineasGeneradas += lineasEnTransaccion;
          continue;
        }
        lineasEfectivas = Math.max(1, Math.floor(lineasEnTransaccion * 0.5));
      }

      // ─── Generar líneas de esta transacción ─────────────────────
      let incluyeCemento = false;
      const skusEnTransaccion = new Set<string>();

      for (let l = 0; l < lineasEfectivas; l++) {
        const categoria = seleccionarCategoria(cliente.tipo_cliente, mes);
        const productosCategoria = ctx.productosPorCategoria.get(categoria);
        if (!productosCategoria || productosCategoria.length === 0) continue;

        const producto = faker.helpers.arrayElement(productosCategoria);

        // Evitar SKU duplicado dentro de la misma transacción
        if (skusEnTransaccion.has(producto.sku)) continue;
        skusEnTransaccion.add(producto.sku);

        // Cantidad según unidad de medida
        const rangoCantidad = CANTIDADES_POR_UNIDAD[producto.unidad_medida] || { min: 1, max: 10 };
        const cantidad = faker.number.int(rangoCantidad);

        // Costo unitario (con posible incremento de plomería)
        const costoUnitario = obtenerCostoEnFecha(producto, fechaActual, ctx.skusPlomeriaAfectados);

        // Precio: precio_lista - descuento por lista del cliente - descuento del vendedor
        const descuentoLista = DESCUENTO_POR_LISTA[cliente.lista_precios] || 0;
        const descuentoVendedor = faker.number.float({
          min: perfil.descuentoMin,
          max: perfil.descuentoMax,
        });
        const descuentoTotal = Math.min(descuentoLista + descuentoVendedor, 0.40); // Cap en 40%
        const descuentoPct = parseFloat((descuentoTotal * 100).toFixed(2));
        const precioUnitario = parseFloat((producto.precio_lista * (1 - descuentoLista)).toFixed(2));

        // Subtotal = cantidad × precioUnitario × (1 - descuentoVendedor)
        // Nota: descuento_pct en DB refleja solo el descuento del vendedor
        const subtotal = parseFloat(
          (cantidad * precioUnitario * (1 - descuentoVendedor)).toFixed(2)
        );

        // Si es devolución o nota de crédito, cantidades y subtotales negativos
        const signo = tipo === 'venta' ? 1 : -1;

        transacciones.push({
          folio,
          fecha: fechaISO,
          tipo,
          cliente_id: cliente.id,
          vendedor_id: vendedorId,
          bodega_id: bodegaId,
          sku: producto.sku,
          cantidad: cantidad * signo,
          precio_unitario: precioUnitario,
          costo_unitario: costoUnitario,
          descuento_pct: descuentoPct,
          subtotal: subtotal * signo,
        });

        // Detectar si esta transacción incluye cemento
        if (ctx.skusCemento.includes(producto.sku)) {
          incluyeCemento = true;
        }
      }

      // ─── Cross-sell: cemento → varilla ────────────────────────────
      if (
        incluyeCemento &&
        ctx.skusVarilla.length > 0 &&
        faker.number.float({ min: 0, max: 1 }) < CROSS_SELL_CEMENTO_VARILLA
      ) {
        const varilla = faker.helpers.arrayElement(
          productos.filter((p) => ctx.skusVarilla.includes(p.sku))
        );

        if (!skusEnTransaccion.has(varilla.sku)) {
          const cantidadVarilla = faker.number.int({ min: 5, max: 30 });
          const costoVarilla = obtenerCostoEnFecha(varilla, fechaActual, ctx.skusPlomeriaAfectados);
          const descuentoLista = DESCUENTO_POR_LISTA[cliente.lista_precios] || 0;
          const descuentoVendedor = faker.number.float({
            min: perfil.descuentoMin,
            max: perfil.descuentoMax,
          });
          const precioVarilla = parseFloat((varilla.precio_lista * (1 - descuentoLista)).toFixed(2));
          const descuentoPct = parseFloat(((descuentoLista + descuentoVendedor) * 100).toFixed(2));
          const subtotalVarilla = parseFloat(
            (cantidadVarilla * precioVarilla * (1 - descuentoVendedor)).toFixed(2)
          );
          const signo = tipo === 'venta' ? 1 : -1;

          transacciones.push({
            folio,
            fecha: fechaISO,
            tipo,
            cliente_id: cliente.id,
            vendedor_id: vendedorId,
            bodega_id: bodegaId,
            sku: varilla.sku,
            cantidad: cantidadVarilla * signo,
            precio_unitario: precioVarilla,
            costo_unitario: costoVarilla,
            descuento_pct: descuentoPct,
            subtotal: subtotalVarilla * signo,
          });

          lineasGeneradas++; // Contar la línea extra del cross-sell
        }
      }

      lineasGeneradas += lineasEfectivas;
    }

    // Avanzar al día siguiente
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return transacciones;
}
