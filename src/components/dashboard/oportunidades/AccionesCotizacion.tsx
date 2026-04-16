'use client';

/**
 * AccionesCotizacion — Botones de acción según el estado de la cotización.
 *
 * Transiciones:
 *   borrador → enviada (Enviar a ERP)
 *   borrador → eliminado (Cancelar → DELETE)
 *   enviada → completada (Completar)
 *   enviada → cancelada (Cancelar → UPDATE)
 *   completada → sin transiciones (solo Duplicar)
 *   cancelada → sin transiciones (solo Duplicar)
 *
 * Todas las mutaciones usan window.location.href para forzar full reload.
 */

import { useState } from 'react';
import {
  actualizarEstadoCotizacion,
  duplicarCotizacion,
  eliminarCotizacion,
} from '@/lib/queries/cotizacion-mutations';

interface Props {
  cotizacionId: string;
  estado: string;
  numeroCotizacion: number;
}

export function AccionesCotizacion({ cotizacionId, estado, numeroCotizacion }: Props) {
  const [ejecutando, setEjecutando] = useState(false);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);

  const cotLabel = `COT-${String(numeroCotizacion).padStart(4, '0')}`;

  // ─── Handlers ───────────────────────────────────────────────────

  const handleEditar = () => {
    window.location.href = `/dashboard/oportunidades/nueva?editar=${cotizacionId}`;
  };

  const handleEnviar = async () => {
    setEjecutando(true);
    try {
      await actualizarEstadoCotizacion(cotizacionId, 'enviada');
      window.location.href = '/dashboard/oportunidades?tab=cotizaciones&toast=cotizacion_enviada';
    } catch {
      setEjecutando(false);
    }
  };

  const handleCompletar = async () => {
    setEjecutando(true);
    try {
      await actualizarEstadoCotizacion(cotizacionId, 'completada');
      window.location.href = '/dashboard/oportunidades?tab=cotizaciones&toast=cotizacion_completada';
    } catch {
      setEjecutando(false);
    }
  };

  const handleCancelarBorrador = async () => {
    // Borrador: DELETE completo
    setEjecutando(true);
    try {
      await eliminarCotizacion(cotizacionId);
      window.location.href = '/dashboard/oportunidades?tab=borradores&toast=cotizacion_eliminada';
    } catch {
      setEjecutando(false);
    }
  };

  const handleCancelarEnviada = async () => {
    // Enviada: UPDATE estado a cancelada
    setEjecutando(true);
    try {
      await actualizarEstadoCotizacion(cotizacionId, 'cancelada');
      window.location.href = '/dashboard/oportunidades?tab=cotizaciones&toast=cotizacion_cancelada';
    } catch {
      setEjecutando(false);
    }
  };

  const handleConfirmarCancelar = () => {
    setConfirmandoCancelar(false);
    if (estado === 'borrador') {
      handleCancelarBorrador();
    } else {
      handleCancelarEnviada();
    }
  };

  const handleDuplicar = async () => {
    setEjecutando(true);
    try {
      const nuevoId = await duplicarCotizacion(cotizacionId);
      window.location.href = `/dashboard/oportunidades/${nuevoId}?toast=cotizacion_duplicada`;
    } catch {
      setEjecutando(false);
    }
  };

  // ─── Texto del modal según estado ───────────────────────────────

  const modalTexto = estado === 'borrador'
    ? `El borrador ${cotLabel} será eliminado permanentemente. Esta acción no se puede deshacer.`
    : `La cotización ${cotLabel} quedará marcada como cancelada. Esta acción no se puede deshacer.`;

  const modalTitulo = estado === 'borrador'
    ? `¿Eliminar borrador ${cotLabel}?`
    : `¿Cancelar cotización ${cotLabel}?`;

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Borrador: Editar | Duplicar | Enviar a ERP | Cancelar */}
        {estado === 'borrador' && (
          <>
            <button onClick={handleEditar} disabled={ejecutando}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-40">
              Editar
            </button>
            <button onClick={handleDuplicar} disabled={ejecutando}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
              Duplicar
            </button>
            <button onClick={handleEnviar} disabled={ejecutando}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
              Enviar a ERP
            </button>
            <button onClick={() => setConfirmandoCancelar(true)} disabled={ejecutando}
              className="px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-40 transition-colors">
              Cancelar
            </button>
          </>
        )}

        {/* Enviada: Duplicar | Completar | Cancelar */}
        {estado === 'enviada' && (
          <>
            <button onClick={handleDuplicar} disabled={ejecutando}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
              Duplicar
            </button>
            <button onClick={handleCompletar} disabled={ejecutando}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-40">
              Completar
            </button>
            <button onClick={() => setConfirmandoCancelar(true)} disabled={ejecutando}
              className="px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-40 transition-colors">
              Cancelar
            </button>
          </>
        )}

        {/* Completada o cancelada: solo Duplicar */}
        {(estado === 'completada' || estado === 'cancelada') && (
          <button onClick={handleDuplicar} disabled={ejecutando}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
            Duplicar como nueva
          </button>
        )}
      </div>

      {/* Modal de confirmación */}
      {confirmandoCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmandoCancelar(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-2">{modalTitulo}</h3>
            <p className="text-sm text-gray-500 mb-4">{modalTexto}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmandoCancelar(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
                No, volver
              </button>
              <button onClick={handleConfirmarCancelar}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">
                {estado === 'borrador' ? 'Sí, eliminar' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
