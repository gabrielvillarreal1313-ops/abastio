'use client';

/**
 * MiActividadRep — Resumen + historial de acciones del rep sobre oportunidades.
 * Fase 9-3: cards de contadores + tabla filtrable de acciones recientes.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { HistorialOportunidadRep } from '@/lib/queries/historial-oportunidades-rep';
import type { ResumenOportunidadesRep } from '@/lib/queries/resumen-oportunidades-rep';
import { ClienteLink } from '@/components/ui/ClienteLink';
import { tiempoRelativo, formatearFechaHora } from '@/lib/textos/formato';

// ─── Constantes ─────────────────────────────────────────────────────────────

const BADGE_ACCION: Record<string, { texto: string; clase: string }> = {
  cotizada: { texto: 'Cotizada', clase: 'text-emerald-700 bg-emerald-50' },
  descartada: { texto: 'Descartada', clase: 'text-red-700 bg-red-50' },
  pospuesta: { texto: 'Pospuesta', clase: 'text-amber-700 bg-amber-50' },
};

type FiltroAccion = 'todas' | 'cotizada' | 'descartada' | 'pospuesta';

const FILTROS: { key: FiltroAccion; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'cotizada', label: 'Cotizadas' },
  { key: 'descartada', label: 'Descartadas' },
  { key: 'pospuesta', label: 'Pospuestas' },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  historial: HistorialOportunidadRep[];
  resumen: ResumenOportunidadesRep;
  vendedorId: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Si fue hoy, muestra tiempo relativo. Si no, muestra fecha completa. */
function formatearFechaInteligente(fecha: string): string {
  const hoy = new Date().toISOString().split('T')[0];
  const fechaDia = fecha.slice(0, 10);
  if (fechaDia === hoy) {
    return tiempoRelativo(fecha);
  }
  return formatearFechaHora(fecha);
}

function formatearFechaCorta(fecha: string | null): string {
  if (!fecha) return '';
  const partes = fecha.slice(0, 10).split('-');
  if (partes.length !== 3) return '';
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);
  return `${dia} ${meses[mes] ?? ''} ${partes[0]}`;
}

// ─── Componente principal ───────────────────────────────────────────────────

export function MiActividadRep({ historial, resumen }: Props) {
  const [filtro, setFiltro] = useState<FiltroAccion>('todas');

  const historialFiltrado = useMemo(() => {
    if (filtro === 'todas') return historial;
    return historial.filter((h) => h.accion === filtro);
  }, [historial, filtro]);

  const historialMostrado = historialFiltrado.slice(0, 50);

  return (
    <div className="space-y-6">
      {/* ─── Cards de resumen ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardResumen label="Trabajadas hoy" valor={resumen.trabajadas_hoy} />
        <CardResumen label="Pendientes" valor={resumen.pendientes} subtexto="Oportunidades por trabajar" />
        <CardResumen label="Pospuestas" valor={resumen.pospuestas_activas} subtexto="Programadas para después" />
        <CardResumen label="Descartadas" valor={resumen.descartadas_total} subtexto="Total histórico" />
      </div>

      {/* ─── Filtros ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Acciones recientes</h2>
        <div className="flex gap-2 mb-4">
          {FILTROS.map((f) => {
            const activo = filtro === f.key;
            const conteo = f.key === 'todas'
              ? historial.length
              : historial.filter((h) => h.accion === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  activo
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f.label} ({conteo})
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Tabla de historial ────────────────────────────────────── */}
      {historialMostrado.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 px-8 py-12 text-center">
          <p className="text-sm text-gray-400">
            {filtro === 'todas'
              ? 'Aún no has trabajado oportunidades.'
              : `No hay acciones de tipo "${FILTROS.find((f) => f.key === filtro)?.label ?? filtro}".`}
          </p>
          {filtro === 'todas' && (
            <Link href="/dashboard/tablero-ventas" className="text-sm text-slate-600 hover:text-slate-900 underline mt-2 inline-block">
              Empieza desde tu Tablero de ventas
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                  <th className="px-4 py-3 font-medium">Notas</th>
                  <th className="px-4 py-3 font-medium">Reaparición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historialMostrado.map((h) => {
                  const badge = BADGE_ACCION[h.accion] ?? BADGE_ACCION.descartada;
                  return (
                    <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {formatearFechaInteligente(h.creada_en)}
                      </td>
                      <td className="px-4 py-3">
                        <ClienteLink clienteId={h.cliente_id} nombre={h.cliente_nombre} />
                      </td>
                      <td className="px-4 py-3">
                        {h.accion === 'cotizada' && h.cotizacion_id ? (
                          <Link
                            href={`/dashboard/oportunidades/${h.cotizacion_id}`}
                            className={`text-xs font-medium px-2 py-0.5 rounded ${badge.clase} hover:underline`}
                          >
                            {badge.texto}
                          </Link>
                        ) : (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.clase}`}>
                            {badge.texto}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                        {h.notas ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {h.fecha_reaparicion ? formatearFechaCorta(h.fecha_reaparicion) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {historialFiltrado.length > 50 && (
            <div className="px-4 py-3 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">Mostrando las 50 más recientes</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Card de resumen ────────────────────────────────────────────────────────

function CardResumen({ label, valor, subtexto }: { label: string; valor: number; subtexto?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-5 py-5">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight">{valor}</p>
      {subtexto && <p className="text-xs text-gray-500 mt-0.5">{subtexto}</p>}
    </div>
  );
}
