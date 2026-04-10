'use client';

/**
 * ComprasTabs — Wrapper cliente que maneja el estado del tab activo.
 * Recibe datos de los tres tabs desde el Server Component padre.
 */

import { useState } from 'react';
import type { ForecastData } from '@/lib/queries/forecast-skus';
import type { PlaneacionData } from '@/lib/queries/planeacion-inventario';
import type { SugerenciasCompraData } from '@/lib/queries/sugerencias-compra';
import { TabPronostico } from './TabPronostico';
import { TabPlaneacion } from './TabPlaneacion';
import { TabCompras } from './TabCompras';

const TABS = [
  { key: 'pronostico', label: 'Pronóstico' },
  { key: 'planeacion', label: 'Planeación' },
  { key: 'compras', label: 'Compras' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface Props {
  forecastData: ForecastData;
  planeacionData: PlaneacionData;
  sugerenciasData: SugerenciasCompraData;
}

export function ComprasTabs({ forecastData, planeacionData, sugerenciasData }: Props) {
  const [tabActivo, setTabActivo] = useState<TabKey>('pronostico');

  return (
    <>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-6" aria-label="Tabs de compras">
          {TABS.map((tab) => {
            const activo = tab.key === tabActivo;
            return (
              <button
                key={tab.key}
                onClick={() => setTabActivo(tab.key)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activo
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido del tab activo */}
      {tabActivo === 'pronostico' && <TabPronostico data={forecastData} />}
      {tabActivo === 'planeacion' && <TabPlaneacion data={planeacionData} />}
      {tabActivo === 'compras' && <TabCompras data={sugerenciasData} />}
    </>
  );
}
