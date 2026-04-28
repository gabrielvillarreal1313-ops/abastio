'use client';

/**
 * BarraConfigGrafica — 4 selectores para configurar la gráfica del Explorer
 * (Fase 15, Checkpoint 3).
 *
 * Tipo, métrica, top N y comparativo. Las opciones inválidas se muestran
 * deshabilitadas con tooltip explicativo. Cualquier cambio dispara
 * `reconciliarConfiguracion()` antes de propagar para que la combinación
 * resultante siempre sea válida.
 */

import type {
  ConfiguracionGrafica,
  MetricaGrafica,
  TipoGrafica,
  TopNGrafica,
} from '@/lib/queries/reportes-guardados';
import type { DimensionExplorer } from '@/lib/queries/explorer';
import {
  ETIQUETA_METRICA,
  ETIQUETA_TIPO,
  comparativoAplicaPara,
  metricasValidasParaTipo,
  motivoDeshabilitado,
  reconciliarConfiguracion,
  tiposValidosParaDimension,
  topNAplicaPara,
} from '@/lib/explorer/reglas-grafica';

interface Props {
  dimension: DimensionExplorer;
  configuracion: ConfiguracionGrafica;
  onChange: (nueva: ConfiguracionGrafica) => void;
}

const TIPOS_ORDEN: TipoGrafica[] = [
  'barras_horizontales',
  'barras_verticales',
  'lineas',
  'area',
  'donut',
];

const METRICAS_ORDEN: MetricaGrafica[] = [
  'ventas_ytd',
  'ventas_lytd',
  'delta_ventas_abs',
  'delta_ventas_pct',
  'gm_ytd',
  'gm_lytd',
  'delta_gm_abs',
  'delta_gm_pct',
];

const TOP_N_OPCIONES: { valor: TopNGrafica; label: string }[] = [
  { valor: 5, label: 'Top 5' },
  { valor: 10, label: 'Top 10' },
  { valor: 15, label: 'Top 15' },
  { valor: 25, label: 'Top 25' },
  { valor: 50, label: 'Top 50' },
  { valor: 'todos', label: 'Todos' },
];

const SELECT_BASE_CLASS =
  'px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400';

export function BarraConfigGrafica({ dimension, configuracion, onChange }: Props) {
  const tiposOk = tiposValidosParaDimension(dimension);
  const metricasOk = metricasValidasParaTipo(configuracion.tipo);
  const compAplica = comparativoAplicaPara(configuracion.tipo, configuracion.metrica);

  function emitir(parcial: Partial<ConfiguracionGrafica>) {
    // Reconciliamos contra la dimensión actual para que cualquier cambio que
    // invalide otros campos (ej. cambiar a Donut con métrica delta) se ajuste
    // automáticamente antes de propagar.
    const tentativa: ConfiguracionGrafica = { ...configuracion, ...parcial };
    onChange(reconciliarConfiguracion(tentativa, dimension));
  }

  function handleTipo(e: React.ChangeEvent<HTMLSelectElement>) {
    emitir({ tipo: e.target.value as TipoGrafica });
  }

  function handleMetrica(e: React.ChangeEvent<HTMLSelectElement>) {
    emitir({ metrica: e.target.value as MetricaGrafica });
  }

  function handleTopN(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    const valor: TopNGrafica = v === 'todos' ? 'todos' : (Number(v) as TopNGrafica);
    emitir({ top_n: valor });
  }

  function handleComparativo(e: React.ChangeEvent<HTMLInputElement>) {
    emitir({ comparar_lytd: e.target.checked });
  }

  const motivoComparativo = motivoDeshabilitado('comparativo', '', {
    dimension,
    tipo: configuracion.tipo,
    metrica: configuracion.metrica,
  });

  return (
    <div className="flex items-center gap-3 flex-wrap bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
      {/* Tipo de gráfica */}
      <label className="flex items-center gap-2 text-xs text-gray-500">
        <span className="font-medium">Tipo</span>
        <select
          value={configuracion.tipo}
          onChange={handleTipo}
          className={SELECT_BASE_CLASS}
          aria-label="Tipo de gráfica"
        >
          {TIPOS_ORDEN.map((t) => {
            const motivo = motivoDeshabilitado('tipo', t, {
              dimension,
              tipo: configuracion.tipo,
              metrica: configuracion.metrica,
            });
            const deshabilitado = !tiposOk.includes(t);
            return (
              <option key={t} value={t} disabled={deshabilitado} title={motivo ?? undefined}>
                {ETIQUETA_TIPO[t]}
                {deshabilitado ? ' — no disponible' : ''}
              </option>
            );
          })}
        </select>
      </label>

      {/* Métrica */}
      <label className="flex items-center gap-2 text-xs text-gray-500">
        <span className="font-medium">Métrica</span>
        <select
          value={configuracion.metrica}
          onChange={handleMetrica}
          className={SELECT_BASE_CLASS}
          aria-label="Métrica"
        >
          {METRICAS_ORDEN.map((m) => {
            const motivo = motivoDeshabilitado('metrica', m, {
              dimension,
              tipo: configuracion.tipo,
              metrica: configuracion.metrica,
            });
            const deshabilitado = !metricasOk.includes(m);
            return (
              <option key={m} value={m} disabled={deshabilitado} title={motivo ?? undefined}>
                {ETIQUETA_METRICA[m]}
                {deshabilitado ? ' — no disponible' : ''}
              </option>
            );
          })}
        </select>
      </label>

      {/* Top N */}
      <label
        className={`flex items-center gap-2 text-xs ${
          topNAplicaPara(dimension) ? 'text-gray-500' : 'text-gray-400'
        }`}
        title={topNAplicaPara(dimension) ? undefined : 'No aplica para dimensión Meses'}
      >
        <span className="font-medium">Mostrar</span>
        <select
          value={String(configuracion.top_n)}
          onChange={handleTopN}
          disabled={!topNAplicaPara(dimension)}
          className={`${SELECT_BASE_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Cantidad de filas"
        >
          {TOP_N_OPCIONES.map((opt) => (
            <option key={String(opt.valor)} value={String(opt.valor)}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {/* Comparativo */}
      <label
        className={`flex items-center gap-2 text-sm ${
          compAplica ? 'text-gray-700 cursor-pointer' : 'text-gray-400 cursor-not-allowed'
        }`}
        title={motivoComparativo ?? undefined}
      >
        <input
          type="checkbox"
          checked={compAplica && configuracion.comparar_lytd}
          onChange={handleComparativo}
          disabled={!compAplica}
          className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-400 disabled:opacity-50"
        />
        Comparar vs año anterior
      </label>
    </div>
  );
}
