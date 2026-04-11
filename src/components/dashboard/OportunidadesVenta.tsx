/**
 * OportunidadesVenta — Sección del Resumen Ejecutivo con oportunidades de venta.
 * Muestra valor total detectado + top 5 clientes por valor de oportunidad.
 */

import type { ResumenOportunidades, TopClienteOportunidad } from '@/lib/queries/resumen-oportunidades';
import { ClienteLink } from '@/components/ui/ClienteLink';
import { formatMXNCorto, formatMXNTabla } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';

interface Props {
  resumen: ResumenOportunidades;
  topClientes: TopClienteOportunidad[];
}

export function OportunidadesVenta({ resumen, topClientes }: Props) {
  const tieneOportunidades = resumen.valorTotal > 0;

  return (
    <div>
      {/* Título */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          Oportunidades de venta
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Recompras tardías y cross-sell detectados automáticamente
        </p>
      </div>

      {/* Hero stat */}
      <div className="bg-white rounded-lg border border-gray-200 px-6 py-5 mb-6">
        <p className="text-sm font-medium text-gray-500 mb-1">
          Valor mensual en oportunidades detectadas
        </p>
        <p className="text-3xl font-semibold text-blue-700 tracking-tight">
          {formatMXNCorto(resumen.valorTotal)}
        </p>
        {tieneOportunidades && (
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>
              {conConteo(resumen.countRecompra, 'recompra tardía', 'recompras tardías')} ({formatMXNCorto(resumen.totalRecompra)})
            </span>
            <span className="text-gray-300">·</span>
            <span>
              {conConteo(resumen.countCrossSell, 'oportunidad de cross-sell', 'oportunidades de cross-sell')} ({formatMXNCorto(resumen.totalCrossSell)})
            </span>
          </div>
        )}
      </div>

      {/* Top 5 clientes */}
      {topClientes.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Top clientes por valor de oportunidad</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-2.5 font-medium">Cliente</th>
                  <th className="px-3 py-2.5 font-medium">Vendedor</th>
                  <th className="px-3 py-2.5 font-medium text-right">Oportunidades</th>
                  <th className="px-5 py-2.5 font-medium text-right">Valor total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topClientes.map((c) => (
                  <tr key={c.cliente_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-2.5">
                      <div className="font-medium text-gray-900">
                        <ClienteLink clienteId={c.cliente_id} nombre={c.nombre_cliente} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{c.vendedor_principal}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className="text-gray-600">{c.total_oportunidades}</span>
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium text-blue-700 whitespace-nowrap">
                      {formatMXNTabla(c.valor_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!tieneOportunidades && (
        <div className="bg-emerald-50 rounded-lg border border-emerald-200 px-5 py-3">
          <p className="text-sm text-emerald-800">
            No se detectaron oportunidades de venta — todos los clientes están al día con sus patrones de compra.
          </p>
        </div>
      )}
    </div>
  );
}
