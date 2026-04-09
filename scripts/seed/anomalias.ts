/**
 * anomalias.ts — Inyecta imperfecciones deliberadas en los datos generados.
 *
 * Todas las anomalías se aplican como transformaciones post-generación:
 * los datos se generan "limpios" primero y después se ensucian aquí.
 * Esto permite controlar exactamente qué se contamina.
 */

import { faker } from '@faker-js/faker';
import { ANOMALIAS, FAKER_SEED } from './config';
import type { Producto } from './catalogo';
import type { Cliente } from './clientes';
import type { Transaccion } from './transacciones';

faker.seed(FAKER_SEED + 300);

// ─── Productos duplicados ───────────────────────────────────────────────────

/**
 * Crea 22 productos duplicados con variaciones sutiles de nombre/SKU.
 * Simula el problema real de catálogos sucios donde el mismo producto
 * se registra más de una vez con nombres ligeramente diferentes.
 *
 * Ejemplos de variaciones:
 * - "Tornillo hexagonal galvanizado 1/4 x 1" → "Tornillo hex. galv. 1/4 x 1"
 * - SKU "TOR-0001" → "TOR-0001-A"
 */
export function generarProductosDuplicados(productosOriginales: Producto[]): Producto[] {
  const duplicados: Producto[] = [];
  const seleccionados = faker.helpers.arrayElements(
    productosOriginales.filter((p) => p.activo),
    ANOMALIAS.productosDuplicados
  );

  const variaciones: Array<(nombre: string) => string> = [
    (n) => n.replace('galvanizado', 'galv.'),
    (n) => n.replace('hexagonal', 'hex.'),
    (n) => n.replace('inoxidable', 'inox.'),
    (n) => n.replace('industrial', 'ind.'),
    (n) => n.replace('profesional', 'prof.'),
    (n) => n.replace('eléctric', 'electr.'),
    (n) => n + ' (duplicado sistema)',
    (n) => n.replace('"', 'pulg'),
    (n) => n.toUpperCase(),
    (n) => n.replace('para', 'p/'),
    (n) => n.replace('con', 'c/'),
    (n) => n.replace('de', 'd/'),
  ];

  seleccionados.forEach((original, i) => {
    const variacionFn = variaciones[i % variaciones.length];
    const nombreVariado = variacionFn(original.nombre);

    duplicados.push({
      ...original,
      sku: `${original.sku}-DUP`,
      nombre: nombreVariado,
      // Costo ligeramente diferente para simular captura manual
      costo_unitario: parseFloat((original.costo_unitario * faker.number.float({ min: 0.98, max: 1.02 })).toFixed(2)),
      precio_lista: parseFloat((original.precio_lista * faker.number.float({ min: 0.99, max: 1.01 })).toFixed(2)),
    });
  });

  return duplicados;
}

// ─── Clientes duplicados ────────────────────────────────────────────────────

/**
 * Crea 12 clientes duplicados con RFCs inconsistentes.
 * Simula el problema de clientes que se registran varias veces
 * (ej: se mudan, cambian de vendedor, errores de captura).
 */
export function generarClientesDuplicados(clientesOriginales: Cliente[]): Cliente[] {
  const duplicados: Cliente[] = [];
  const seleccionados = faker.helpers.arrayElements(
    clientesOriginales,
    ANOMALIAS.clientesDuplicados
  );

  seleccionados.forEach((original) => {
    // Variar el RFC (errores comunes: una letra mal, homoclave diferente)
    const rfcOriginal = original.rfc;
    const rfcVariado = rfcOriginal.slice(0, -3) +
      faker.string.alphanumeric({ length: 3, casing: 'upper' });

    // Variar nombre sutilmente
    const variaciones = [
      original.razon_social.replace('S.A. de C.V.', 'SA de CV'),
      original.razon_social.replace(', S.A. de C.V.', ''),
      original.razon_social + ' (Sucursal)',
      original.razon_social.replace('Ferretería', 'Ferret.'),
      original.razon_social.replace('Constructora', 'Const.'),
    ];

    duplicados.push({
      ...original,
      razon_social: faker.helpers.arrayElement(variaciones),
      rfc: rfcVariado,
    });
  });

  return duplicados;
}

// ─── Costos NULL en transacciones ───────────────────────────────────────────

/**
 * Anula el costo_unitario en ~3% de las transacciones.
 * Simula errores de integración donde el costo no se captura.
 * Modifica el array in-place para eficiencia.
 */
export function inyectarCostosNull(transacciones: Transaccion[]): number {
  let contador = 0;
  const objetivo = Math.floor(transacciones.length * ANOMALIAS.porcentajeCostoNull);

  // Seleccionar índices al azar
  const indices = faker.helpers.arrayElements(
    Array.from({ length: transacciones.length }, (_, i) => i),
    objetivo
  );

  for (const idx of indices) {
    transacciones[idx].costo_unitario = null;
    contador++;
  }

  return contador;
}

