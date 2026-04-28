'use client';

/**
 * ToggleVistaExplorer — Segmented control para alternar entre vista
 * Tabla y Gráfica en el Explorer (Fase 15, Checkpoint 2).
 *
 * El estado vive en el componente padre (ExplorerView) para que cambiar
 * de vista no dispare re-fetch — los datos ya están en memoria.
 */

import type { VistaReporte } from '@/lib/queries/reportes-guardados';

interface Props {
  vista: VistaReporte;
  onChange: (nueva: VistaReporte) => void;
}

export function ToggleVistaExplorer({ vista, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Alternar entre tabla y gráfica"
      className="inline-flex rounded-md border border-gray-300 bg-white p-0.5"
    >
      <BotonSegmento
        label="Tabla"
        activo={vista === 'tabla'}
        onClick={() => onChange('tabla')}
      />
      <BotonSegmento
        label="Gráfica"
        activo={vista === 'grafica'}
        onClick={() => onChange('grafica')}
      />
    </div>
  );
}

function BotonSegmento({
  label,
  activo,
  onClick,
}: {
  label: string;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activo}
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded transition-colors ${
        activo
          ? 'bg-slate-900 text-white'
          : 'text-gray-700 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  );
}
