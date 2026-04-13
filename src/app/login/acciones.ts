'use server';

/**
 * acciones.ts — Server Actions de autenticación (login y logout).
 *
 * Usan el cliente Supabase server-side con cookies para manejar la sesión.
 * El componente cliente debe redirigir con window.location.href al recibir la ruta.
 */

import { createSupabaseServer } from '@/lib/supabase-server';
import { getUsuarioActual, paginaAterrizajePorRol } from '@/lib/auth/usuario-actual';

interface ResultadoLogin {
  exito: boolean;
  ruta?: string;
  error?: string;
}

/**
 * Inicia sesión con email y password.
 * Retorna la ruta de aterrizaje si es exitoso, o un mensaje de error.
 */
export async function accionLogin(email: string, password: string): Promise<ResultadoLogin> {
  const supabase = createSupabaseServer();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { exito: false, error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' };
  }

  // Obtener datos del usuario para calcular la página de aterrizaje
  const usuario = await getUsuarioActual();
  if (!usuario) {
    return { exito: false, error: 'No se encontró el perfil de usuario. Contacta al administrador.' };
  }

  // Verificar si hay vista preferida en el cliente (se pasa como parámetro opcional)
  // La lógica de localStorage se maneja en el cliente — aquí solo calculamos el default
  const ruta = paginaAterrizajePorRol(usuario.rolPrimario);

  return { exito: true, ruta };
}

/**
 * Cierra la sesión del usuario actual.
 */
export async function accionLogout(): Promise<void> {
  const supabase = createSupabaseServer();
  await supabase.auth.signOut();
}
