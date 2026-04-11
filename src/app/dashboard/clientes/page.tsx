/**
 * Clientes — Lista de todos los clientes con métricas y filtros.
 * Server Component que carga datos y delega al componente cliente.
 */

import { getClientesLista } from '@/lib/queries/clientes-lista';
import { ListaClientes } from '@/components/dashboard/clientes/ListaClientes';

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const clientes = await getClientesLista();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Todos los clientes con historial de compras
        </p>
      </div>

      <ListaClientes clientes={clientes} />
    </>
  );
}
