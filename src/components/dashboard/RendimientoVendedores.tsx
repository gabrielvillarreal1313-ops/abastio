/**
 * RendimientoVendedores — Tabla de rendimiento por vendedor con callout de insight.
 */

import type { RendimientoVendedoresData } from '@/lib/queries/rendimiento-vendedores';
import { formatMXNTabla, formatMXN, formatPct, formatCambioPct } from '@/lib/textos/formato';
import { calloutRendimientoVendedores } from '@/lib/textos/callouts';

interface Props {
  data: RendimientoVendedoresData;
}

const BADGE_TIPO: Record<string, string> = {
  ruta: 'Ruta',
  mostrador: 'Mostrador',
  telefonico: 'Telefónico',
};

function colorMargen(pct: number): string {
  if (pct >= 25) return 'text-emerald-700';
  if (pct >= 18) return 'text-gray-900';
  return 'text-red-600';
}

function colorDescuento(pct: number): string {
  if (pct <= 5) return 'text-emerald-700';
  if (pct <= 12) return 'text-gray-900';
  return 'text-red-600';
}

export function RendimientoVendedores({ data }: Props) {
  const { vendedores, etiquetaMes } = data;

  const calloutData = vendedores.map((v) => ({
    nombre: v.nombre,
    margen_pct: v.margen_pct,
    descuento_promedio_pct: v.descuento_promedio_pct,
    ingresos_totales: v.ingresos_totales,
  }));
  const textoCallout = calloutRendimientoVendedores(calloutData);

  // Detectar si el callout es positivo (homogéneo) o de oportunidad
  const tieneProblematico = vendedores.some(
    (v) => v.margen_pct < 18 && v.descuento_promedio_pct > 12
  );
  const margenes = vendedores.map((v) => v.margen_pct);
  const dispersion = Math.max(...margenes) - Math.min(...margenes);
  const esPositivo = !tieneProblematico && dispersion <= 8;

  return (
    <div>
      {/* Título */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          Rendimiento por vendedor — {etiquetaMes}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Mes completo más reciente
        </p>
      </div>

      {/* Tabla */}
      {vendedores.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-2.5 font-medium">Vendedor</th>
                  <th className="px-3 py-2.5 font-medium text-right">Ingresos</th>
                  <th className="px-3 py-2.5 font-medium text-right">Txns</th>
                  <th className="px-3 py-2.5 font-medium text-right">Ticket prom.</th>
                  <th className="px-3 py-2.5 font-medium text-right">Margen %</th>
                  <th className="px-3 py-2.5 font-medium text-right">Desc. prom.</th>
                  <th className="px-3 py-2.5 font-medium text-right">Clientes</th>
                  <th className="px-5 py-2.5 font-medium text-right">vs mes ant.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vendedores.map((v) => {
                  const cambioPositivo = v.ingresos_vs_mes_anterior_pct >= 0;

                  return (
                    <tr key={v.vendedor_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-2.5">
                        <div className="font-medium text-gray-900">{v.nombre}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{v.zona}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-slate-600 bg-slate-100">
                            {BADGE_TIPO[v.tipo] || v.tipo}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">
                        {formatMXNTabla(v.ingresos_totales)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
                        {v.num_transacciones}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
                        {formatMXN(v.ticket_promedio)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-medium whitespace-nowrap ${colorMargen(v.margen_pct)}`}>
                        {formatPct(v.margen_pct)}
                      </td>
                      <td className={`px-3 py-2.5 text-right whitespace-nowrap ${colorDescuento(v.descuento_promedio_pct)}`}>
                        {formatPct(v.descuento_promedio_pct)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
                        {v.num_clientes_unicos}
                      </td>
                      <td className="px-5 py-2.5 text-right whitespace-nowrap">
                        <span className={cambioPositivo ? 'text-emerald-700' : 'text-red-600'}>
                          {cambioPositivo ? '↑' : '↓'} {formatCambioPct(v.ingresos_vs_mes_anterior_pct)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Callout */}
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
