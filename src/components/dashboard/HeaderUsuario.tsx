/**
 * HeaderUsuario — Header del dashboard con búsqueda global, info del usuario, y selector de vista.
 * Server Component que obtiene datos del usuario y delega interactividad a componentes cliente.
 */

import { redirect } from 'next/navigation';
import { getUsuarioActual, type Rol } from '@/lib/auth/usuario-actual';
import { BusquedaGlobal } from '@/components/dashboard/BusquedaGlobal';
import { SelectorVista } from '@/components/dashboard/SelectorVista';
import { BotonLogout } from '@/components/dashboard/BotonLogout';

const BADGE_ROL: Record<Rol, { label: string; clase: string }> = {
  dueno: { label: 'Dueño', clase: 'bg-slate-100 text-slate-700' },
  comprador: { label: 'Comprador', clase: 'bg-blue-100 text-blue-700' },
  rep: { label: 'Vendedor', clase: 'bg-emerald-100 text-emerald-700' },
};

export async function HeaderUsuario() {
  const usuario = await getUsuarioActual();

  // Defensivo: el middleware ya debería haber redirigido
  if (!usuario) {
    redirect('/login');
  }

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Lado izquierdo: búsqueda global */}
      <BusquedaGlobal />

      {/* Lado derecho: usuario, roles, selector, logout */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Nombre y roles */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{usuario.nombre}</span>
          {usuario.roles.map((rol) => {
            const badge = BADGE_ROL[rol];
            return (
              <span
                key={rol}
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.clase}`}
              >
                {badge.label}
              </span>
            );
          })}
        </div>

        {/* Selector de vista (solo si tiene >1 rol) */}
        <SelectorVista
          usuarioId={usuario.id}
          roles={usuario.roles}
          rolPrimario={usuario.rolPrimario}
        />

        {/* Logout */}
        <BotonLogout />
      </div>
    </div>
  );
}
