'use client';

/**
 * FiltrosHistorial — Filtros de fecha y tipo para el historial del comprador.
 * Actualiza query params en la URL para que los links sean compartibles.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const TIPOS_ACCION = [
  { valor: '', label: 'Todas las acciones' },
  { valor: 'po_toma_revision', label: 'Toma de revisión' },
  { valor: 'po_aprobacion', label: 'Aprobación' },
  { valor: 'po_descarte', label: 'Descarte' },
  { valor: 'po_modificacion', label: 'Modificación' },
  { valor: 'min_max_override', label: 'Override de min/max' },
] as const;

const QUICK_PICKS = [
  { label: '7 días', dias: 7 },
  { label: '30 días', dias: 30 },
  { label: 'Este mes', dias: 0 }, // valor especial
] as const;

function formatearFecha(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function calcularDesde(dias: number): string {
  if (dias === 0) {
    // "Este mes" — primer día del mes actual
    const hoy = new Date();
    return formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  }
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return formatearFecha(d);
}

export function FiltrosHistorial() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fechaDesde = searchParams.get('desde') ?? '';
  const fechaHasta = searchParams.get('hasta') ?? '';
  const tipoAccion = searchParams.get('tipo') ?? '';

  const actualizarFiltros = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 mb-6">
      <div className="flex flex-wrap items-end gap-4">
        {/* Quick picks */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Periodo rápido</label>
          <div className="flex gap-1.5">
            {QUICK_PICKS.map((pick) => (
              <button
                key={pick.label}
                onClick={() => actualizarFiltros({
                  desde: calcularDesde(pick.dias),
                  hasta: formatearFecha(new Date()),
                })}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {pick.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fecha desde */}
        <div>
          <label htmlFor="filtro-desde" className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
          <input
            id="filtro-desde"
            type="date"
            value={fechaDesde}
            onChange={(e) => actualizarFiltros({ desde: e.target.value })}
            className="block w-36 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <label htmlFor="filtro-hasta" className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
          <input
            id="filtro-hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => actualizarFiltros({ hasta: e.target.value })}
            className="block w-36 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Tipo de acción */}
        <div>
          <label htmlFor="filtro-tipo-accion" className="block text-xs font-medium text-gray-500 mb-1">Tipo de acción</label>
          <select
            id="filtro-tipo-accion"
            value={tipoAccion}
            onChange={(e) => actualizarFiltros({ tipo: e.target.value })}
            className="block w-48 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {TIPOS_ACCION.map((t) => (
              <option key={t.valor} value={t.valor}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
