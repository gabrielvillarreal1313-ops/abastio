/**
 * /dashboard/explorer — Vista multidimensional de datos.
 *
 * Fase 12-2: Página del Explorer. Solo accesible para rol `dueno` — los reps y
 * compradores tienen sus propios módulos operativos. Se cargan los datos
 * iniciales con la dimensión default (bodegas) en el Server Component.
 *
 * Fase 13-2: Carga también los reportes guardados del usuario para permitir
 * abrir un reporte vía `?reporte=<uuid>` y para el modal de "Guardar como".
 */

import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/lib/auth/usuario-actual';
import { getExplorer } from '@/lib/queries/explorer';
import { getReportesUsuario } from '@/lib/queries/reportes-guardados';
import { ExplorerView } from '@/components/dashboard/explorer/ExplorerView';

export const dynamic = 'force-dynamic';

export default async function ExplorerPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect('/login');
  if (!usuario.roles.includes('dueno')) redirect('/dashboard');

  const [datosIniciales, reportes] = await Promise.all([
    getExplorer('bodegas'),
    getReportesUsuario(usuario.id),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Explorer</h1>
        <p className="text-sm text-gray-500 mt-1">
          Explora tus datos transaccionales por cualquier dimensión.
        </p>
      </div>

      <ExplorerView
        datosIniciales={datosIniciales}
        dimensionInicial="bodegas"
        usuarioId={usuario.id}
        reportes={reportes}
      />
    </div>
  );
}
