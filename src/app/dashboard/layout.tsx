/**
 * Layout del dashboard — Sidebar con secciones colapsables + header con usuario.
 * Server Component que obtiene el usuario actual y pasa roles al sidebar client.
 *
 * Identidad visual "Ámbar equilibrado" (Fase 14): sidebar oscuro con gradiente
 * cálido, logo claro, ámbar como color de acento en el item activo.
 */

import { getUsuarioActual } from '@/lib/auth/usuario-actual';
import { HeaderUsuario } from '@/components/dashboard/HeaderUsuario';
import { SidebarNav } from '@/components/dashboard/SidebarNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioActual();
  const rolesUsuario = usuario?.roles ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa]">
      {/* ─── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 bg-gradient-to-b from-[#0f1419] to-[#141c24] flex flex-col">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/[0.04]">
          <h1 className="text-[#f1f3f5] text-base font-semibold tracking-tight leading-tight">
            Ferretera del Bajío
          </h1>
          <p className="text-[#7a8899] text-xs mt-0.5">Dashboard Operativo</p>
        </div>

        {/* Navegación dinámica por roles con secciones colapsables */}
        <SidebarNav rolesUsuario={rolesUsuario} />

        {/* Footer del sidebar */}
        <div className="px-5 py-4 border-t border-white/[0.04]">
          <p className="text-[#7a8899] text-xs">V0 — MVP</p>
        </div>
      </aside>

      {/* ─── Área principal ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header con búsqueda global y usuario */}
        <div className="flex-shrink-0 border-b border-[#e2e5ea] bg-white px-8 py-3">
          <HeaderUsuario />
        </div>

        {/* Contenido scrollable */}
        <main className="flex-1 overflow-y-auto bg-[#f8f9fa]">
          <div className="px-8 py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
