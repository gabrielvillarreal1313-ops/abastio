/**
 * TablaHistorial — Tabla de acciones del comprador (polimórfica).
 * Renderiza acciones de POs y de overrides de min/max con links y badges distintos.
 * Server Component, recibe datos por props.
 */

import Link from 'next/link';
import { formatMXNTabla, formatearFechaHora } from '@/lib/textos/formato';
import type { HistorialAccion } from '@/lib/queries/historial-comprador';

interface Props {
  acciones: HistorialAccion[];
}

const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  po_toma_revision: {
    label: 'Toma',
    className: 'bg-gray-100 text-gray-700',
  },
  po_aprobacion: {
    label: 'Aprobación',
    className: 'bg-emerald-50 text-emerald-700',
  },
  po_descarte: {
    label: 'Descarte',
    className: 'bg-red-50 text-red-700',
  },
  po_modificacion: {
    label: 'Modificación',
    className: 'bg-blue-50 text-blue-700',
  },
  min_max_override: {
    label: 'Override min/max',
    className: 'bg-purple-50 text-purple-700',
  },
};

function renderEntidad(accion: HistorialAccion) {
  if (accion.entidad_tipo === 'inventario' && accion.producto_id) {
    return (
      <Link
        href={`/dashboard/productos/${accion.producto_id}`}
        className="text-purple-600 hover:underline text-xs"
      >
        {accion.po_referencia}
      </Link>
    );
  }

  if (accion.po_id) {
    return (
      <Link
        href={`/dashboard/compras/po/${accion.po_id}`}
        className="text-blue-600 hover:underline font-mono text-xs"
      >
        {accion.po_referencia}
      </Link>
    );
  }

  return <span className="text-gray-400 text-xs">—</span>;
}

export function TablaHistorial({ acciones }: Props) {
  if (acciones.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-8 py-12 text-center">
        <p className="text-gray-400 text-sm">
          Todavía no has registrado acciones en este periodo.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/hora</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entidad</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bodega</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {acciones.map((accion) => {
            const badge = BADGE_CONFIG[accion.tipo_accion] ?? BADGE_CONFIG.po_toma_revision;
            return (
              <tr key={accion.accion_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {formatearFechaHora(accion.creada_en)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {renderEntidad(accion)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {accion.bodega_nombre}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap">
                  {accion.valor_monetario != null
                    ? formatMXNTabla(accion.valor_monetario)
                    : '—'
                  }
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                  {accion.notas ?? '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
