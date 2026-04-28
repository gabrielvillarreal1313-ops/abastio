'use client';

/**
 * GraficaCompacta — Versión reducida de GraficaExplorer para el Resumen
 * Ejecutivo (reportes anclados con vista gráfica).
 *
 * Diferencias respecto a GraficaExplorer:
 * - Altura fija 280px (vs 500-600+ dinámica)
 * - Sin barra de configuración encima (la config viene del reporte guardado)
 * - Sin texto "Mostrando N de M filas" cuando Top N es 'todos' (cap silencioso)
 * - Tipografía y márgenes reducidos
 * - Donut: innerRadius 50 / outerRadius 90 (vs 80/140), texto central más chico
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { FilaExplorer, DimensionExplorer } from '@/lib/queries/explorer';
import type {
  ConfiguracionGrafica,
  MetricaGrafica,
  TopNGrafica,
} from '@/lib/queries/reportes-guardados';
import {
  formatMXN,
  formatMXNEje,
  formatPct,
  formatPctEje,
} from '@/lib/textos/formato';
import {
  ETIQUETA_METRICA,
  comparativoAplicaPara,
  sanearConfiguracionGrafica,
} from '@/lib/explorer/reglas-grafica';

interface Props {
  filas: FilaExplorer[];
  dimension: DimensionExplorer;
  configuracion: ConfiguracionGrafica;
}

const ALTURA_PX = 280;
const TOPE_TODOS = 100;
const TOPE_DONUT = 25;

// Misma paleta que GraficaExplorer — mantenemos colores consistentes entre
// el Resumen Ejecutivo y la vista expandida del Explorer.
const PALETA_DONUT = [
  '#0f172a', '#1e293b', '#334155', '#475569', '#64748b',
  '#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24',
  '#0c4a6e', '#075985', '#0369a1', '#0284c7', '#38bdf8',
  '#14532d', '#166534', '#15803d', '#16a34a', '#22c55e',
  '#581c87', '#6b21a8', '#7e22ce', '#9333ea', '#374151',
];

// ─── Helpers (idénticos a GraficaExplorer; podrían extraerse a utils en V1) ─

function obtenerValorFila(fila: FilaExplorer, metrica: MetricaGrafica): number {
  switch (metrica) {
    case 'ventas_ytd': return fila.ventas_ytd;
    case 'ventas_lytd': return fila.ventas_lytd;
    case 'delta_ventas_abs': return fila.ventas_delta;
    case 'delta_ventas_pct': return fila.ventas_delta_pct ?? 0;
    case 'gm_ytd': return fila.gm_ytd;
    case 'gm_lytd': return fila.gm_lytd;
    case 'delta_gm_abs': return fila.gm_delta;
    case 'delta_gm_pct': return fila.gm_delta_pct ?? 0;
  }
}

function esMetricaPorcentaje(m: MetricaGrafica): boolean {
  return m === 'delta_ventas_pct' || m === 'delta_gm_pct';
}

function formatearValor(valor: number, metrica: MetricaGrafica): string {
  return esMetricaPorcentaje(metrica) ? formatPct(valor) : formatMXN(valor);
}

function formatearEje(valor: number, metrica: MetricaGrafica): string {
  return esMetricaPorcentaje(metrica) ? formatPctEje(valor) : formatMXNEje(valor);
}

function metricaComparativa(metrica: MetricaGrafica): MetricaGrafica | null {
  if (metrica === 'ventas_ytd') return 'ventas_lytd';
  if (metrica === 'gm_ytd') return 'gm_lytd';
  return null;
}

function ordenarCronologicamente(filas: FilaExplorer[]): FilaExplorer[] {
  return [...filas].sort((a, b) => Number(a.dimension_id) - Number(b.dimension_id));
}

function aplicarTopN(filas: FilaExplorer[], topN: TopNGrafica, topeMaximo: number) {
  const limite = topN === 'todos' ? topeMaximo : topN;
  return filas.slice(0, limite);
}

// ─── Componente principal ──────────────────────────────────────────────────

export function GraficaCompacta({ filas, dimension, configuracion: configRaw }: Props) {
  // Defensa en profundidad: si el JSONB del reporte anclado tiene una
  // combinación inválida (ej. editado a mano en la DB), saneamos antes de
  // pasarla a los renderers. Comparamos por referencia para detectar si
  // hubo cambios y registrar advertencia en consola.
  const configuracion = sanearConfiguracionGrafica(configRaw, dimension);
  if (configuracion !== configRaw) {
    // eslint-disable-next-line no-console
    console.warn(
      '[ReportesAnclados] Configuración de gráfica saneada en preview:',
      { original: configRaw, saneada: configuracion }
    );
  }
  const esTemporal = configuracion.tipo === 'lineas' || configuracion.tipo === 'area';

  // Combinaciones inválidas — degradación silenciosa para no romper el Resumen.
  if (esTemporal && dimension !== 'meses') return <Vacio mensaje="Configuración no compatible." />;
  if (dimension === 'meses' && !esTemporal) return <Vacio mensaje="Configuración no compatible." />;
  if (filas.length === 0) return <Vacio mensaje="Sin datos." />;

  switch (configuracion.tipo) {
    case 'barras_horizontales':
      return <BarrasHorizontales filas={filas} configuracion={configuracion} />;
    case 'barras_verticales':
      return <BarrasVerticales filas={filas} configuracion={configuracion} />;
    case 'lineas':
      return <Lineas filas={filas} configuracion={configuracion} />;
    case 'area':
      return <AreaTipo filas={filas} configuracion={configuracion} />;
    case 'donut':
      return <Donut filas={filas} configuracion={configuracion} />;
  }
}

function Vacio({ mensaje }: { mensaje: string }) {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 flex items-center justify-center"
      style={{ height: ALTURA_PX }}
    >
      <p className="text-sm text-gray-500">{mensaje}</p>
    </div>
  );
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

function BarrasHorizontales({
  filas,
  configuracion,
}: {
  filas: FilaExplorer[];
  configuracion: ConfiguracionGrafica;
}) {
  const datos = aplicarTopN(filas, configuracion.top_n, TOPE_TODOS);
  const metrica = configuracion.metrica;
  const compAplica =
    configuracion.comparar_lytd && comparativoAplicaPara(configuracion.tipo, metrica);
  const metricaComp = compAplica ? metricaComparativa(metrica) : null;

  const datosChart = datos.map((f) => ({
    nombre: f.dimension_label,
    principal: obtenerValorFila(f, metrica),
    ...(metricaComp ? { comparativa: obtenerValorFila(f, metricaComp) } : {}),
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3" style={{ height: ALTURA_PX }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={datosChart}
          margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => formatearEje(Number(v) || 0, metrica)}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            stroke="#d1d5db"
          />
          <YAxis
            type="category"
            dataKey="nombre"
            width={160}
            tick={<TickConTooltip />}
            stroke="#d1d5db"
            interval={0}
          />
          <Tooltip
            formatter={(v) => formatearValor(Number(v) || 0, metrica)}
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
          <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="principal" name={ETIQUETA_METRICA[metrica]} fill="#0f172a" />
          {metricaComp && (
            <Bar dataKey="comparativa" name={ETIQUETA_METRICA[metricaComp]} fill="#cbd5e1" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarrasVerticales({
  filas,
  configuracion,
}: {
  filas: FilaExplorer[];
  configuracion: ConfiguracionGrafica;
}) {
  const datos = aplicarTopN(filas, configuracion.top_n, TOPE_TODOS);
  const metrica = configuracion.metrica;
  const compAplica =
    configuracion.comparar_lytd && comparativoAplicaPara(configuracion.tipo, metrica);
  const metricaComp = compAplica ? metricaComparativa(metrica) : null;

  const datosChart = datos.map((f) => ({
    nombre: f.dimension_label,
    principal: obtenerValorFila(f, metrica),
    ...(metricaComp ? { comparativa: obtenerValorFila(f, metricaComp) } : {}),
  }));

  const maxLargo = Math.max(0, ...datos.map((f) => f.dimension_label.length));
  const rotar = maxLargo > 8;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3" style={{ height: ALTURA_PX }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datosChart}
          margin={{ top: 10, right: 15, left: 5, bottom: rotar ? 50 : 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="nombre"
            tick={{ fontSize: 10, fill: '#374151' }}
            stroke="#d1d5db"
            interval={0}
            angle={rotar ? -45 : 0}
            textAnchor={rotar ? 'end' : 'middle'}
            height={rotar ? 70 : 24}
          />
          <YAxis
            tickFormatter={(v) => formatearEje(Number(v) || 0, metrica)}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            stroke="#d1d5db"
          />
          <Tooltip
            formatter={(v) => formatearValor(Number(v) || 0, metrica)}
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
          <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="principal" name={ETIQUETA_METRICA[metrica]} fill="#0f172a" />
          {metricaComp && (
            <Bar dataKey="comparativa" name={ETIQUETA_METRICA[metricaComp]} fill="#cbd5e1" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Lineas({
  filas,
  configuracion,
}: {
  filas: FilaExplorer[];
  configuracion: ConfiguracionGrafica;
}) {
  const datos = ordenarCronologicamente(filas);
  const metrica = configuracion.metrica;
  const compAplica =
    configuracion.comparar_lytd && comparativoAplicaPara(configuracion.tipo, metrica);
  const metricaComp = compAplica ? metricaComparativa(metrica) : null;

  const datosChart = datos.map((f) => ({
    mes: f.dimension_label,
    principal: obtenerValorFila(f, metrica),
    ...(metricaComp ? { comparativa: obtenerValorFila(f, metricaComp) } : {}),
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3" style={{ height: ALTURA_PX }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datosChart} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#374151' }} stroke="#d1d5db" />
          <YAxis
            tickFormatter={(v) => formatearEje(Number(v) || 0, metrica)}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            stroke="#d1d5db"
          />
          <Tooltip
            formatter={(v) => formatearValor(Number(v) || 0, metrica)}
            contentStyle={{ fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
          <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="principal"
            name={ETIQUETA_METRICA[metrica]}
            stroke="#0f172a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
          {metricaComp && (
            <Line
              type="monotone"
              dataKey="comparativa"
              name={ETIQUETA_METRICA[metricaComp]}
              stroke="#94a3b8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AreaTipo({
  filas,
  configuracion,
}: {
  filas: FilaExplorer[];
  configuracion: ConfiguracionGrafica;
}) {
  const datos = ordenarCronologicamente(filas);
  const metrica = configuracion.metrica;
  const compAplica =
    configuracion.comparar_lytd && comparativoAplicaPara(configuracion.tipo, metrica);
  const metricaComp = compAplica ? metricaComparativa(metrica) : null;

  const datosChart = datos.map((f) => ({
    mes: f.dimension_label,
    principal: obtenerValorFila(f, metrica),
    ...(metricaComp ? { comparativa: obtenerValorFila(f, metricaComp) } : {}),
  }));

  // Suffix único para los gradientes — múltiples GraficaCompacta en la misma
  // página con AreaChart compartirían IDs y se sobrescribirían los stops.
  const gradId = `${metrica}-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3" style={{ height: ALTURA_PX }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datosChart} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id={`gradYTD-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`gradLYTD-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#374151' }} stroke="#d1d5db" />
          <YAxis
            tickFormatter={(v) => formatearEje(Number(v) || 0, metrica)}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            stroke="#d1d5db"
          />
          <Tooltip
            formatter={(v) => formatearValor(Number(v) || 0, metrica)}
            contentStyle={{ fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
          <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 11 }} />
          {metricaComp && (
            <Area
              type="monotone"
              dataKey="comparativa"
              name={ETIQUETA_METRICA[metricaComp]}
              stroke="#94a3b8"
              strokeWidth={2}
              fill={`url(#gradLYTD-${gradId})`}
            />
          )}
          <Area
            type="monotone"
            dataKey="principal"
            name={ETIQUETA_METRICA[metrica]}
            stroke="#0f172a"
            strokeWidth={2}
            fill={`url(#gradYTD-${gradId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Donut({
  filas,
  configuracion,
}: {
  filas: FilaExplorer[];
  configuracion: ConfiguracionGrafica;
}) {
  const datos = aplicarTopN(filas, configuracion.top_n, TOPE_DONUT);
  const metrica = configuracion.metrica;

  const datosChart = datos.map((f) => ({
    nombre: f.dimension_label,
    valor: obtenerValorFila(f, metrica),
  }));

  const totalGraficado = datosChart.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 flex gap-3" style={{ height: ALTURA_PX }}>
      <div className="relative flex-1 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <Pie
              data={datosChart}
              dataKey="valor"
              nameKey="nombre"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={1}
              isAnimationActive={false}
            >
              {datosChart.map((_, idx) => (
                <Cell key={idx} fill={PALETA_DONUT[idx % PALETA_DONUT.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: unknown, name) => {
                const num = Number(v) || 0;
                const pct = totalGraficado > 0 ? (num / totalGraficado) * 100 : 0;
                return [
                  `${formatearValor(num, metrica)} (${pct.toFixed(1)}%)`,
                  name as string,
                ];
              }}
              contentStyle={{ fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div
          className="absolute pointer-events-none flex flex-col items-center justify-center"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <div className="text-xl font-bold text-slate-900 leading-tight">
            {formatearEje(totalGraficado, metrica)}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">{ETIQUETA_METRICA[metrica]}</div>
        </div>
      </div>

      <div className="overflow-y-auto py-1 text-[11px]" style={{ width: 160 }}>
        <ul className="space-y-1">
          {datosChart.map((d, idx) => (
            <li key={d.nombre + idx} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: PALETA_DONUT[idx % PALETA_DONUT.length] }}
              />
              <span className="text-gray-700 truncate" title={d.nombre}>
                {d.nombre}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Tick custom para YAxis con tooltip nativo cuando hay truncado ─────────

const MAX_LABEL_CHARS = 18;

/**
 * Tick component custom para Recharts que trunca a 18 chars con "…" y agrega
 * un `<title>` SVG con el nombre completo cuando hay truncado. El `<title>`
 * dispara el tooltip nativo del navegador en hover, cross-browser.
 *
 * Recharts pasa props `x`, `y`, `payload` al componente cuando se usa como
 * `tick={<Custom />}`. La firma debe coincidir con la que Recharts espera.
 */
function TickConTooltip(props: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  const valor = props.payload?.value ?? '';
  const truncado = valor.length > MAX_LABEL_CHARS;
  const display = truncado ? valor.slice(0, MAX_LABEL_CHARS - 1) + '…' : valor;
  return (
    <text
      x={props.x}
      y={props.y}
      dy={4}
      textAnchor="end"
      fill="#374151"
      fontSize={10}
    >
      {truncado && <title>{valor}</title>}
      {display}
    </text>
  );
}
