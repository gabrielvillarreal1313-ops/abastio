'use client';

/**
 * SelectorVista — Dropdown para usuarios multi-rol que permite cambiar de vista.
 * Guarda la preferencia en localStorage y redirige a la página de aterrizaje del rol elegido.
 */

import { useState, useEffect, useRef } from 'react';
import { paginaAterrizajePorRol, type Rol } from '@/lib/auth/roles';

const LABEL_ROL: Record<Rol, string> = {
  dueno: 'Vista Dueño',
  comprador: 'Vista Comprador',
  rep: 'Vista Vendedor',
};

interface Props {
  usuarioId: string;
  roles: Rol[];
  rolPrimario: Rol;
}

/**
 * Lee la vista activa de localStorage, validando que el rol siga existiendo.
 */
function leerVistaActiva(usuarioId: string, roles: Rol[], rolPrimario: Rol): Rol {
  try {
    const guardada = localStorage.getItem(`vista_activa_${usuarioId}`) as Rol | null;
    if (guardada && roles.includes(guardada)) return guardada;
    // Valor inválido o no existe — limpiar y usar default
    if (guardada) localStorage.removeItem(`vista_activa_${usuarioId}`);
  } catch {
    // localStorage no disponible
  }
  return rolPrimario;
}

export function SelectorVista({ usuarioId, roles, rolPrimario }: Props) {
  const [vistaActiva, setVistaActiva] = useState<Rol>(rolPrimario);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Leer de localStorage al montar
  useEffect(() => {
    setVistaActiva(leerVistaActiva(usuarioId, roles, rolPrimario));
  }, [usuarioId, roles, rolPrimario]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // No renderizar si solo tiene 1 rol
  if (roles.length <= 1) return null;

  function cambiarVista(rol: Rol) {
    try {
      localStorage.setItem(`vista_activa_${usuarioId}`, rol);
    } catch {
      // ignorar si localStorage no está disponible
    }
    setAbierto(false);
    window.location.href = paginaAterrizajePorRol(rol);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {LABEL_ROL[vistaActiva]}
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${abierto ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {abierto && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-md border border-gray-200 shadow-lg z-50 py-1">
          {roles.map((rol) => (
            <button
              key={rol}
              onClick={() => cambiarVista(rol)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                rol === vistaActiva
                  ? 'bg-gray-50 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {LABEL_ROL[rol]}
              {rol === vistaActiva && (
                <svg className="inline-block w-3.5 h-3.5 ml-1.5 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
