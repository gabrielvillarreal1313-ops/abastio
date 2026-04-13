'use client';

/**
 * BotonLogout — Botón que cierra sesión y redirige a /login.
 */

import { accionLogout } from '@/app/login/acciones';

export function BotonLogout() {
  async function handleLogout() {
    await accionLogout();
    window.location.href = '/login';
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      title="Cerrar sesión"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
      </svg>
    </button>
  );
}
