/**
 * config.ts — Todas las constantes y parámetros del generador centralizados.
 *
 * Este archivo es la "perilla de control" del generador. Cualquier ajuste
 * de volumen, probabilidad, distribución o comportamiento se hace aquí.
 */

// ─── Fechas del período de transacciones ────────────────────────────────────

/** 18 meses hacia atrás desde la fecha actual */
export const FECHA_INICIO = new Date('2024-10-01');
export const FECHA_FIN = new Date('2026-04-09');

// ─── Volúmenes objetivo ─────────────────────────────────────────────────────

/** Líneas de transacción por día hábil (lun-sáb) */
export const LINEAS_DIA_MIN = 220;
export const LINEAS_DIA_MAX = 260;

/** Líneas promedio por transacción (una transacción = varias líneas con mismo folio) */
export const LINEAS_POR_TRANSACCION_MIN = 3;
export const LINEAS_POR_TRANSACCION_MAX = 7;

/** Domingos: actividad mínima (0-5 líneas) */
export const LINEAS_DIA_DOMINGO_MAX = 5;

/** Ingresos anuales objetivo para calibración: ~$255M MXN */
export const INGRESOS_ANUALES_OBJETIVO = 255_000_000;

/** Tamaño de batch para inserciones en Supabase */
export const BATCH_SIZE = 1000;

// ─── Catálogo de productos ──────────────────────────────────────────────────

/** Total de SKUs activos (antes de duplicados por anomalías) */
export const TOTAL_SKUS = 750;

/** Distribución exacta de SKUs por categoría */
export const SKUS_POR_CATEGORIA: Record<string, number> = {
  'Tornillería y sujeción': 135,
  'Herramientas manuales': 115,
  'Herramientas eléctricas': 70,
  'Plomería': 105,
  'Electricidad': 95,
  'Pintura y accesorios': 75,
  'Materiales de construcción': 70,
  'Jardinería': 45,
  'Seguridad industrial': 40,
};

/** Prefijo de SKU por categoría (3 letras) */
export const PREFIJO_SKU: Record<string, string> = {
  'Tornillería y sujeción': 'TOR',
  'Herramientas manuales': 'HMA',
  'Herramientas eléctricas': 'HEL',
  'Plomería': 'PLO',
  'Electricidad': 'ELE',
  'Pintura y accesorios': 'PIN',
  'Materiales de construcción': 'MAT',
  'Jardinería': 'JAR',
  'Seguridad industrial': 'SEG',
};

/**
 * Márgenes brutos objetivo por categoría (min%, max%).
 * El costo se genera primero y el precio se calcula para caer en este rango.
 */
export const MARGENES_POR_CATEGORIA: Record<string, { min: number; max: number }> = {
  'Tornillería y sujeción': { min: 0.30, max: 0.40 },
  'Herramientas manuales': { min: 0.22, max: 0.32 },
  'Herramientas eléctricas': { min: 0.18, max: 0.25 },
  'Plomería': { min: 0.28, max: 0.38 },
  'Electricidad': { min: 0.25, max: 0.35 },
  'Pintura y accesorios': { min: 0.30, max: 0.40 },
  'Materiales de construcción': { min: 0.08, max: 0.18 },
  'Jardinería': { min: 0.30, max: 0.45 },
  'Seguridad industrial': { min: 0.35, max: 0.50 },
};

/** Marcas por categoría (solo las que tienen marcas específicas) */
export const MARCAS_POR_CATEGORIA: Record<string, string[]> = {
  'Herramientas manuales': ['Truper', 'Pretul', 'Stanley', 'Urrea'],
  'Herramientas eléctricas': ['Truper', 'DeWalt', 'Makita', 'Black+Decker'],
  'Pintura y accesorios': ['Comex', 'Sherwin Williams', 'Berel'],
};

// ─── Clientes ───────────────────────────────────────────────────────────────

export const TOTAL_CLIENTES = 110;

/** Distribución de tipos de cliente (porcentaje → cantidad exacta) */
export const DISTRIBUCION_TIPO_CLIENTE: Record<string, number> = {
  ferreteria_minorista: 44,  // 40%
  constructor: 22,           // 20%
  plomero: 13,               // ~12%
  electricista: 11,          // 10%
  carpintero: 9,             // ~8%
  industrial: 9,             // ~8%
  otro: 2,                   // ~2%
};

