'use client';

/**
 * DescartarModal — Modal de confirmación de descarte con notas obligatorias.
 */

import { useState } from 'react';

interface Props {
  onConfirmar: (notas: string) => void;
  onCerrar: () => void;
}

export function DescartarModal({ onConfirmar, onCerrar }: Props) {
  const [notas, setNotas] = useState('');
  const puedeConfirmar = notas.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Descartar esta orden de compra?</h3>
        <p className="text-sm text-gray-500 mb-4">
          Esta acción no se puede deshacer. La orden quedará registrada como descartada y no aparecerá en el Tablero de compras.
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Razón del descarte: <span className="text-red-500">*</span>
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          placeholder="Ej: el proveedor no tiene stock disponible este mes."
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-400 focus:ring-1 focus:ring-red-400 mb-1"
        />
        <p className="text-xs text-gray-400 mb-4">
          Mínimo 10 caracteres ({notas.trim().length}/10)
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCerrar}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(notas.trim())}
            disabled={!puedeConfirmar}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition-colors"
          >
            Descartar PO
          </button>
        </div>
      </div>
    </div>
  );
}
