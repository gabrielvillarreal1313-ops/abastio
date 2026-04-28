/**
 * reglas-grafica.ts — Reglas puras de validación para la configuración
 * de gráficas del Explorer (Fase 15, Checkpoint 3).
 *
 * Centraliza qué tipos/métricas/comparativo aplican según contexto,
 * para que UI, persistencia y futura validación consulten un solo lugar.
 *
 * Convenciones:
 * - Todas las funciones son puras, sin side effects.
 * - El "default" se elige según la dimensión y el sort actual de la tabla.
 * - La reconciliación se ejecuta cuando cambia la dimensión, conservando
 *   las decisiones del usuario cuando siguen siendo válidas.
 */

import type { DimensionExplorer } from '@/lib/queries/explorer';
import type {
  ConfiguracionGrafica,
  MetricaGrafica,
  TipoGrafica,
  TopNGrafica,
} from '@/lib/queries/reportes-guardados';

// ─── Catálogos ─────────────────────────────────────────────────────────────

const TIPOS_PARA_MESES: TipoGrafica[] = ['lineas', 'area'];
const TIPOS_PARA_OTRAS: TipoGrafica[] = [
  'barras_horizontales',
  'barras_verticales',
  'donut',
];

const TODAS_LAS_METRICAS: MetricaGrafica[] = [
  'ventas_ytd',
  'ventas_lytd',
  'delta_ventas_abs',
  'delta_ventas_pct',
  'gm_ytd',
  'gm_lytd',
  'delta_gm_abs',
  'delta_gm_pct',
];

const METRICAS_DELTA: MetricaGrafica[] = [
  'delta_ventas_abs',
  'delta_ventas_pct',
  'delta_gm_abs',
  'delta_gm_pct',
];

const METRICAS_ABSOLUTAS: MetricaGrafica[] = TODAS_LAS_METRICAS.filter(
  (m) => !METRICAS_DELTA.includes(m)
);

// Métricas que tienen un par natural LYTD para graficar como serie comparativa.
// `ventas_lytd` y `gm_lytd` ya SON históricas, así que no tienen "vs año anterior".
const METRICAS_CON_PAR_LYTD: MetricaGrafica[] = ['ventas_ytd', 'gm_ytd'];

// ─── Etiquetas de display ──────────────────────────────────────────────────

export const ETIQUETA_TIPO: Record<TipoGrafica, string> = {
  barras_horizontales: 'Barras horizontales',
  barras_verticales: 'Barras verticales',
  lineas: 'Líneas',
  area: 'Área',
  donut: 'Donut',
};

export const ETIQUETA_METRICA: Record<MetricaGrafica, string> = {
  ventas_ytd: 'Ventas YTD',
  ventas_lytd: 'Ventas LYTD',
  delta_ventas_abs: 'Δ Ventas $',
  delta_ventas_pct: 'Δ Ventas %',
  gm_ytd: 'GM YTD',
  gm_lytd: 'GM LYTD',
  delta_gm_abs: 'Δ GM $',
  delta_gm_pct: 'Δ GM %',
};

export const ETIQUETA_DIMENSION: Record<DimensionExplorer, string> = {
  bodegas: 'Bodegas',
  vendedores: 'Vendedores',
  clientes: 'Clientes',
  categorias: 'Categorías',
  productos: 'Productos',
  meses: 'Meses',
  ciudades: 'Ciudades',
};

// ─── Reglas ─────────────────────────────────────────────────────────────────

/**
 * Retorna los tipos de gráfica válidos para una dimensión dada.
 * Reglas:
 * - `meses`: solo Líneas y Área (visualizaciones de serie temporal)
 * - Otras dimensiones: Barras horizontales, Barras verticales, Donut
 *
 * @example
 * tiposValidosParaDimension('meses')   // ['lineas', 'area']
 * tiposValidosParaDimension('bodegas') // ['barras_horizontales', 'barras_verticales', 'donut']
 */
export function tiposValidosParaDimension(dimension: DimensionExplorer): TipoGrafica[] {
  return dimension === 'meses' ? TIPOS_PARA_MESES : TIPOS_PARA_OTRAS;
}

