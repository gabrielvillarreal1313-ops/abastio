import { getKPIsResumen } from '@/lib/queries/kpis';
import { getIngresosMensuales } from '@/lib/queries/ingresos-mensuales';
import { getTopSKUs } from '@/lib/queries/top-skus';
import { getDeadstock } from '@/lib/queries/deadstock';
import { getClientesEnRiesgo } from '@/lib/queries/clientes-en-riesgo';
import { getRendimientoVendedores } from '@/lib/queries/rendimiento-vendedores';
import { getAlertasMargen } from '@/lib/queries/alertas-margen';
import { KPICard } from '@/components/dashboard/KPICard';
import { GraficaIngresosMensuales } from '@/components/dashboard/GraficaIngresosMensuales';
import { TopSKUs } from '@/components/dashboard/TopSKUs';
import { Deadstock } from '@/components/dashboard/Deadstock';
import { ClientesEnRiesgo } from '@/components/dashboard/ClientesEnRiesgo';
import { RendimientoVendedores } from '@/components/dashboard/RendimientoVendedores';
import { AlertasMargen } from '@/components/dashboard/AlertasMargen';
import { formatMXN, formatMXNCorto, formatPct, formatUnidades } from '@/lib/textos/formato';
import { textoDiasParcial } from '@/lib/textos/callouts';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [kpis, ingresosMensuales, topSKUs, deadstock, clientesEnRiesgo, rendimientoVendedores, alertasMargen] = await Promise.all([
    getKPIsResumen(),
    getIngresosMensuales(),
    getTopSKUs(),
    getDeadstock(),
    getClientesEnRiesgo(),
    getRendimientoVendedores(),
    getAlertasMargen(),
  ]);

  const parcialTag = kpis.mesParcial
    ? textoDiasParcial(kpis.diasConDatos, kpis.diasDelMes)
    : undefined;

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Resumen Ejecutivo</h1>
        <p className="text-sm text-gray-500 mt-1">
          Datos de {kpis.etiquetaMesActual}
          {kpis.mesParcial && (
            <span className="ml-1 text-amber-600 font-medium">(mes parcial)</span>
          )}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          label={kpis.mesParcial ? 'Ingresos del mes (parcial)' : 'Ingresos del mes'}
          value={formatMXNCorto(kpis.ingresosMesActual)}
          subtitle={parcialTag}
          changePct={kpis.cambioIngresosPct}
          changeLabel={kpis.etiquetaComparacion}
        />
        <KPICard
          label="Margen bruto"
          value={formatPct(kpis.margenBrutoPct)}
        />
        <KPICard
          label={kpis.mesParcial ? 'Transacciones (parcial)' : 'Transacciones'}
          value={formatUnidades(kpis.transaccionesUnicas)}
          subtitle={parcialTag}
        />
        <KPICard
          label="Ticket promedio"
          value={formatMXN(kpis.ticketPromedio)}
          subtitle={parcialTag}
        />
        <KPICard
          label={kpis.mesParcial ? 'Clientes activos (parcial)' : 'Clientes activos'}
          value={formatUnidades(kpis.clientesActivos)}
          subtitle={parcialTag}
        />
      </div>

      {/* Gráfica de ingresos mensuales */}
      <div className="mt-10">
        <GraficaIngresosMensuales data={ingresosMensuales} />
      </div>

      {/* Alertas de margen por categoria */}
      <div className="mt-10">
        <AlertasMargen data={alertasMargen} />
      </div>

      {/* Top 10 SKUs */}
      <div className="mt-10">
        <TopSKUs data={topSKUs} />
      </div>

      {/* Deadstock */}
      <div className="mt-10">
        <Deadstock data={deadstock} />
      </div>

      {/* Clientes en riesgo */}
      <div className="mt-10">
        <ClientesEnRiesgo data={clientesEnRiesgo} />
      </div>

      {/* Rendimiento por vendedor */}
      <div className="mt-10">
        <RendimientoVendedores data={rendimientoVendedores} />
      </div>
    </>
  );
}
