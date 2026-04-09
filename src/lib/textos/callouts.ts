/**
 * callouts.ts — Generadores de texto para callouts del dashboard.
 *
 * Cada función maneja todos los casos de concordancia gramatical
 * delegando a pluralizar.ts. Nunca se hace concordancia inline aquí.
 */

import { pluralizar, pluralizarVerbo, conConteo } from './pluralizar';
import { formatMXN, formatPct } from './formato';

/**
 * Texto del callout de Top SKUs: compara overlap entre top ingresos y top margen.
 *
 * Casos:
 * - 0 overlap: "Ninguno de los N productos..."
 * - 1 overlap: "Solo 1 de los N productos... está..."
 * - 2-9 overlap: "Solo X de los N productos... están..."
 * - N overlap (todos): "Los N productos... también son los más vendidos"
 */
export function calloutTopSKUs(overlap: number, topN: number): string {
  if (overlap === 0) {
    return (
      `Ninguno de los ${topN} productos con mejor margen está entre los más vendidos. ` +
      `Esto es dinero que dejas en la mesa — oportunidad de empujar ventas en productos rentables.`
    );
  }

  if (overlap === topN) {
    return (
      `Los ${topN} productos con mejor margen también son los más vendidos — ` +
      `buena alineación de mix de producto.`
    );
  }

  const otros = topN - overlap;
  const verbo = pluralizarVerbo(overlap, 'está', 'están');

  return (
    `Solo ${overlap} de los ${topN} productos con mejor margen ${verbo} entre los más vendidos. ` +
    `Los otros ${otros} representan oportunidad de empujar ventas en productos rentables.`
  );
}

/**
 * Texto para indicador de mes parcial: "X de Y días"
 * Maneja concordancia: "1 de 1 día", "5 de 30 días", "1 de 28 días"
 */
export function textoDiasParcial(diasConDatos: number, diasDelMes: number): string {
  return `${diasConDatos} de ${diasDelMes} ${pluralizar(diasDelMes, 'día', 'días')}`;
}

/**
 * Texto del callout de deadstock.
 *
 * Casos:
 * - 0 SKUs: mensaje positivo
 * - 1 SKU: singular
 * - ≥2 SKUs: plural con recomendación de acción
 */
export function calloutDeadstock(numSKUs: number, capitalTotal: number): string {
  if (numSKUs === 0) {
    return 'No se detectó deadstock — buena gestión de inventario.';
  }

  if (numSKUs === 1) {
    return `Tienes 1 producto sin movimiento en 90+ días con ${formatMXN(capitalTotal)} inmovilizados.`;
  }

  return (
    `Tienes ${conConteo(numSKUs, 'producto', 'productos')} sin movimiento en 90+ días ` +
    `con ${formatMXN(capitalTotal)} inmovilizados en total. ` +
    `Considera liquidación, promociones, o devolución a proveedor.`
  );
}

/**
 * Texto del callout de clientes en riesgo.
 *
 * Casos:
 * - 0 clientes: mensaje positivo
 * - 1 cliente: singular con verbo "muestra" y "representa"
 * - ≥2 clientes: plural con recomendación de campaña
 */
export function calloutClientesEnRiesgo(numClientes: number, ingresosPotenciales: number): string {
  if (numClientes === 0) {
    return 'No se detectaron clientes en riesgo — buena retención.';
  }

  if (numClientes === 1) {
    return (
      `1 cliente muestra señales de riesgo, representa ${formatMXN(ingresosPotenciales)} ` +
      `de ingresos anuales potencialmente perdidos. Considera contacto directo.`
    );
  }

  return (
    `${conConteo(numClientes, 'cliente', 'clientes')} ` +
    `${pluralizarVerbo(numClientes, 'muestra', 'muestran')} señales de riesgo, ` +
    `${pluralizarVerbo(numClientes, 'representa', 'representan')} ${formatMXN(ingresosPotenciales)} ` +
    `de ingresos anuales potencialmente perdidos. ` +
    `Considera campaña de retención o contacto directo con los más grandes.`
  );
}

// ─── Rendimiento de vendedores ──────────────────────────────────────────────

interface VendedorParaCallout {
  nombre: string;
  margen_pct: number;
  descuento_promedio_pct: number;
  ingresos_totales: number;
}

/**
 * Detecta automáticamente el insight más importante del rendimiento de vendedores.
 *
 * Prioridad:
 * 1. Vendedor con margen <18% Y descuento >12% → señal de coaching
 * 2. Dispersión alta de márgenes (>8pp entre mejor y peor) → compartir prácticas
 * 3. Rendimiento homogéneo → mensaje positivo
 */
export function calloutRendimientoVendedores(vendedores: VendedorParaCallout[]): string {
  if (vendedores.length === 0) {
    return 'No hay datos de vendedores para este período.';
  }

  const ingresosTotales = vendedores.reduce((s, v) => s + v.ingresos_totales, 0);

  // Calcular margen total ponderado para obtener % de margen total por vendedor
  // margen$ de cada vendedor ≈ ingresos * margen_pct / 100
  const margenTotalAbs = vendedores.reduce(
    (s, v) => s + v.ingresos_totales * v.margen_pct / 100, 0
  );

  // Caso 1: vendedor problemático (margen <18% Y descuento >12%)
  // De todos los que cumplen, seleccionar el peor (margen más bajo; empate: mayor descuento)
  const problematicos = vendedores
    .filter((v) => v.margen_pct < 18 && v.descuento_promedio_pct > 12)
    .sort((a, b) => a.margen_pct - b.margen_pct || b.descuento_promedio_pct - a.descuento_promedio_pct);
  const problematico = problematicos.length > 0 ? problematicos[0] : vendedores.find(() => false
  );

  if (problematico) {
    const pctVolumen = ingresosTotales > 0
      ? (problematico.ingresos_totales / ingresosTotales * 100).toFixed(0)
      : '0';
    const margenVendedor = problematico.ingresos_totales * problematico.margen_pct / 100;
    const pctMargen = margenTotalAbs > 0
      ? (margenVendedor / margenTotalAbs * 100).toFixed(0)
      : '0';

    return (
      `${problematico.nombre} tiene el margen más bajo del equipo (${formatPct(problematico.margen_pct)}) ` +
      `por aplicar descuentos agresivos (promedio ${formatPct(problematico.descuento_promedio_pct)}). ` +
      `Representa ${pctVolumen}% del volumen pero solo ${pctMargen}% del margen total ` +
      `— oportunidad de coaching en manejo de descuentos.`
    );
  }

  // Caso 2: dispersión alta (>8pp entre mejor y peor)
  const margenes = vendedores.map((v) => v.margen_pct);
  const margenMax = Math.max(...margenes);
  const margenMin = Math.min(...margenes);
  const dispersion = margenMax - margenMin;

  if (dispersion > 8) {
    const mejor = vendedores.find((v) => v.margen_pct === margenMax)!;
    const peor = vendedores.find((v) => v.margen_pct === margenMin)!;

    return (
      `Hay una dispersión de ${dispersion.toFixed(1)} puntos porcentuales entre ` +
      `el vendedor con mejor margen (${mejor.nombre}: ${formatPct(mejor.margen_pct)}) ` +
      `y el peor (${peor.nombre}: ${formatPct(peor.margen_pct)}). ` +
      `Considera compartir prácticas del equipo estrella.`
    );
  }

  // Caso 3: rendimiento homogéneo
  return (
    `Rendimiento homogéneo del equipo de ventas ` +
    `— margen entre ${formatPct(margenMin)} y ${formatPct(margenMax)}.`
  );
}
