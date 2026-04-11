'use client';

/**
 * ClientesEnRiesgo — Detección de clientes con declive o inactividad.
 * Hero stat + tabla con fila destacada para el cliente de mayor impacto + callout.
 * Las filas son clickeables y navegan al detalle del cliente.
 */

import { useRouter } from 'next/navigation';
import type { ClientesEnRiesgoData } from '@/lib/queries/clientes-en-riesgo';
import { formatMXNCorto, formatMXNTabla, formatCambioPct } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';
import { calloutClientesEnRiesgo } from '@/lib/textos/callouts';
import { ClienteLink } from '@/components/ui/ClienteLink';

interface Props {
  data: ClientesEnRiesgoData;
}

const BADGE_TIPO_CLIENTE: Record<string, string> = {
  ferreteria_minorista: 'Ferretería',
  constructor: 'Constructor',
  plomero: 'Plomero',
  electricista: 'Electricista',
  carpintero: 'Carpintero',
  industrial: 'Industrial',
  otro: 'Otro',
};

export function ClientesEnRiesgo({ data }: Props) {
  const router = useRouter();
  const { clientes, totalIngresosPotenciales } = data;
  const textoCallout = calloutClientesEnRiesgo(clientes.length, totalIngresosPotenciales);
  const esPositivo = clientes.length === 0;

  // El cliente con mayor impacto es el primero (ya viene ordenado por ingresos_potenciales_perdidos DESC)
  const clienteDestacadoId = clientes.length > 0 ? clientes[0].cliente_id : null;

  return (
    <div>
      {/* Título */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          Clientes en riesgo
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Declive significativo o inactividad reciente
        </p>
      </div>

      {/* Hero stat */}
      <div className="bg-white rounded-lg border border-gray-200 px-6 py-5 mb-6">
        <div className="flex items-baseline gap-8">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              Clientes en riesgo
            </p>
            <p className="text-3xl font-semibold text-amber-600 tracking-tight">
              {clientes.length}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              Ingresos anuales en riesgo
            </p>
            <p className="text-3xl font-semibold text-amber-600 tracking-tight">
              {formatMXNCorto(totalIngresosPotenciales)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {clientes.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-2.5 font-medium">Cliente</th>
                  <th className="px-3 py-2.5 font-medium text-right">Promedio histórico</th>
                  <th className="px-3 py-2.5 font-medium text-right">Reciente</th>
                  <th className="px-3 py-2.5 font-medium text-right">Cambio</th>
                  <th className="px-3 py-2.5 font-medium text-right">Días s/comprar</th>
                  <th className="px-5 py-2.5 font-medium text-right">Riesgo anual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clientes.map((cliente) => {
                  const esDestacado = cliente.cliente_id === clienteDestacadoId;
                  const badgeRiesgo = cliente.tipo_riesgo === 'declive'
                    ? 'text-red-700 bg-red-50'
                    : 'text-amber-700 bg-amber-50';

                  return (
                    <tr
                      key={cliente.cliente_id}
                      onClick={() => router.push(`/dashboard/clientes/${cliente.cliente_id}`)}
                      className={`cursor-pointer ${
                        esDestacado
                          ? 'bg-amber-50/50 border-l-2 border-l-amber-400 hover:bg-amber-50'
                          : 'hover:bg-gray-50 transition-colors'
                      }`}
                    >
                      <td className="px-5 py-2.5">
                        <div className="font-medium text-gray-900 truncate max-w-[240px]" title={cliente.razon_social}>
                          <ClienteLink clienteId={cliente.cliente_id} nombre={cliente.razon_social} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{cliente.ciudad}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badgeRiesgo}`}>
                            {BADGE_TIPO_CLIENTE[cliente.tipo_cliente] || cliente.tipo_cliente}
                            {' · '}
                            {cliente.tipo_riesgo === 'declive' ? 'Declive' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
                        {formatMXNTabla(cliente.compra_mensual_baseline)}/mes
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
                        {formatMXNTabla(cliente.compra_mensual_reciente)}/mes
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <span className={
                          cliente.cambio_pct <= -50 ? 'text-red-600 font-medium'
                            : cliente.cambio_pct <= -30 ? 'text-amber-600'
                            : 'text-gray-600'
                        }>
                          {formatCambioPct(cliente.cambio_pct)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
                        {cliente.dias_sin_comprar !== null
                          ? conConteo(cliente.dias_sin_comprar, 'día', 'días')
                          : '—'
                        }
                      </td>
                      <td className="px-5 py-2.5 text-right font-medium text-amber-700 whitespace-nowrap">
                        {formatMXNTabla(cliente.ingresos_potenciales_perdidos)}
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