/**
 * Retorna las métricas válidas para un tipo de gráfica dado.
 * Reglas:
 * - Donut: solo métricas absolutas (no deltas, porque sumar deltas como % del total no tiene sentido)
 * - Otros tipos: las 8 métricas
 *
 * @example
 * metricasValidasParaTipo('donut')              // 4 métricas absolutas
 * metricasValidasParaTipo('barras_horizontales') // las 8
 */
export function metricasValidasParaTipo(tipo: TipoGrafica): MetricaGrafica[] {
  return tipo === 'donut' ? METRICAS_ABSOLUTAS : TODAS_LAS_METRICAS;
}

/**
 * Retorna true si el comparativo YTD vs LYTD aplica para esta combinación.
 * Reglas:
 * - Donut no soporta comparativo (es % sobre total, no comparación temporal)
 * - Métricas delta no tienen sentido comparar (sería delta de delta)
 * - Métricas LYTD ya son históricas — no tienen "vs año anterior" propio
 *
 * @example
 * comparativoAplicaPara('barras_horizontales', 'ventas_ytd')        // true
 * comparativoAplicaPara('barras_horizontales', 'ventas_lytd')       // false
 * comparativoAplicaPara('barras_horizontales', 'delta_ventas_abs')  // false
 * comparativoAplicaPara('donut', 'ventas_ytd')                       // false
 */
export function comparativoAplicaPara(
  tipo: TipoGrafica,
  metrica: MetricaGrafica
): boolean {
  if (tipo === 'donut') return false;
  if (METRICAS_DELTA.includes(metrica)) return false;
  return METRICAS_CON_PAR_LYTD.includes(metrica);
}

// ─── Mapeo de columnas de sort a métricas ───────────────────────────────────

const SORT_A_METRICA: Record<string, MetricaGrafica> = {
  ventas_ytd: 'ventas_ytd',
  ventas_lytd: 'ventas_lytd',
  ventas_delta: 'delta_ventas_abs',
  ventas_delta_pct: 'delta_ventas_pct',
  gm_ytd: 'gm_ytd',
  gm_lytd: 'gm_lytd',
  gm_delta: 'delta_gm_abs',
};

/**
 * Mapea la columna por la que está ordenada la tabla a la métrica equivalente
 * de gráfica. Columnas no numéricas (`dimension_id`, `dimension_label`) caen
 * al fallback `ventas_ytd`.
 *
 * @example
 * metricaDesdeSort('ventas_ytd')      // 'ventas_ytd'
 * metricaDesdeSort('gm_delta')        // 'delta_gm_abs'
 * metricaDesdeSort('dimension_label') // 'ventas_ytd' (fallback)
 */
export function metricaDesdeSort(sortColumn: string): MetricaGrafica {
  return SORT_A_METRICA[sortColumn] ?? 'ventas_ytd';
}

// ─── Defaults y reconciliación ──────────────────────────────────────────────

/**
 * Tipo de gráfica default para cada dimensión. Centraliza el hardcode que
 * antes estaba duplicado entre `generarConfiguracionDefault` y
 * `reconciliarConfiguracion`. El tipo `Record<DimensionExplorer, ...>` fuerza
 * completitud en compile-time: agregar una dimensión nueva al tipo
 * `DimensionExplorer` sin actualizar este record genera un error de TypeScript.
 */
export const TIPO_DEFAULT_POR_DIMENSION: Record<DimensionExplorer, TipoGrafica> = {
  meses: 'area',
  bodegas: 'barras_horizontales',
  vendedores: 'barras_horizontales',
  clientes: 'barras_horizontales',
  categorias: 'barras_horizontales',
  productos: 'barras_horizontales',
  ciudades: 'barras_horizontales',
};

/**
 * Top N solo aplica cuando la dimensión limita las filas mostradas.
 * En dimensión Meses siempre se muestran los 12 meses (eje X cronológico),
 * así que Top N es irrelevante y la UI lo deshabilita visualmente.
 */
export function topNAplicaPara(dimension: DimensionExplorer): boolean {
  return dimension !== 'meses';
}

