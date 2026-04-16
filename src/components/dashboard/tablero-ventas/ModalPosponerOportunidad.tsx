'use client';

/**
 * ModalPosponerOportunidad — Pospone oportunidad con fecha de reaparición y notas.
 */

import { useState } from 'react';
import { registrarOportunidadTrabajada } from '@/lib/queries/oportunidades-trabajadas';

interface Props {
  clienteId: number;
  clienteNombre: string;
  vendedorId: number;
  abierto: boolean;
  onCerrar: () => void;
}

function formatFecha(date: Date): string {
  return date.toISOString().split('T')[0];
}

function sumarDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return formatFecha(d);
}

const QUICK_PICKS = [
  { label: 'En 3 días', dias: 3 },
  { label: 'En 1 semana', dias: 7 },
  { label: 'En 2 semanas', dias: 14 },
  { label: 'En 1 mes', dias: 30 },
] as const;

export function ModalPosponerOportunidad({ clienteId, clienteNombre, vendedorId, abierto, onCerrar }: Props) {
  const [fecha, setFecha] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!abierto) return null;

  const manana = sumarDias(1);

  async function handlePosponer() {
    setError(null);
    if (!fecha) {
      setError('Selecciona una fecha de reaparición.');
      return;
    }
    if (fecha <= formatFecha(new Date())) {
      setError('La fecha debe ser futura.');
      return;
    }

    setGuardando(true);
    try {
      await registrarOportunidadTrabajada({
        vendedor_id: vendedorId,
        cliente_id: clienteId,
        accion: 'pospuesta',
        notas: notas.trim() || null,
        fecha_reaparicion: fecha,
      });
      window.location.href = '/dashboard/tablero-ventas?toast=oportunidad_pospuesta';
    } catch {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCerrar}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          Posponer oportunidades de {clienteNombre}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Este cliente reaparecerá en tu tablero en la fecha indicada.
        </p>

        {/* Quick picks */}
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_PICKS.map((pick) => (
            <button
              key={pick.label}
              type="button"
              onClick={() => setFecha(sumarDias(pick.dias))}
              className="px-2 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              {pick.label}
            </button>
          ))}
        </div>

        {/* Date picker */}
        <input
          type="date"
          value={fecha}
          min={manana}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none mb-3"
        />

        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none resize-none"
          placeholder="Nota de recordatorio (opcional)"
        />

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCerrar} disabled={guardando}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
            Cancelar
          </button>
          <button onClick={handlePosponer} disabled={guardando}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-40">
            {guardando ? 'Posponiendo...' : 'Posponer'}
          </button>
        </div>
      </div>
    </div>
  );
}
