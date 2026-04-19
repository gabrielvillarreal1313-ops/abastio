'use client';

/**
 * TablaCotizaciones — Tabla reutilizable de cotizaciones con filtros y sorting.
 * Usada tanto en tab Borradores como en tab Cotizaciones.
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { CotizacionLista } from '@/lib/queries/cotizaciones-lista';
import { ClienteLink } from '@/components/ui/ClienteLink';
import { formatMXNTabla, formatPct } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';

interface Props {
  cotizaciones: CotizacionLista[];
  /** Filtro de estado adicional (para tab Cotizaciones) */
  mostrarFiltroEstado?: boolean;
  /** Mensaje cuando no hay datos */
  mensajeVacio: string;
}

const BADGE_ESTADO: Record<string, { texto: string; clase: string }> = {
  borrador: { texto: 'Borrador', clase: 'text-gray-700 bg-gray-100' },
  enviada: { texto: 'Enviada', clase: 'text-blue-700 bg-blue-50' },
  completada: { texto: 'Completada', clase: 'text-emerald-700 bg-emerald-50' },
  cancelada: { texto: 'Cancelada', clase: 'text-red-700 bg-red-50' },
};

type SortKey = 'numero' | 'fecha' | 'cliente' | 'subtotal' | 'margen' | 'lineas';
type SortDir = 'asc' | 'desc';

function valorSort(row: CotizacionLista, key: SortKey): number | string {
  switch (key) {
    case 'numero': return row.numero_cotizacion;
    case 'fecha': return row.fecha_creacion;
    case 'cliente': return row.nombre_cliente;
    case 'subtotal': return row.subtotal;
    case 'margen': return row.margen_bruto_pct;
    case 'lineas': return row.total_lineas;
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

function formatFecha(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function TablaCotizaciones({ cotizaciones, mostrarFiltroEstado, mensajeVacio }: Props) {
  const router = useRouter();
  const [filtroVendedor, setFiltroVendedor] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('fecha');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'cliente' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const vendedoresUnicos = useMemo(() => {
    const set = new Set(cotizaciones.map((c) => c.nombre_vendedor));
    return Array.from(set).sort();
  }, [cotizaciones]);

  const filtradas = useMemo(() => {
    let resultado = cotizaciones;

    if (filtroVendedor !== 'Todos') {
      resultado = resultado.filter((c) => c.nombre_vendedor === filtroVendedor);
    }
    if (mostrarFiltroEstado && filtroEstado !== 'Todos') {
      resultado = resultado.filter((c) => c.estado === filtroEstado);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter((c) => c.nombre_cliente.toLowerCase().includes(q));
    }

    resultado = [...resultado].sort((a, b) => {
      const va = valorSort(a, sortKey);
      const vb = valorSort(b, sortKey);
      const cmp = typeof va === 'string' && typeof vb === 'string' ? va.localeCompare(vb) : (va as number) - (vb as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return resultado;
  }, [cotizaciones, filtroVendedor, filtroEstado, mostrarFiltroEstado, busqueda, sortKey, sortDir]);

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

  if (cotizaciones.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 px-8 py-12 text-center">
        <p className="text-gray-500 text-sm">{mensajeVacio}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex items-end gap-4 mb-6 flex-wrap">
        <div>
          <label htmlFor="filtro-vendedor-cot" className="block text-xs font-medium text-gray-500 mb-1">Vendedor</label>
          <select id="filtro-vendedor-cot" value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)}
            className="block w-44 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
            <option value="Todos">Todos</option>
            {vendedoresUnicos.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {mostrarFiltroEstado && (
          <div>
            <label htmlFor="filtro-estado-cot" className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select id="filtro-estado-cot" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
              className="block w-36 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
              <option value="Todos">Todos</option>
              <option value="enviada">Enviadas</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
        )}

        <div>
          <label htmlFor="buscar-cot" className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
          <input id="buscar-cot" type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre del cliente"
            className="block w-56 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-gray-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500" />
        </div>

        <div className="ml-auto text-sm text-gray-500 pb-0.5">
          {conConteo(filtradas.length, 'cotización', 'cotizaciones')}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-2.5 font-medium"><SortableHeader label="Nº" colKey="numero" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Fecha" colKey="fecha" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Cliente" colKey="cliente" /></th>
                <th className="px-3 py-2.5 font-medium">Vendedor</th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Líneas" colKey="lineas" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Subtotal" colKey="subtotal" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Margen" colKey="margen" align="right" /></th>
                <th className="px-4 py-2.5 font-medium text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtradas.map((c) => {
                const badge = BADGE_ESTADO[c.estado] ?? BADGE_ESTADO.borrador;
                return (
                  <tr key={c.id} onClick={() => router.push(`/dashboard/oportunidades/${c.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">COT-{String(c.numero_cotizacion).padStart(4, '0')}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{formatFecha(c.fecha_creacion)}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900 truncate max-w-[200px]">
                        <ClienteLink clienteId={c.cliente_id} nombre={c.nombre_cliente} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{c.nombre_vendedor}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{c.total_lineas}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-700 whitespace-nowrap">{formatMXNTabla(c.subtotal)}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className={c.margen_bruto_pct < 15 ? 'text-red-600' : 'text-emerald-600'}>
                        {formatPct(c.margen_bruto_pct)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.clase}`}>{badge.texto}</span>
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