/** Ciudades y su peso de distribución (más clientes en ciudades más grandes) */
export const CIUDADES: Array<{ ciudad: string; estado: string; peso: number }> = [
  { ciudad: 'León', estado: 'Guanajuato', peso: 0.30 },
  { ciudad: 'Querétaro', estado: 'Querétaro', peso: 0.18 },
  { ciudad: 'Celaya', estado: 'Guanajuato', peso: 0.12 },
  { ciudad: 'Irapuato', estado: 'Guanajuato', peso: 0.12 },
  { ciudad: 'Silao', estado: 'Guanajuato', peso: 0.08 },
  { ciudad: 'San Luis Potosí', estado: 'San Luis Potosí', peso: 0.10 },
  { ciudad: 'Aguascalientes', estado: 'Aguascalientes', peso: 0.10 },
];

/**
 * Asignación de lista de precios según tipo de cliente.
 * A = mejores precios (industriales grandes), D = precios estándar (ferreterías chicas)
 */
export const LISTA_PRECIOS_POR_TIPO: Record<string, string[]> = {
  industrial: ['A', 'A', 'B'],          // Mayoría en A
  constructor: ['A', 'B', 'B', 'C'],    // Mayoría en B
  ferreteria_minorista: ['B', 'C', 'C', 'D', 'D'], // Mayoría en C-D
  plomero: ['C', 'C', 'D'],
  electricista: ['C', 'C', 'D'],
  carpintero: ['C', 'D', 'D'],
  otro: ['D', 'D'],
};

/**
 * Descuento implícito por lista de precios sobre precio_lista.
 * Lista A obtiene 12% menos que precio_lista, D paga precio_lista completo.
 */
export const DESCUENTO_POR_LISTA: Record<string, number> = {
  A: 0.12,
  B: 0.08,
  C: 0.04,
  D: 0.00,
};

/** Límites de crédito por tipo de cliente (rango en MXN) */
export const LIMITE_CREDITO_POR_TIPO: Record<string, { min: number; max: number }> = {
  industrial: { min: 500_000, max: 2_000_000 },
  constructor: { min: 200_000, max: 800_000 },
  ferreteria_minorista: { min: 30_000, max: 150_000 },
  plomero: { min: 20_000, max: 80_000 },
  electricista: { min: 20_000, max: 80_000 },
  carpintero: { min: 15_000, max: 60_000 },
  otro: { min: 10_000, max: 30_000 },
};

/** Días de crédito por tipo de cliente */
export const DIAS_CREDITO_POR_TIPO: Record<string, number[]> = {
  industrial: [30, 45, 60],
  constructor: [30, 30, 45],
  ferreteria_minorista: [15, 30, 30],
  plomero: [15, 15, 30],
  electricista: [15, 15, 30],
  carpintero: [15, 15],
  otro: [0, 15],
};

// ─── Vendedores ─────────────────────────────────────────────────────────────

export interface PerfilVendedor {
  nombre: string;
  zona: string;
  tipo: 'mostrador' | 'ruta' | 'telefonico';
  /** Margen bruto promedio objetivo (solo para el generador, no se guarda en DB) */
  margenObjetivo: number;
  /** Rango de descuento adicional que este vendedor aplica sobre el precio de lista */
  descuentoMin: number;
  descuentoMax: number;
  /** Peso relativo para asignación de transacciones (vendedores estrella venden más) */
  pesoVolumen: number;
  /** Descripción del perfil para comentarios */
  perfil: string;
}

