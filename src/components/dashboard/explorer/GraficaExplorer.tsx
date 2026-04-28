'use client';

/**
 * GraficaExplorer — Vista de gráfica del Explorer.
 *
 * Checkpoint 4 (Fase 15): los 5 tipos están implementados.
 * - Barras horizontales / verticales: Top N por métrica con comparativo opcional
 * - Líneas / Área: solo dimensión Meses, 12 meses cronológicos con comparativo
 * - Donut: ranking visual de N segmentos con total al centro y leyenda lateral
 *
 * El componente recibe `filas` ya filtradas y ordenadas por la tabla (sort
 * client-side en ExplorerView). Para Líneas/Área en Meses re-ordenamos
 * cronológicamente porque el sort por defecto es ventas_ytd desc.
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
  ETIQUETA_TIPO,
  comparativoAplicaPara,
} from '@/lib/explorer/reglas-grafica';

interface Props {
  filas: FilaExplorer[];
  dimension: DimensionExplorer;
  configuracion: ConfiguracionGrafica;
}

const TOPE_TODOS = 100;
const TOPE_DONUT = 25;

// Paleta de 25 colores derivada de la identidad ámbar-equilibrado del proyecto:
// arranca con slate (primario), pasa por ámbar (brand), después tonos sky,
// emerald y púrpura para diferenciar segmentos cuando hay muchos.
const PALETA_DONUT = [
  '#0f172a', '#1e293b', '#334155', '#475569', '#64748b',
  '#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24',
  '#0c4a6e', '#075985', '#0369a1', '#0284c7', '#38bdf8',
  '#14532d', '#166534', '#15803d', '#16a34a', '#22c55e',
  '#581c87', '#6b21a8', '#7e22ce', '#9333ea', '#374151',
];

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// Re-ordena filas de Meses de ene→dic (la tabla puede llegar en orden de
// sort por valor, pero las gráficas temporales necesitan eje cronológico).
function ordenarCronologicamente(filas: FilaExplorer[]): FilaExplorer[] {
  return [...filas].sort((a, b) => Number(a.dimension_id) - Number(b.dimension_id));
}

// Aplica el cap del Top N solicitado, con tope absoluto distinto según tipo.
function aplicarTopN(
  filas: FilaExplorer[],
  topN: TopNGrafica,
  topeMaximo: number
): { datos: FilaExplorer[]; mostrarAvisoTope: boolean; total: number } {
  const total = filas.length;
  const limite = topN === 'todos' ? topeMaximo : topN;
  const datos = filas.slice(0, limite);
  const mostrarAvisoTope = topN === 'todos' && total > topeMaximo;
  return { datos, mostrarAvisoTope, total };
}

// ─── Componente principal ──────────────────────────────────────────────────

export function GraficaExplorer({ filas, dimension, configuracion }: Props) {
  // Caso 1: Líneas y Área SOLO aplican para Meses (la barra de config
  // ya restringe la combinación, pero defensa en profundidad aquí).
  const esTemporal = configuracion.tipo === 'lineas' || configuracion.tipo === 'area';
  if (esTemporal && dimension !== 'meses') {
    return (
      <PlaceholderGrafica
        mensaje={`El tipo "${ETIQUETA_TIPO[configuracion.tipo]}" requiere dimensión Meses.`}
      />
    );
  }

  // Caso 2: dimensión Meses con tipo no-temporal — los tipos válidos para
  // Meses son lineas/area; el resto no tiene sentido.
  if (dimension === 'meses' && !esTemporal) {
    return (
      <PlaceholderGrafica
        mensaje="La dimensión Meses solo soporta gráficas de Líneas o Área. Cambia el tipo o usa vista Tabla."
      />
    );
  }

  if (filas.length === 0) {
    return (
      <PlaceholderGrafica mensaje="No hay datos para mostrar con los filtros aplicados." />
    );
  }

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

// ─── Barras horizontales ───────────────────────────────────────────────────

function BarrasHorizontales({
  filas,
  configuracion,
}: {
  filas: FilaExplorer[];
  configuracion: ConfiguracionGrafica;
}) {
  const { datos, mostrarAvisoTope, total } = aplicarTopN(filas, configuracion.top_n, TOPE_TODOS);
  const metrica = configuracion.metrica;
  const compAplica =
    configuracion.comparar_lytd && comparativoAplicaPara(configuracion.tipo, metrica);
  const metricaComp = compAplica ? metricaComparativa(metrica) : null;

  const datosChart = datos.map((f) => ({
    nombre: f.dimension_label,
    principal: obtenerValorFila(f, metrica),
    ...(metricaComp ? { comparativa: obtenerValorFila(f, metricaComp) } : {}),
  }));

  const alturaPx = Math.max(600, datos.length * 32 + 100);

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-lg border border-gray-200 p-4" style={{ height: alturaPx }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={datosChart}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => formatearEje(Number(v) || 0, metrica)}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              stroke="#d1d5db"
            />
            <YAxis
              type="category"
              dataKey="nombre"
              width={180}
              tick={{ fontSize: 12, fill: '#374151' }}
              stroke="#d1d5db"
              interval={0}
            />
            <Tooltip
              formatter={(v) => formatearValor(Number(v) || 0, metrica)}
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}
            />
            <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="principal" name={ETIQUETA_METRICA[metrica]} fill="#0f172a" />
            {metricaComp && (
              <Bar dataKey="comparativa" name={ETIQUETA_METRICA[metricaComp]} fill="#cbd5e1" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {mostrarAvisoTope && <AvisoTope mostrados={TOPE_TODOS} total={total} />}
    </div>
  );
}

// ─── Barras verticales ─────────────────────────────────────────────────────

function BarrasVerticales({
  filas,
  configuracion,
}: {
  filas: FilaExplorer[];
  configuracion: ConfiguracionGrafica;
}) {
  const { datos, mostrarAvisoTope, total } = aplicarTopN(filas, configuracion.top_n, TOPE_TODOS);
  const metrica = configuracion.metrica;
  const compAplica =
    configuracion.comparar_lytd && comparativoAplicaPara(configuracion.tipo, metrica);
  const metricaComp = compAplica ? metricaComparativa(metrica) : null;

  const datosChart = datos.map((f) => ({
    nombre: f.dimension_label,
    principal: obtenerValorFila(f, metrica),
    ...(metricaComp ? { comparativa: obtenerValorFila(f, metricaComp) } : {}),
  }));

  // Rotar labels solo si hay nombres largos para evitar overlap.
  const maxLargo = Math.max(0, ...datos.map((f) => f.dimension_label.length));
  const rotar = maxLargo > 10;

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-lg border border-gray-200 p-4" style={{ height: 600 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={datosChart}
            margin={{ top: 20, right: 30, left: 10, bottom: rotar ? 80 : 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="nombre"
              tick={{ fontSize: 12, fill: '#374151' }}
              stroke="#d1d5db"
              interval={0}
              angle={rotar ? -45 : 0}
              textAnchor={rotar ? 'end' : 'middle'}
              height={rotar ? 100 : 30}
            />
            <YAxis
              tickFormatter={(v) => formatearEje(Number(v) || 0, metrica)}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              stroke="#d1d5db"
            />
            <Tooltip
              formatter={(v) => formatearValor(Number(v) || 0, metrica)}
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}
            />
            <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="principal" name={ETIQUETA_METRICA[metrica]} fill="#0f172a" />
            {metricaComp && (
              <Bar dataKey="comparativa" name={ETIQUETA_METRICA[metricaComp]} fill="#cbd5e1" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {mostrarAvisoTope && <AvisoTope mostrados={TOPE_TODOS} total={total} />}
    </div>
  );
}

// ─── Líneas (solo Meses) ───────────────────────────────────────────────────

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
    <div className="bg-white rounded-lg border border-gray-200 p-4" style={{ height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datosChart} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 12, fill: '#374151' }}
            stroke="#d1d5db"
            interval={0}
          />
          <YAxis
            tickFormatter={(v) => formatearEje(Number(v) || 0, metrica)}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            stroke="#d1d5db"
          />
          <Tooltip
            formatter={(v) => formatearValor(Number(v) || 0, metrica)}
            contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="principal"
            name={ETIQUETA_METRICA[metrica]}
            stroke="#0f172a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          {metricaComp && (
            <Line
              type="monotone"
              dataKey="comparativa"
              name={ETIQUETA_METRICA[metricaComp]}
              stroke="#94a3b8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Área (solo Meses) ─────────────────────────────────────────────────────

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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4" style={{ height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datosChart} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="gradientYTD" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientLYTD" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 12, fill: '#374151' }}
            stroke="#d1d5db"
            interval={0}
          />
          <YAxis
            tickFormatter={(v) => formatearEje(Number(v) || 0, metrica)}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            stroke="#d1d5db"
          />
          <Tooltip
            formatter={(v) => formatearValor(Number(v) || 0, metrica)}
            contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
          <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 12 }} />
          {/*
            LYTD primero para que YTD se renderice ENCIMA visualmente —
            el contraste entre el área principal y la comparativa importa.
          */}
          {metricaComp && (
            <Area
              type="monotone"
              dataKey="comparativa"
              name={ETIQUETA_METRICA[metricaComp]}
              stroke="#94a3b8"
              strokeWidth={2}
              fill="url(#gradientLYTD)"
            />
          )}
          <Area
            type="monotone"
            dataKey="principal"
            name={ETIQUETA_METRICA[metrica]}
            stroke="#0f172a"
            strokeWidth={2}
            fill="url(#gradientYTD)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Donut ─────────────────────────────────────────────────────────────────

