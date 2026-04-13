'use client';

/**
 * FormularioLogin — Formulario de inicio de sesión.
 * Usa Server Action para autenticarse y redirige con window.location.href.
 */

import { useState } from 'react';
import { accionLogin } from '@/app/login/acciones';
import { paginaAterrizajePorRol, type Rol } from '@/lib/auth/roles';

export function FormularioLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const resultado = await accionLogin(email, password);

      if (!resultado.exito) {
        setError(resultado.error ?? 'Error desconocido');
        setCargando(false);
        return;
      }

      // Verificar si hay vista preferida en localStorage
      let rutaFinal = resultado.ruta ?? '/dashboard';

      try {
        // Necesitamos el ID del usuario para la key de localStorage,
        // pero no lo tenemos aquí. Usamos el email como proxy temporal
        // hasta que el header cargue y establezca la key correcta.
        // El login siempre usa el default por jerarquía — la persistencia
        // de vista se aplica en logins subsecuentes cuando ya existe la key.
        const keys = Object.keys(localStorage).filter((k) => k.startsWith('vista_activa_'));
        if (keys.length > 0) {
          const vistaGuardada = localStorage.getItem(keys[0]) as Rol | null;
          if (vistaGuardada && ['dueno', 'comprador', 'rep'].includes(vistaGuardada)) {
            rutaFinal = paginaAterrizajePorRol(vistaGuardada);
          }
        }
      } catch {
        // localStorage no disponible — usar default
      }

      window.location.href = rutaFinal;
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / título */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-slate-900">Ferretera del Bajío</h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard Operativo</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
