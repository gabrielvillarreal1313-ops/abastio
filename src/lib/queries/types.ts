/**
 * types.ts — Tipos de TypeScript para los resultados de queries al dashboard.
 *
 * Cada tipo representa la forma exacta de datos que una query retorna,
 * no la forma de la tabla en Supabase. Esto permite tipar los componentes
 * de visualización sin depender del schema de la DB.
 */

// ─── KPIs del Resumen Ejecutivo ─────────────────────────────────────────────

export interface KPIsResumen {
  /** Ingresos del mes más reciente con datos (suma de subtotal tipo='venta') */
  ingresosMesActual: number;
  /** Ingresos del período equivalente del mes anterior (apples-to-apples) */
  ingresosMesAnterior: number;
  /** Cambio porcentual de ingresos vs período equivalente del mes anterior */
  cambioIngresosPct: number;
  /** Margen bruto % del mes actual: (ingresos - costos) / ingresos */
  margenBrutoPct: number;
  /** Número de transacciones únicas (folios distintos) del mes actual */
  transaccionesUnicas: number;
  /** Ticket promedio: ingresos / folios únicos */
  ticketPromedio: number;
  /** Clientes con al menos una venta en el mes actual */
  clientesActivos: number;
  /** Etiqueta del mes actual (ej: "Abril 2026") */
  etiquetaMesActual: string;
  /** true si el mes más reciente está incompleto */
  mesParcial: boolean;
  /** Días con datos en el mes actual (ej: 9) */
  diasConDatos: number;
  /** Total de días en el mes calendario (ej: 30) */
  diasDelMes: number;
  /** Etiqueta de comparación (ej: "vs mismo periodo de marzo" o "vs marzo") */
  etiquetaComparacion: string;
}

// ─── Tipos futuros (placeholder para próximas queries) ──────────────────────

export interface IngresoMensual {
  /** Etiqueta corta del mes (ej: "Abr 26") */
  mes: string;
  ingresos: number;
  costos: number;
  /** Margen bruto % */
  margen: number;
  /** true si es el mes más reciente y está incompleto */
  parcial: boolean;
}

export interface TopSKU {
  sku: string;
  nombre: string;
  categoria: string;
  ingresos: number;
  unidadesVendidas: number;
  margenPct: number;
}

export interface TopCliente {
  clienteId: number;
  razonSocial: string;
  tipoCliente: string;
  ingresos: number;
  transacciones: number;
}

export interface RendimientoVendedor {
  vendedorId: number;
  nombre: string;
  ingresos: number;
  margenPct: number;
  transacciones: number;
  clientesAtendidos: number;
}
