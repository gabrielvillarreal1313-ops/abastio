/**
 * Compras — Server Component que carga datos y delega a ComprasTabs (cliente).
 * Mismo patrón que app/dashboard/page.tsx: fetch en servidor, render en cliente.
 */

import { getForecastSKUs } from '@/lib/queries/forecast-skus';
import { getPlaneacionInventario } from '@/lib/queries/planeacion-inventario';
import { getSugerenciasCompra } from '@/lib/queries/sugerencias-compra';
import { ComprasTabs } from '@/components/dashboard/compras/ComprasTabs';

export const dynamic = 'force-dynamic';

export default async function ComprasPage() {
  const [forecastData, planeacionData, sugerenciasData] = await Promise.all([
    getForecastSKUs(),
    getPlaneacionInventario(),
    getSugerenciasCompra(),
  ]);

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Compras</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pronóstico de demanda, planeación de inventario y órdenes de compra
        </p>
      </div>

      <ComprasTabs
        forecastData={forecastData}
        planeacionData={planeacionData}
        sugerenciasData={sugerenciasData}
      />
    </>
  );
}