// ─── Cantidades outlier ─────────────────────────────────────────────────────

/**
 * Multiplica la cantidad en ~1.5% de las transacciones por un factor de 10-50.
 * Simula errores de captura donde se pone la cantidad equivocada.
 * Recalcula el subtotal acorde.
 */
export function inyectarCantidadesOutlier(transacciones: Transaccion[]): number {
  let contador = 0;
  const objetivo = Math.floor(transacciones.length * ANOMALIAS.porcentajeCantidadOutlier);

  const indices = faker.helpers.arrayElements(
    Array.from({ length: transacciones.length }, (_, i) => i),
    objetivo
  );

  for (const idx of indices) {
    const tx = transacciones[idx];
    const factor = faker.number.int({ min: 10, max: 50 });
    const signo = tx.cantidad >= 0 ? 1 : -1;
    tx.cantidad = Math.abs(tx.cantidad) * factor * signo;
    // Recalcular subtotal
    tx.subtotal = parseFloat(
      (Math.abs(tx.cantidad) * tx.precio_unitario * (1 - tx.descuento_pct / 100) * signo).toFixed(2)
    );
    contador++;
  }

  return contador;
}

// ─── SKUs descontinuados ────────────────────────────────────────────────────

/**
 * Marca 18 SKUs como "descontinuados en la práctica":
 * - Siguen con activo=true (nadie los desactivó en el sistema)
 * - Pero no tienen transacciones en los últimos 4-6 meses
 *
 * Se eliminan las transacciones recientes de estos SKUs.
 * El inventario positivo se preserva (se calcula después).
 *
 * @returns Los SKUs que fueron marcados como descontinuados
 */
export function procesarSkusDescontinuados(
  productos: Producto[],
  transacciones: Transaccion[]
): string[] {
  // Seleccionar 18 SKUs activos al azar (evitar los de plomería que ya tienen su anomalía)
  const candidatos = productos.filter(
    (p) => p.activo && p.categoria !== 'Plomería'
  );
  const descontinuados = faker.helpers.arrayElements(candidatos, ANOMALIAS.skusDescontinuados);
  const skusDesc = new Set(descontinuados.map((p) => p.sku));

  // Fecha de corte: 4-6 meses atrás
  const mesesAtras = faker.number.int({ min: 4, max: 6 });
  const fechaCorte = new Date(ANOMALIAS.clienteEnDeclive.fechaDeclive); // ~enero 2026
  fechaCorte.setMonth(fechaCorte.getMonth() - mesesAtras + 3);

  // Eliminar transacciones de estos SKUs posteriores a la fecha de corte
  let eliminadas = 0;
  for (let i = transacciones.length - 1; i >= 0; i--) {
    if (
      skusDesc.has(transacciones[i].sku) &&
      new Date(transacciones[i].fecha) >= fechaCorte
    ) {
      transacciones.splice(i, 1);
      eliminadas++;
    }
  }

  console.log(`   Descontinuados: ${skusDesc.size} SKUs, ${eliminadas} transacciones eliminadas post-corte`);

  return Array.from(skusDesc);
}

// ─── Escenario proveedor plomería ───────────────────────────────────────────

/**
 * Actualiza los precio_lista de los SKUs de plomería afectados
 * para que NO reflejen el incremento de costos.
 *
 * El incremento de costos ya se aplicó en transacciones.ts (obtenerCostoEnFecha).
 * Aquí simplemente verificamos que el precio_lista original se mantuvo,
 * creando la situación de margen erosionado.
 *
 * Nota: Esta función no necesita hacer nada si el catálogo ya se generó
 * con precios pre-incremento (que es el caso). Pero la incluimos para
 * documentar el escenario y poder verificarlo.
 *
 * @returns Info del escenario para el reporte
 */
export function verificarEscenarioPlomeria(
  productos: Producto[],
  skusAfectados: Set<string>
): { skusAfectados: number; margenAntes: number; margenDespues: number } {
  let margenAntesSum = 0;
  let margenDespuesSum = 0;
  let count = 0;

  for (const p of productos) {
    if (skusAfectados.has(p.sku)) {
      const costoOriginal = p.costo_unitario;
      const costoNuevo = costoOriginal * (1 + ANOMALIAS.plomeria.incrementoCosto);
      const precio = p.precio_lista;

      const margenAntes = (precio - costoOriginal) / precio;
      const margenDespues = (precio - costoNuevo) / precio;

      margenAntesSum += margenAntes;
      margenDespuesSum += margenDespues;
      count++;
    }
  }

  return {
    skusAfectados: count,
    margenAntes: count > 0 ? margenAntesSum / count : 0,
    margenDespues: count > 0 ? margenDespuesSum / count : 0,
  };
}
