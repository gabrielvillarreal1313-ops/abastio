'use client';

/**
 * ModalDescartarOportunidad — Confirma descarte de oportunidad con notas opcionales.
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

export function ModalDescartarOportunidad({ clienteId, clienteNombre, vendedorId, abierto, onCerrar }: Props) {
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (!abierto) return null;

  async function handleDescartar() {
    setGuardando(true);
    try {
      await registrarOportunidadTrabajada({
        vendedor_id: vendedorId,
        cliente_id: clienteId,
        accion: 'descartada',
        notas: notas.trim() || null,
      });
      window.location.href = '/dashboard/tablero-ventas?toast=oportunidad_descartada';
    } catch {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCerrar}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          Descartar oportunidades de {clienteNombre}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Este cliente dejará de aparecer en tu tablero de oportunidades.
        </p>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-gray-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none resize-none"
          placeholder="Motivo del descarte (opcional)"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCerrar} disabled={guardando}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
            Cancelar
          </button>
          <button onClick={handleDescartar} disabled={guardando}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40">
            {guardando ? 'Descartando...' : 'Descartar'}
          </button>
        </div>
      </div>
    </div>
  );
}
