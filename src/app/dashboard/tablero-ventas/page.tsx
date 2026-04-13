/**
 * Tablero de ventas — Página de aterrizaje para reps.
 * Placeholder que se construye en la Fase 7 del pivot.
 */

import { getUsuarioActual } from '@/lib/auth/usuario-actual';

export const dynamic = 'force-dynamic';

export default async function TableroVentasPage() {
  const usuario = await getUsuarioActual();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Tablero de ventas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Hola, {usuario?.nombre ?? 'usuario'}
        </p>
      </div>

      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-8 py-16 text-center">
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Esta página se construye en la Fase 7 del pivot. Aquí verás tus oportunidades del día,
          cotizaciones pendientes de seguimiento, clientes en riesgo, y tus métricas del mes.
        </p>
      </div>
    </>
  );
}
