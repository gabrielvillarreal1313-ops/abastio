'use client';

/**
 * Deadstock — Muestra productos sin movimiento en 90+ días con inventario > 0.
 * Incluye hero stat de capital inmovilizado, tabla expandible, y callout.
 */

import { useState } from 'react';
import type { DeadstockData } from '@/lib/queries/deadstock';
import { formatMXNCorto, formatMXNTabla, formatUnidades } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';
import { calloutDeadstock } from '@/lib/textos/callouts';
import { ProductoLink } from '@/components/ui/ProductoLink';

interface Props {
  data: DeadstockData;
}

const FILAS_INICIALES = 10;

export function Deadstock({ data }: Props) {
  const { items, capitalTotal } = data;
  const [expandido, setExpandido] = useState(false);

  const filasVisibles = expandido ? items : items.slice(0, FILAS_INICIALES);
  const filasOcultas = items.length - FILAS_INICIALES;
  const textoCallout = calloutDeadstock(items.length, capitalTotal);
  const esPositivo = items.length === 0;

  return (
    <div>
      {/* Título */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          Detección de deadstock
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Productos activos sin ventas en los últimos 90 días
        </p>
      </div>

      {/* Hero stat */}
      <div className="bg-white rounded-lg border border-gray-200 px-6 py-5 mb-6">
        <p className="text-sm font-medium text-gray-500 mb-1">
          Capital inmovilizado en productos sin movimiento
        </p>
        <p className="text-3xl font-semibold text-red-700 tracking-tight">
          {formatMXNCorto(capitalTotal)}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {conConteo(items.length, 'SKU afectado', 'SKUs afectados')}
        </p>
      </div>

      {/* Tabla */}
      {items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-2.5 font-medium">SKU</th>
                  <th className="px-3 py-2.5 font-medium">Producto</th>
                  <th className="px-3 py-2.5 font-medium">Bodega</th>
                  <th className="px-3 py-2.5 font-medium text-right">Inventario</th>
                  <th className="px-3 py-2.5 font-medium text-right">Capital inmovilizado</th>
                  <th className="px-3 py-2.5 font-medium text-right">Días sin vender</th>
                  <th className="px-5 py-2.5 font-medium text-right">Última venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filasVisibles.map((item) => (
                  <tr key={item.sku} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-2.5 font-mono text-xs text-gray-500">
                      {item.sku}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900 truncate max-w-[220px]" title={item.nombre}>
                        <ProductoLink sku={item.sku} nombre={item.nombre} />
                      </div>
                      <div className="text-xs text-gray-400">{item.categoria}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                      {item.bodegas_con_stock}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
                      {formatUnidades(item.inventario_total)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-red-700 whitespace-nowrap">
                      {formatMXNTabla(item.capital_inmovilizado)}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className={
                        item.dias_sin_movimiento === null ? 'text-red-600 font-medium'
                          : item.dias_sin_movimiento > 150 ? 'text-red-600'
                          : 'text-amber-600'
                      }>
                        {item.dias_sin_movimiento !== null
                          ? conConteo(item.dias_sin_movimiento, 'día', 'días')
                          : 'Nunca'}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right text-gray-500 text-xs whitespace-nowrap">
                      {item.ultima_venta
                        ? new Date(item.ultima_venta).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botón expandir */}
          {filasOcultas > 0 && !expandido && (
            <div className="px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => setExpandido(true)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Ver {conConteo(filasOcultas, 'producto más', 'productos más')}
              </button>
            </div>
          )}

          {expandido && filasOcultas > 0 && (
            <div className="px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => setExpandido(false)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Mostrar menos
              </button>
            </div>
          )}
        </div>
      )}

      {/* Callout */}
      <div className={`mt-4 rounded-lg px-5 py-3 border ${
        esPositivo
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <p className={`text-sm ${esPositivo ? 'text-emerald-800' : 'text-red-800'}`}>
          {textoCallout}
        </p>
      </div>
    </div>
  );
}
