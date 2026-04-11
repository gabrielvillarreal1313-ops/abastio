'use client';

/**
 * ListaClientes — Tabla filtrable de todos los clientes con métricas.
 * Cada fila navega al detalle del cliente al hacer clic.
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ClienteLista } from '@/lib/queries/clientes-lista';
import { formatMXNTabla, formatMXN, formatCambioPct } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';
import { ClienteLink } from '@/components/ui/ClienteLink';

interface Props {
  clientes: ClienteLista[];
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

type EstadoFiltro = 'todos' | 'activo' | 'riesgo';
type SortKey = 'razon_social' | 'ingresos_12m' | 'ticket_promedio' | 'dias_sin_comprar' | 'cambio_pct';
type SortDir = 'asc' | 'desc';

function valorSort(row: ClienteLista, key: SortKey): number | string {
  switch (key) {
    case 'razon_social': return row.razon_social;
    case 'ingresos_12m': return row.ingresos_12m;
    case 'ticket_promedio': return row.ticket_promedio;
    case 'dias_sin_comprar': return row.dias_sin_comprar;
    case 'cambio_pct': return row.cambio_pct;
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

function formatFecha(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ListaClientes({ clientes }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('todos');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [busqueda, setBusqueda] = useState(searchParams.get('busqueda') ?? '');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'razon_social' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const filtrados = useMemo(() => {
    let resultado = clientes;

    if (filtroEstado === 'riesgo') {
      resultado = resultado.filter((c) => c.es_riesgo);
    } else if (filtroEstado === 'activo') {
      resultado = resultado.filter((c) => !c.es_riesgo);
    }
    if (filtroTipo !== 'Todos') {
      resultado = resultado.filter((c) => c.tipo_cliente === filtroTipo);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter((c) => c.razon_social.toLowerCase().includes(q));
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
  }, [clientes, filtroEstado, filtroTipo, busqueda, sortKey, sortDir]);

  const conteos = useMemo(() => ({
    todos: clientes.length,
    activo: clientes.filter((c) => !c.es_riesgo).length,
    riesgo: clientes.filter((c) => c.es_riesgo).length,
  }), [clientes]);

  const tiposUnicos = useMemo(() => {
    const tipos = new Set(clientes.map((c) => c.tipo_cliente));
    return Array.from(tipos).sort();
  }, [clientes]);

  const FILTROS_ESTADO: { key: EstadoFiltro; label: string }[] = [
    { key: 'todos', label: `Todos (${conteos.todos})` },
    { key: 'activo', label: `Activos (${conteos.activo})` },
    { key: 'riesgo', label: `En riesgo (${conteos.riesgo})` },
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
          {FILTROS_ESTADO.map((f) => (
            <button key={f.key} onClick={() => setFiltroEstado(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filtroEstado === f.key ? 'bg-slate-900 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}>{f.label}</button>
          ))}
        </div>

        <div>
          <label htmlFor="filtro-tipo" className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
          <select id="filtro-tipo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
            className="block w-44 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
            <option value="Todos">Todos los tipos</option>
            {tiposUnicos.map((t) => <option key={t} value={t}>{BADGE_TIPO[t] ?? t}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="buscar-cliente" className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
          <input id="buscar-cliente" type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
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
                <th className="px-5 py-2.5 font-medium"><SortableHeader label="Cliente" colKey="razon_social" /></th>
                <th className="px-3 py-2.5 font-medium">Vendedor</th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Ingresos 12m" colKey="ingresos_12m" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Ticket prom." colKey="ticket_promedio" align="right" /></th>
                <th className="px-3 py-2.5 font-medium text-right">Última compra</th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Días s/comprar" colKey="dias_sin_comprar" align="right" /></th>
                <th className="px-3 py-2.5 font-medium"><SortableHeader label="Cambio" colKey="cambio_pct" align="right" /></th>
                <th className="px-5 py-2.5 font-medium text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.map((c) => (
                <tr key={c.cliente_id}
                  onClick={() => router.push(`/dashboard/clientes/${c.cliente_id}`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-5 py-2.5">
                    <div className="font-medium text-gray-900 truncate max-w-[240px]" title={c.razon_social}>
                      <ClienteLink clienteId={c.cliente_id} nombre={c.razon_social} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{c.ciudad}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-gray-500 bg-gray-100">
                        {BADGE_TIPO[c.tipo_cliente] ?? c.tipo_cliente}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-600 whitespace-nowrap">{c.vendedor_principal}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-gray-700 whitespace-nowrap">{formatMXNTabla(c.ingresos_12m)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatMXN(c.ticket_promedio)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 text-xs whitespace-nowrap">{formatFecha(c.ultima_compra)}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <span className={c.dias_sin_comprar > 60 ? 'text-red-600 font-medium' : c.dias_sin_comprar > 30 ? 'text-amber-600' : 'text-gray-600'}>
                      {conConteo(c.dias_sin_comprar, 'día', 'días')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <span className={
                      c.cambio_pct < -20 ? 'text-red-600 font-medium'
                        : c.cambio_pct < 0 ? 'text-amber-600'
                        : c.cambio_pct > 0 ? 'text-emerald-600 font-medium'
                        : 'text-gray-400'
                    }>
                      {formatCambioPct(c.cambio_pct)}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      c.es_riesgo ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'
                    }`}>
                      {c.es_riesgo ? 'En riesgo' : 'Activo'}
                    </span>
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
