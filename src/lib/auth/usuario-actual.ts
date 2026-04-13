/**
 * usuario-actual.ts — Helper centralizado para obtener el usuario logueado.
 *
 * Consulta Supabase Auth + tablas usuarios/usuario_roles en el servidor.
 * Usar en Server Components y Server Actions.
 *
 * Los tipos y utilidades de roles se importan desde roles.ts para que
 * los componentes 'use client' puedan usarlos sin arrastrar next/headers.
 */

import { createSupabaseServer } from '@/lib/supabase-server';
import { calcularRolPrimario, type Rol, type UsuarioActual } from '@/lib/auth/roles';

// Re-exportar tipos y utilidades para que los Server Components importen todo desde aquí
export { calcularRolPrimario, paginaAterrizajePorRol } from '@/lib/auth/roles';
export type { Rol, UsuarioActual } from '@/lib/auth/roles';

/**
 * Obtiene el usuario autenticado actual con sus roles.
 * Retorna null si no hay sesión activa.
 * Llamar desde Server Components o Server Actions.
 */
export async function getUsuarioActual(): Promise<UsuarioActual | null> {
  const supabase = createSupabaseServer();

  // 1. Obtener sesión de Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  // 2. Buscar en tabla usuarios por auth_user_id
  const { data: usuario, error: userError } = await supabase
    .from('usuarios')
    .select('id, email, nombre, vendedor_id')
    .eq('auth_user_id', user.id)
    .single();

  if (userError || !usuario) return null;

  // 3. Obtener roles
  const { data: rolesData, error: rolesError } = await supabase
    .from('usuario_roles')
    .select('rol')
    .eq('usuario_id', usuario.id);

  if (rolesError) return null;

  const roles = (rolesData ?? []).map((r) => r.rol as Rol);
  if (roles.length === 0) return null;

  return {
    id: usuario.id,
    authUserId: user.id,
    email: usuario.email ?? '',
    nombre: usuario.nombre ?? '',
    vendedorId: usuario.vendedor_id ?? null,
    roles,
    rolPrimario: calcularRolPrimario(roles),
  };
}
