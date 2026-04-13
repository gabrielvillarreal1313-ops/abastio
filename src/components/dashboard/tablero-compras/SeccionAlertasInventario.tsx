/**
 * SeccionAlertasInventario — 3 tarjetas informativas de capital atrapado.
 * Deadstock (90+ días), sobrestock (>6 meses), sin movimiento reciente (30-90 días).
 * Las 3 tarjetas siempre se renderizan, incluso si alguna está vacía.
 * Server Component.
 */

import { formatMXNCorto } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';
import type { DeadstockItem } from '@/lib/queries/deadstock';
import type { AlertaSobrestock } from '@/lib/queries/alertas-sobrestock';
import type { ItemSinMovimientoReciente } from '@/lib/queries/items-sin-movimiento-reciente';

interface Props {
  deadstock: DeadstockItem[];
  alertasSobrestock: AlertaSobrestock[];
  itemsSinMovimiento: ItemSinMovimientoReciente[];
}

interface TarjetaAlertaProps {
  colorAccento: string; // clase CSS del borde superior
  colorValor: string;   // clase CSS del texto del valor
  valor: string;
  descripcion: string;
  subtitulo: string;
}

function TarjetaAlerta({ colorAccento, colorValor, valor, descripcion, subtitulo }: TarjetaAlertaProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-5 border-t-2 ${colorAccento}`}>
      <p className={`text-2xl font-semibold tracking-tight ${colorValor}`}>{valor}</p>
      <p className="text-sm text-gray-700 mt-1">{descripcion}</p>
      <p className="text-xs text-gray-400 mt-0.5">{subtitulo}</p>
    </div>
  );
}

export function SeccionAlertasInventario({ deadstock, alertasSobrestock, itemsSinMovimiento }: Props) {
  // Calcular totales
  const valorDeadstock = deadstock.reduce((sum, d) => sum + d.capital_inmovilizado, 0);
  const valorSobrestock = alertasSobrestock.reduce((sum, s) => sum + s.valor_capital_atrapado, 0);
  const valorSinMovimiento = itemsSinMovimiento.reduce((sum, i) => sum + i.valor_inmovilizado, 0);

  return (
    <section id="alertas-inventario" className="mb-10 scroll-mt-16">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Alertas de inventario</h2>
      <p className="text-xs text-gray-500 mb-4 max-w-3xl">
        Capital atrapado en inventario que no se está moviendo. Estas alertas son informativas —
        la acción para liberar capital se toma reduciendo futuras órdenes en el módulo Compras.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Deadstock — lo más crónico */}
        <TarjetaAlerta
          colorAccento="border-t-red-500"
          colorValor={deadstock.length > 0 ? 'text-red-700' : 'text-gray-400'}
          valor={deadstock.length > 0 ? formatMXNCorto(valorDeadstock) : '—'}
          descripcion={deadstock.length > 0
            ? conConteo(deadstock.length, 'SKU sin movimiento en 90+ días', 'SKUs sin movimiento en 90+ días')
            : 'Sin alertas en este momento'
          }
          subtitulo="Capital atrapado a largo plazo"
        />

        {/* Sobrestock */}
        <TarjetaAlerta
          colorAccento="border-t-amber-500"
          colorValor={alertasSobrestock.length > 0 ? 'text-amber-700' : 'text-gray-400'}
          valor={alertasSobrestock.length > 0 ? formatMXNCorto(valorSobrestock) : '—'}
          descripcion={alertasSobrestock.length > 0
            ? conConteo(alertasSobrestock.length, 'SKU con más de 6 meses de inventario', 'SKUs con más de 6 meses de inventario')
            : 'Sin alertas en este momento'
          }
          subtitulo="Inventario excesivo respecto a la demanda"
        />

        {/* Sin movimiento reciente — alerta temprana */}
        <TarjetaAlerta
          colorAccento="border-t-slate-400"
          colorValor={itemsSinMovimiento.length > 0 ? 'text-slate-700' : 'text-gray-400'}
          valor={itemsSinMovimiento.length > 0 ? formatMXNCorto(valorSinMovimiento) : '—'}
          descripcion={itemsSinMovimiento.length > 0
            ? conConteo(itemsSinMovimiento.length, 'SKU sin venta en los últimos 30 días', 'SKUs sin venta en los últimos 30 días')
            : 'Sin alertas en este momento'
          }
          subtitulo="Alerta temprana — pueden convertirse en deadstock"
        />
      </div>
    </section>
  );
}
