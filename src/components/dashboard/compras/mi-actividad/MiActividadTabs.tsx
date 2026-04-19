'use client';

/**
 * MiActividadTabs — Tabs de actividad reciente e historial del comprador.
 * Tab 1: Actividad reciente (POs en revisión, aprobadas, descartadas, overrides)
 * Tab 2: Historial completo (migrado desde /dashboard/compras/mi-historial)
 *
 * Soporta ?tab=historial para deep-linking.
 */

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { PoRevisorResumen } from '@/lib/queries/pos-por-revisor';
import type { OverrideReciente } from '@/lib/queries/overrides-recientes';
import type { HistorialAccion } from '@/lib/queries/historial-comprador';
import { ProductoLink } from '@/components/ui/ProductoLink';
import { FiltrosHistorial } from '@/components/dashboard/compras/mi-historial/FiltrosHistorial';
import { ResumenHistorial } from '@/components/dashboard/compras/mi-historial/ResumenHistorial';
import { TablaHistorial } from '@/components/dashboard/compras/mi-historial/TablaHistorial';
import { formatMXN, tiempoRelativo, formatearFechaHora } from '@/lib/textos/formato';

// ─── Constantes ─────────────────────────────────────────────────────────────

const TABS = [
  { key: 'actividad', label: 'Actividad reciente' },
  { key: 'historial', label: 'Historial completo' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function isValidTab(value: string | null): value is TabKey {
  return value === 'actividad' || value === 'historial';
}

const BADGE_URGENCIA: Record<string, { texto: string; clase: string }> = {
  alta: { texto: 'Urgencia alta', clase: 'text-red-700 bg-red-50' },
  media: { texto: 'Urgencia media', clase: 'text-amber-700 bg-amber-50' },
  baja: { texto: 'Urgencia baja', clase: 'text-blue-700 bg-blue-50' },
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  posRevisor: PoRevisorResumen[];
  overridesRecientes: OverrideReciente[];
  historialInicial: HistorialAccion[];
}

// ─── Componente principal ───────────────────────────────────────────────────

export function MiActividadTabs({ posRevisor, overridesRecientes, historialInicial }: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tabInicial = isValidTab(tabParam) ? tabParam : 'actividad';

  const [tabActivo, setTabActivo] = useState<TabKey>(tabInicial);

  const enRevision = posRevisor.filter((po) => po.estado === 'pendiente_revision');
  const aprobadas = posRevisor.filter((po) => po.estado === 'aprobada');
  const descartadas = posRevisor.filter((po) => po.estado === 'descartada');

  return (
    <>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-6" aria-label="Tabs de mi actividad">
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

      {/* Contenido */}
      {tabActivo === 'actividad' && (
        <div className="space-y-8">
          <SeccionEnRevision pos={enRevision} />
          <SeccionAprobadas pos={aprobadas} />
          <SeccionDescartadas pos={descartadas} />
          <SeccionOverrides overrides={overridesRecientes} />
        </div>
      )}
      {tabActivo === 'historial' && (
        <>
          <ResumenHistorial acciones={historialInicial} />
          <Suspense fallback={null}>
            <FiltrosHistorial />
          </Suspense>
          <TablaHistorial acciones={historialInicial} />
        </>
      )}
    </>
  );
}

// ─── Componentes de sección ─────────────────────────────────────────────────

function TituloSeccion({ texto, conteo }: { texto: string; conteo: number }) {
  return (
    <h2 className="text-lg font-semibold text-gray-900">
      {texto} <span className="text-gray-500 font-normal">({conteo})</span>
    </h2>
  );
}

function EstadoVacio({ texto }: { texto: string }) {
  return <p className="text-sm text-gray-500">{texto}</p>;
}

// ─── Sección 1: En revisión por mí ─────────────────────────────────────────

function SeccionEnRevision({ pos }: { pos: PoRevisorResumen[] }) {
  return (
    <section>
      <TituloSeccion texto="En revisión por mí" conteo={pos.length} />
      {pos.length === 0 ? (
        <div className="mt-3 text-sm text-gray-500">
          <p>No tienes órdenes de compra en revisión.</p>
          <Link
            href="/dashboard/tablero-compras"
            className="text-slate-700 hover:text-slate-900 underline mt-1 inline-block"
          >
            Ir al Tablero de compras
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {pos.map((po) => {
            const badge = BADGE_URGENCIA[po.urgencia] ?? BADGE_URGENCIA.media;
            return (
              <div key={po.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{po.bodega_nombre}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${badge.clase}`}>
                    {badge.texto}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {po.cantidad_items} ítems · Valor estimado: {formatMXN(po.valor_total_estimado)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  En revisión desde {tiempoRelativo(po.actualizada_en)}
                </p>
                <Link
                  href={`/dashboard/compras/po/${po.id}`}
                  className="inline-block mt-3 text-xs font-medium px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  Continuar revisión
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Sección 2: Aprobadas recientes ────────────────────────────────────────

function SeccionAprobadas({ pos }: { pos: PoRevisorResumen[] }) {
  return (
    <section>
      <TituloSeccion texto="Aprobadas recientes" conteo={pos.length} />
      {pos.length === 0 ? (
        <div className="mt-3">
          <EstadoVacio texto="Sin aprobaciones recientes." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {pos.map((po) => (
            <Link
              key={po.id}
              href={`/dashboard/compras/po/${po.id}`}
              className="block border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:border-gray-300 hover:shadow transition-all"
            >
              <h3 className="text-sm font-semibold text-gray-900">{po.bodega_nombre}</h3>
              <p className="text-sm text-gray-700 mt-1">
                {formatMXN(po.valor_total_estimado)} · {formatearFechaHora(po.actualizada_en)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {po.cantidad_items} ítems
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Sección 3: Descartadas recientes ──────────────────────────────────────

function SeccionDescartadas({ pos }: { pos: PoRevisorResumen[] }) {
  return (
    <section>
      <TituloSeccion texto="Descartadas recientes" conteo={pos.length} />
      {pos.length === 0 ? (
        <div className="mt-3">
          <EstadoVacio texto="Sin descartes recientes." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {pos.map((po) => (
            <Link
              key={po.id}
              href={`/dashboard/compras/po/${po.id}`}
              className="block border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:border-gray-300 hover:shadow transition-all"
            >
              <h3 className="text-sm font-semibold text-gray-900">{po.bodega_nombre}</h3>
              <p className="text-sm text-gray-700 mt-1">
                {formatMXN(po.valor_total_estimado)} · {formatearFechaHora(po.actualizada_en)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {po.cantidad_items} ítems
              </p>
              {po.notas && (
                <p className="text-xs text-gray-500 mt-1">
                  Motivo: {po.notas}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Sección 4: Ajustes de inventario recientes ────────────────────────────

function SeccionOverrides({ overrides }: { overrides: OverrideReciente[] }) {
  return (
    <section>
      <TituloSeccion texto="Ajustes de inventario recientes" conteo={overrides.length} />
      {overrides.length === 0 ? (
        <div className="mt-3">
          <EstadoVacio texto="No has realizado ajustes de mín/máx." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {overrides.map((o) => (
            <div key={o.accion_id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">
                <ProductoLink sku={o.producto_sku} nombre={o.producto_nombre} />
              </h3>
              <p className="text-xs text-gray-500 mt-1">{o.bodega_nombre}</p>
              <p className="text-sm text-gray-700 mt-1">
                Tipo: {o.tipo_seleccion === 'recomendado' ? 'Recomendado' : 'Personalizado'}
              </p>
              <p className="text-sm text-gray-700 mt-0.5">
                Mín: {o.min_anterior} → {o.min_nuevo} · Máx: {o.max_anterior} → {o.max_nuevo}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {tiempoRelativo(o.creada_en)}
              </p>
              {o.notas && (
                <p className="text-xs text-gray-500 mt-1">{o.notas}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
