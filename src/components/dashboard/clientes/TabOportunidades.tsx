'use client';

/**
 * TabOportunidades — Recompras tardías y cross-sell para un cliente específico.
 * Muestra valor total en riesgo + dos tablas ordenadas por valor descendente.
 */

import { useRouter } from 'next/navigation';
import type { OportunidadesClienteData } from '@/lib/queries/oportunidades-cliente';
import { ProductoLink } from '@/components/ui/ProductoLink';
import { formatMXNCorto, formatMXNTabla, formatPct } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';
import { FilaRecompraExpandible } from './FilaRecompraExpandible';

interface Props {
  data: OportunidadesClienteData;
  clienteId: number;
}

export function TabOportunidades({ data, clienteId }: Props) {
  const router = useRouter();
  const { recompras, crossSell, totalRecompra, totalCrossSell } = data;

  const tieneOportunidades = recompras.length > 0 || crossSell.length > 0;

  return (
    <div>
      {/* Botón nueva cotización */}
      {tieneOportunidades && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push(`/dashboard/oportunidades/nueva?cliente_id=${clienteId}`)}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva cotización
          </button>
        </div>
      )}

      {/* ─── Sección 1: Recompras tardías ──────────────────────────── */}
      <div className="mb-10">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900">Recompras tardías</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {recompras.length === 0
              ? 'Sin recompras tardías detectadas'
              : `${conConteo(recompras.length, 'producto que este cliente debería estar reordenando', 'productos que este cliente debería estar reordenando')}`
            }
          </p>
        </div>

        {recompras.length > 0 && (
          <>
            {/* Hero stat */}
            <div className="bg-white rounded-lg border border-gray-200 px-6 py-4 mb-4">
              <p className="text-sm font-medium text-gray-500 mb-1">Valor estimado mensual en recompras tardías</p>
              <p className="text-2xl font-semibold text-amber-600 tracking-tight">{formatMXNCorto(totalRecompra)}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-3 py-2.5 font-medium w-8"></th>
                      <th className="px-5 py-2.5 font-medium">Producto</th>
                      <th className="px-3 py-2.5 font-medium">Categoría</th>
                      <th className="px-3 py-2.5 font-medium text-right">Intervalo normal</th>
                      <th className="px-3 py-2.5 font-medium">Última compra</th>
                      <th className="px-3 py-2.5 font-medium text-right">Retraso</th>
                      <th className="px-3 py-2.5 font-medium text-center">Urgencia</th>
                      <th className="px-5 py-2.5 font-medium text-right">Valor est. mensual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recompras.map((r) => (
                      <FilaRecompraExpandible
                        key={r.sku}
                        clienteId={clienteId}
                        recompra={r}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {recompras.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-8 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Este cliente está al día con sus recompras habituales.</p>
          </div>
        )}
      </div>

      {/* ─── Sección 2: Cross-sell ─────────────────────────────────── */}
      <div>
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900">Oportunidades de cross-sell</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {crossSell.length === 0
              ? 'Sin oportunidades de cross-sell detectadas'
              : `${conConteo(crossSell.length, 'categoría donde clientes similares compran pero este no', 'categorías donde clientes similares compran pero este no')}`
            }
          </p>
        </div>

        {crossSell.length > 0 && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 px-6 py-4 mb-4">
              <p className="text-sm font-medium text-gray-500 mb-1">Valor potencial mensual en cross-sell</p>
              <p className="text-2xl font-semibold text-blue-600 tracking-tight">{formatMXNCorto(totalCrossSell)}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-2.5 font-medium">Categoría</th>
                      <th className="px-3 py-2.5 font-medium">Clientes similares que compran</th>
                      <th className="px-3 py-2.5 font-medium text-right">Valor potencial mensual</th>
                      <th className="px-5 py-2.5 font-medium">SKUs recomendados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {crossSell.map((cs) => (
                      <tr key={cs.categoria_oportunidad} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-2.5 font-medium text-gray-900">{cs.categoria_oportunidad}</td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                          {cs.cantidad_clientes_similares} ({formatPct(cs.pct_clientes_similares)})
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-gray-700 whitespace-nowrap">
                          {formatMXNTabla(cs.valor_potencial_mensual)}
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            {cs.top_skus.map((s) => (
                              <div key={s.sku} className="text-xs text-gray-600">
                                <ProductoLink sku={s.sku} nombre={s.nombre} className="text-gray-600" />
                                <span className="text-gray-500 ml-1">({formatMXNTabla(s.ingresos_promedio_mensual)}/mes)</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {crossSell.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-8 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Este cliente ya compra en todas las categorías donde sus pares compran.</p>
          </div>
        )}
      </div>
    </div>
  );
}
