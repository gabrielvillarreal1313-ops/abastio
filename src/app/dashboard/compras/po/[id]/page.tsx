/**
 * Detalle de PO sugerida — Server Component que carga datos y delega al cliente.
 */

import { notFound, redirect } from 'next/navigation';
import { getUsuarioActual } from '@/lib/auth/usuario-actual';
import { getPoSugeridaDetalle } from '@/lib/queries/po-sugerida-detalle';
import DetallePoSugerida from '@/components/dashboard/po-sugerida/DetallePoSugerida';
import { ToastListener } from '@/components/ui/ToastListener';

export const dynamic = 'force-dynamic';

export default async function PaginaDetallePoSugerida({ params }: { params: { id: string } }) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect('/login');

  const po = await getPoSugeridaDetalle(params.id);
  if (!po) notFound();

  return (
    <>
      <ToastListener />
      <DetallePoSugerida poInicial={po} usuario={usuario} />
    </>
  );
}
