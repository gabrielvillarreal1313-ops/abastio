'use client';

/**
 * TabPronostico — Tabla de pronóstico de demanda por SKU × bodega.
 * Incluye sparkline de 6 meses, clasificación ABC, filtros client-side,
 * selector de horizonte de pronóstico, porcentaje de cambio con color
 * condicional, y sorting por columna.
 */

import { useState, useMemo, useCallback } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { ForecastData, ForecastSKU } from '@/lib/queries/forecast-skus';
import { formatMXNTabla, formatUnidades } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';

interface Props {
  data: ForecastData;
}

const CATEGORIAS = [
  'Electricidad',
  'Herramientas eléctricas',
  'Herramientas manuales',
  'Jardinería',
  'Materiales de construcción',
  'Pintura y accesorios',
  'Plomería',
  'Seguridad industrial',
  'Tornillería y sujeción',
] as const;

/** Nombres exactos de las bodegas en la DB */
const BODEGAS = [
  { value: 'Bodega Central León', label: 'León' },
  { value: 'Bodega Querétaro', label: 'Querétaro' },
] as const;

const CLASES_ABC = ['A', 'B', 'C'] as const;

const HORIZONTES = [
  { value: 1, label: '1 mes' },
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
] as const;

const BADGE_ABC: Record<string, string> = {
  A: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  B: 'text-amber-700 bg-amber-50 border-amber-200',
  C: 'text-gray-600 bg-gray-50 border-gray-200',
};

// ─── Sorting ────────────────────────────────────────────────────────────────

type SortKey = 'sku' | 'clase_abc' | 'demanda_historica' | 'pronostico' | 'cambio_pct' | 'ingresos';
type SortDir = 'asc' | 'desc';

/** Orden numérico para clase ABC: A=1, B=2, C=3 */
const ABC_ORD: Record<string, number> = { A: 1, B: 2, C: 3 };

/**
 * Extrae el valor numérico de sorting para una fila según la columna activa.
 * Para SKU y clase ABC retorna un valor que se compara como string/número.
 */
function valorSort(sku: ForecastSKU, key: SortKey, horizonte: number): number | string {
  switch (key) {
    case 'sku': return sku.sku;
    case 'clase_abc': return ABC_ORD[sku.clase_abc] ?? 4;
    case 'demanda_historica': return sku.demanda_mensual_historica * horizonte;
    case 'pronostico': return sku.demanda_mensual_pronostico * horizonte;
    case 'cambio_pct':
      return sku.demanda_mensual_historica > 0
        ? ((sku.demanda_mensual_pronostico - sku.demanda_mensual_historica) / sku.demanda_mensual_historica) * 100
        : 0;
    case 'ingresos': return sku.ingresos_totales;
    default: return 0;
  }
}

