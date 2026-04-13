'use client';

/**
 * BotonGenerarPos — Botón que dispara generación manual de POs sugeridas.
 * Visible solo para roles comprador y dueno.
 */

import { useState } from 'react';
import { generarPosSugeridas } from '@/lib/queries/po-sugeridas-mutations';

export function BotonGenerarPos() {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarClick() {
    if (generando) return;

    const ok = confirm(
      'Esto regenerará las POs sugeridas pendientes. Las POs que ya están en revisión por ti u otros se conservarán. ¿Continuar?'
    );
    if (!ok) return;

    setGenerando(true);
    setError(null);
    try {
      await generarPosSugeridas();
      window.location.href = window.location.href;
    } catch {
      setError('No se pudieron generar POs. Intenta de nuevo.');
      setGenerando(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={manejarClick}
        disabled={generando}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
        </svg>
        {generando ? 'Generando...' : 'Generar POs sugeridas'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
