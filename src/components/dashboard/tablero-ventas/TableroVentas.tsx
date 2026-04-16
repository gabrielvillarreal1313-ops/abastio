'use client';

/**
 * TableroVentas — Tablero operativo del rep de ventas.
 * Muestra KPIs del mes, oportunidades con acciones inline (Cotizar/Descartar/Posponer),
 * cotizaciones pendientes, y clientes en riesgo filtrados por el vendedor.
 */

import { useState } from 'react';
import Link from 'next/link';
import type { KpisRepMes } from '@/lib/queries/kpis-rep-mes';
import type { OportunidadTableroRep } from '@/lib/queries/oportunidades-tablero-rep';
import type { OportunidadCliente } from '@/lib/queries/oportunidades-lista';
import type { ClienteEnRiesgo } from '@/lib/queries/clientes-en-riesgo';
import type { CotizacionLista } from '@/lib/queries/cotizaciones-lista';
import type { ResumenOportunidadesRep } from '@/lib/queries/resumen-oportunidades-rep';
import { ClienteLink } from '@/components/ui/ClienteLink';
import { ModalDescartarOportunidad } from './ModalDescartarOportunidad';
import { ModalPosponerOportunidad } from './ModalPosponerOportunidad';
import {
  formatMXNCorto,
  formatMXN,
  formatPct,
  formatUnidades,
  formatearMesAnio,
  formatearFechaHora,
} from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';

// ─── Tipo unión para oportunidades ──────────────────────────────────────────

type OportunidadFila = (OportunidadTableroRep | OportunidadCliente) & {
  fue_pospuesta?: boolean;
  fecha_posposicion_original?: string | null;
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  kpis: KpisRepMes | null;
  oportunidades: OportunidadFila[];
  resumenOportunidades: ResumenOportunidadesRep | null;
  clientesEnRiesgo: ClienteEnRiesgo[];
  cotizaciones: CotizacionLista[];
  nombreUsuario: string;
  vendedorId: number | null;
  esRepPuro: boolean;
}

// ─── Badges ─────────────────────────────────────────────────────────────────

const BADGE_RIESGO: Record<string, { texto: string; clase: string }> = {
  declive: { texto: 'Declive', clase: 'text-amber-700 bg-amber-50' },
  inactivo: { texto: 'Inactivo', clase: 'text-red-700 bg-red-50' },
};

const BADGE_COTIZACION: Record<string, { texto: string; clase: string }> = {
  borrador: { texto: 'Borrador', clase: 'text-gray-700 bg-gray-100' },
  enviada: { texto: 'Enviada', clase: 'text-blue-700 bg-blue-50' },
};

// ─── Componente principal ───────────────────────────────────────────────────