export const PERFILES_VENDEDORES: PerfilVendedor[] = [
  {
    nombre: 'Ricardo Mendoza',
    zona: 'León',
    tipo: 'ruta',
    margenObjetivo: 0.28,
    descuentoMin: 0.00,
    descuentoMax: 0.05,
    pesoVolumen: 1.4,
    perfil: 'Estrella: margen alto, descuentos mínimos',
  },
  {
    nombre: 'Jorge Ramírez',
    zona: 'Querétaro',
    tipo: 'ruta',
    margenObjetivo: 0.14,
    descuentoMin: 0.15,
    descuentoMax: 0.25,
    pesoVolumen: 1.1,
    perfil: 'Mediocre: descuentos agresivos para cerrar ventas',
  },
  {
    nombre: 'Laura Sánchez',
    zona: 'León',
    tipo: 'ruta',
    margenObjetivo: 0.24,
    descuentoMin: 0.03,
    descuentoMax: 0.10,
    pesoVolumen: 0.9,
    perfil: 'Especialista industrial: tickets grandes, ~15 clientes',
  },
  {
    nombre: 'Carlos Herrera',
    zona: 'León',
    tipo: 'mostrador',
    margenObjetivo: 0.22,
    descuentoMin: 0.02,
    descuentoMax: 0.08,
    pesoVolumen: 1.0,
    perfil: 'Normal: mostrador León',
  },
  {
    nombre: 'Ana Martínez',
    zona: 'León',
    tipo: 'mostrador',
    margenObjetivo: 0.23,
    descuentoMin: 0.01,
    descuentoMax: 0.07,
    pesoVolumen: 1.0,
    perfil: 'Normal: mostrador León',
  },
  {
    nombre: 'Fernando Torres',
    zona: 'Querétaro',
    tipo: 'mostrador',
    margenObjetivo: 0.21,
    descuentoMin: 0.02,
    descuentoMax: 0.09,
    pesoVolumen: 0.9,
    perfil: 'Normal: mostrador Querétaro',
  },
  {
    nombre: 'Patricia López',
    zona: 'León',
    tipo: 'telefonico',
    margenObjetivo: 0.20,
    descuentoMin: 0.03,
    descuentoMax: 0.12,
    pesoVolumen: 0.7,
    perfil: 'Normal: ventas telefónicas',
  },
];

// ─── Bodegas ────────────────────────────────────────────────────────────────

export const BODEGAS = [
  { nombre: 'Bodega Central León', ciudad: 'León', estado: 'Guanajuato' },
  { nombre: 'Bodega Querétaro', ciudad: 'Querétaro', estado: 'Querétaro' },
];

/** Distribución de inventario: León 65%, Querétaro 35% */
export const DISTRIBUCION_INVENTARIO = { leon: 0.65, queretaro: 0.35 };

// ─── Estacionalidad ─────────────────────────────────────────────────────────

/**
 * Factor multiplicador por categoría y mes (1-12).
 * 1.0 = sin efecto, 1.4 = +40%, etc.
 * Solo se definen los meses con efecto; los demás usan 1.0.
 */
export const ESTACIONALIDAD: Record<string, Record<number, number>> = {
  'Pintura y accesorios': {
    3: 1.40, 4: 1.40, 5: 1.40, 6: 1.40,  // +40% marzo-junio
  },
  'Jardinería': {
    3: 1.40, 4: 1.40, 5: 1.40, 6: 1.40,  // +40% marzo-junio
  },
  'Herramientas eléctricas': {
    11: 1.25, 12: 1.25,  // +25% nov-dic
  },
  'Plomería': {
    7: 1.15, 8: 1.15, 9: 1.15,  // +15% julio-septiembre
  },
};

// ─── Tipos de transacción ───────────────────────────────────────────────────

export const PROBABILIDAD_VENTA = 0.96;
export const PROBABILIDAD_DEVOLUCION = 0.03;
export const PROBABILIDAD_NOTA_CREDITO = 0.01;

// ─── Cross-sell ─────────────────────────────────────────────────────────────

/** Probabilidad de que una transacción con cemento también incluya varilla */
export const CROSS_SELL_CEMENTO_VARILLA = 0.75;

// ─── Perfiles de compra por tipo de cliente ─────────────────────────────────

/**
 * Peso relativo de cada categoría para cada tipo de cliente.
 * Los plomeros compran 70% plomería, los constructores compran más materiales, etc.
 * Los valores no necesitan sumar 1.0 — se normalizan en el generador.
 */