/**
 * Genera la configuración default de gráfica según el contexto del Explorer.
 * Se llama cuando el usuario hace toggle de Tabla a Gráfica por primera vez,
 * o cuando la dimensión cambia y la configuración actual ya no es válida.
 *
 * Reglas:
 * - Tipo default: 'lineas' si dimensión es 'meses', 'barras_horizontales' en otro caso
 * - Métrica default: derivada de la columna de sort, fallback 'ventas_ytd'.
 *   Si esa métrica no aplica para el tipo elegido (ej. delta en Donut), se cambia a 'ventas_ytd'
 * - Top N default: 15
 * - Comparativo default: true si aplica para tipo+métrica, false en otro caso
 *
 * @example
 * generarConfiguracionDefault('bodegas', 'ventas_ytd')
 * // { tipo: 'barras_horizontales', metrica: 'ventas_ytd', top_n: 15, comparar_lytd: true }
 *
 * generarConfiguracionDefault('meses', 'gm_ytd')
 * // { tipo: 'lineas', metrica: 'gm_ytd', top_n: 15, comparar_lytd: true }
 */
export function generarConfiguracionDefault(
  dimension: DimensionExplorer,
  sortColumn: string
): ConfiguracionGrafica {
  const tipo = TIPO_DEFAULT_POR_DIMENSION[dimension];
  const metricaCandidata = metricaDesdeSort(sortColumn);
  const metricasOk = metricasValidasParaTipo(tipo);
  const metrica = metricasOk.includes(metricaCandidata) ? metricaCandidata : 'ventas_ytd';
  return {
    tipo,
    metrica,
    top_n: 15,
    comparar_lytd: comparativoAplicaPara(tipo, metrica),
  };
}

/**
 * Reconcilia una configuración existente cuando cambia la dimensión.
 * Si el tipo actual ya no aplica para la nueva dimensión, lo cambia al default.
 * Si la métrica actual ya no aplica para el nuevo tipo, la cambia al default.
 * Si el comparativo no aplica para la nueva combinación, lo apaga.
 *
 * Conserva las decisiones del usuario cuando siguen siendo válidas. No regenera
 * desde cero — solo arregla las inconsistencias mínimas.
 *
 * @example
 * // Usuario en Bodegas con barras horizontales, cambia a Meses
 * reconciliarConfiguracion(
 *   { tipo: 'barras_horizontales', metrica: 'ventas_ytd', top_n: 15, comparar_lytd: true },
 *   'meses'
 * )
 * // { tipo: 'lineas', metrica: 'ventas_ytd', top_n: 15, comparar_lytd: true }
 *
 * // Usuario en Meses con líneas, cambia a Bodegas
 * reconciliarConfiguracion(
 *   { tipo: 'lineas', metrica: 'ventas_ytd', top_n: 15, comparar_lytd: true },
 *   'bodegas'
 * )
 * // { tipo: 'barras_horizontales', metrica: 'ventas_ytd', top_n: 15, comparar_lytd: true }
 */
export function reconciliarConfiguracion(
  config: ConfiguracionGrafica,
  nuevaDimension: DimensionExplorer
): ConfiguracionGrafica {
  const tiposOk = tiposValidosParaDimension(nuevaDimension);
  const tipo = tiposOk.includes(config.tipo)
    ? config.tipo
    : TIPO_DEFAULT_POR_DIMENSION[nuevaDimension];

  const metricasOk = metricasValidasParaTipo(tipo);
  const metrica = metricasOk.includes(config.metrica) ? config.metrica : 'ventas_ytd';

  const comparar_lytd = config.comparar_lytd && comparativoAplicaPara(tipo, metrica);

  return {
    tipo,
    metrica,
    top_n: config.top_n,
    comparar_lytd,
  };
}

// ─── Saneado defensivo ──────────────────────────────────────────────────────

const TOP_N_VALIDOS = new Set<TopNGrafica>([5, 10, 15, 25, 50, 'todos']);

