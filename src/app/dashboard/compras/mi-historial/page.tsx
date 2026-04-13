/**
 * Mi historial — Página del comprador con log de acciones registradas.
 * Server Component. Filtra por query params (?desde=, ?hasta=, ?tipo=).
 * Accesible solo para roles comprador o dueño.
 */

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getUsuarioActual } from '@/lib/auth/usuario-actual';
import { getHistorialComprador } from '@/lib/queries/historial-comprador';
import { BotonVolver } from '@/components/ui/BotonVolver';
import { FiltrosHistorial } from '@/components/dashboard/compras/mi-historial/FiltrosHistorial';
import { ResumenHistorial } from '@/components/dashboard/compras/mi-historial/ResumenHistorial';
import { TablaHistorial } from '@/components/dashboard/compras/mi-historial/TablaHistorial';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MiHistorialPage({ searchParams }: Props) {
  const usuario = await getUsuarioActual();

  // Solo comprador o dueño
  const rolesPermitidos = ['comprador', 'dueno'];
  const tieneAcceso = usuario?.roles.some((r) => rolesPermitidos.includes(r)) ?? false;
  if (!tieneAcceso) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const desde = typeof params.desde === 'string' ? params.desde : undefined;
  const hasta = typeof params.hasta === 'string' ? params.hasta : undefined;
  const tipo = typeof params.tipo === 'string' ? params.tipo : undefined;

  const acciones = await getHistorialComprador(usuario!.id, {
    fechaDesde: desde,
    fechaHasta: hasta,
    tipoAccion: tipo,
  });

  return (
    <>
      <BotonVolver />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi historial</h1>
        <p className="text-sm text-gray-500 mt-1">
          Acciones de compras que has registrado
        </p>
      </div>

      <ResumenHistorial acciones={acciones} />

      <Suspense fallback={null}>
        <FiltrosHistorial />
      </Suspense>

      <TablaHistorial acciones={acciones} />
    </>
  );
}
