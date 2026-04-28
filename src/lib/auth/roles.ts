/**
 * roles.ts — Utilidades de roles y navegación.
 *
 * Archivo separado de usuario-actual.ts para que los componentes 'use client'
 * puedan importar estos tipos y funciones sin arrastrar dependencias de next/headers.
 */

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type Rol = 'dueno' | 'comprador' | 'rep';

export interface UsuarioActual {
  id: string;              // usuarios.id (UUID interno)
  authUserId: string;      // auth.users.id
  email: string;
  nombre: string;
  vendedorId: number | null;
  roles: Rol[];
  rolPrimario: Rol;        // calculado por jerarquía: dueno > comprador > rep
}

// ─── Jerarquía de roles ──────────────────────────────────────────────────────

const JERARQUIA_ROLES: Rol[] = ['dueno', 'comprador', 'rep'];

/**
 * Calcula el rol primario según jerarquía: dueno > comprador > rep.
 * Si el array está vacío, lanza error (usuario corrupto en la DB).
 */
export function calcularRolPrimario(roles: Rol[]): Rol {
  if (roles.length === 0) {
    throw new Error('Usuario sin roles asignados. Esto indica datos corruptos en la tabla usuario_roles.');
  }
  for (const rol of JERARQUIA_ROLES) {
    if (roles.includes(rol)) return rol;
  }
  return roles[0];
}

/**
 * Retorna la página de aterrizaje según el rol activo.
 * - dueno → /dashboard (resumen ejecutivo)
 * - comprador → /dashboard/tablero-compras
 * - rep → /dashboard/tablero-ventas
 */
export function paginaAterrizajePorRol(rol: Rol): string {
  switch (rol) {
    case 'dueno': return '/dashboard';
    case 'comprador': return '/dashboard/tablero-compras';
    case 'rep': return '/dashboard/tablero-ventas';
  }
}

/**
 * "Rep puro" = usuario con un único rol y ese rol es 'rep'. Multi-rol
 * (incluso si incluye 'rep') NO es rep puro porque tiene perspectiva de
 * empresa heredada del otro rol. Esta es la regla 18 del CLAUDE.md.
 */
export function esRepPuro(roles: Rol[]): boolean {
  return roles.length === 1 && roles[0] === 'rep';
}

/**
 * Retorna el `vendedor_id` del usuario solo cuando es rep puro. En cualquier
 * otro caso retorna null. Pasar este valor a las RPCs que aplican filtrado
 * por vendedor (regla 18) garantiza el comportamiento correcto en una sola
 * línea sin que el caller tenga que recordar la lógica.
 */
export function vendedorIdParaFiltrado(usuario: UsuarioActual): number | null {
  return esRepPuro(usuario.roles) ? usuario.vendedorId : null;
}