export const PERFIL_COMPRA_CLIENTE: Record<string, Record<string, number>> = {
  ferreteria_minorista: {
    'Tornillería y sujeción': 1.0,
    'Herramientas manuales': 1.0,
    'Herramientas eléctricas': 0.6,
    'Plomería': 0.8,
    'Electricidad': 0.8,
    'Pintura y accesorios': 0.7,
    'Materiales de construcción': 0.5,
    'Jardinería': 0.4,
    'Seguridad industrial': 0.3,
  },
  constructor: {
    'Tornillería y sujeción': 0.8,
    'Herramientas manuales': 0.5,
    'Herramientas eléctricas': 0.6,
    'Plomería': 0.6,
    'Electricidad': 0.5,
    'Pintura y accesorios': 0.7,
    'Materiales de construcción': 2.5,  // Compran mucho material
    'Jardinería': 0.2,
    'Seguridad industrial': 0.5,
  },
  plomero: {
    'Tornillería y sujeción': 0.3,
    'Herramientas manuales': 0.3,
    'Herramientas eléctricas': 0.1,
    'Plomería': 4.0,  // 70% de sus compras
    'Electricidad': 0.1,
    'Pintura y accesorios': 0.05,
    'Materiales de construcción': 0.2,
    'Jardinería': 0.05,
    'Seguridad industrial': 0.1,
  },
  electricista: {
    'Tornillería y sujeción': 0.3,
    'Herramientas manuales': 0.4,
    'Herramientas eléctricas': 0.8,
    'Plomería': 0.05,
    'Electricidad': 4.0,  // Compran principalmente electricidad
    'Pintura y accesorios': 0.05,
    'Materiales de construcción': 0.1,
    'Jardinería': 0.02,
    'Seguridad industrial': 0.3,
  },
  carpintero: {
    'Tornillería y sujeción': 1.5,
    'Herramientas manuales': 2.0,  // Mucha herramienta manual
    'Herramientas eléctricas': 1.5,
    'Plomería': 0.05,
    'Electricidad': 0.2,
    'Pintura y accesorios': 0.8,
    'Materiales de construcción': 0.3,
    'Jardinería': 0.1,
    'Seguridad industrial': 0.4,
  },
  industrial: {
    'Tornillería y sujeción': 1.2,
    'Herramientas manuales': 0.8,
    'Herramientas eléctricas': 1.0,
    'Plomería': 0.5,
    'Electricidad': 0.8,
    'Pintura y accesorios': 0.4,
    'Materiales de construcción': 0.5,
    'Jardinería': 0.1,
    'Seguridad industrial': 2.5,  // Mucha seguridad industrial
  },
  otro: {
    'Tornillería y sujeción': 1.0,
    'Herramientas manuales': 1.0,
    'Herramientas eléctricas': 0.5,
    'Plomería': 0.5,
    'Electricidad': 0.5,
    'Pintura y accesorios': 0.5,
    'Materiales de construcción': 0.3,
    'Jardinería': 0.5,
    'Seguridad industrial': 0.3,
  },
};

// ─── Anomalías ──────────────────────────────────────────────────────────────

export const ANOMALIAS = {
  /** Productos duplicados con variaciones de nombre */
  productosDuplicados: 22,
  /** Clientes duplicados con RFCs inconsistentes */
  clientesDuplicados: 12,
  /** Porcentaje de transacciones con costo_unitario en NULL */
  porcentajeCostoNull: 0.03,
  /** Porcentaje de transacciones con cantidades outlier (×10 a ×50) */
  porcentajeCantidadOutlier: 0.015,
  /** SKUs descontinuados sin movimiento en los últimos 4-6 meses */
  skusDescontinuados: 18,
  /**
   * Escenario del proveedor de plomería:
   * Hace 4 meses subió costos 15%, pero precio_lista NO se actualizó.
   */
  plomeria: {
    /** Fecha del incremento de costos (4 meses atrás desde FECHA_FIN) */
    fechaIncremento: new Date('2025-12-09'),
    /** Porcentaje de incremento en costos */
    incrementoCosto: 0.15,
    /** Cantidad aproximada de SKUs afectados */
    skusAfectados: 40,
  },
  /**
   * Cliente en declive: "Constructora Valle del Bajío"
   * Compraba ~$280K/mes y bajó a ~$55K/mes hace 3 meses.
   */
  clienteEnDeclive: {
    nombre: 'Constructora Valle del Bajío, S.A. de C.V.',
    compraMensualAntes: 280_000,
    compraMensualDespues: 55_000,
    /** Fecha de inicio del declive (3 meses atrás desde FECHA_FIN) */
    fechaDeclive: new Date('2026-01-09'),
  },
};

// ─── Cantidades típicas por unidad de medida ────────────────────────────────

/**
 * Rango de cantidades normales para cada unidad de medida.
 * Usado para generar cantidades realistas en las transacciones.
 */
export const CANTIDADES_POR_UNIDAD: Record<string, { min: number; max: number }> = {
  pieza: { min: 1, max: 50 },
  caja: { min: 1, max: 20 },
  metro: { min: 1, max: 100 },
  kilo: { min: 1, max: 50 },
  litro: { min: 1, max: 20 },
  saco: { min: 1, max: 30 },
  tarima: { min: 1, max: 3 },
  rollo: { min: 1, max: 10 },
};

// ─── Seed para reproducibilidad ─────────────────────────────────────────────

/** Seed fijo para faker.js — permite regenerar los mismos datos */
export const FAKER_SEED = 42;