/**
 * Valida una configuración de gráfica contra las reglas y retorna una versión
 * saneada. Si la configuración es válida, retorna la misma sin cambios. Si tiene
 * combinaciones inválidas, retorna versión corregida aplicando los defaults
 * apropiados para el contexto.
 *
 * Defensa en profundidad: la UI ya previene combinaciones inválidas, pero un
 * usuario con acceso a la DB podría editar el JSONB manualmente. Esta función
 * garantiza que el render no truene aunque llegue basura.
 *
 * Reglas de saneado:
 * - Tipo no válido para dimensión → reemplazar con tipo default de esa dimensión
 * - Métrica no válida para tipo → reemplazar con `ventas_ytd`
 * - Comparativo true cuando no aplica → forzar a false
 * - top_n no en {5,10,15,25,50,'todos'} → forzar a 15
 *
 * @returns la misma referencia si no hubo cambios, o un objeto nuevo saneado.
 *   Comparar por identidad (`===`) para detectar si hubo cambios.
 */
export function sanearConfiguracionGrafica(
  config: ConfiguracionGrafica,
  dimension: DimensionExplorer
): ConfiguracionGrafica {
  const tiposOk = tiposValidosParaDimension(dimension);
  const tipoOk = tiposOk.includes(config.tipo);
  const tipo = tipoOk ? config.tipo : TIPO_DEFAULT_POR_DIMENSION[dimension];

  const metricasOk = metricasValidasParaTipo(tipo);
  const metricaOk = metricasOk.includes(config.metrica);
  const metrica = metricaOk ? config.metrica : 'ventas_ytd';

  const compAplica = comparativoAplicaPara(tipo, metrica);
  const compararCandidato = config.comparar_lytd === true;
  const comparar_lytd = compAplica && compararCandidato;

  const topNOk = TOP_N_VALIDOS.has(config.top_n);
  const top_n = topNOk ? config.top_n : 15;

  // Si nada cambió, devolver la misma referencia para que callers puedan
  // detectar "no hubo saneado" con comparación de identidad.
  if (tipoOk && metricaOk && comparar_lytd === config.comparar_lytd && topNOk) {
    return config;
  }

  return { tipo, metrica, top_n, comparar_lytd };
}

// ─── Tooltips de "deshabilitado" ────────────────────────────────────────────

/**
 * Retorna el motivo por el que una opción está deshabilitada, para mostrar
 * en tooltip nativo del control. Retorna null si la opción está habilitada.
 *
 * Acepta tres tipos de opción:
 * - 'tipo': se valida contra la dimensión del Explorer
 * - 'metrica': se valida contra el tipo actual
 * - 'comparativo': se valida contra (tipo, métrica) — `valor` es ignorado
 *
 * @example
 * motivoDeshabilitado('tipo', 'lineas', { dimension: 'bodegas', tipo: 'barras_horizontales', metrica: 'ventas_ytd' })
 * // "No disponible para dimensión Bodegas"
 *
 * motivoDeshabilitado('metrica', 'delta_ventas_abs', { dimension: 'bodegas', tipo: 'donut', metrica: 'ventas_ytd' })
 * // "No disponible para gráfica de Donut"
 */
export function motivoDeshabilitado(
  opcion: 'tipo' | 'metrica' | 'comparativo',
  valor: string,
  contexto: {
    dimension: DimensionExplorer;
    tipo: TipoGrafica;
    metrica: MetricaGrafica;
  }
): string | null {
  if (opcion === 'tipo') {
    const tiposOk = tiposValidosParaDimension(contexto.dimension);
    if (tiposOk.includes(valor as TipoGrafica)) return null;
    return `No disponible para dimensión ${ETIQUETA_DIMENSION[contexto.dimension]}`;
  }

  if (opcion === 'metrica') {
    const metricasOk = metricasValidasParaTipo(contexto.tipo);
    if (metricasOk.includes(valor as MetricaGrafica)) return null;
    return `No disponible para gráfica de ${ETIQUETA_TIPO[contexto.tipo]}`;
  }

  // comparativo
  if (comparativoAplicaPara(contexto.tipo, contexto.metrica)) return null;
  return 'No aplica para esta combinación';
}
