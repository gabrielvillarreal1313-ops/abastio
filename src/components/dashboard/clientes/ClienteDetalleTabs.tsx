'use client';

/**
 * ClienteDetalleTabs — Wrapper de tabs para la página de detalle de cliente.
 * Tab 1: Resumen (KPIs, gráfica, top SKUs)
 * Tab 2: Oportunidades (recompras tardías + cross-sell)
 *
 * Soporta query param ?tab=oportunidades para abrir directamente en ese tab.
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import type { OportunidadesClienteData } from '@/lib/queries/oportunidades-cliente';
import { TabOportunidades } from './TabOportunidades';

const TABS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'oportunidades', label: 'Oportunidades' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface Props {
  /** Contenido del tab Resumen (renderizado como Server Component children) */
  children: ReactNode;
  oportunidadesData: OportunidadesClienteData;
  /** Badge de conteo para el tab de oportunidades */
  totalOportunidades: number;
  /** ID del cliente para el botón de nueva cotización */
  clienteId: number;
}

function isValidTab(value: string | null): value is TabKey {
  return value === 'resumen' || value === 'oportunidades';
}

export function ClienteDetalleTabs({ children, oportunidadesData, totalOportunidades, clienteId }: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tabInicial = isValidTab(tabParam) ? tabParam : 'resumen';

  const [tabActivo, setTabActivo] = useState<TabKey>(tabInicial);

  return (
    <>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-6" aria-label="Tabs de detalle de cliente">
          {TABS.map((tab) => {
            const activo = tab.key === tabActivo;
            return (
              <button
                key={tab.key}
                onClick={() => setTabActivo(tab.key)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activo
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.key === 'oportunidades' && totalOportunidades > 0 && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    activo ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {totalOportunidades}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido */}
      {tabActivo === 'resumen' && <div>{children}</div>}
      {tabActivo === 'oportunidades' && <TabOportunidades data={oportunidadesData} clienteId={clienteId} />}
    </>
  );
}
