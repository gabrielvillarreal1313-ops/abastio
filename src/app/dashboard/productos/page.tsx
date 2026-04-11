/**
 * Productos — Lista de todos los productos con métricas y filtros.
 * Server Component que carga datos y delega al componente cliente.
 */

import { getProductosLista } from '@/lib/queries/productos-lista';
import { ListaProductos } from '@/components/dashboard/productos/ListaProductos';

export const dynamic = 'force-dynamic';

export default async function ProductosPage() {
  const productos = await getProductosLista();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Productos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Catálogo completo con métricas de venta e inventario
        </p>
      </div>

      <ListaProductos productos={productos} />
    </>
  );
}
