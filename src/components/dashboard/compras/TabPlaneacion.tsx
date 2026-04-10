'use client';

/**
 * TabPlaneacion — Tabla de planeación de inventario min/max por SKU × bodega.
 * Incluye modal de detalle de cálculo, filtros, búsqueda, y sorting.
 */

import { useState, useMemo, useCallback } from 'react';
import type { PlaneacionData, PlaneacionSKU } from '@/lib/queries/planeacion-inventario';
import { formatUnidades } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';

interface Props {
  data: PlaneacionData;
}

// ─── Constantes ─────────────────────────────────────────────────────────────

const BODEGAS = [
  { value: 'Bodega Central León', label: 'León' },
  { value: 'Bodega Querétaro', label: 'Querétaro' },
] as const;

const BADGE_ABC: Record<string, string> = {
  A: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  B: 'text-amber-700 bg-amber-50 border-amber-200',
  C: 'text-gray-600 bg-gray-50 border-gray-200',
};

const BADGE_ESTADO: Record<string, string> = {
  ok: 'text-emerald-700 bg-emerald-50',
  revisar: 'text-red-700 bg-red-50',
};

type EstadoFiltro = 'todos' | 'ok' | 'revisar';
type SortKey = 'sku' | 'clase_abc' | 'min_actual' | 'min_recomendado' | 'delta_min' | 'max_actual' | 'max_recomendado' | 'delta_max' | 'cantidad_actual';
type SortDir = 'asc' | 'desc';

const ABC_ORD: Record<string, number> = { A: 1, B: 2, C: 3 };

function valorSort(row: PlaneacionSKU, key: SortKey): number | string {
  switch (key) {
    case 'sku': return row.sku;
    case 'clase_abc': return ABC_ORD[row.clase_abc] ?? 4;
    case 'min_actual': return row.min_actual;
    case 'min_recomendado': return row.min_recomendado;
    case 'delta_min': return row.delta_min_pct;
    case 'max_actual': return row.max_actual;
    case 'max_recomendado': return row.max_recomendado;
    case 'delta_max': return row.delta_max_pct;
    case 'cantidad_actual': return row.cantidad_actual;
    default: return 0;
  }
}

