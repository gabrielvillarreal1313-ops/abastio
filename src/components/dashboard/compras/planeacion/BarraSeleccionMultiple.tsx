'use client';

/**
 * BarraSeleccionMultiple.tsx — Barra fija inferior para acciones en lote sobre ítems seleccionados.
 *
 * Aparece cuando el usuario selecciona uno o más ítems en la tabla de planeación.
 * Permite aplicar recomendados en bulk o descartar la selección.
 * La opción de ERP está deshabilitada hasta integración con SAP B1 / CONTPAQi.
 */

import { conConteo } from '@/lib/textos/pluralizar';

interface Props {
  cantidadSeleccionados: number;
  onAplicarRecomendados: () => void;
  onDescartarSeleccion: () => void;
  cargando: boolean;
}

export function BarraSeleccionMultiple({
  cantidadSeleccionados,
  onAplicarRecomendados,
  onDescartarSeleccion,
  cargando,
}: Props) {
  if (cantidadSeleccionados === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Conteo */}
        <p className="text-sm font-medium text-gray-700">
          {conConteo(cantidadSeleccionados, 'ítem seleccionado', 'ítems seleccionados')}
        </p>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <button
            onClick={onAplicarRecomendados}
            disabled={cargando}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? 'Aplicando...' : 'Aplicar recomendados'}
          </button>

          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-md cursor-not-allowed"
            title="Esta opción estará disponible cuando se conecte SAP B1 o CONTPAQi en producción."
          >
            Aplicar valores del ERP
          </button>

          <button
            onClick={onDescartarSeleccion}
            disabled={cargando}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            Descartar selección
          </button>
        </div>
      </div>
    </div>
  );
}
