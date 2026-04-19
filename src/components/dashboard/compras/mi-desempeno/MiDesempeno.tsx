'use client';

/**
 * MiDesempeno — KPIs personales del comprador + gráfica de actividad mensual.
 * Fase 5-2: vista de métricas individuales.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { KpisCompradorPersonal } from '@/lib/queries/kpis-comprador-personal';
import type { ActividadMensualComprador } from '@/lib/queries/actividad-mensual-comprador';
import { formatMXNCorto, formatearMesAnio, formatMXN, formatearDuracionHoras } from '@/lib/textos/formato';

// ─── Abreviatura de mes en español ──────────────────────────────────────────

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

function mesCorto(fecha: string): string {
  const partes = fecha.slice(0, 10).split('-');
  if (partes.length < 2) return '';
  const idx = parseInt(partes[1], 10) - 1;
  return MESES_CORTOS[idx] ?? '';
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  kpis: KpisCompradorPersonal | null;
  actividadMensual: ActividadMensualComprador[];
}

// ─── Componente principal ───────────────────────────────────────────────────

export function MiDesempeno({ kpis, actividadMensual }: Props) {
  const mesFormateado = kpis ? formatearMesAnio(kpis.mes_actual) : '';
  const tieneActividad = actividadMensual.some(
    (m) => m.aprobaciones > 0 || m.descartes > 0 || m.overrides > 0
  );

  // Datos para la gráfica con label de mes corto
  const datosGrafica = actividadMensual.map((m) => ({
    ...m,
    mesLabel: mesCorto(m.mes),
  }));

  return (
    <div className="space-y-6">
      {/* ─── Header con contexto ──────────────────────────────────── */}
      {mesFormateado && (
        <p className="text-sm text-gray-700">
          Resumen de <span className="font-medium">{mesFormateado}</span>
        </p>
      )}

      {/* ─── KPI cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICardPersonal
          label="POs aprobadas"
          valor={kpis?.pos_aprobadas_mes ?? 0}
          valorFormateado={String(kpis?.pos_aprobadas_mes ?? 0)}
          valorAnterior={kpis?.pos_aprobadas_mes_anterior ?? 0}
        />
        <KPICardPersonal
          label="Valor aprobado"
          valor={kpis?.valor_aprobado_mes ?? 0}
          valorFormateado={formatMXNCorto(kpis?.valor_aprobado_mes ?? 0)}
          valorAnterior={kpis?.valor_aprobado_mes_anterior ?? 0}
          formatearAnterior={(v) => formatMXNCorto(v)}
        />
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Tiempo promedio de revisión</p>
          <p className="text-2xl font-semibold text-gray-900 tracking-tight">
            {formatearDuracionHoras(kpis?.tiempo_promedio_revision_horas ?? null)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">De toma a decisión</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Ajustes de inventario</p>
          <p className="text-2xl font-semibold text-gray-900 tracking-tight">
            {kpis?.overrides_mes ?? 0}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Modificaciones de mín/máx este mes</p>
        </div>
      </div>

      {/* ─── Gráfica de actividad mensual ─────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 px-6 py-6">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900">
            Actividad de los últimos 12 meses
          </h2>
        </div>

        {tieneActividad ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={datosGrafica} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="mesLabel"
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                width={35}
                allowDecimals={false}
              />
              <Tooltip content={<TooltipActividad />} cursor={{ fill: '#f8fafc' }} />
              <Legend
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontSize: 12, color: '#64748b' }}
              />
              <Bar
                dataKey="aprobaciones"
                name="Aprobaciones"
                stackId="a"
                fill="#334155"
                radius={[0, 0, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="descartes"
                name="Descartes"
                stackId="a"
                fill="#d1d5db"
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-500 text-center">
              Tu actividad aparecerá aquí conforme trabajes órdenes de compra
            </p>
          </div>
        )}
      </div>

      {/* ─── Resumen de descartes (condicional) ───────────────────── */}
      {(kpis?.pos_descartadas_mes ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-5 py-3">
          <p className="text-sm text-amber-800">
            Descartaste {kpis!.pos_descartadas_mes} {kpis!.pos_descartadas_mes === 1 ? 'orden de compra' : 'órdenes de compra'} este mes.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── KPI Card con comparación ───────────────────────────────────────────────

function KPICardPersonal({
  label,
  valor,
  valorFormateado,
  valorAnterior,
  formatearAnterior,
}: {
  label: string;
  valor: number;
  valorFormateado: string;
  valorAnterior: number;
  formatearAnterior?: (v: number) => string;
}) {
  let subtexto = 'Sin datos del mes anterior';
  let changePct: number | undefined;

  if (valorAnterior > 0) {
    changePct = ((valor - valorAnterior) / valorAnterior) * 100;
    const anteriorStr = formatearAnterior ? formatearAnterior(valorAnterior) : String(valorAnterior);
    subtexto = `vs ${anteriorStr} mes anterior`;
  }

  const isPositive = changePct !== undefined && changePct >= 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 px-5 py-5">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight">{valorFormateado}</p>
      <div className="flex items-center gap-1.5 mt-2">
        {changePct !== undefined && (
          <span
            className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
              isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
            }`}
          >
            {isPositive ? '+' : ''}{changePct.toFixed(1)}%
          </span>
        )}
        <span className="text-xs text-gray-500">{subtexto}</span>
      </div>
    </div>
  );
}

// ─── Tooltip personalizado para la gráfica ──────────────────────────────────

interface TooltipPayload {
  aprobaciones: number;
  descartes: number;
  overrides: number;
  valor_aprobado: number;
  mesLabel: string;
}

function TooltipActividad({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TooltipPayload }>;
}) {
  if (!active || !payload?.length) return null;

  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-gray-900 mb-1.5">{d.mesLabel}</p>
      <div className="space-y-1">
        <p className="text-gray-600">Aprobaciones: <span className="font-medium text-gray-900">{d.aprobaciones}</span></p>
        <p className="text-gray-600">Descartes: <span className="font-medium text-gray-900">{d.descartes}</span></p>
        <p className="text-gray-600">Overrides: <span className="font-medium text-gray-900">{d.overrides}</span></p>
        <p className="text-gray-600">Valor: <span className="font-medium text-gray-900">{formatMXN(d.valor_aprobado)}</span></p>
      </div>
    </div>
  );
}