export function TableroVentas({
  kpis,
  oportunidades,
  resumenOportunidades,
  clientesEnRiesgo,
  cotizaciones,
  nombreUsuario,
  vendedorId,
  esRepPuro,
}: Props) {
  const mesFormateado = kpis ? formatearMesAnio(kpis.mes_actual) : '';
  const oportunidadesConValor = oportunidades.filter((o) => o.valor_total > 0);
  const cotizacionesPendientes = cotizaciones.filter(
    (c) => c.estado === 'borrador' || c.estado === 'enviada'
  );

  // Header dinámico con contadores del resumen
  let subtextoHeader: string;
  if (!esRepPuro) {
    subtextoHeader = 'Vista general del equipo de ventas';
  } else if (resumenOportunidades) {
    const partes: string[] = [];
    partes.push(`${conConteo(resumenOportunidades.pendientes, 'oportunidad', 'oportunidades')} por trabajar`);
    if (resumenOportunidades.trabajadas_hoy > 0) {
      partes.push(`Has trabajado ${resumenOportunidades.trabajadas_hoy} hoy`);
    }
    if (resumenOportunidades.pospuestas_activas > 0) {
      partes.push(`${conConteo(resumenOportunidades.pospuestas_activas, 'pospuesta', 'pospuestas')} para después`);
    }
    subtextoHeader = `Tienes ${partes[0]}.${partes.length > 1 ? ' ' + partes.slice(1).join('. ') + '.' : ''}`;
  } else {
    subtextoHeader = 'Todo al día por ahora.';
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ───────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Tablero de ventas</h1>
        <p className="text-sm text-gray-500 mt-1">
          {esRepPuro ? (
            <>
              Hola, <span className="font-medium text-gray-700">{nombreUsuario}</span>.{' '}
              {subtextoHeader}
            </>
          ) : (
            subtextoHeader
          )}
        </p>
        {mesFormateado && (
          <p className="text-xs text-gray-400 mt-1">Datos del mes: {mesFormateado}</p>
        )}
      </div>

      {/* ─── KPI cards ────────────────────────────────────────────── */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            label="Ingresos del mes"
            valor={formatMXNCorto(kpis.ingresos_mes)}
            cambio={kpis.ingresos_mes_anterior > 0
              ? ((kpis.ingresos_mes - kpis.ingresos_mes_anterior) / kpis.ingresos_mes_anterior) * 100
              : undefined}
            subtexto={kpis.ingresos_mes_anterior > 0
              ? `vs ${formatMXNCorto(kpis.ingresos_mes_anterior)} mes anterior`
              : 'Sin datos del mes anterior'}
          />
          <KPICard label="Margen bruto" valor={formatPct(kpis.margen_pct_mes)} subtexto="Margen del mes actual" />
          <KPICard label="Transacciones" valor={formatUnidades(kpis.transacciones_mes)} subtexto="Ventas cerradas este mes" />
          <KPICard label="Clientes activos" valor={formatUnidades(kpis.clientes_activos_mes)} subtexto="Con al menos 1 compra este mes" />
          <KPICard
            label="Cotizaciones"
            valor={formatUnidades(kpis.cotizaciones_mes)}
            cambio={kpis.cotizaciones_mes_anterior > 0
              ? ((kpis.cotizaciones_mes - kpis.cotizaciones_mes_anterior) / kpis.cotizaciones_mes_anterior) * 100
              : undefined}
            subtexto={kpis.cotizaciones_mes_anterior > 0
              ? `vs ${kpis.cotizaciones_mes_anterior} mes anterior`
              : 'Sin datos del mes anterior'}
          />
          <KPICard label="Ticket promedio" valor={formatMXN(kpis.ticket_promedio_mes)} subtexto="Por transacción" />
        </div>
      )}

      {/* ─── Oportunidades de mayor valor ─────────────────────────── */}
      <SeccionOportunidades
        oportunidades={oportunidadesConValor.slice(0, 7)}
        total={oportunidadesConValor.length}
        esRepPuro={esRepPuro}
        vendedorId={vendedorId}
      />

      {/* ─── Cotizaciones pendientes ──────────────────────────────── */}
      <SeccionCotizaciones cotizaciones={cotizacionesPendientes.slice(0, 5)} total={cotizacionesPendientes.length} />

      {/* ─── Clientes en riesgo ───────────────────────────────────── */}
      <SeccionClientesRiesgo clientes={clientesEnRiesgo.slice(0, 5)} total={clientesEnRiesgo.length} />
    </div>
  );
}

// ─── KPI Card local ─────────────────────────────────────────────────────────

function KPICard({ label, valor, subtexto, cambio }: { label: string; valor: string; subtexto?: string; cambio?: number }) {
  const isPositive = cambio !== undefined && cambio >= 0;
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-5 py-5">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight">{valor}</p>
      <div className="flex items-center gap-1.5 mt-2">
        {cambio !== undefined && (
          <span className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
            {isPositive ? '+' : ''}{cambio.toFixed(1)}%
          </span>
        )}
        {subtexto && <span className="text-xs text-gray-500">{subtexto}</span>}
      </div>
    </div>
  );
}

// ─── Sección: Oportunidades con acciones inline ─────────────────────────────