function bodegaCorta(nombre: string): string {
  if (!nombre) return '';
  return nombre.replace(/^Bodega (Central )?/, '');
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function SortIcon({ activo, dir }: { activo: boolean; dir: SortDir }) {
  if (!activo) {
    return (
      <svg className="w-3 h-3 text-gray-300 ml-0.5 inline-block" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 text-slate-700 ml-0.5 inline-block" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'asc' ? 'M4.5 15.75l7.5-7.5 7.5 7.5' : 'M19.5 8.25l-7.5 7.5-7.5-7.5'} />
    </svg>
  );
}

function DeltaPct({ valor }: { valor: number }) {
  if (valor === 0) return <span className="text-gray-400">—</span>;
  const texto = `${valor > 0 ? '+' : ''}${valor.toFixed(0)}%`;
  let color = 'text-gray-400';
  if (valor > 20) color = 'text-red-600 font-medium';
  else if (valor < -20) color = 'text-amber-600 font-medium';
  return <span className={color}>{texto}</span>;
}

/** Modal que muestra el detalle del cálculo de min/max recomendado */
function ModalCalculo({ row, onClose }: { row: PlaneacionSKU; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Detalle de cálculo</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-2">
          <p className="text-sm font-medium text-gray-900">{row.nombre_producto}</p>
          <p className="text-xs text-gray-500">{row.sku} · {bodegaCorta(row.bodega_nombre)}</p>
        </div>

        {/* Mínimo recomendado */}
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Mínimo recomendado</p>
          <div className="flex items-center gap-2 text-sm">
            <div className="bg-white rounded border border-gray-200 px-3 py-2 text-center">
              <p className="text-xs text-gray-400">Demanda diaria</p>
              <p className="font-semibold text-gray-900">{row.demanda_diaria_promedio.toFixed(2)}</p>
            </div>
            <span className="text-gray-400">×</span>
            <div className="bg-white rounded border border-gray-200 px-3 py-2 text-center">
              <p className="text-xs text-gray-400">Safety stock</p>
              <p className="font-semibold text-gray-900">7 días</p>
            </div>
            <span className="text-gray-400">+</span>
            <div className="bg-white rounded border border-gray-200 px-3 py-2 text-center">
              <p className="text-xs text-gray-400">Lead time</p>
              <p className="font-semibold text-gray-900">14 días</p>
            </div>
            <span className="text-gray-400">=</span>
            <div className="bg-slate-900 rounded px-3 py-2 text-center">
              <p className="text-xs text-slate-300">Mín. recomendado</p>
              <p className="font-semibold text-white">{formatUnidades(row.min_recomendado)}</p>
            </div>
          </div>
        </div>

        {/* Máximo recomendado */}
        <div className="mt-3 rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Máximo recomendado</p>
          <div className="flex items-center gap-2 text-sm">
            <div className="bg-white rounded border border-gray-200 px-3 py-2 text-center">
              <p className="text-xs text-gray-400">Demanda mensual</p>
              <p className="font-semibold text-gray-900">{row.demanda_mensual_promedio.toFixed(1)}</p>
            </div>
            <span className="text-gray-400">×</span>
            <div className="bg-white rounded border border-gray-200 px-3 py-2 text-center">
              <p className="text-xs text-gray-400">Meses de stock</p>
              <p className="font-semibold text-gray-900">2</p>
            </div>
            <span className="text-gray-400">=</span>
            <div className="bg-slate-900 rounded px-3 py-2 text-center">
              <p className="text-xs text-slate-300">Máx. recomendado</p>
              <p className="font-semibold text-white">{formatUnidades(row.max_recomendado)}</p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          Lead time estimado (14 días) — se calculará automáticamente con datos reales del ERP.
        </p>
      </div>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export function TabPlaneacion({ data }: Props) {
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('todos');
  const [filtroBodega, setFiltroBodega] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [modalRow, setModalRow] = useState<PlaneacionSKU | null>(null);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'sku' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const skusFiltrados = useMemo(() => {
    let resultado = data.skus;

    if (filtroEstado !== 'todos') {
      resultado = resultado.filter((s) => s.estado === filtroEstado);
    }
    if (filtroBodega !== 'Todas') {
      resultado = resultado.filter((s) => s.bodega_nombre === filtroBodega);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter(
        (s) => s.sku.toLowerCase().includes(q) || s.nombre_producto.toLowerCase().includes(q)
      );
    }

    if (sortKey) {
      resultado = [...resultado].sort((a, b) => {
        const va = valorSort(a, sortKey);
        const vb = valorSort(b, sortKey);
        const cmp = typeof va === 'string' && typeof vb === 'string'
          ? va.localeCompare(vb)
          : (va as number) - (vb as number);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return resultado;
  }, [data.skus, filtroEstado, filtroBodega, busqueda, sortKey, sortDir]);

  const conteos = useMemo(() => ({
    todos: data.skus.length,
    ok: data.skus.filter((s) => s.estado === 'ok').length,
    revisar: data.skus.filter((s) => s.estado === 'revisar').length,
  }), [data.skus]);

  function SortableHeader({ label, colKey, align }: { label: string; colKey: SortKey; align?: 'left' | 'right' | 'center' }) {
    const activo = sortKey === colKey;
    const alignClass = align === 'right' ? 'text-right justify-end' : align === 'center' ? 'text-center justify-center' : 'text-left';
    return (
      <button type="button" onClick={() => toggleSort(colKey)} className={`flex items-center gap-0.5 w-full ${alignClass} hover:text-gray-700 transition-colors`}>
        <span>{label}</span>
        <SortIcon activo={activo} dir={activo ? sortDir : 'desc'} />
      </button>
    );
  }

  const FILTROS_ESTADO: { key: EstadoFiltro; label: string }[] = [
    { key: 'todos', label: `Todos (${conteos.todos})` },
    { key: 'ok', label: `OK (${conteos.ok})` },
    { key: 'revisar', label: `Revisar (${conteos.revisar})` },
  ];

  return (
    <div>
      {/* Filtros */}
      <div className="flex items-end gap-4 mb-6 flex-wrap">
        {/* Botones de estado */}
        <div className="flex gap-2">
          {FILTROS_ESTADO.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltroEstado(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filtroEstado === f.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bodega */}
        <div>
          <label htmlFor="plan-bodega" className="block text-xs font-medium text-gray-500 mb-1">Bodega</label>
          <select id="plan-bodega" value={filtroBodega} onChange={(e) => setFiltroBodega(e.target.value)}
            className="block w-40 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
            <option value="Todas">Todas</option>
            {BODEGAS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>

        {/* Búsqueda */}
        <div>
          <label htmlFor="plan-busqueda" className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
          <input id="plan-busqueda" type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="SKU o nombre de producto"
            className="block w-56 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500" />
        </div>

        <div className="ml-auto text-sm text-gray-500 pb-0.5">
          {conConteo(skusFiltrados.length, 'resultado', 'resultados')}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-2.5 font-medium"><SortableHeader label="SKU" colKey="sku" /></th>
                <th className="px-3 py-2.5 font-medium">Producto</th>
                <th className="px-3 py-2.5 font-medium">Bodega</th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Clase" colKey="clase_abc" align="center" /></th>
                <th className="px-3 py-2.5 font-medium text-center">Estado</th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Actual" colKey="cantidad_actual" align="right" /></th>
                {/* Mínimo dinámico */}
                <th className="px-2 py-2.5 font-medium"><SortableHeader label="Mín. actual" colKey="min_actual" align="right" /></th>
                <th className="px-2 py-2.5 font-medium"><SortableHeader label="Mín. rec." colKey="min_recomendado" align="right" /></th>
                <th className="px-2 py-2.5 font-medium"><SortableHeader label="Δ%" colKey="delta_min" align="right" /></th>
                {/* Máximo dinámico */}
                <th className="px-2 py-2.5 font-medium"><SortableHeader label="Máx. actual" colKey="max_actual" align="right" /></th>
                <th className="px-2 py-2.5 font-medium"><SortableHeader label="Máx. rec." colKey="max_recomendado" align="right" /></th>
                <th className="px-2 py-2.5 font-medium"><SortableHeader label="Δ%" colKey="delta_max" align="right" /></th>
                <th className="px-3 py-2.5 font-medium text-right">Lead time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {skusFiltrados.map((row) => (
                <tr key={`${row.sku}-${row.bodega_nombre}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{row.sku}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900 truncate max-w-[180px]" title={row.nombre_producto}>{row.nombre_producto}</div>
                    <div className="text-xs text-gray-400">{row.categoria}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{bodegaCorta(row.bodega_nombre)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${BADGE_ABC[row.clase_abc]}`}>{row.clase_abc}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${BADGE_ESTADO[row.estado]}`}>
                      {row.estado === 'ok' ? 'OK' : 'Revisar'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">{formatUnidades(row.cantidad_actual)}</td>
                  {/* Mínimo */}
                  <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">{formatUnidades(row.min_actual)}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-gray-900 font-medium">{formatUnidades(row.min_recomendado)}</span>
                      <button onClick={() => setModalRow(row)} className="text-gray-400 hover:text-slate-700" title="Ver detalle del cálculo">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap"><DeltaPct valor={row.delta_min_pct} /></td>
                  {/* Máximo */}
                  <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">{formatUnidades(row.max_actual)}</td>
                  <td className="px-2 py-2 text-right text-gray-900 font-medium whitespace-nowrap">{formatUnidades(row.max_recomendado)}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap"><DeltaPct valor={row.delta_max_pct} /></td>
                  <td className="px-3 py-2 text-right text-gray-500 whitespace-nowrap" title="Lead time estimado — se calculará automáticamente con datos reales del ERP">
                    14 días
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalle */}
      {modalRow && <ModalCalculo row={modalRow} onClose={() => setModalRow(null)} />}
    </div>
  );
}
