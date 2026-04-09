'use client';

/**
 * GraficaIngresosMensuales — Combo chart: barras de ingresos + línea de margen.
 *
 * Últimos 12 meses completos + mes parcial actual.
 * El mes parcial se muestra con opacidad reducida para diferenciarlo.
 */

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import type { IngresoMensual } from '@/lib/queries/types';
import { formatMXNEje, formatMXN, formatPctEje, formatPct } from '@/lib/textos/formato';

interface Props {
  data: IngresoMensual[];
}

/** Tooltip personalizado */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const punto = payload[0]?.payload as IngresoMensual | undefined;
  if (!punto) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-gray-900 mb-1.5">
        {label}
        {punto.parcial && <span className="text-amber-600 ml-1">(parcial)</span>}
      </p>
      <div className="space-y-1">
        <p className="text-gray-600">
          Ingresos: <span className="font-medium text-gray-900">{formatMXN(punto.ingresos)}</span>
        </p>
        <p className="text-gray-600">
          Costos: <span className="font-medium text-gray-900">{formatMXN(punto.costos)}</span>
        </p>
        <p className="text-gray-600">
          Margen: <span className="font-medium text-emerald-700">{formatPct(punto.margen)}</span>
        </p>
      </div>
    </div>
  );
}

const COLOR_BARRA = '#1e3a5f';
const COLOR_BARRA_PARCIAL = '#94a3b8';
const COLOR_LINEA_MARGEN = '#059669';

export function GraficaIngresosMensuales({ data }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-6 py-6">
      {/* Títulos */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-900">
          Ingresos y margen bruto mensual
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Últimos 12 meses</p>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-5 mb-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_BARRA }} />
          <span>Ingresos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_BARRA_PARCIAL }} />
          <span>Mes parcial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLOR_LINEA_MARGEN }} />
          <span>Margen bruto %</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

          <XAxis
            dataKey="mes"
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />

          <YAxis
            yAxisId="ingresos"
            tickFormatter={formatMXNEje}
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            width={50}
          />

          <YAxis
            yAxisId="margen"
            orientation="right"
            tickFormatter={formatPctEje}
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            width={45}
            domain={[0, 50]}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />

          <Bar
            yAxisId="ingresos"
            dataKey="ingresos"
            radius={[3, 3, 0, 0]}
            maxBarSize={40}
          >
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.parcial ? COLOR_BARRA_PARCIAL : COLOR_BARRA}
                opacity={entry.parcial ? 0.7 : 1}
              />
            ))}
          </Bar>

          <Line
            yAxisId="margen"
            dataKey="margen"
            type="monotone"
            stroke={COLOR_LINEA_MARGEN}
            strokeWidth={2}
            dot={{ r: 3, fill: COLOR_LINEA_MARGEN, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: COLOR_LINEA_MARGEN, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
