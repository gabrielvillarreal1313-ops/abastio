/**
 * Mi desempeño — Página de métricas personales del comprador.
 * Server Component. Accesible solo para roles comprador o dueño.
 */

import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/lib/auth/usuario-actual';
import { getKpisCompradorPersonal } from '@/lib/queries/kpis-comprador-personal';
import { getActividadMensualComprador } from '@/lib/queries/actividad-mensual-comprador';
import { BotonVolver } from '@/components/ui/BotonVolver';
import { MiDesempeno } from '@/components/dashboard/compras/mi-desempeno/MiDesempeno';

export const dynamic = 'force-dynamic';

export default async function MiDesempenoPage() {
  const usuario = await getUsuarioActual();

  const rolesPermitidos = ['comprador', 'dueno'];
  const tieneAcceso = usuario?.roles.some((r) => rolesPermitidos.includes(r)) ?? false;
  if (!tieneAcceso) {
    redirect('/dashboard');
  }

  const [kpis, actividadMensual] = await Promise.all([
    getKpisCompradorPersonal(usuario!.id),
    getActividadMensualComprador(usuario!.id),
  ]);

  return (
    <>
      <BotonVolver />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi desempeño</h1>
        <p className="text-sm text-gray-500 mt-1">
          Métricas personales de tu gestión de compras
        </p>
      </div>

      <MiDesempeno
        kpis={kpis}
        actividadMensual={actividadMensual}
      />
    </>
  );
}
