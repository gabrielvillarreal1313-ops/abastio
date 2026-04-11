/**
 * Detalle de cliente — KPIs, historial, top SKUs + tab de oportunidades.
 * Server Component que carga datos en paralelo y delega tabs al cliente.
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getClienteDetalle, getClienteIngresosMensuales, getClienteTopSKUs } from '@/lib/queries/cliente-detalle';
import { getOportunidadesCliente } from '@/lib/queries/oportunidades-cliente';
import { KPICard } from '@/components/dashboard/KPICard';
import { GraficaIngresosMensuales } from '@/components/dashboard/GraficaIngresosMensuales';
import { ClienteDetalleTabs } from '@/components/dashboard/clientes/ClienteDetalleTabs';
import { formatMXNCorto, formatMXN, formatPct, formatUnidades, formatMXNTabla } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';
import { ProductoLink } from '@/components/ui/ProductoLink';
import { BotonVolver } from '@/components/ui/BotonVolver';

export const dynamic = 'force-dynamic';

const BADGE_TIPO: Record<string, string> = {
  ferreteria_minorista: 'Ferretería',
  constructor: 'Constructor',
  plomero: 'Plomero',
  electricista: 'Electricista',
  carpintero: 'Carpintero',
  industrial: 'Industrial',
  otro: 'Otro',
};

export default async function ClienteDetallePage({ params }: { params: { id: string } }) {
  const clienteId = parseInt(params.id, 10);
  if (isNaN(clienteId)) notFound();

  const [cliente, ingresosMensuales, topSKUs, oportunidades] = await Promise.all([
    getClienteDetalle(clienteId),
    getClienteIngresosMensuales(clienteId),
    getClienteTopSKUs(clienteId),
    getOportunidadesCliente(clienteId),
  ]);

  if (!cliente) notFound();

  const totalOportunidades = oportunidades.recompras.length + oportunidades.crossSell.length;

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <BotonVolver texto="Volver a clientes" />

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{cliente.razon_social}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">{cliente.ciudad}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded text-gray-500 bg-gray-100">
                {BADGE_TIPO[cliente.tipo_cliente] ?? cliente.tipo_cliente}
              </span>
              <span className="text-sm text-gray-500">Vendedor: {cliente.vendedor_principal}</span>
            </div>
          </div>

          <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${
            cliente.es_riesgo ? 'text-red-700 bg-red-50 border border-red-200' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
          }`}>
            {cliente.es_riesgo ? 'En riesgo' : 'Activo'}
          </span>
        </div>
      </div>

      {/* Tabs — Suspense necesario para useSearchParams en ClienteDetalleTabs */}
      <Suspense fallback={null}>
      <ClienteDetalleTabs oportunidadesData={oportunidades} totalOportunidades={totalOportunidades} clienteId={clienteId}>
        {/* ─── Tab Resumen (Server Component content) ──────────────── */}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard label="Ingresos 12 meses" value={formatMXNCorto(cliente.ingresos_12m)} />
          <KPICard label="Ingresos YTD" value={formatMXNCorto(cliente.ingresos_ytd)} />
          <KPICard label="Ticket promedio" value={formatMXN(cliente.ticket_promedio)} />
          <KPICard label="Transacciones 12m" value={formatUnidades(cliente.total_transacciones_12m)} />
          <KPICard label="Margen promedio" value={formatPct(cliente.margen_promedio_pct)} />
        </div>

        {/* Gráfica de ingresos mensuales */}
        <div className="mt-10">
          <GraficaIngresosMensuales data={ingresosMensuales} />
        </div>

        {/* Top SKUs comprados */}
        <div className="mt-10">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-900">Productos más comprados</h2>
            <p className="text-sm text-gray-500 mt-0.5">Top 10 SKUs por ingresos totales</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-2.5 font-medium">SKU</th>
                    <th className="px-3 py-2.5 font-medium">Producto</th>
                    <th className="px-3 py-2.5 font-medium text-right">Ingresos</th>
                    <th className="px-3 py-2.5 font-medium text-right">Unidades</th>
                    <th className="px-3 py-2.5 font-medium text-right">Margen</th>
                    <th className="px-3 py-2.5 font-medium">Patrón de compra</th>
                    <th className="px-5 py-2.5 font-medium text-right">Días desde última compra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topSKUs.map((sku) => (
                    <tr key={sku.sku} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-2.5 font-mono text-xs text-gray-500">{sku.sku}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-gray-900 truncate max-w-[220px]" title={sku.nombre_producto}>
                          <ProductoLink sku={sku.sku} nombre={sku.nombre_producto} />
                        </div>
                        <div className="text-xs text-gray-400">{sku.categoria}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-gray-700 whitespace-nowrap">{formatMXNTabla(sku.ingresos_totales)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatUnidades(sku.unidades_totales)}</td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <span className={sku.margen_pct < 15 ? 'text-red-600' : sku.margen_pct < 20 ? 'text-amber-600' : 'text-emerald-600'}>
                          {formatPct(sku.margen_pct)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          sku.patron_compra === 'Compra regularmente' ? 'text-emerald-700 bg-emerald-50'
                            : sku.patron_compra === 'Compra ocasionalmente' ? 'text-amber-700 bg-amber-50'
                            : 'text-gray-600 bg-gray-50'
                        }`}>
                          {sku.patron_compra}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right whitespace-nowrap">
                        <span className={
                          sku.intervalo_promedio_dias > 0 && sku.dias_desde_ultima_compra <= sku.intervalo_promedio_dias
                            ? 'text-emerald-600'
                            : sku.intervalo_promedio_dias > 0 && sku.dias_desde_ultima_compra <= sku.intervalo_promedio_dias * 1.5
                            ? 'text-amber-600'
                            : 'text-red-600 font-medium'
                        }>
                          {conConteo(sku.dias_desde_ultima_compra, 'día', 'días')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ClienteDetalleTabs>
      </Suspense>
    </>
  );
}
