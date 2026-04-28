/**
 * /dashboard/explorer — Vista multidimensional de datos.
 *
 * Fase 16: accesible para los 3 roles. Cuando el usuario es rep puro,
 * `getExplorer` recibe su `vendedor_id` y los datos llegan ya filtrados
 * (regla 18 de CLAUDE.md). Dueño y comprador ven todo.
 */

import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/lib/auth/usuario-actual';
import { vendedorIdParaFiltrado } from '@/lib/auth/roles';
import { getExplorer } from '@/lib/queries/explorer';
import { getReportesUsuario } from '@/lib/queries/reportes-guardados';
import { ExplorerView } from '@/components/dashboard/explorer/ExplorerView';

export const dynamic = 'force-dynamic';

export default async function ExplorerPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect('/login');

  const vendedorIdFiltro = vendedorIdParaFiltrado(usuario);

  const [datosIniciales, reportes] = await Promise.all([
    getExplorer('bodegas', {}, vendedorIdFiltro),
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
        vendedorIdFiltro={vendedorIdFiltro}
      />
    </div>
  );
}
