/**
 * Login — Página de inicio de sesión.
 * Server Component que verifica si ya hay sesión activa.
 * Si hay, redirige a la página de aterrizaje. Si no, muestra el formulario.
 */

import { redirect } from 'next/navigation';
import { getUsuarioActual, paginaAterrizajePorRol } from '@/lib/auth/usuario-actual';
import { FormularioLogin } from '@/components/auth/FormularioLogin';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const usuario = await getUsuarioActual();

  if (usuario) {
    redirect(paginaAterrizajePorRol(usuario.rolPrimario));
  }

  return <FormularioLogin />;
}
