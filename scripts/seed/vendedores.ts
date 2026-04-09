/**
 * vendedores.ts — Genera los 7 vendedores con perfiles diferenciados.
 *
 * Los perfiles (margen objetivo, rango de descuento) viven en config.ts.
 * Aquí solo generamos los datos que van a la tabla vendedores de Supabase
 * y el mapeo vendedor→clientes para el motor de transacciones.
 */

import { PERFILES_VENDEDORES } from './config';
import type { Cliente } from './clientes';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface Vendedor {
  nombre: string;
  zona: string;
  tipo: 'mostrador' | 'ruta' | 'telefonico';
  activo: boolean;
}

/** Mapeo de índice de vendedor → IDs de clientes asignados (se calcula post-inserción) */
export interface AsignacionVendedorClientes {
  vendedorIndex: number;
  clienteIds: number[];
}

// ─── Generador de vendedores para inserción ─────────────────────────────────

/**
 * Genera los datos de los 7 vendedores para insertar en Supabase.
 * El orden del array corresponde al orden de PERFILES_VENDEDORES en config.ts.
 */
export function generarVendedores(): Vendedor[] {
  return PERFILES_VENDEDORES.map((perfil) => ({
    nombre: perfil.nombre,
    zona: perfil.zona,
    tipo: perfil.tipo,
    activo: true,
  }));
}

// ─── Asignación de clientes a vendedores ────────────────────────────────────

/**
 * Asigna clientes a vendedores basándose en:
 * - Laura Sánchez (índice 2) recibe ~15 clientes industriales
 * - Ricardo Mendoza (índice 0) recibe clientes de León
 * - Jorge Ramírez (índice 1) recibe clientes de Querétaro
 * - Vendedores de mostrador reciben clientes walk-in de su zona
 * - Patricia López (telefónica) recibe clientes de ciudades lejanas
 *
 * Cada cliente queda asignado a exactamente un vendedor principal.
 *
 * @param clientes - Array de clientes ya generados (con su index como futuro ID)
 * @returns Mapeo de índice de vendedor → índices de clientes
 */
export function asignarClientesAVendedores(
  clientes: Cliente[]
): Map<number, number[]> {
  const asignaciones = new Map<number, number[]>();

  // Inicializar mapa vacío para cada vendedor
  for (let i = 0; i < PERFILES_VENDEDORES.length; i++) {
    asignaciones.set(i, []);
  }

  // Índices de vendedores según su rol
  const RICARDO = 0;    // Estrella, ruta León
  const JORGE = 1;      // Mediocre, ruta Querétaro
  const LAURA = 2;      // Especialista industrial
  const CARLOS = 3;     // Mostrador León
  const ANA = 4;        // Mostrador León
  const FERNANDO = 5;   // Mostrador Querétaro
  const PATRICIA = 6;   // Telefónica

  // Ciudades "lejanas" que atiende la vendedora telefónica
  const ciudadesLejos = ['San Luis Potosí', 'Aguascalientes'];

  // Contador para distribuir equitativamente entre vendedores de mostrador León
  let mostradorLeonTurno = 0;

  clientes.forEach((cliente, index) => {
    const clienteIndex = index; // Usamos index como referencia temporal

    // Laura se queda con los industriales (hasta ~15)
    if (cliente.tipo_cliente === 'industrial' && asignaciones.get(LAURA)!.length < 15) {
      asignaciones.get(LAURA)!.push(clienteIndex);
      return;
    }

    // Patricia atiende ciudades lejanas por teléfono
    if (ciudadesLejos.includes(cliente.ciudad)) {
      asignaciones.get(PATRICIA)!.push(clienteIndex);
      return;
    }

    // Clientes de Querétaro → Jorge (ruta) o Fernando (mostrador), alternando
    if (cliente.ciudad === 'Querétaro') {
      if (cliente.tipo_cliente === 'constructor' || cliente.tipo_cliente === 'industrial') {
        // Constructores/industriales van con Jorge (ruta)
        asignaciones.get(JORGE)!.push(clienteIndex);
      } else {
        asignaciones.get(FERNANDO)!.push(clienteIndex);
      }
      return;
    }

    // Clientes de León y ciudades cercanas (Celaya, Irapuato, Silao)
    if (cliente.tipo_cliente === 'constructor' || cliente.tipo_cliente === 'industrial') {
      // Constructores/industriales grandes van con Ricardo (estrella, ruta)
      asignaciones.get(RICARDO)!.push(clienteIndex);
    } else {
      // Ferreterías, plomeros, etc. van a mostrador León, alternando
      const vendedorMostrador = mostradorLeonTurno % 2 === 0 ? CARLOS : ANA;
      asignaciones.get(vendedorMostrador)!.push(clienteIndex);
      mostradorLeonTurno++;
    }
  });

  return asignaciones;
}
