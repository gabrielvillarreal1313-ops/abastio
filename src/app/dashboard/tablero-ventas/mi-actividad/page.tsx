/**
 * Mi actividad del rep — Historial de acciones sobre oportunidades.
 * Server Component. Accesible solo para reps con vendedor_id.
 */

import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/lib/auth/usuario-actual';
import { getHistorialOportunidadesRep } from '@/lib/queries/historial-oportunidades-rep';
import { getResumenOportunidadesRep } from '@/lib/queries/resumen-oportunidades-rep';
import { BotonVolver } from '@/components/ui/BotonVolver';
import { MiActividadRep } from '@/components/dashboard/tablero-ventas/MiActividadRep';

export const dynamic = 'force-dynamic';

export default async function MiActividadRepPage() {
  const usuario = await getUsuarioActual();

  const rolesPermitidos = ['rep', 'dueno'];
  const tieneAcceso = usuario?.roles.some((r) => rolesPermitidos.includes(r)) ?? false;
  if (!tieneAcceso || !usuario?.vendedorId) {
    redirect('/dashboard');
  }

  const vendedorId = usuario.vendedorId;

  const [historial, resumen] = await Promise.all([
    getHistorialOportunidadesRep(vendedorId),
    getResumenOportunidadesRep(vendedorId),
  ]);

  return (
    <>
      <BotonVolver />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi actividad</h1>
        <p className="text-sm text-gray-500 mt-1">
          Historial de oportunidades trabajadas
        </p>
      </div>

      <MiActividadRep
        historial={historial}
        resumen={resumen}
        vendedorId={vendedorId}
      />
    </>
  );
}
