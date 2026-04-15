'use client';

/**
 * TabCompras — Sugerencias de órdenes de compra por SKU × bodega.
 * Incluye selección múltiple, filtros por estado, búsqueda, sorting,
 * y botón "Generar orden de compra" (placeholder V1).
 */

import { useState, useMemo, useCallback } from 'react';
import type { SugerenciasCompraData, SugerenciaCompra } from '@/lib/queries/sugerencias-compra';
import { formatUnidades } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';

interface Props {
  data: SugerenciasCompraData;
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

const BADGE_ESTADO: Record<string, { texto: string; clase: string }> = {
  desabasto: { texto: 'Desabasto', clase: 'text-red-700 bg-red-50' },
  ok: { texto: 'OK', clase: 'text-emerald-700 bg-emerald-50' },
  sobrestock: { texto: 'Sobrestock', clase: 'text-amber-700 bg-amber-50' },
  sin_movimiento: { texto: 'Sin movimiento', clase: 'text-gray-600 bg-gray-100' },
};

type EstadoFiltro = 'todos' | 'desabasto' | 'ok' | 'sobrestock' | 'sin_movimiento';
type SortKey = 'sku' | 'clase_abc' | 'cantidad_actual' | 'cantidad_a_pedir' | 'meses_suministro' | 'fecha_requerida';
type SortDir = 'asc' | 'desc';

const ABC_ORD: Record<string, number> = { A: 1, B: 2, C: 3 };

function valorSort(row: SugerenciaCompra, key: SortKey): number | string {
  switch (key) {
    case 'sku': return row.sku;
    case 'clase_abc': return ABC_ORD[row.clase_abc] ?? 4;
    case 'cantidad_actual': return row.cantidad_actual;
    case 'cantidad_a_pedir': return row.cantidad_a_pedir ?? 0;
    case 'meses_suministro': return row.meses_de_suministro ?? 0;
    case 'fecha_requerida': return row.fecha_requerida ?? 'z';
    default: return 0;
  }
}

function bodegaCorta(nombre: string): string {
  if (!nombre) return '';
  return nombre.replace(/^Bodega (Central )?/, '');
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
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

/** Toast temporal */
function Toast({ mensaje, onClose }: { mensaje: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-lg shadow-lg px-5 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-2">
      <p className="text-sm">{mensaje}</p>
      <button onClick={onClose} className="text-slate-400 hover:text-white">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export function TabCompras({ data }: Props) {
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('todos');
  const [filtroBodega, setFiltroBodega] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [toastVisible, setToastVisible] = useState(false);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'sku' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const itemsFiltrados = useMemo(() => {
    let resultado = data.items;

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
  }, [data.items, filtroEstado, filtroBodega, busqueda, sortKey, sortDir]);

  const conteos = useMemo(() => ({
    todos: data.items.length,
    desabasto: data.items.filter((s) => s.estado === 'desabasto').length,
    ok: data.items.filter((s) => s.estado === 'ok').length,
    sobrestock: data.items.filter((s) => s.estado === 'sobrestock').length,
    sin_movimiento: data.items.filter((s) => s.estado === 'sin_movimiento').length,
  }), [data.items]);

  // ─── Selección ──────────────────────────────────────────────────────

  function itemKey(item: SugerenciaCompra): string {
    return `${item.sku}-${item.bodega_nombre}`;
  }

  function toggleSeleccion(key: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleTodos() {
    const keysVisibles = itemsFiltrados.map(itemKey);
    const todosSeleccionados = keysVisibles.every((k) => seleccionados.has(k));
    if (todosSeleccionados) {
      setSeleccionados((prev) => {
        const next = new Set(prev);
        keysVisibles.forEach((k) => next.delete(k));
        return next;
      });
    } else {
      setSeleccionados((prev) => {
        const next = new Set(prev);
        keysVisibles.forEach((k) => next.add(k));
        return next;
      });
    }
  }

  const todosVisiblesSeleccionados = itemsFiltrados.length > 0 && itemsFiltrados.every((i) => seleccionados.has(itemKey(i)));
  const haySeleccion = seleccionados.size > 0;

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
    { key: 'desabasto', label: `Desabasto (${conteos.desabasto})` },
    { key: 'ok', label: `OK (${conteos.ok})` },
    { key: 'sobrestock', label: `Sobrestock (${conteos.sobrestock})` },
    { key: 'sin_movimiento', label: `Sin movimiento (${conteos.sin_movimiento})` },
  ];

  return (
    <div>
      {/* Header con filtros y botón de acción */}
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
          <label htmlFor="compra-bodega" className="block text-xs font-medium text-gray-500 mb-1">Bodega</label>
          <select id="compra-bodega" value={filtroBodega} onChange={(e) => setFiltroBodega(e.target.value)}
            className="block w-40 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
            <option value="Todas">Todas</option>
            {BODEGAS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>

        {/* Búsqueda */}
        <div>
          <label htmlFor="compra-busqueda" className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
          <input id="compra-busqueda" type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="SKU o nombre de producto"
            className="block w-56 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500" />
        </div>

        {/* Contador y selección */}
        <div className="ml-auto flex items-center gap-3 pb-0.5">
          {haySeleccion && (
            <span className="text-sm text-slate-700 font-medium">
              {conConteo(seleccionados.size, 'item seleccionado', 'items seleccionados')}
            </span>
          )}
          <span className="text-sm text-gray-500">
            {conConteo(itemsFiltrados.length, 'resultado', 'resultados')}
          </span>
        </div>
      </div>

      {/* Botón generar OC */}
      {haySeleccion && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => { setToastVisible(true); setTimeout(() => setToastVisible(false), 4000); }}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Generar orden de compra
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-2.5 w-10">
                  <input type="checkbox" checked={todosVisiblesSeleccionados} onChange={toggleTodos}
                    className="rounded border-gray-300 text-slate-900 focus:ring-slate-500" />
                </th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="SKU" colKey="sku" /></th>
                <th className="px-3 py-2.5 font-medium">Producto</th>
                <th className="px-3 py-2.5 font-medium">Bodega</th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Clase" colKey="clase_abc" align="center" /></th>
                <th className="px-3 py-2.5 font-medium text-center">Estado</th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Cantidad a pedir" colKey="cantidad_a_pedir" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="En almacén" colKey="cantidad_actual" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Fecha requerida" colKey="fecha_requerida" align="right" /></th>
                <th className="px-4 py-2.5 font-medium"><SortableHeader label="Meses suministro" colKey="meses_suministro" align="right" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {itemsFiltrados.map((item) => {
                const key = itemKey(item);
                const sel = seleccionados.has(key);
                const badge = BADGE_ESTADO[item.estado] ?? BADGE_ESTADO.ok;

                return (
                  <tr key={key} className={`transition-colors ${sel ? 'bg-slate-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={sel} onChange={() => toggleSeleccion(key)}
                        className="rounded border-gray-300 text-slate-900 focus:ring-slate-500" />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{item.sku}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900 truncate max-w-[180px]" title={item.nombre_producto}>{item.nombre_producto}</div>
                      <div className="text-[10px] text-gray-500">Lead time: {item.lead_time_dias ?? 14} días</div>
                      <div className="text-xs text-gray-400">{item.categoria}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{bodegaCorta(item.bodega_nombre)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${BADGE_ABC[item.clase_abc]}`}>{item.clase_abc}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.clase}`}>{badge.texto}</span>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {item.cantidad_a_pedir != null && item.cantidad_a_pedir > 0 ? (
                        <span className="text-gray-900 font-semibold">{formatUnidades(item.cantidad_a_pedir)}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">{formatUnidades(item.cantidad_actual)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {item.fecha_requerida ? (
                        <span className="text-red-600 font-medium text-xs">{formatFecha(item.fecha_requerida)}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {item.meses_de_suministro != null ? (
                        <span className={
                          item.meses_de_suministro < 1 ? 'text-red-600 font-medium'
                            : item.meses_de_suministro < 2 ? 'text-amber-600'
                            : 'text-gray-600'
                        }>
                          {item.meses_de_suministro > 0 ? item.meses_de_suministro.toFixed(1) : '0'}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toastVisible && (
        <Toast
          mensaje="Generación de órdenes de compra disponible en V1 — requiere integración con ERP."
          onClose={() => setToastVisible(false)}
        />
      )}
    </div>
  );
}