/** Ícono de flecha para indicar dirección de sorting */
function SortIcon({ activo, dir }: { activo: boolean; dir: SortDir }) {
  if (!activo) {
    // Flechas grises inactivas
    return (
      <svg className="w-3 h-3 text-gray-500 ml-1 inline-block" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
      </svg>
    );
  }
  if (dir === 'asc') {
    return (
      <svg className="w-3 h-3 text-slate-700 ml-1 inline-block" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 text-slate-700 ml-1 inline-block" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Color de la sparkline según tendencia del último tramo */
function colorSparkline(serie: { cantidad: number }[]): string {
  if (serie.length < 2) return '#9ca3af';
  const ultimo = serie[serie.length - 1].cantidad;
  const penultimo = serie[serie.length - 2].cantidad;
  if (ultimo > penultimo) return '#059669';
  if (ultimo < penultimo) return '#dc2626';
  return '#9ca3af';
}

/**
 * Porcentaje de cambio con color condicional.
 * >+10% verde, <-10% rojo, entre -10% y +10% gris neutro, 0% guión.
 */
function CambioPct({ valor }: { valor: number }) {
  if (valor === 0) {
    return <span className="text-gray-500">0%</span>;
  }

  const abs = Math.abs(valor);
  const texto = `${valor > 0 ? '+' : ''}${valor.toFixed(0)}%`;

  let colorClass = 'text-gray-500';
  if (valor > 10) colorClass = 'text-emerald-600 font-medium';
  else if (valor < -10) colorClass = 'text-red-600 font-medium';

  if (abs > 999) {
    return <span className={colorClass}>{valor > 0 ? '+' : ''}999%+</span>;
  }

  return <span className={colorClass}>{texto}</span>;
}

/** Nombre corto de bodega para la tabla (sin prefijo "Bodega") */
function bodegaCorta(nombre: string): string {
  if (!nombre) return '';
  return nombre.replace(/^Bodega (Central )?/, '');
}

// ─── Componente principal ───────────────────────────────────────────────────

export function TabPronostico({ data }: Props) {
  const [filtroBodega, setFiltroBodega] = useState('Todas');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroClaseABC, setFiltroClaseABC] = useState('Todas');
  const [soloDemandaReciente, setSoloDemandaReciente] = useState(true);
  const [horizonte, setHorizonte] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      // SKU empieza ascendente, el resto descendente
      setSortDir(key === 'sku' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const skusFiltrados = useMemo(() => {
    let resultado: ForecastSKU[] = data.skus;

    if (filtroBodega !== 'Todas') {
      resultado = resultado.filter((s) => s.bodega_nombre === filtroBodega);
    }
    if (filtroCategoria !== 'Todas') {
      resultado = resultado.filter((s) => s.categoria === filtroCategoria);
    }
    if (filtroClaseABC !== 'Todas') {
      resultado = resultado.filter((s) => s.clase_abc === filtroClaseABC);
    }
    if (soloDemandaReciente) {
      resultado = resultado.filter((s) => s.tiene_demanda_reciente === true);
    }

    // Sorting
    if (sortKey) {
      resultado = [...resultado].sort((a, b) => {
        const va = valorSort(a, sortKey, horizonte);
        const vb = valorSort(b, sortKey, horizonte);
        let cmp: number;
        if (typeof va === 'string' && typeof vb === 'string') {
          cmp = va.localeCompare(vb);
        } else {
          cmp = (va as number) - (vb as number);
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return resultado;
  }, [data.skus, filtroBodega, filtroCategoria, filtroClaseABC, soloDemandaReciente, sortKey, sortDir, horizonte]);

  const etiquetaHorizonte = HORIZONTES.find((h) => h.value === horizonte)!.label;

  /** Helper para headers ordenables */
  function SortableHeader({ label, colKey, align }: { label: string; colKey: SortKey; align?: 'left' | 'right' | 'center' }) {
    const activo = sortKey === colKey;
    const alignClass = align === 'right' ? 'text-right justify-end' : align === 'center' ? 'text-center justify-center' : 'text-left';
    return (
      <button
        type="button"
        onClick={() => toggleSort(colKey)}
        className={`flex items-center gap-0.5 w-full ${alignClass} hover:text-gray-700 transition-colors`}
      >
        <span>{label}</span>
        <SortIcon activo={activo} dir={activo ? sortDir : 'desc'} />
      </button>
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex items-end gap-4 mb-6 flex-wrap">
        {/* Bodega */}
        <div>
          <label htmlFor="filtro-bodega" className="block text-xs font-medium text-gray-500 mb-1">
            Bodega
          </label>
          <select
            id="filtro-bodega"
            value={filtroBodega}
            onChange={(e) => setFiltroBodega(e.target.value)}
            className="block w-40 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          >
            <option value="Todas">Todas</option>
            {BODEGAS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>

        {/* Categoría */}
        <div>
          <label htmlFor="filtro-categoria" className="block text-xs font-medium text-gray-500 mb-1">
            Categoría
          </label>
          <select
            id="filtro-categoria"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="block w-52 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          >
            <option value="Todas">Todas las categorías</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Clase ABC */}
        <div>
          <label htmlFor="filtro-clase" className="block text-xs font-medium text-gray-500 mb-1">
            Clase ABC
          </label>
          <select
            id="filtro-clase"
            value={filtroClaseABC}
            onChange={(e) => setFiltroClaseABC(e.target.value)}
            className="block w-28 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          >
            <option value="Todas">Todas</option>
            {CLASES_ABC.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Horizonte */}
        <div>
          <label htmlFor="filtro-horizonte" className="block text-xs font-medium text-gray-500 mb-1">
            Horizonte
          </label>
          <select
            id="filtro-horizonte"
            value={horizonte}
            onChange={(e) => setHorizonte(Number(e.target.value))}
            className="block w-28 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          >
            {HORIZONTES.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>

        {/* Toggle demanda reciente */}
        <div className="flex items-center gap-2 pb-0.5">
          <button
            type="button"
            role="switch"
            aria-checked={soloDemandaReciente}
            onClick={() => setSoloDemandaReciente(!soloDemandaReciente)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              soloDemandaReciente ? 'bg-slate-900' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                soloDemandaReciente ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className="text-xs text-gray-600 cursor-pointer select-none"
            onClick={() => setSoloDemandaReciente(!soloDemandaReciente)}
          >
            Solo con demanda reciente
          </span>
        </div>

        {/* Contador */}
        <div className="ml-auto text-sm text-gray-500 pb-0.5">
          {conConteo(skusFiltrados.length, 'SKU', 'SKUs')}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-2.5 font-medium">
                  <SortableHeader label="SKU" colKey="sku" />
                </th>
                <th className="px-3 py-2.5 font-medium">Producto</th>
                <th className="px-3 py-2.5 font-medium">Bodega</th>
                <th className="px-3 py-2.5 font-medium">
                  <SortableHeader label="Clase" colKey="clase_abc" align="center" />
                </th>
                <th className="px-3 py-2.5 font-medium text-center">Tendencia</th>
                <th className="px-3 py-2.5 font-medium">
                  <SortableHeader label="Demanda histórica" colKey="demanda_historica" align="right" />
                </th>
                <th className="px-3 py-2.5 font-medium">
                  <SortableHeader label={`Pronóstico — próx. ${etiquetaHorizonte}`} colKey="pronostico" align="right" />
                </th>
                <th className="px-3 py-2.5 font-medium">
                  <SortableHeader label="Cambio" colKey="cambio_pct" align="right" />
                </th>
                <th className="px-5 py-2.5 font-medium">
                  <SortableHeader label="Ingresos históricos" colKey="ingresos" align="right" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {skusFiltrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-8 py-12 text-center">
                    <p className="text-sm text-gray-500">No se encontraron productos con los filtros aplicados.</p>
                  </td>
                </tr>
              )}
              {skusFiltrados.map((sku) => {
                const pronosticoHorizonte = sku.demanda_mensual_pronostico * horizonte;
                const demandaHistoricaHorizonte = sku.demanda_mensual_historica * horizonte;
                const diffPct = sku.demanda_mensual_historica > 0
                  ? ((sku.demanda_mensual_pronostico - sku.demanda_mensual_historica) / sku.demanda_mensual_historica) * 100
                  : 0;

                return (
                  <tr key={`${sku.sku}-${sku.bodega_nombre}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-2.5 font-mono text-xs text-gray-500">
                      {sku.sku}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900 truncate max-w-[220px]" title={sku.nombre_producto}>
                        {sku.nombre_producto}
                      </div>
                      <div className="text-xs text-gray-500">{sku.categoria}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                      {bodegaCorta(sku.bodega_nombre)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${BADGE_ABC[sku.clase_abc]}`}>
                        {sku.clase_abc}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="w-20 h-8 mx-auto">
                        {sku.serie_6_meses.length >= 2 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sku.serie_6_meses}>
                              <Line
                                type="monotone"
                                dataKey="cantidad"
                                stroke={colorSparkline(sku.serie_6_meses)}
                                strokeWidth={1.5}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <span className="block text-center text-xs text-gray-500">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
                      {formatUnidades(demandaHistoricaHorizonte)} uds
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className="text-gray-900 font-medium">
                        {formatUnidades(pronosticoHorizonte)}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">uds</span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <CambioPct valor={diffPct} />
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium text-gray-700 whitespace-nowrap">
                      {formatMXNTabla(sku.ingresos_totales)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
