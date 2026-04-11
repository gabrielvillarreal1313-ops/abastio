/**
 * Oportunidades — Sales Intelligence: oportunidades detectadas + cotizaciones.
 * Server Component que carga datos y delega a OportunidadesTabs (cliente).
 */

import { Suspense } from 'react';
import { getListaOportunidades } from '@/lib/queries/oportunidades-lista';
import { getCotizacionesLista } from '@/lib/queries/cotizaciones-lista';
import { OportunidadesTabs } from '@/components/dashboard/oportunidades/OportunidadesTabs';

export const dynamic = 'force-dynamic';

export default async function OportunidadesPage() {
  const [oportunidades, cotizaciones] = await Promise.all([
    getListaOportunidades(),
    getCotizacionesLista(),
  ]);


  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Oportunidades</h1>
          <p className="text-sm text-gray-500 mt-1">
            Recompras tardías, cross-sell y cotizaciones
          </p>
        </div>
        <a
          href="/dashboard/oportunidades/nueva"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva cotización
        </a>
      </div>

      <Suspense fallback={null}>
        <OportunidadesTabs oportunidades={oportunidades} cotizaciones={cotizaciones} />
      </Suspense>
    </>
  );
}
