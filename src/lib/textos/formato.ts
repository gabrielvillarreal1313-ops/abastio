/**
 * formato.ts — Funciones centralizadas de formato para el dashboard.
 *
 * Todo el dashboard debe usar estas funciones en vez de formatters locales.
 * Esto garantiza consistencia visual (mismos separadores, decimales, sufijos).
 */

/**
 * Formato completo de moneda mexicana: "$1,234,567 MXN"
 * Redondea a enteros (sin centavos en dashboards).
 */
export function formatMXN(valor: number): string {
  return '$' + Math.round(valor).toLocaleString('en-US') + ' MXN';
}

/**
 * Formato abreviado para valores grandes: "$12.3M MXN"
 * Usa formato completo para valores < 1M.
 */
export function formatMXNCorto(valor: number): string {
  if (Math.abs(valor) >= 1_000_000) {
    return '$' + (valor / 1_000_000).toFixed(1) + 'M MXN';
  }
  return formatMXN(valor);
}

/**
 * Formato para tablas: "$4.38M" (sin "MXN", más compacto).
 * Valores < 1M se muestran como "$123,456".
 */
export function formatMXNTabla(valor: number): string {
  if (Math.abs(valor) >= 1_000_000) {
    return '$' + (valor / 1_000_000).toFixed(2) + 'M';
  }
  return '$' + Math.round(valor).toLocaleString('en-US');
}

/**
 * Formato para ejes de gráficas: "$12M" (sin decimales).
 */
export function formatMXNEje(valor: number): string {
  if (valor === 0) return '$0';
  return '$' + (valor / 1_000_000).toFixed(0) + 'M';
}

/**
 * Formato de porcentaje con 1 decimal: "23.5%"
 */
export function formatPct(valor: number): string {
  return valor.toFixed(1) + '%';
}

/**
 * Formato de porcentaje para ejes: "25%"
 */
export function formatPctEje(valor: number): string {
  return valor + '%';
}

/**
 * Formato de unidades con separador de miles: "1,234"
 */
export function formatUnidades(valor: number): string {
  return Math.round(valor).toLocaleString('en-US');
}

/**
 * Formato de porcentaje con signo: "+5.2%" o "-3.1%"
 */
export function formatCambioPct(valor: number): string {
  const signo = valor >= 0 ? '+' : '';
  return signo + valor.toFixed(1) + '%';
}
