/**
 * Detalle de producto — Muestra KPIs, historial de ventas, inventario y top clientes.
 * Server Component que carga datos en paralelo.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductoDetalle, getProductoIngresosMensuales, getProductoTopClientes } from '@/lib/queries/producto-detalle';
import { KPICard } from '@/components/dashboard/KPICard';
import { GraficaIngresosMensuales } from '@/components/dashboard/GraficaIngresosMensuales';
import { ClienteLink } from '@/components/ui/ClienteLink';
import { formatMXNCorto, formatPct, formatUnidades, formatMXNTabla } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';

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

export default async function ProductoDetallePage({ params }: { params: { sku: string } }) {
  const sku = decodeURIComponent(params.sku);

  const [producto, ingresosMensuales, topClientes] = await Promise.all([
    getProductoDetalle(sku),
    getProductoIngresosMensuales(sku),
    getProductoTopClientes(sku),
  ]);

  if (!producto) notFound();

  const esDeadstock = producto.dias_sin_vender > 90 && (producto.cantidad_actual_leon + producto.cantidad_actual_queretaro) > 0;
  const stockTotal = producto.cantidad_actual_leon + producto.cantidad_actual_queretaro;
  const pctStockLeon = producto.cantidad_maxima > 0 ? Math.min((producto.cantidad_actual_leon / producto.cantidad_maxima) * 100, 100) : 0;
  const pctStockQro = producto.cantidad_maxima > 0 ? Math.min((producto.cantidad_actual_queretaro / producto.cantidad_maxima) * 100, 100) : 0;

  return (
    <>
      {/* Sección 1 — Header */}
      <div className="mb-8">
        <Link href="/dashboard/productos" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Volver a productos
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{producto.nombre}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="font-mono text-sm text-gray-400">{producto.sku}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded text-gray-500 bg-gray-100">{producto.categoria}</span>
              {producto.marca && <span className="text-sm text-gray-500">{producto.marca}</span>}
              {producto.proveedor_principal && <span className="text-sm text-gray-500">· {producto.proveedor_principal}</span>}
              <span className="text-sm text-gray-500">· {producto.unidad_medida}</span>
            </div>
          </div>

          <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${
            esDeadstock ? 'text-red-700 bg-red-50 border border-red-200' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
          }`}>
            {esDeadstock ? 'Deadstock' : 'Activo'}
          </span>
        </div>
      </div>

      {/* Sección 2 — KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="Ingresos 12 meses" value={formatMXNCorto(producto.ingresos_12m)} />
        <KPICard
          label="Margen"
          value={formatPct(producto.margen_pct)}
          subtitle={`vs ${formatPct(producto.margen_pct_historico)} histórico`}
        />
        <KPICard label="Stock total" value={formatUnidades(stockTotal)} />
        <KPICard label="Clientes activos 12m" value={formatUnidades(producto.total_clientes_12m)} />
        <KPICard label="Días sin vender" value={String(producto.dias_sin_vender)} />
      </div>

      {/* Sección 3 — Gráfica + Inventario lado a lado */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica (ocupa 2 columnas) */}
        <div className="lg:col-span-2">
          <GraficaIngresosMensuales data={ingresosMensuales} />
        </div>

        {/* Card de inventario */}
        <div className="bg-white rounded-lg border border-gray-200 px-6 py-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Inventario por bodega</h3>

          {/* León */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">León</span>
              <span className="font-medium text-gray-900">{formatUnidades(producto.cantidad_actual_leon)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${pctStockLeon > 80 ? 'bg-emerald-500' : pctStockLeon > 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${pctStockLeon}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
              <span>Mín: {formatUnidades(producto.cantidad_minima)}</span>
              <span>Máx: {formatUnidades(producto.cantidad_maxima)}</span>
            </div>
          </div>

          {/* Querétaro */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Querétaro</span>
              <span className="font-medium text-gray-900">{formatUnidades(producto.cantidad_actual_queretaro)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${pctStockQro > 80 ? 'bg-emerald-500' : pctStockQro > 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${pctStockQro}%` }}
              />
            </div>
          </div>

          {/* Resumen */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Stock total</span>
              <span className="font-semibold text-gray-900">{formatUnidades(stockTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-500">Unidades/mes</span>
              <span className="text-gray-600">{formatUnidades(producto.ticket_promedio_unidades)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 4 — Top clientes */}
      <div className="mt-10">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900">Clientes principales</h2>
          <p className="text-sm text-gray-500 mt-0.5">Top 10 por ingresos totales</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-2.5 font-medium">Cliente</th>
                  <th className="px-3 py-2.5 font-medium">Ciudad</th>
                  <th className="px-3 py-2.5 font-medium">Tipo</th>
                  <th className="px-3 py-2.5 font-medium text-right">Ingresos</th>
                  <th className="px-3 py-2.5 font-medium text-right">Unidades</th>
                  <th className="px-3 py-2.5 font-medium">Patrón de compra</th>
                  <th className="px-5 py-2.5 font-medium text-right">Días desde última compra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topClientes.map((c) => (
                  <tr key={c.cliente_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-2.5">
                      <div className="font-medium text-gray-900">
                        <ClienteLink clienteId={c.cliente_id} nombre={c.razon_social} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{c.ciudad}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-gray-500 bg-gray-100">
                        {BADGE_TIPO[c.tipo_cliente] ?? c.tipo_cliente}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-700 whitespace-nowrap">{formatMXNTabla(c.ingresos_totales)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatUnidades(c.unidades_totales)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        c.patron_compra === 'Compra regularmente' ? 'text-emerald-700 bg-emerald-50'
                          : c.patron_compra === 'Compra ocasionalmente' ? 'text-amber-700 bg-amber-50'
                          : 'text-gray-600 bg-gray-50'
                      }`}>
                        {c.patron_compra}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      <span className={
                        c.intervalo_promedio_dias > 0 && c.dias_desde_ultima_compra <= c.intervalo_promedio_dias
                          ? 'text-emerald-600'
                          : c.intervalo_promedio_dias > 0 && c.dias_desde_ultima_compra <= c.intervalo_promedio_dias * 1.5
                          ? 'text-amber-600'
                          : 'text-red-600 font-medium'
                      }>
                        {conConteo(c.dias_desde_ultima_compra, 'día', 'días')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
