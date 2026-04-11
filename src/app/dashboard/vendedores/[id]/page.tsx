/**
 * Detalle de vendedor — Muestra KPIs, historial, top clientes y top SKUs.
 * Server Component que carga datos en paralelo.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getVendedorDetalle,
  getVendedorIngresosMensuales,
  getVendedorTopClientes,
  getVendedorTopSKUs,
} from '@/lib/queries/vendedor-detalle';
import { KPICard } from '@/components/dashboard/KPICard';
import { GraficaIngresosMensuales } from '@/components/dashboard/GraficaIngresosMensuales';
import { ClienteLink } from '@/components/ui/ClienteLink';
import { ProductoLink } from '@/components/ui/ProductoLink';
import { formatMXNCorto, formatPct, formatUnidades, formatMXNTabla } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';

export const dynamic = 'force-dynamic';

const BADGE_TIPO: Record<string, string> = {
  ruta: 'Ruta',
  mostrador: 'Mostrador',
  telefonico: 'Telefónico',
};

const BADGE_TIPO_CLIENTE: Record<string, string> = {
  ferreteria_minorista: 'Ferretería',
  constructor: 'Constructor',
  plomero: 'Plomero',
  electricista: 'Electricista',
  carpintero: 'Carpintero',
  industrial: 'Industrial',
  otro: 'Otro',
};

export default async function VendedorDetallePage({ params }: { params: { id: string } }) {
  const vendedorId = parseInt(params.id, 10);
  if (isNaN(vendedorId)) notFound();

  const [vendedor, ingresosMensuales, topClientes, topSKUs] = await Promise.all([
    getVendedorDetalle(vendedorId),
    getVendedorIngresosMensuales(vendedorId),
    getVendedorTopClientes(vendedorId),
    getVendedorTopSKUs(vendedorId),
  ]);

  if (!vendedor) notFound();

  return (
    <>
      {/* Sección 1 — Header */}
      <div className="mb-8">
        <Link href="/dashboard/vendedores" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Volver a vendedores
        </Link>

        <h1 className="text-2xl font-semibold text-gray-900">{vendedor.nombre}</h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm text-gray-500">{vendedor.zona}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded text-slate-600 bg-slate-100">
            {BADGE_TIPO[vendedor.tipo] ?? vendedor.tipo}
          </span>
        </div>
      </div>

      {/* Sección 2 — KPI Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${vendedor.clientes_en_riesgo > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
        <KPICard label="Ingresos 12 meses" value={formatMXNCorto(vendedor.ingresos_12m)} />
        <KPICard label="Margen promedio" value={formatPct(vendedor.margen_pct_12m)} />
        <KPICard label="Descuento promedio" value={formatPct(vendedor.descuento_promedio_pct_12m)} />
        <KPICard label="Clientes activos 12m" value={formatUnidades(vendedor.clientes_activos_12m)} />
        {vendedor.clientes_en_riesgo > 0 && (
          <div className="bg-amber-50 rounded-lg border border-amber-200 px-5 py-5">
            <p className="text-sm font-medium text-amber-700 mb-1">Clientes en riesgo</p>
            <p className="text-2xl font-semibold text-amber-700 tracking-tight">{vendedor.clientes_en_riesgo}</p>
          </div>
        )}
      </div>

      {/* Sección 3 — Gráfica */}
      <div className="mt-10">
        <GraficaIngresosMensuales data={ingresosMensuales} />
      </div>

      {/* Sección 4 — Dos tablas lado a lado */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clientes principales */}
        <div>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Clientes principales</h2>
            <p className="text-sm text-gray-500 mt-0.5">Top 10 por ingresos 12 meses</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2 font-medium">Cliente</th>
                    <th className="px-3 py-2 font-medium text-right">Ingresos</th>
                    <th className="px-3 py-2 font-medium text-right">Días s/c</th>
                    <th className="px-4 py-2 font-medium text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topClientes.map((c) => (
                    <tr key={c.cliente_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-900 truncate max-w-[180px]">
                          <ClienteLink clienteId={c.cliente_id} nombre={c.razon_social} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-400">{c.ciudad}</span>
                          <span className="text-[10px] font-medium px-1 py-0.5 rounded text-gray-500 bg-gray-100">
                            {BADGE_TIPO_CLIENTE[c.tipo_cliente] ?? c.tipo_cliente}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-700 whitespace-nowrap">{formatMXNTabla(c.ingresos_12m)}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <span className={c.dias_sin_comprar > 60 ? 'text-red-600 font-medium' : c.dias_sin_comprar > 30 ? 'text-amber-600' : 'text-gray-600'}>
                          {conConteo(c.dias_sin_comprar, 'día', 'días')}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${c.es_riesgo ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
                          {c.es_riesgo ? 'En riesgo' : 'Activo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Productos más vendidos */}
        <div>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Productos más vendidos</h2>
            <p className="text-sm text-gray-500 mt-0.5">Top 10 por ingresos 12 meses</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2 font-medium">Producto</th>
                    <th className="px-3 py-2 font-medium text-right">Ingresos</th>
                    <th className="px-3 py-2 font-medium text-right">Margen</th>
                    <th className="px-4 py-2 font-medium text-right">Clientes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topSKUs.map((s) => (
                    <tr key={s.sku} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-900 truncate max-w-[180px]" title={s.nombre_producto}>
                          <ProductoLink sku={s.sku} nombre={s.nombre_producto} />
                        </div>
                        <div className="text-xs text-gray-400">{s.categoria}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-700 whitespace-nowrap">{formatMXNTabla(s.ingresos_totales)}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <span className={s.margen_pct < 15 ? 'text-red-600' : s.margen_pct < 20 ? 'text-amber-600' : 'text-emerald-600'}>
                          {formatPct(s.margen_pct)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600 whitespace-nowrap">{formatUnidades(s.clientes_distintos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