function SeccionOportunidades({
  oportunidades,
  total,
  esRepPuro,
  vendedorId,
}: {
  oportunidades: OportunidadFila[];
  total: number;
  esRepPuro: boolean;
  vendedorId: number | null;
}) {
  const [descartarModal, setDescartarModal] = useState<{ clienteId: number; nombre: string } | null>(null);
  const [posponerModal, setPosponerModal] = useState<{ clienteId: number; nombre: string } | null>(null);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Oportunidades de mayor valor <span className="text-gray-500 font-normal">({total})</span>
      </h2>
      {oportunidades.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 px-8 py-12 text-center">
          <p className="text-sm text-gray-400">No hay oportunidades detectadas para tus clientes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium text-right">Oportunidades</th>
                  <th className="px-4 py-3 font-medium text-right">Valor estimado</th>
                  {!esRepPuro && <th className="px-4 py-3 font-medium">Vendedor</th>}
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {oportunidades.map((o) => (
                  <tr key={o.cliente_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ClienteLink clienteId={o.cliente_id} nombre={o.nombre_cliente} />
                        {o.fue_pospuesta && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 whitespace-nowrap">
                            Regresó
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {o.conteo_recompras + o.conteo_cross_sell}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatMXNCorto(o.valor_total)}
                    </td>
                    {!esRepPuro && (
                      <td className="px-4 py-3 text-gray-600 text-xs">{o.vendedor_principal}</td>
                    )}
                    <td className="px-4 py-3 text-right">
                      {esRepPuro && vendedorId ? (
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/oportunidades/nueva?cliente_id=${o.cliente_id}`}
                            className="px-2 py-1 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                          >
                            Cotizar
                          </Link>
                          <button
                            onClick={() => setDescartarModal({ clienteId: o.cliente_id, nombre: o.nombre_cliente })}
                            className="px-2 py-1 text-xs font-medium rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Descartar
                          </button>
                          <button
                            onClick={() => setPosponerModal({ clienteId: o.cliente_id, nombre: o.nombre_cliente })}
                            className="px-2 py-1 text-xs font-medium rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Posponer
                          </button>
                        </div>
                      ) : (
                        <Link
                          href={`/dashboard/oportunidades/nueva?cliente_id=${o.cliente_id}`}
                          className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          Crear cotización
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 7 && (
            <div className="px-4 py-3 border-t border-gray-100 text-right">
              <Link href="/dashboard/oportunidades" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Ver todas las oportunidades →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      {descartarModal && vendedorId && (
        <ModalDescartarOportunidad
          clienteId={descartarModal.clienteId}
          clienteNombre={descartarModal.nombre}
          vendedorId={vendedorId}
          abierto
          onCerrar={() => setDescartarModal(null)}
        />
      )}
      {posponerModal && vendedorId && (
        <ModalPosponerOportunidad
          clienteId={posponerModal.clienteId}
          clienteNombre={posponerModal.nombre}
          vendedorId={vendedorId}
          abierto
          onCerrar={() => setPosponerModal(null)}
        />
      )}
    </div>
  );
}

// ─── Sección: Cotizaciones pendientes ───────────────────────────────────────

function SeccionCotizaciones({ cotizaciones, total }: { cotizaciones: CotizacionLista[]; total: number }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Cotizaciones pendientes <span className="text-gray-500 font-normal">({total})</span>
      </h2>
      {cotizaciones.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 px-8 py-12 text-center">
          <p className="text-sm text-gray-400">No tienes cotizaciones pendientes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Nº</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cotizaciones.map((c) => {
                  const badge = BADGE_COTIZACION[c.estado] ?? BADGE_COTIZACION.borrador;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/oportunidades/${c.id}`} className="font-mono text-xs text-slate-600 hover:underline">
                          COT-{String(c.numero_cotizacion).padStart(4, '0')}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.nombre_cliente}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.clase}`}>{badge.texto}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatearFechaHora(c.fecha_creacion)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatMXNCorto(c.subtotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {total > 5 && (
            <div className="px-4 py-3 border-t border-gray-100 text-right">
              <Link href="/dashboard/oportunidades?tab=cotizaciones" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Ver todas las cotizaciones →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sección: Clientes en riesgo ────────────────────────────────────────────

function SeccionClientesRiesgo({ clientes, total }: { clientes: ClienteEnRiesgo[]; total: number }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Clientes en riesgo <span className="text-gray-500 font-normal">({total})</span>
      </h2>
      {clientes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 px-8 py-12 text-center">
          <p className="text-sm text-gray-400">Ninguno de tus clientes está en riesgo. ¡Buen trabajo!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Tipo de riesgo</th>
                  <th className="px-4 py-3 font-medium text-right">Días sin comprar</th>
                  <th className="px-4 py-3 font-medium text-right">Ingreso potencial perdido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clientes.map((c) => {
                  const badge = BADGE_RIESGO[c.tipo_riesgo] ?? BADGE_RIESGO.inactivo;
                  return (
                    <tr key={c.cliente_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3"><ClienteLink clienteId={c.cliente_id} nombre={c.razon_social} /></td>
                      <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.clase}`}>{badge.texto}</span></td>
                      <td className="px-4 py-3 text-right text-gray-700">{c.dias_sin_comprar != null ? `${c.dias_sin_comprar} días` : '—'}</td>
                      <td className="px-4 py-3 text-right font-medium text-red-700">{formatMXNCorto(c.ingresos_potenciales_perdidos)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {total > 5 && (
            <div className="px-4 py-3 border-t border-gray-100 text-right">
              <Link href="/dashboard/clientes" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Ver todos los clientes →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
