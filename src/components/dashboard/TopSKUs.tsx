/**
 * TopSKUs — Dos tablas lado a lado: Top 10 por ingresos y Top 10 por margen %.
 * Incluye callout con insight sobre discrepancia entre ambos rankings.
 */

import type { TopSKUsData } from '@/lib/queries/top-skus';
import { formatMXNTabla, formatUnidades, formatPct } from '@/lib/textos/formato';
import { calloutTopSKUs } from '@/lib/textos/callouts';

interface Props {
  data: TopSKUsData;
}

function MargenBadge({ pct }: { pct: number }) {
  const color = pct >= 20 ? 'text-emerald-700' : pct >= 10 ? 'text-amber-600' : 'text-red-600';
  return <span className={color}>{formatPct(pct)}</span>;
}

export function TopSKUs({ data }: Props) {
  const { porIngresos, porMargen, etiquetaMes, skusEnAmbos } = data;
  const textoCallout = calloutTopSKUs(skusEnAmbos, 10);
  // Determinar si el callout es positivo (todos alineados) o de oportunidad
  const esPositivo = skusEnAmbos === 10;

  return (
    <div>
      {/* Título */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          Top 10 SKUs — {etiquetaMes}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Mes completo más reciente
        </p>
      </div>

      {/* Grid de dos tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Top 10 por ingresos ───────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Por ingresos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-2.5 font-medium">#</th>
                  <th className="px-3 py-2.5 font-medium">Producto</th>
                  <th className="px-3 py-2.5 font-medium text-right">Ingresos</th>
                  <th className="px-3 py-2.5 font-medium text-right">Uds.</th>
                  <th className="px-5 py-2.5 font-medium text-right">Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {porIngresos.map((sku, i) => (
                  <tr key={sku.sku} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-2.5 text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900 truncate max-w-[200px]" title={sku.nombre}>
                        {sku.nombre}
                      </div>
                      <div className="text-xs text-gray-400">{sku.categoria}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatMXNTabla(sku.ingresos_totales)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
                      {formatUnidades(sku.unidades_vendidas)}
                    </td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      <MargenBadge pct={sku.margen_pct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Top 10 por margen % ───────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Por margen %</h3>
            <p className="text-xs text-gray-400 mt-0.5">Min. 20 uds. y $50K ingresos</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-2.5 font-medium">#</th>
                  <th className="px-3 py-2.5 font-medium">Producto</th>
                  <th className="px-3 py-2.5 font-medium text-right">Margen %</th>
                  <th className="px-3 py-2.5 font-medium text-right">Uds.</th>
                  <th className="px-5 py-2.5 font-medium text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {porMargen.map((sku, i) => (
                  <tr key={sku.sku} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-2.5 text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900 truncate max-w-[200px]" title={sku.nombre}>
                        {sku.nombre}
                      </div>
                      <div className="text-xs text-gray-400">{sku.categoria}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium whitespace-nowrap">
                      <MargenBadge pct={sku.margen_pct} />
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
                      {formatUnidades(sku.unidades_vendidas)}
                    </td>
                    <td className="px-5 py-2.5 text-right text-gray-600 whitespace-nowrap">
                      {formatMXNTabla(sku.ingresos_totales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Callout de insight ─────────────────────────────────────── */}
      <div className={`mt-4 rounded-lg px-5 py-3 border ${
        esPositivo
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <p className={`text-sm ${esPositivo ? 'text-emerald-800' : 'text-amber-800'}`}>
          {textoCallout}
        </p>
      </div>
    </div>
  );
}
