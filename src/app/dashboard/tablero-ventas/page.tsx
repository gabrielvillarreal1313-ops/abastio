/**
 * Tablero de ventas — Página de aterrizaje para reps.
 * Server Component que carga datos filtrados por vendedor y delega al cliente.
 */

import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/lib/auth/usuario-actual';
import { getKpisRepMes } from '@/lib/queries/kpis-rep-mes';
import { getListaOportunidades } from '@/lib/queries/oportunidades-lista';
import { getOportunidadesTableroRep } from '@/lib/queries/oportunidades-tablero-rep';
import { getResumenOportunidadesRep } from '@/lib/queries/resumen-oportunidades-rep';
import { getClientesEnRiesgo } from '@/lib/queries/clientes-en-riesgo';
import { getCotizacionesLista } from '@/lib/queries/cotizaciones-lista';
import { TableroVentas } from '@/components/dashboard/tablero-ventas/TableroVentas';
import { ToastListener } from '@/components/ui/ToastListener';

export const dynamic = 'force-dynamic';

export default async function TableroVentasPage() {
  const usuario = await getUsuarioActual();

  const rolesPermitidos = ['rep', 'dueno'];
  const tieneAcceso = usuario?.roles.some((r) => rolesPermitidos.includes(r)) ?? false;
  if (!tieneAcceso) {
    redirect('/dashboard');
  }

  // Rep puro: filtra por su vendedor_id. Dueño: ve todo (null)
  const esRepPuro = usuario!.roles.length === 1 && usuario!.roles[0] === 'rep';
  const vendedorId = esRepPuro ? usuario!.vendedorId : null;

  const [kpis, oportunidades, resumenOportunidades, clientesEnRiesgoData, cotizaciones] = await Promise.all([
    vendedorId ? getKpisRepMes(vendedorId) : null,
    // Rep puro: usa tablero filtrado (excluye trabajadas). Dueño: ve todo
    vendedorId ? getOportunidadesTableroRep(vendedorId) : getListaOportunidades(null),
    vendedorId ? getResumenOportunidadesRep(vendedorId) : null,
    getClientesEnRiesgo(vendedorId ?? undefined),
    getCotizacionesLista(vendedorId ?? undefined),
  ]);

  return (
    <>
      <ToastListener />
      <TableroVentas
        kpis={kpis}
        oportunidades={oportunidades}
        resumenOportunidades={resumenOportunidades}
        clientesEnRiesgo={clientesEnRiesgoData.clientes}
        cotizaciones={cotizaciones}
        nombreUsuario={usuario!.nombre}
        vendedorId={vendedorId}
        esRepPuro={esRepPuro}
      />
    </>
  );
}
