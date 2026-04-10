/**
 * AlertasMargen — Detecta categorías con erosión significativa de margen bruto.
 * Compara últimos 3 meses vs 9 meses anteriores. Server Component.
 */

import type { AlertasMargenData } from '@/lib/queries/alertas-margen';
import { formatPct } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';
import { calloutAlertasMargen } from '@/lib/textos/callouts';

interface Props {
  data: AlertasMargenData;
}

export function AlertasMargen({ data }: Props) {
  const { alertas, tieneCriticas } = data;
  const numCriticas = alertas.filter((a) => a.severidad === 'critica').length;

  const textoCallout = calloutAlertasMargen(
    alertas.length,
    numCriticas,
    alertas.length === 1 ? alertas[0].categoria : undefined,
    alertas.length === 1 ? alertas[0].caida_pp : undefined,
  );

  const esPositivo = alertas.length === 0;

  return (
    <div>
      {/* Titulo */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          Alertas de margen por categoria
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Categorias con caida significativa vs promedio historico
        </p>
      </div>

      {/* Estado vacio positivo */}
      {esPositivo && (
        <div className="bg-white rounded-lg border border-gray-200 px-6 py-8 mb-4 flex flex-col items-center gap-2">
          {/* Icono check verde */}
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 text-center">{textoCallout}</p>
        </div>
      )}

      {/* Cards de alertas */}
      {alertas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {alertas.map((alerta) => {
            const esCritica = alerta.severidad === 'critica';
            const iconColor = esCritica ? 'text-red-600 bg-red-100' : 'text-amber-600 bg-amber-100';
            const badgeColor = esCritica
              ? 'text-red-700 bg-red-50 border-red-200'
              : 'text-amber-700 bg-amber-50 border-amber-200';

            return (
              <div
                key={alerta.categoria}
                className="bg-white rounded-lg border border-gray-200 px-5 py-4"
              >
                <div className="flex items-start gap-3">
                  {/* Icono de alerta */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Nombre de categoria + badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {alerta.categoria}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        -{alerta.caida_pp.toFixed(1)}pp
                      </span>
                    </div>

                    {/* Margen actual vs historico */}
                    <p className="text-sm text-gray-600 mt-1">
                      {formatPct(alerta.margen_reciente_pct)} actual vs {formatPct(alerta.margen_historico_pct)} historico
                    </p>

                    {/* Detalle */}
                    <p className="text-xs text-gray-400 mt-1">
                      Ultimos 3 meses vs 9 meses anteriores · {conConteo(alerta.skus_afectados, 'SKU afectado', 'SKUs afectados')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Callout — siempre visible cuando hay alertas */}
      {alertas.length > 0 && (
        <div className={`rounded-lg px-5 py-3 border ${
          tieneCriticas
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <p className={`text-sm ${tieneCriticas ? 'text-red-800' : 'text-amber-800'}`}>
            {textoCallout}
          </p>
        </div>
      )}
    </div>
  );
}
