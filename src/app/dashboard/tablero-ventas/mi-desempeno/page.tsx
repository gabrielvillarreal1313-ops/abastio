/**
 * Mi desempeño del rep — Métricas personales de ventas.
 * Server Component. Accesible solo para reps con vendedor_id.
 */

import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/lib/auth/usuario-actual';
import { getKpisRepMes } from '@/lib/queries/kpis-rep-mes';
import { getVendedorIngresosMensuales, getVendedorTopClientes, getVendedorTopSKUs } from '@/lib/queries/vendedor-detalle';
import { getResumenOportunidadesRep } from '@/lib/queries/resumen-oportunidades-rep';
import { BotonVolver } from '@/components/ui/BotonVolver';
import { MiDesempenoRep } from '@/components/dashboard/tablero-ventas/MiDesempenoRep';

export const dynamic = 'force-dynamic';

export default async function MiDesempenoRepPage() {
  const usuario = await getUsuarioActual();

  const rolesPermitidos = ['rep', 'dueno'];
  const tieneAcceso = usuario?.roles.some((r) => rolesPermitidos.includes(r)) ?? false;
  if (!tieneAcceso || !usuario?.vendedorId) {
    redirect('/dashboard');
  }

  const vendedorId = usuario.vendedorId;

  const [kpis, ingresosMensuales, topClientes, topSkus, resumenOportunidades] = await Promise.all([
    getKpisRepMes(vendedorId),
    getVendedorIngresosMensuales(vendedorId),
    getVendedorTopClientes(vendedorId),
    getVendedorTopSKUs(vendedorId),
    getResumenOportunidadesRep(vendedorId),
  ]);

  return (
    <>
      <BotonVolver />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi desempeño</h1>
        <p className="text-sm text-gray-500 mt-1">
          Métricas personales de tu gestión de ventas
        </p>
      </div>

      <MiDesempenoRep
        kpis={kpis}
        ingresosMensuales={ingresosMensuales}
        topClientes={topClientes}
        topSkus={topSkus}
        resumenOportunidades={resumenOportunidades}
        nombreUsuario={usuario.nombre}
      />
    </>
  );
}
