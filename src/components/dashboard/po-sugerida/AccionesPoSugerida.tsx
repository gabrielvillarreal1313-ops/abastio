'use client';

/**
 * AccionesPoSugerida — Barra de acciones: Guardar, Aprobar, Descartar.
 */

import { conConteo } from '@/lib/textos/pluralizar';

interface Props {
  onGuardar: () => void;
  onAprobar: () => void;
  onDescartar: () => void;
  cantidadItems: number;
  guardando: boolean;
  haCambios: boolean;
}

export function AccionesPoSugerida({ onGuardar, onAprobar, onDescartar, cantidadItems, guardando, haCambios }: Props) {
  return (
    <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
      <button
        onClick={onDescartar}
        disabled={guardando}
        className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        Descartar PO
      </button>
      <div className="flex gap-3">
        <button
          onClick={onGuardar}
          disabled={!haCambios || guardando}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          onClick={onAprobar}
          disabled={guardando}
          className="px-5 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors"
        >
          {guardando ? 'Aprobando...' : `Aprobar PO completa (${conConteo(cantidadItems, 'item', 'items')})`}
        </button>
      </div>
    </div>
  );
}
