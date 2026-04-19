/**
 * /dashboard/reportes — Lista de reportes guardados del usuario.
 *
 * Fase 13-2: Gestión de reportes guardados desde el Explorer. Solo visible
 * para rol `dueno` por ahora; los demás roles no crean reportes en V0.
 */

import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/lib/auth/usuario-actual';
import { getReportesUsuario } from '@/lib/queries/reportes-guardados';
import { ListaReportes } from '@/components/dashboard/explorer/ListaReportes';
import { BotonVolver } from '@/components/ui/BotonVolver';

export const dynamic = 'force-dynamic';

export default async function ReportesPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect('/login');
  if (!usuario.roles.includes('dueno')) redirect('/dashboard');

  const reportes = await getReportesUsuario(usuario.id);

  return (
    <div className="space-y-4">
      <BotonVolver />

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Mis reportes</h1>
        <p className="text-sm text-gray-500 mt-1">Reportes guardados desde el Explorer.</p>
      </div>

      <ListaReportes reportes={reportes} usuarioId={usuario.id} />
    </div>
  );
}