function Donut({
  filas,
  configuracion,
}: {
  filas: FilaExplorer[];
  configuracion: ConfiguracionGrafica;
}) {
  const { datos, mostrarAvisoTope, total } = aplicarTopN(filas, configuracion.top_n, TOPE_DONUT);
  const metrica = configuracion.metrica;

  const datosChart = datos.map((f) => ({
    nombre: f.dimension_label,
    valor: obtenerValorFila(f, metrica),
  }));

  const totalGraficado = datosChart.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4" style={{ height: 500 }}>
        {/*
          Layout flex: chart a la izquierda (sin <Legend> interno), leyenda
          HTML a la derecha. Esto garantiza que cx="50%" del Pie coincide
          con el centro del overlay HTML que muestra el total — Recharts
          ajusta el área de plot cuando hay <Legend> interno y rompe la
          alineación de cualquier overlay calculado con porcentajes.
        */}
        <div className="relative flex-1 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Pie
                data={datosChart}
                dataKey="valor"
                nameKey="nombre"
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
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
                contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            className="absolute pointer-events-none flex flex-col items-center justify-center"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="text-2xl font-bold text-slate-900 leading-tight">
              {formatearEje(totalGraficado, metrica)}
            </div>
            <div className="text-xs text-gray-500 mt-1">{ETIQUETA_METRICA[metrica]}</div>
          </div>
        </div>

        <div className="overflow-y-auto py-2 text-xs" style={{ width: 220 }}>
          <ul className="space-y-1.5">
            {datosChart.map((d, idx) => (
              <li key={d.nombre + idx} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
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
      {mostrarAvisoTope && (
        <p className="text-xs text-gray-500 text-center">
          Mostrando {TOPE_DONUT} de {total} segmentos. Reduce filtros o usa Top N para ver menos.
        </p>
      )}
    </div>
  );
}

// ─── Subcomponentes auxiliares ─────────────────────────────────────────────

function PlaceholderGrafica({ mensaje }: { mensaje: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center min-h-[400px] px-6">
      <p className="text-sm text-gray-500 text-center max-w-md">{mensaje}</p>
    </div>
  );
}

function AvisoTope({ mostrados, total }: { mostrados: number; total: number }) {
  return (
    <p className="text-xs text-gray-500 text-center">
      Mostrando {mostrados} de {total} filas. Reduce filtros o usa Top N para ver menos.
    </p>
  );
}
