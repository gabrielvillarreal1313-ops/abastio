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
