/**
 * SeccionProximosDesabasto — Tabla de items próximos a caer en desabasto.
 * Items con stock >= mínimo pero días hasta stockout < 14.
 * Mutuamente excluyente con SeccionDesabastoCritico.
 * Server Component.
 */

import { ProductoLink } from '@/components/ui/ProductoLink';
import { formatMXNTabla, formatUnidades } from '@/lib/textos/formato';
import type { ItemProximoDesabasto } from '@/lib/queries/items-proximos-desabasto';

interface Props {
  items: ItemProximoDesabasto[];
}

const MAX_FILAS_VISIBLE = 10;

export function SeccionProximosDesabasto({ items }: Props) {
  const top10 = items.slice(0, MAX_FILAS_VISIBLE);
  const restantes = items.length - MAX_FILAS_VISIBLE;

  return (
    <section id="proximos-desabasto" className="mb-10 scroll-mt-16">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Items próximos a entrar en desabasto</h2>
      <p className="text-xs text-gray-500 mb-4 max-w-3xl">
        Items que aún no están en desabasto pero cuya demanda histórica indica que se agotarán
        en los próximos 14 días. Esta proyección te permite actuar antes del problema, no después.
        Cálculo basado en la demanda promedio de los últimos 90 días.
      </p>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 px-8 py-12 text-center">
          <p className="text-gray-400 text-sm">
            No hay items próximos a entrar en desabasto en los próximos 14 días.
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
                      <td className="px-3 py-2.5 text-right text-gray-900 tabular-nums">
                        {formatUnidades(item.stock_actual)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-500 tabular-nums">
                        {formatUnidades(item.minimo_recomendado)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-amber-600 font-medium tabular-nums">
                        {Math.round(item.dias_hasta_stockout)} {item.dias_hasta_stockout === 1 ? 'día' : 'días'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-900 tabular-nums">
                        {formatMXNTabla(item.valor_impacto_mensual)}
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
                href="/dashboard/tablero-compras/proximos-desabasto"
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
