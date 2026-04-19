'use client';

/**
 * useToastFromUrl — Lee un query param ?toast=CODIGO de la URL y dispara un toast de sonner.
 *
 * Patrón: las mutaciones agregan ?toast=CODIGO al redirect (window.location.href),
 * y la página destino llama este hook para mostrar la confirmación.
 * Después de disparar, limpia el param de la URL sin navegar.
 *
 * Guards contra doble disparo:
 * - processedRef: evita re-ejecución por React Strict Mode (doble useEffect en dev)
 * - lastProcessedToast: evita disparo duplicado si múltiples instancias del hook
 *   están montadas en la misma página
 */

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const TOAST_MESSAGES: Record<string, { tipo: 'success' | 'error' | 'info'; mensaje: string }> = {
  po_aprobada: { tipo: 'success', mensaje: 'Orden de compra aprobada correctamente' },
  po_descartada: { tipo: 'success', mensaje: 'Orden de compra descartada' },
  po_guardada: { tipo: 'success', mensaje: 'Cambios guardados correctamente' },
  po_tomada: { tipo: 'info', mensaje: 'Has tomado esta orden en revisión' },
  override_guardado: { tipo: 'success', mensaje: 'Mín/máx actualizados correctamente' },
  override_bulk: { tipo: 'success', mensaje: 'Valores recomendados aplicados correctamente' },
  cotizacion_creada: { tipo: 'success', mensaje: 'Cotización creada correctamente' },
  cotizacion_enviada: { tipo: 'success', mensaje: 'Cotización enviada al ERP' },
  cotizacion_completada: { tipo: 'success', mensaje: 'Cotización marcada como completada' },
  cotizacion_cancelada: { tipo: 'info', mensaje: 'Cotización cancelada' },
  cotizacion_duplicada: { tipo: 'success', mensaje: 'Cotización duplicada como borrador' },
  cotizacion_eliminada: { tipo: 'info', mensaje: 'Borrador eliminado' },
  cotizacion_actualizada: { tipo: 'success', mensaje: 'Cotización actualizada correctamente' },
  oportunidad_descartada: { tipo: 'success', mensaje: 'Oportunidad descartada' },
  oportunidad_pospuesta: { tipo: 'success', mensaje: 'Oportunidad pospuesta — reaparecerá en la fecha indicada' },
  reporte_guardado: { tipo: 'success', mensaje: 'Reporte guardado correctamente' },
  reporte_eliminado: { tipo: 'info', mensaje: 'Reporte eliminado' },
  reporte_anclado: { tipo: 'success', mensaje: 'Reporte anclado a tu dashboard' },
  reporte_desanclado: { tipo: 'info', mensaje: 'Reporte desanclado de tu dashboard' },
};

// Guard global para evitar que múltiples instancias del hook disparen el mismo toast
let lastProcessedToast: string | null = null;

export function useToastFromUrl() {
  const searchParams = useSearchParams();
  const processedRef = useRef(false);

  useEffect(() => {
    const toastCode = searchParams.get('toast');
    if (!toastCode) return;

    // Guard 1: evitar doble ejecución por Strict Mode
    if (processedRef.current) return;
    // Guard 2: evitar doble ejecución por múltiples instancias del hook
    if (lastProcessedToast === toastCode + window.location.pathname) return;

    processedRef.current = true;
    lastProcessedToast = toastCode + window.location.pathname;

    const config = TOAST_MESSAGES[toastCode];
    if (config) {
      setTimeout(() => {
        toast[config.tipo](config.mensaje);
      }, 100);
    }

    // Limpiar el param de la URL sin causar navegación
    const url = new URL(window.location.href);
    url.searchParams.delete('toast');
    window.history.replaceState({}, '', url.toString());

    // Reset del guard global después de un momento para permitir futuros toasts
    setTimeout(() => {
      lastProcessedToast = null;
    }, 2000);
  }, [searchParams]);
}
