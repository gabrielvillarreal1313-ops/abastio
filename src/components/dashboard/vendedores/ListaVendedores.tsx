'use client';

/**
 * ListaVendedores — Tabla filtrable de todos los vendedores con métricas.
 * Cada fila navega al detalle del vendedor al hacer clic.
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { VendedorLista } from '@/lib/queries/vendedores-lista';
import { formatMXNTabla, formatPct, formatCambioPct, formatUnidades } from '@/lib/textos/formato';

interface Props {
  vendedores: VendedorLista[];
}

const BADGE_TIPO: Record<string, string> = {
  ruta: 'Ruta',
  mostrador: 'Mostrador',
  telefonico: 'Telefónico',
};

type SortKey = 'nombre' | 'ingresos_mes' | 'cambio_pct' | 'margen_pct' | 'descuento' | 'clientes' | 'ingresos_12m';
type SortDir = 'asc' | 'desc';

function valorSort(row: VendedorLista, key: SortKey): number | string {
  switch (key) {
    case 'nombre': return row.nombre;
    case 'ingresos_mes': return row.ingresos_mes_actual;
    case 'cambio_pct': return row.cambio_pct;
    case 'margen_pct': return row.margen_pct;
    case 'descuento': return row.descuento_promedio_pct;
    case 'clientes': return row.clientes_activos;
    case 'ingresos_12m': return row.ingresos_12m;
    default: return 0;
  }
}

function SortIcon({ activo, dir }: { activo: boolean; dir: SortDir }) {
  if (!activo) {
    return (
      <svg className="w-3 h-3 text-gray-500 ml-0.5 inline-block" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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

export function ListaVendedores({ vendedores }: Props) {
  const router = useRouter();
  const [filtroZona, setFiltroZona] = useState('Todas');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'nombre' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const zonasUnicas = useMemo(() => {
    const zonas = new Set(vendedores.map((v) => v.zona).filter(Boolean));
    return Array.from(zonas).sort();
  }, [vendedores]);

  const filtrados = useMemo(() => {
    let resultado = vendedores;
    if (filtroZona !== 'Todas') {
      resultado = resultado.filter((v) => v.zona === filtroZona);
    }
    if (filtroTipo !== 'Todos') {
      resultado = resultado.filter((v) => v.tipo === filtroTipo);
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
  }, [vendedores, filtroZona, filtroTipo, sortKey, sortDir]);

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
        <div>
          <label htmlFor="filtro-zona" className="block text-xs font-medium text-gray-500 mb-1">Zona</label>
          <select id="filtro-zona" value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)}
            className="block w-40 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
            <option value="Todas">Todas</option>
            {zonasUnicas.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-tipo-v" className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
          <select id="filtro-tipo-v" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
            className="block w-40 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
            <option value="Todos">Todos</option>
            <option value="mostrador">Mostrador</option>
            <option value="ruta">Ruta</option>
            <option value="telefonico">Telefónico</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-500 pb-0.5">
          {filtrados.length} vendedores
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-2.5 font-medium"><SortableHeader label="Vendedor" colKey="nombre" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Ingresos mes" colKey="ingresos_mes" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Vs mes ant." colKey="cambio_pct" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Margen" colKey="margen_pct" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Desc. prom." colKey="descuento" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Clientes" colKey="clientes" align="right" /></th>
                <th className="px-5 py-2.5 font-medium"><SortableHeader label="Ingresos 12m" colKey="ingresos_12m" align="right" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.map((v) => (
                <tr key={v.vendedor_id} onClick={() => router.push(`/dashboard/vendedores/${v.vendedor_id}`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-5 py-2.5">
                    <div className="font-medium text-gray-900">{v.nombre}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{v.zona}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-slate-600 bg-slate-100">
                        {BADGE_TIPO[v.tipo] ?? v.tipo}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">{formatMXNTabla(v.ingresos_mes_actual)}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <span className={v.cambio_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {formatCambioPct(v.cambio_pct)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <span className={v.margen_pct < 15 ? 'text-red-600 font-medium' : v.margen_pct < 20 ? 'text-amber-600' : 'text-emerald-600'}>
                      {formatPct(v.margen_pct)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <span className={v.descuento_promedio_pct > 15 ? 'text-red-600 font-medium' : v.descuento_promedio_pct > 10 ? 'text-amber-600' : 'text-gray-600'}>
                      {formatPct(v.descuento_promedio_pct)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatUnidades(v.clientes_activos)}</td>
                  <td className="px-5 py-2.5 text-right font-medium text-gray-700 whitespace-nowrap">{formatMXNTabla(v.ingresos_12m)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
