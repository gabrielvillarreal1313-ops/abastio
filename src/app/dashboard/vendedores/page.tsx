/**
 * Vendedores — Lista de todos los vendedores con métricas mensuales.
 * Server Component que carga datos y delega al componente cliente.
 */

import { getVendedoresLista } from '@/lib/queries/vendedores-lista';
import { ListaVendedores } from '@/components/dashboard/vendedores/ListaVendedores';

export const dynamic = 'force-dynamic';

export default async function VendedoresPage() {
  const vendedores = await getVendedoresLista();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Vendedores</h1>
        <p className="text-sm text-gray-500 mt-1">
          Equipo de ventas con rendimiento mensual
        </p>
      </div>

      <ListaVendedores vendedores={vendedores} />
    </>
  );
}
