/**
 * Detalle de cotización — Header, tabla de líneas, totales, y acciones.
 * Server Component que carga datos. Las acciones usan un componente cliente.
 */

import { notFound } from 'next/navigation';
import { getCotizacionDetalle, getCotizacionLineas } from '@/lib/queries/cotizacion-detalle';
import { ClienteLink } from '@/components/ui/ClienteLink';
import { VendedorLink } from '@/components/ui/VendedorLink';
import { ProductoLink } from '@/components/ui/ProductoLink';
import { formatMXN, formatMXNTabla, formatPct, formatUnidades } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';
import { AccionesCotizacion } from '@/components/dashboard/oportunidades/AccionesCotizacion';
import { BotonVolver } from '@/components/ui/BotonVolver';
import { ToastListener } from '@/components/ui/ToastListener';

export const dynamic = 'force-dynamic';

const BADGE_ESTADO: Record<string, { texto: string; clase: string }> = {
  borrador: { texto: 'Borrador', clase: 'text-gray-700 bg-gray-100 border-gray-200' },
  enviada: { texto: 'Enviada', clase: 'text-blue-700 bg-blue-50 border-blue-200' },
  completada: { texto: 'Completada', clase: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  cancelada: { texto: 'Cancelada', clase: 'text-red-700 bg-red-50 border-red-200' },
};

const BADGE_ORIGEN: Record<string, { texto: string; clase: string }> = {
  recompra: { texto: 'Recompra', clase: 'text-amber-700 bg-amber-50' },
  cross_sell: { texto: 'Cross-sell', clase: 'text-blue-700 bg-blue-50' },
  manual: { texto: '', clase: '' },
};

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function CotizacionDetallePage({ params }: { params: { id: string } }) {
  const cotizacionId = params.id;

  const [cotizacion, lineas] = await Promise.all([
    getCotizacionDetalle(cotizacionId),
    getCotizacionLineas(cotizacionId),
  ]);

  if (!cotizacion) notFound();

  const badge = BADGE_ESTADO[cotizacion.estado] ?? BADGE_ESTADO.borrador;

  return (
    <>
      <ToastListener />
      {/* Header */}
      <div className="mb-8">
        <BotonVolver texto="Volver a oportunidades" />

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">
                COT-{String(cotizacion.numero_cotizacion).padStart(4, '0')}
              </h1>
              <span className={`text-sm font-semibold px-3 py-1 rounded-lg border ${badge.clase}`}>
                {badge.texto}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Cliente: <ClienteLink clienteId={cotizacion.cliente_id} nombre={cotizacion.nombre_cliente} className="text-gray-900 font-medium" /></span>
              <span>Vendedor: <VendedorLink vendedorId={cotizacion.vendedor_id} nombre={cotizacion.nombre_vendedor} className="text-gray-900 font-medium" /></span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
              <span>Creada: {formatFecha(cotizacion.fecha_creacion)}</span>
              <span>Válida hasta: {formatFecha(cotizacion.fecha_vencimiento)}</span>
              {cotizacion.fecha_envio && <span>Enviada: {formatFecha(cotizacion.fecha_envio)}</span>}
            </div>
            {cotizacion.notas && (
              <p className="mt-2 text-sm text-gray-500 italic">{cotizacion.notas}</p>
            )}
          </div>

          {/* Acciones (componente cliente) */}
          <AccionesCotizacion cotizacionId={cotizacion.id} estado={cotizacion.estado} numeroCotizacion={cotizacion.numero_cotizacion} />
        </div>
      </div>

      {/* Tabla de líneas */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-2.5 font-medium">SKU</th>
                <th className="px-3 py-2.5 font-medium">Producto</th>
                <th className="px-3 py-2.5 font-medium text-right">Cantidad</th>
                <th className="px-3 py-2.5 font-medium">Unidad</th>
                <th className="px-3 py-2.5 font-medium text-right">Precio unitario</th>
                <th className="px-3 py-2.5 font-medium text-right">Desc. %</th>
                <th className="px-3 py-2.5 font-medium text-right">Precio final</th>
                <th className="px-3 py-2.5 font-medium text-right">Margen</th>
                <th className="px-5 py-2.5 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lineas.map((l) => {
                const origenBadge = BADGE_ORIGEN[l.origen];
                return (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-2.5 font-mono text-xs text-gray-500">{l.sku}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900">
                        <ProductoLink sku={l.sku} nombre={l.nombre_producto} />
                      </div>
                      {origenBadge && origenBadge.texto && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block ${origenBadge.clase}`}>
                          {origenBadge.texto}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{formatUnidades(l.cantidad)}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{l.unidad}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatMXNTabla(l.precio_unitario)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">
                      {l.descuento_pct}%
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatMXNTabla(l.precio_final)}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className={l.margen_pct < 15 ? 'text-red-600' : 'text-emerald-600'}>
                        {formatPct(l.margen_pct)}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatMXNTabla(l.total_linea)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="border-t border-gray-200 px-5 py-4 bg-gray-50">
          <div className="flex justify-end gap-8 text-sm">
            <span className="text-gray-500">{conConteo(cotizacion.total_lineas, 'línea', 'líneas')}</span>
            <span className="text-gray-500">Subtotal: <span className="font-semibold text-gray-900">{formatMXN(cotizacion.subtotal)}</span></span>
            <span className="text-gray-500">Margen: <span className={`font-semibold ${cotizacion.margen_bruto_pct < 15 ? 'text-red-600' : 'text-emerald-600'}`}>{formatPct(cotizacion.margen_bruto_pct)}</span></span>
            <span className="text-gray-500">Ganancia: <span className="font-semibold text-gray-900">{formatMXN(cotizacion.ganancia_bruta)}</span></span>
          </div>
        </div>
      </div>
    </>
  );
}
