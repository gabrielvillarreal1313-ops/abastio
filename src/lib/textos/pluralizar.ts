/**
 * pluralizar.ts — Helpers de concordancia gramatical en español.
 *
 * Español tiene reglas claras:
 * - n=0: usa plural ("0 productos", "ningún producto")
 * - n=1: usa singular ("1 producto")
 * - n≥2: usa plural ("5 productos")
 *
 * Para verbos:
 * - n=1: singular ("está", "representa")
 * - n≠1: plural ("están", "representan")
 */

/**
 * Retorna la forma singular o plural de un sustantivo según n.
 *
 * @example
 * pluralizar(0, 'producto', 'productos') // "productos"
 * pluralizar(1, 'cliente', 'clientes')   // "cliente"
 * pluralizar(5, 'día', 'días')           // "días"
 */
export function pluralizar(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

/**
 * Retorna la forma singular o plural de un verbo según n.
 * En español, el verbo va en singular solo con n=1.
 *
 * @example
 * pluralizarVerbo(0, 'está', 'están')       // "están"
 * pluralizarVerbo(1, 'representa', 'representan') // "representa"
 * pluralizarVerbo(3, 'tiene', 'tienen')     // "tienen"
 */
export function pluralizarVerbo(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

/**
 * Genera "N sustantivo(s)" con concordancia automática.
 *
 * @example
 * conConteo(0, 'producto', 'productos')  // "0 productos"
 * conConteo(1, 'cliente', 'clientes')    // "1 cliente"
 * conConteo(15, 'día', 'días')           // "15 días"
 */
export function conConteo(n: number, singular: string, plural: string): string {
  return `${n} ${pluralizar(n, singular, plural)}`;
}
