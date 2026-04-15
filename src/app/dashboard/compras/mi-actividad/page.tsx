/**
 * Mi actividad — Página del comprador con resumen de POs, ajustes e historial.
 * Server Component. Accesible solo para roles comprador o dueño.
 * Lee query params para filtros del historial y deep-linking de tab.
 */

import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/lib/auth/usuario-actual';
import { getPosPorRevisor } from '@/lib/queries/pos-por-revisor';
import { getOverridesRecientes } from '@/lib/queries/overrides-recientes';
import { getHistorialComprador } from '@/lib/queries/historial-comprador';
import { BotonVolver } from '@/components/ui/BotonVolver';
import { MiActividadTabs } from '@/components/dashboard/compras/mi-actividad/MiActividadTabs';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MiActividadPage({ searchParams }: Props) {
  const usuario = await getUsuarioActual();

  const rolesPermitidos = ['comprador', 'dueno'];
  const tieneAcceso = usuario?.roles.some((r) => rolesPermitidos.includes(r)) ?? false;
  if (!tieneAcceso) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const desde = typeof params.desde === 'string' ? params.desde : undefined;
  const hasta = typeof params.hasta === 'string' ? params.hasta : undefined;
  const tipo = typeof params.tipo === 'string' ? params.tipo : undefined;

  const [posRevisor, overridesRecientes, historialInicial] = await Promise.all([
    getPosPorRevisor(usuario!.id),
    getOverridesRecientes(usuario!.id),
    getHistorialComprador(usuario!.id, {
      fechaDesde: desde,
      fechaHasta: hasta,
      tipoAccion: tipo,
    }),
  ]);

  return (
    <>
      <BotonVolver />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi actividad</h1>
        <p className="text-sm text-gray-500 mt-1">
          Resumen de tus órdenes de compra y ajustes de inventario
        </p>
      </div>

      <MiActividadTabs
        posRevisor={posRevisor}
        overridesRecientes={overridesRecientes}
        historialInicial={historialInicial}
      />
    </>
  );
}
