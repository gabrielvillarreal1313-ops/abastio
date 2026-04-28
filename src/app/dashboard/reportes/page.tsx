/**
 * /dashboard/reportes — Lista de reportes guardados del usuario.
 *
 * Fase 16: accesible para los 3 roles. Cada usuario ve solo sus propios
 * reportes (la RPC `get_reportes_usuario` ya filtra por `usuario_id`).
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
