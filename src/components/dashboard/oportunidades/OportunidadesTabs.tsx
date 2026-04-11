'use client';

/**
 * OportunidadesTabs — Wrapper de tabs para la sección de Oportunidades/Cotizaciones.
 * Tab 1: Oportunidades (lista de clientes con oportunidades detectadas)
 * Tab 2: Borradores (cotizaciones en estado borrador)
 * Tab 3: Cotizaciones (cotizaciones enviadas, completadas o canceladas)
 *
 * Soporta query param ?tab=borradores o ?tab=cotizaciones para abrir directo.
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { OportunidadCliente } from '@/lib/queries/oportunidades-lista';
import type { CotizacionLista } from '@/lib/queries/cotizaciones-lista';
import { ListaOportunidades } from './ListaOportunidades';
import { TablaCotizaciones } from './TablaCotizaciones';

const TABS = [
  { key: 'oportunidades', label: 'Oportunidades' },
  { key: 'borradores', label: 'Borradores' },
  { key: 'cotizaciones', label: 'Cotizaciones' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface Props {
  oportunidades: OportunidadCliente[];
  cotizaciones: CotizacionLista[];
}

function isValidTab(value: string | null): value is TabKey {
  return value === 'oportunidades' || value === 'borradores' || value === 'cotizaciones';
}

export function OportunidadesTabs({ oportunidades, cotizaciones }: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tabInicial = isValidTab(tabParam) ? tabParam : 'oportunidades';

  const [tabActivo, setTabActivo] = useState<TabKey>(tabInicial);

  const borradores = cotizaciones.filter((c) => c.estado === 'borrador');
  const enviadas = cotizaciones.filter((c) => c.estado !== 'borrador');

  return (
    <>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-6" aria-label="Tabs de oportunidades y cotizaciones">
          {TABS.map((tab) => {
            const activo = tab.key === tabActivo;
            const conteo = tab.key === 'borradores' ? borradores.length
              : tab.key === 'cotizaciones' ? enviadas.length
              : 0;

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
                {conteo > 0 && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    activo ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {conteo}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido */}
      {tabActivo === 'oportunidades' && <ListaOportunidades oportunidades={oportunidades} />}
      {tabActivo === 'borradores' && (
        <TablaCotizaciones
          cotizaciones={borradores}
          mensajeVacio="No hay cotizaciones en borrador"
        />
      )}
      {tabActivo === 'cotizaciones' && (
        <TablaCotizaciones
          cotizaciones={enviadas}
          mostrarFiltroEstado
          mensajeVacio="No hay cotizaciones registradas"
        />
      )}
    </>
  );
}
