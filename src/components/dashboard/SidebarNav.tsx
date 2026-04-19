'use client';

/**
 * SidebarNav — Navegación del sidebar con secciones colapsables.
 *
 * Estructura: Resumen (link directo) + Compras (grupo) + Ventas (grupo).
 * Los grupos se expanden/colapsan. El grupo que contiene la página actual
 * se abre por defecto.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Rol } from '@/lib/auth/roles';

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  roles: Rol[];
}

interface NavGroup {
  label: string;
  roles: Rol[]; // grupo visible si hay intersección
  prefixes: string[]; // para detectar si la página actual está en este grupo
  items: NavItem[];
}

// ─── Configuración de navegación ────────────────────────────────────────────

const LINK_RESUMEN: NavItem = {
  label: 'Resumen',
  href: '/dashboard',
  roles: ['dueno'],
};

const LINK_EXPLORER: NavItem = {
  label: 'Explorer',
  href: '/dashboard/explorer',
  roles: ['dueno'],
};

const LINK_REPORTES: NavItem = {
  label: 'Reportes',
  href: '/dashboard/reportes',
  roles: ['dueno'],
};

const GRUPOS: NavGroup[] = [
  {
    label: 'Compras',
    roles: ['comprador', 'dueno'],
    prefixes: ['/dashboard/tablero-compras', '/dashboard/compras', '/dashboard/productos'],
    items: [
      { label: 'Tablero de compras', href: '/dashboard/tablero-compras', roles: ['comprador', 'dueno'] },
      { label: 'Productos', href: '/dashboard/productos', roles: ['comprador', 'dueno'] },
      { label: 'Inventario', href: '/dashboard/compras', roles: ['comprador', 'dueno'] },
      { label: 'Mi actividad', href: '/dashboard/compras/mi-actividad', roles: ['comprador', 'dueno'] },
      { label: 'Mi desempeño', href: '/dashboard/compras/mi-desempeno', roles: ['comprador', 'dueno'] },
    ],
  },
  {
    label: 'Ventas',
    roles: ['rep', 'dueno'],
    prefixes: ['/dashboard/tablero-ventas', '/dashboard/clientes', '/dashboard/vendedores', '/dashboard/oportunidades'],
    items: [
      { label: 'Tablero de ventas', href: '/dashboard/tablero-ventas', roles: ['rep', 'dueno'] },
      { label: 'Clientes', href: '/dashboard/clientes', roles: ['rep', 'dueno'] },
      { label: 'Vendedores', href: '/dashboard/vendedores', roles: ['dueno'] },
      { label: 'Oportunidades', href: '/dashboard/oportunidades', roles: ['rep', 'dueno'] },
      { label: 'Mi actividad', href: '/dashboard/tablero-ventas/mi-actividad', roles: ['rep'] },
      { label: 'Mi desempeño', href: '/dashboard/tablero-ventas/mi-desempeno', roles: ['rep'] },
    ],
  },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  rolesUsuario: Rol[];
}

// ─── Componente ─────────────────────────────────────────────────────────────

export function SidebarNav({ rolesUsuario }: Props) {
  const pathname = usePathname();

  // Determinar qué grupo contiene la página actual
  const grupoActivo = GRUPOS.findIndex((g) =>
    g.prefixes.some((p) => pathname.startsWith(p))
  );

  // Determinar el href más específico que coincide con el pathname actual.
  // Evita que dos items con hrefs anidados (ej: /dashboard/compras y
  // /dashboard/compras/mi-actividad) queden ambos resaltados como activos.
  // El más largo gana, pero solo si hay match exacto o prefijo con "/".
  const hrefActivo: string | null = (() => {
    const todosHrefs: string[] = [];
    for (const g of GRUPOS) {
      for (const it of g.items) todosHrefs.push(it.href);
    }
    const matches = todosHrefs.filter(
      (h) => pathname === h || pathname.startsWith(h + '/')
    );
    if (matches.length === 0) return null;
    return matches.reduce((a, b) => (a.length >= b.length ? a : b));
  })();

  const [expandidos, setExpandidos] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    GRUPOS.forEach((_, i) => {
      init[i] = i === grupoActivo;
    });
    return init;
  });

  function toggleGrupo(idx: number) {
    setExpandidos((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  const tieneRol = (roles: Rol[]) => roles.some((r) => rolesUsuario.includes(r));

  // Resumen, Explorer y Reportes visibles solo para dueño
  const mostrarResumen = tieneRol(LINK_RESUMEN.roles);
  const mostrarExplorer = tieneRol(LINK_EXPLORER.roles);
  const mostrarReportes = tieneRol(LINK_REPORTES.roles);

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {/* Resumen — link directo */}
      {mostrarResumen && (
        <Link
          href={LINK_RESUMEN.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors border-l-2 ${
            pathname === '/dashboard'
              ? 'text-[#fbbf24] bg-[rgba(245,158,11,0.10)] border-[#f59e0b]'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border-transparent'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
          </svg>
          Resumen
        </Link>
      )}

      {/* Explorer — link directo (sección independiente, solo dueño) */}
      {mostrarExplorer && (
        <Link
          href={LINK_EXPLORER.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors border-l-2 ${
            pathname.startsWith('/dashboard/explorer')
              ? 'text-[#fbbf24] bg-[rgba(245,158,11,0.10)] border-[#f59e0b]'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border-transparent'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5v15m4.5-15v15m4.5-15v15m4.5-15v15M3 4.5h18M3 9h18M3 13.5h18M3 18h18" />
          </svg>
          Explorer
        </Link>
      )}

      {/* Reportes — link directo (sección independiente, solo dueño) */}
      {mostrarReportes && (
        <Link
          href={LINK_REPORTES.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors border-l-2 ${
            pathname.startsWith('/dashboard/reportes')
              ? 'text-[#fbbf24] bg-[rgba(245,158,11,0.10)] border-[#f59e0b]'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border-transparent'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Reportes
        </Link>
      )}

      {/* Grupos colapsables */}
      {GRUPOS.map((grupo, idx) => {
        if (!tieneRol(grupo.roles)) return null;

        const itemsVisibles = grupo.items.filter((item) => tieneRol(item.roles));
        if (itemsVisibles.length === 0) return null;

        const expandido = expandidos[idx] ?? false;
        const grupoContieneActual = grupo.prefixes.some((p) => pathname.startsWith(p));

        return (
          <div key={grupo.label} className="pt-3">
            {/* Header del grupo */}
            <button
              onClick={() => toggleGrupo(idx)}
              className={`flex items-center justify-between w-full px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold transition-colors ${
                grupoContieneActual ? 'text-[#fbbf24]' : 'text-[#8899ab] hover:text-[#94a3b8]'
              }`}
            >
              <span>{grupo.label}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${expandido ? 'rotate-0' : '-rotate-90'}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Items del grupo */}
            <div
              className={`overflow-hidden transition-all duration-200 ${
                expandido ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="mt-1 space-y-0.5">
                {itemsVisibles.map((item) => {
                  const activo = hrefActivo === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center pl-6 pr-3 py-2 rounded-md text-sm font-medium transition-colors border-l-2 ${
                        activo
                          ? 'text-[#fbbf24] bg-[rgba(245,158,11,0.10)] border-[#f59e0b]'
                          : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border-transparent'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
