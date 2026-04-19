'use client';

/**
 * MiDesempenoRep — KPIs personales del rep + gráfica + top clientes/SKUs.
 * Fase 10: vista de métricas individuales del vendedor.
 */

import type { KpisRepMes } from '@/lib/queries/kpis-rep-mes';
import type { IngresoMensual } from '@/lib/queries/types';
import type { VendedorTopCliente, VendedorTopSKU } from '@/lib/queries/vendedor-detalle';
import type { ResumenOportunidadesRep } from '@/lib/queries/resumen-oportunidades-rep';
import { GraficaIngresosMensuales } from '@/components/dashboard/GraficaIngresosMensuales';
import { ClienteLink } from '@/components/ui/ClienteLink';
import { ProductoLink } from '@/components/ui/ProductoLink';
import {
  formatMXNCorto,
  formatMXN,
  formatPct,
  formatUnidades,
  formatearMesAnio,
  formatMXNTabla,
} from '@/lib/textos/formato';

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  kpis: KpisRepMes | null;
  ingresosMensuales: IngresoMensual[];
  topClientes: VendedorTopCliente[];
  topSkus: VendedorTopSKU[];
  resumenOportunidades: ResumenOportunidadesRep;
  nombreUsuario: string;
}

// ─── Componente principal ───────────────────────────────────────────────────

export function MiDesempenoRep({ kpis, ingresosMensuales, topClientes, topSkus, resumenOportunidades }: Props) {
  const mesFormateado = kpis ? formatearMesAnio(kpis.mes_actual) : '';

  return (
    <div className="space-y-6">
      {/* ─── Header ───────────────────────────────────────────────── */}
      {mesFormateado && (
        <p className="text-sm text-gray-700">
          Resumen de <span className="font-medium">{mesFormateado}</span>
        </p>
      )}

      {/* ─── KPI cards ────────────────────────────────────────────── */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Ingresos del mes"
            valor={formatMXNCorto(kpis.ingresos_mes)}
            cambio={kpis.ingresos_mes_anterior > 0
              ? ((kpis.ingresos_mes - kpis.ingresos_mes_anterior) / kpis.ingresos_mes_anterior) * 100
              : undefined}
            subtexto={kpis.ingresos_mes_anterior > 0
              ? `vs ${formatMXNCorto(kpis.ingresos_mes_anterior)} mes anterior`
              : 'Sin datos del mes anterior'}
          />
          <KPICard label="Margen bruto" valor={formatPct(kpis.margen_pct_mes)} subtexto="Margen del mes actual" />
          <KPICard
            label="Cotizaciones"
            valor={formatUnidades(kpis.cotizaciones_mes)}
            cambio={kpis.cotizaciones_mes_anterior > 0
              ? ((kpis.cotizaciones_mes - kpis.cotizaciones_mes_anterior) / kpis.cotizaciones_mes_anterior) * 100
              : undefined}
            subtexto={kpis.cotizaciones_mes_anterior > 0
              ? `vs ${kpis.cotizaciones_mes_anterior} mes anterior`
              : 'Sin datos del mes anterior'}
          />
          <KPICard label="Ticket promedio" valor={formatMXN(kpis.ticket_promedio_mes)} subtexto="Por transacción" />
          <KPICard label="Clientes activos" valor={formatUnidades(kpis.clientes_activos_mes)} subtexto="Con al menos 1 compra este mes" />
          <KPICard label="Transacciones" valor={formatUnidades(kpis.transacciones_mes)} subtexto="Ventas cerradas este mes" />
          <KPICard label="Oportunidades pendientes" valor={formatUnidades(resumenOportunidades.pendientes)} subtexto="Por trabajar" />
          <KPICard label="Trabajadas hoy" valor={formatUnidades(resumenOportunidades.trabajadas_hoy)} subtexto="Oportunidades atendidas" />
        </div>
      )}

      {/* ─── Gráfica de ingresos mensuales ─────────────────────────── */}
      {ingresosMensuales.length > 0 ? (
        <GraficaIngresosMensuales data={ingresosMensuales} />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 px-6 py-16 text-center">
          <p className="text-sm text-gray-500">Tu historial aparecerá aquí conforme se registren ventas</p>
        </div>
      )}

      {/* ─── Top clientes y top SKUs lado a lado ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clientes */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Top clientes</h3>
          </div>
          {topClientes.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-sm text-gray-500">Sin clientes registrados.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium text-right">Ingresos 12m</th>
                  <th className="px-4 py-2 font-medium text-right">Días sin comprar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topClientes.slice(0, 10).map((c) => (
                  <tr key={c.cliente_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <ClienteLink clienteId={c.cliente_id} nombre={c.razon_social} />
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">{formatMXNTabla(c.ingresos_12m)}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{c.dias_sin_comprar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top productos vendidos */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Top productos vendidos</h3>
          </div>
          {topSkus.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-sm text-gray-500">Sin productos registrados.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2 font-medium">Producto</th>
                  <th className="px-4 py-2 font-medium text-right">Ingresos 12m</th>
                  <th className="px-4 py-2 font-medium text-right">Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topSkus.slice(0, 10).map((s) => (
                  <tr key={s.sku} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <ProductoLink sku={s.sku} nombre={s.nombre_producto} />
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">{formatMXNTabla(s.ingresos_totales)}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{formatPct(s.margen_pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card local ─────────────────────────────────────────────────────────

function KPICard({ label, valor, subtexto, cambio }: { label: string; valor: string; subtexto?: string; cambio?: number }) {
  const isPositive = cambio !== undefined && cambio >= 0;
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight">{valor}</p>
      <div className="flex items-center gap-1.5 mt-1">
        {cambio !== undefined && (
          <span className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
            {isPositive ? '+' : ''}{cambio.toFixed(1)}%
          </span>
        )}
        {subtexto && <span className="text-xs text-gray-500">{subtexto}</span>}
      </div>
    </div>
  );
}
