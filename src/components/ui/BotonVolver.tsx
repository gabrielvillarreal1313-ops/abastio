'use client';

/**
 * BotonVolver — Componente reutilizable para navegación hacia atrás.
 * Usa router.back() en vez de rutas hardcodeadas para respetar el historial.
 */

import { useRouter } from 'next/navigation';

interface Props {
  texto?: string;
}

export function BotonVolver({ texto = 'Volver' }: Props) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
      {texto}
    </button>
  );
}
