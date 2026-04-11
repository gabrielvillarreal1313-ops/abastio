'use client';

/**
 * ListaOportunidades — Tabla de clientes con oportunidades de recompra y cross-sell.
 * Al hacer clic en una fila, navega al tab de Oportunidades del detalle del cliente.
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { OportunidadCliente } from '@/lib/queries/oportunidades-lista';
import { ClienteLink } from '@/components/ui/ClienteLink';
import { formatMXNTabla, formatMXNCorto } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';

interface Props {
  oportunidades: OportunidadCliente[];
}

const BADGE_TIPO: Record<string, string> = {
  ferreteria_minorista: 'Ferretería',
  constructor: 'Constructor',
  plomero: 'Plomero',
  electricista: 'Electricista',
  carpintero: 'Carpintero',
  industrial: 'Industrial',
  otro: 'Otro',
};

type SortKey = 'nombre' | 'recompras' | 'cross_sell' | 'valor_total';
type SortDir = 'asc' | 'desc';

function valorSort(row: OportunidadCliente, key: SortKey): number | string {
  switch (key) {
    case 'nombre': return row.nombre_cliente;
    case 'recompras': return row.conteo_recompras;
    case 'cross_sell': return row.conteo_cross_sell;
    case 'valor_total': return row.valor_total;
    default: return 0;
  }
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

export function ListaOportunidades({ oportunidades }: Props) {
  const router = useRouter();
  const [filtroVendedor, setFiltroVendedor] = useState('Todos');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('valor_total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'nombre' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const vendedoresUnicos = useMemo(() => {
    const set = new Set(oportunidades.map((o) => o.vendedor_principal).filter((v) => v !== '—'));
    return Array.from(set).sort();
  }, [oportunidades]);

  const tiposUnicos = useMemo(() => {
    const set = new Set(oportunidades.map((o) => o.tipo_cliente).filter(Boolean));
    return Array.from(set).sort();
  }, [oportunidades]);

  const filtrados = useMemo(() => {
    let resultado = oportunidades;

    if (filtroVendedor !== 'Todos') {
      resultado = resultado.filter((o) => o.vendedor_principal === filtroVendedor);
    }
    if (filtroTipo !== 'Todos') {
      resultado = resultado.filter((o) => o.tipo_cliente === filtroTipo);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter((o) => o.nombre_cliente.toLowerCase().includes(q));
    }

    resultado = [...resultado].sort((a, b) => {
      const va = valorSort(a, sortKey);
      const vb = valorSort(b, sortKey);
      const cmp = typeof va === 'string' && typeof vb === 'string' ? va.localeCompare(vb) : (va as number) - (vb as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return resultado;
  }, [oportunidades, filtroVendedor, filtroTipo, busqueda, sortKey, sortDir]);

  // Totales para el hero stat
  const totalValor = useMemo(() => oportunidades.reduce((s, o) => s + o.valor_total, 0), [oportunidades]);
  const totalRecompras = useMemo(() => oportunidades.reduce((s, o) => s + o.conteo_recompras, 0), [oportunidades]);
  const totalCrossSell = useMemo(() => oportunidades.reduce((s, o) => s + o.conteo_cross_sell, 0), [oportunidades]);

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
      {/* Hero stat */}
      <div className="bg-white rounded-lg border border-gray-200 px-6 py-5 mb-6">
        <p className="text-sm font-medium text-gray-500 mb-1">Valor mensual en oportunidades detectadas</p>
        <p className="text-3xl font-semibold text-blue-700 tracking-tight">{formatMXNCorto(totalValor)}</p>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <span>{conConteo(totalRecompras, 'recompra tardía', 'recompras tardías')}</span>
          <span className="text-gray-300">·</span>
          <span>{conConteo(totalCrossSell, 'oportunidad de cross-sell', 'oportunidades de cross-sell')}</span>
          <span className="text-gray-300">·</span>
          <span>{conConteo(filtrados.length, 'cliente', 'clientes')}</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-end gap-4 mb-6 flex-wrap">
        <div>
          <label htmlFor="filtro-vendedor-op" className="block text-xs font-medium text-gray-500 mb-1">Vendedor</label>
          <select id="filtro-vendedor-op" value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)}
            className="block w-44 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
            <option value="Todos">Todos</option>
            {vendedoresUnicos.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-tipo-op" className="block text-xs font-medium text-gray-500 mb-1">Tipo de cliente</label>
          <select id="filtro-tipo-op" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
            className="block w-44 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
            <option value="Todos">Todos los tipos</option>
            {tiposUnicos.map((t) => <option key={t} value={t}>{BADGE_TIPO[t] ?? t}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="buscar-op" className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
          <input id="buscar-op" type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre del cliente"
            className="block w-56 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500" />
        </div>

        <div className="ml-auto text-sm text-gray-500 pb-0.5">
          {conConteo(filtrados.length, 'cliente', 'clientes')}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-2.5 font-medium"><SortableHeader label="Cliente" colKey="nombre" /></th>
                <th className="px-3 py-2.5 font-medium">Vendedor</th>
                <th className="px-3 py-2.5 font-medium">Tipo</th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Recompras tardías" colKey="recompras" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Cross-sell" colKey="cross_sell" align="right" /></th>
                <th className="px-5 py-2.5 font-medium"><SortableHeader label="Valor total" colKey="valor_total" align="right" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.map((o) => (
                <tr key={o.cliente_id}
                  onClick={() => router.push(`/dashboard/clientes/${o.cliente_id}?tab=oportunidades`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-5 py-2.5">
                    <div className="font-medium text-gray-900 truncate max-w-[240px]" title={o.nombre_cliente}>
                      <ClienteLink clienteId={o.cliente_id} nombre={o.nombre_cliente} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{o.vendedor_principal}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-gray-500 bg-gray-100">
                      {BADGE_TIPO[o.tipo_cliente] ?? o.tipo_cliente}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {o.conteo_recompras > 0 ? (
                      <span className="text-amber-600 font-medium">{o.conteo_recompras}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {o.conteo_cross_sell > 0 ? (
                      <span className="text-blue-600 font-medium">{o.conteo_cross_sell}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-2.5 text-right font-medium text-gray-700 whitespace-nowrap">
                    {formatMXNTabla(o.valor_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
