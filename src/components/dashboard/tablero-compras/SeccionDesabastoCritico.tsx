/**
 * SeccionDesabastoCritico — Tabla de los top 10 items en desabasto crítico.
 * Muestra SKUs cuyo stock actual está por debajo del mínimo recomendado.
 * Server Component.
 */

import { ProductoLink } from '@/components/ui/ProductoLink';
import { formatMXNTabla, formatUnidades } from '@/lib/textos/formato';
import type { ItemDesabastoCritico } from '@/lib/queries/items-desabasto-critico';

interface Props {
  items: ItemDesabastoCritico[];
}

const MAX_FILAS_VISIBLE = 10;

/** Color condicional para días hasta stockout */
function colorDias(dias: number): string {
  if (dias <= 0) return 'text-red-600 font-semibold';
  if (dias <= 7) return 'text-amber-600 font-medium';
  return 'text-gray-600';
}

export function SeccionDesabastoCritico({ items }: Props) {
  const top10 = items.slice(0, MAX_FILAS_VISIBLE);
  const restantes = items.length - MAX_FILAS_VISIBLE;

  return (
    <section id="desabasto-critico" className="mb-10 scroll-mt-16">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Items en desabasto crítico</h2>
      <p className="text-xs text-gray-500 mb-4 max-w-3xl">
        SKUs cuyo stock actual está por debajo del mínimo recomendado. El mínimo se calcula como
        demanda diaria promedio × 21 días (7 de safety stock + 14 de lead time).
        La demanda promedio se calcula sobre los últimos 90 días.
      </p>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 px-8 py-12 text-center">
          <p className="text-gray-400 text-sm">
            Tu inventario está al día. No hay items en desabasto crítico.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5 font-medium">SKU</th>
                    <th className="px-3 py-2.5 font-medium">Producto</th>
                    <th className="px-3 py-2.5 font-medium">Bodega</th>
                    <th className="px-3 py-2.5 font-medium text-right">Stock</th>
                    <th className="px-3 py-2.5 font-medium text-right">Mínimo</th>
                    <th className="px-3 py-2.5 font-medium text-right">Días hasta stockout</th>
                    <th className="px-3 py-2.5 font-medium text-right">Valor en riesgo / mes</th>
                    <th className="px-4 py-2.5 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {top10.map((item, idx) => (
                    <tr key={`${item.sku}-${item.bodega_id}-${idx}`} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5">
                        <ProductoLink sku={item.sku} nombre={item.sku} className="font-mono text-xs" />
                      </td>
                      <td className="px-3 py-2.5 text-gray-900 max-w-[200px] truncate">{item.nombre_producto}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">{item.bodega_nombre}</td>
                      <td className={`px-3 py-2.5 text-right tabular-nums ${item.stock_actual === 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                        {formatUnidades(item.stock_actual)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-500 tabular-nums">
                        {formatUnidades(item.minimo_recomendado)}
                      </td>
                      <td className={`px-3 py-2.5 text-right tabular-nums ${colorDias(item.dias_hasta_stockout)}`}>
                        {Math.round(item.dias_hasta_stockout)} {item.dias_hasta_stockout === 1 ? 'día' : 'días'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-900 tabular-nums">
                        {formatMXNTabla(item.valor_impacto_mensual)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          disabled
                          title="Disponible en Fase 3"
                          className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-400 cursor-not-allowed"
                        >
                          Generar PO
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {restantes > 0 && (
            <div className="mt-3 text-center">
              <a
                href="/dashboard/tablero-compras/desabasto-critico"
                className="text-sm text-slate-600 hover:text-slate-800 font-medium"
              >
                Ver los {formatUnidades(restantes)} items restantes →
              </a>
            </div>
          )}
        </>
      )}
    </section>
  );
}
