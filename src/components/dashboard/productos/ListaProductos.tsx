'use client';

/**
 * ListaProductos — Tabla filtrable de todos los productos con métricas.
 * Cada fila navega al detalle del producto al hacer clic.
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ProductoLista } from '@/lib/queries/productos-lista';
import { formatMXNTabla, formatPct, formatUnidades } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';

interface Props {
  productos: ProductoLista[];
}

const CATEGORIAS = [
  'Electricidad', 'Herramientas eléctricas', 'Herramientas manuales',
  'Jardinería', 'Materiales de construcción', 'Pintura y accesorios',
  'Plomería', 'Seguridad industrial', 'Tornillería y sujeción',
] as const;

const BADGE_ABC: Record<string, string> = {
  A: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  B: 'text-amber-700 bg-amber-50 border-amber-200',
  C: 'text-gray-600 bg-gray-50 border-gray-200',
};

type EstadoFiltro = 'todos' | 'activo' | 'deadstock';
type SortKey = 'sku' | 'nombre' | 'ingresos_12m' | 'margen_pct' | 'cantidad_actual' | 'dias_sin_vender';
type SortDir = 'asc' | 'desc';

function valorSort(row: ProductoLista, key: SortKey): number | string {
  switch (key) {
    case 'sku': return row.sku;
    case 'nombre': return row.nombre;
    case 'ingresos_12m': return row.ingresos_12m;
    case 'margen_pct': return row.margen_pct;
    case 'cantidad_actual': return row.cantidad_actual;
    case 'dias_sin_vender': return row.dias_sin_vender;
    default: return 0;
  }
}

function esDeadstock(p: ProductoLista): boolean {
  return p.dias_sin_vender > 90 && p.cantidad_actual > 0;
}

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

export function ListaProductos({ productos }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroClase, setFiltroClase] = useState('Todas');
  const [busqueda, setBusqueda] = useState(searchParams.get('busqueda') ?? '');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'sku' || key === 'nombre' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const filtrados = useMemo(() => {
    let resultado = productos;

    if (filtroEstado === 'deadstock') {
      resultado = resultado.filter(esDeadstock);
    } else if (filtroEstado === 'activo') {
      resultado = resultado.filter((p) => !esDeadstock(p));
    }
    if (filtroCategoria !== 'Todas') {
      resultado = resultado.filter((p) => p.categoria === filtroCategoria);
    }
    if (filtroClase !== 'Todas') {
      resultado = resultado.filter((p) => p.clase_abc === filtroClase);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter((p) => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (sortKey) {
      resultado = [...resultado].sort((a, b) => {
        const va = valorSort(a, sortKey);
        const vb = valorSort(b, sortKey);
        const cmp = typeof va === 'string' && typeof vb === 'string' ? va.localeCompare(vb) : (va as number) - (vb as number);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return resultado;
  }, [productos, filtroEstado, filtroCategoria, filtroClase, busqueda, sortKey, sortDir]);

  const conteos = useMemo(() => ({
    todos: productos.length,
    activo: productos.filter((p) => !esDeadstock(p)).length,
    deadstock: productos.filter(esDeadstock).length,
  }), [productos]);

  const FILTROS: { key: EstadoFiltro; label: string }[] = [
    { key: 'todos', label: `Todos (${conteos.todos})` },
    { key: 'activo', label: `Activos (${conteos.activo})` },
    { key: 'deadstock', label: `Deadstock (${conteos.deadstock})` },
  ];

  function SortableHeader({ label, colKey, align }: { label: string; colKey: SortKey; align?: 'left' | 'right' }) {
    const activo = sortKey === colKey;
    const alignClass = align === 'right' ? 'text-right justify-end' : 'text-left';
    return (
      <button type="button" onClick={() => toggleSort(colKey)} className={`flex items-center gap-0.5 w-full ${alignClass} hover:text-gray-700 transition-colors`}>
        <span>{label}</span>
        <SortIcon activo={activo} dir={activo ? sortDir : 'desc'} />
      </button>
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex items-end gap-4 mb-6 flex-wrap">
        <div className="flex gap-2">
          {FILTROS.map((f) => (
            <button key={f.key} onClick={() => setFiltroEstado(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filtroEstado === f.key ? 'bg-slate-900 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}>{f.label}</button>
          ))}
        </div>

        <div>
          <label htmlFor="filtro-cat-prod" className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
          <select id="filtro-cat-prod" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
            className="block w-52 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
            <option value="Todas">Todas las categorías</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-clase-prod" className="block text-xs font-medium text-gray-500 mb-1">Clase ABC</label>
          <select id="filtro-clase-prod" value={filtroClase} onChange={(e) => setFiltroClase(e.target.value)}
            className="block w-28 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
            <option value="Todas">Todas</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>

        <div>
          <label htmlFor="buscar-prod" className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
          <input id="buscar-prod" type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre o SKU"
            className="block w-56 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500" />
        </div>

        <div className="ml-auto text-sm text-gray-500 pb-0.5">
          {conConteo(filtrados.length, 'producto', 'productos')}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-2.5 font-medium"><SortableHeader label="SKU" colKey="sku" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Producto" colKey="nombre" /></th>
                <th className="px-3 py-2.5 font-medium">Proveedor</th>
                <th className="px-3 py-2.5 font-medium text-center">Clase</th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Ingresos 12m" colKey="ingresos_12m" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Margen" colKey="margen_pct" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Stock" colKey="cantidad_actual" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Días s/vender" colKey="dias_sin_vender" align="right" /></th>
                <th className="px-4 py-2.5 font-medium text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.map((p) => {
                const dead = esDeadstock(p);
                return (
                  <tr key={p.sku} onClick={() => router.push(`/dashboard/productos/${p.sku}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{p.sku}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900 truncate max-w-[220px]" title={p.nombre}>{p.nombre}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{p.categoria}</span>
                        {p.marca && <span className="text-[10px] text-gray-500">· {p.marca}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap truncate max-w-[120px]" title={p.proveedor_principal}>
                      {p.proveedor_principal || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${BADGE_ABC[p.clase_abc]}`}>{p.clase_abc}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-700 whitespace-nowrap">{formatMXNTabla(p.ingresos_12m)}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className={p.margen_pct < 15 ? 'text-red-600 font-medium' : p.margen_pct < 20 ? 'text-amber-600' : 'text-emerald-600'}>
                        {formatPct(p.margen_pct)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatUnidades(p.cantidad_actual)}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className={p.dias_sin_vender > 90 ? 'text-red-600 font-medium' : p.dias_sin_vender > 60 ? 'text-amber-600' : 'text-gray-600'}>
                        {conConteo(p.dias_sin_vender, 'día', 'días')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${dead ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
                        {dead ? 'Deadstock' : 'Activo'}
                      </span>
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
