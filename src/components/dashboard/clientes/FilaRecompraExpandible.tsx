'use client';

/**
 * FilaRecompraExpandible — Fila de recompra con detalle expandible de 3 sub-tabs.
 *
 * Fase 11-3: al expandir, carga bajo demanda las RPCs de cadencia/estacionalidad/
 * contexto para el par cliente-SKU y las cachea en estado local para no re-pedir
 * al colapsar y re-expandir. El badge de urgencia en la fila principal se calcula
 * client-side sin llamada adicional.
 */

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ProductoLink } from '@/components/ui/ProductoLink';
import { formatMXNTabla, formatUnidades } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';
import type { RecompraCliente } from '@/lib/queries/oportunidades-cliente';
import {
  getCadenciaClienteSku,
  getResumenCadenciaClienteSku,
  type CompraParClienteSku,
  type ResumenCadencia,
} from '@/lib/queries/cadencia-cliente-sku';
import {
  getEstacionalidadClienteSku,
  type EstacionalidadMes,
} from '@/lib/queries/estacionalidad-cliente-sku';
import {
  getContextoOportunidadRecompra,
  type ContextoOportunidad,
} from '@/lib/queries/contexto-oportunidad';

interface Props {
  clienteId: number;
  recompra: RecompraCliente;
}

type SubTab = 'cadencia' | 'uso' | 'estacional';

interface DetalleCache {
  historial: CompraParClienteSku[];
  resumen: ResumenCadencia | null;
  estacionalidad: EstacionalidadMes[];
  contexto: ContextoOportunidad | null;
}

// ─── Helpers de formato y cálculo ───────────────────────────────────────────

function formatFechaCorta(iso: string | null | undefined): string {
  if (!iso) return '—';
  const partes = iso.slice(0, 10).split('-');
  if (partes.length !== 3) return '—';
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const anio = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10);
  const dia = parseInt(partes[2], 10);
  if (isNaN(anio) || isNaN(mes) || isNaN(dia)) return '—';
  return `${dia} ${meses[mes - 1]} ${anio}`;
}

function diasEntreFechas(desdeIso: string, hastaIso: string): number {
  const d1 = new Date(desdeIso).getTime();
  const d2 = new Date(hastaIso).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function calcularNivelUrgencia(diasRetraso: number, intervaloPromedio: number): 'media' | 'alta' | 'critica' {
  if (!intervaloPromedio || intervaloPromedio <= 0) return 'media';
  const ratio = diasRetraso / intervaloPromedio;
  if (ratio > 1.0) return 'critica';
  if (ratio >= 0.5) return 'alta';
  return 'media';
}

function fechaEstimadaYaPasada(fechaEstimadaIso: string | null, ultimaCompraIso: string): boolean {
  if (!fechaEstimadaIso) return false;
  // "Ya pasó" = fecha estimada < última fecha conocida del dataset.
  // Aproximamos con la fecha de sistema; en datos sintéticos funciona igual
  // porque las recompras en cache están construidas contra MAX(fecha).
  const hoy = Date.now();
  const estim = new Date(fechaEstimadaIso).getTime();
  return !isNaN(estim) && estim < hoy && hoy - new Date(ultimaCompraIso).getTime() > 0;
}

// ─── Badges ─────────────────────────────────────────────────────────────────

function BadgeUrgencia({ nivel }: { nivel: 'media' | 'alta' | 'critica' }) {
  const estilos = {
    media: 'bg-yellow-100 text-yellow-800',
    alta: 'bg-orange-100 text-orange-800',
    critica: 'bg-red-100 text-red-800',
  };
  const etiquetas = { media: 'Media', alta: 'Alta', critica: 'Crítica' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estilos[nivel]}`}>
      {etiquetas[nivel]}
    </span>
  );
}

function BadgeRegularidad({ regularidad }: { regularidad: string }) {
  const estilos: Record<string, string> = {
    muy_regular: 'bg-emerald-100 text-emerald-800',
    regular: 'bg-blue-100 text-blue-800',
    irregular: 'bg-yellow-100 text-yellow-800',
  };
  const etiquetas: Record<string, string> = {
    muy_regular: 'Muy regular',
    regular: 'Regular',
    irregular: 'Irregular',
  };
  const clase = estilos[regularidad] ?? 'bg-gray-100 text-gray-700';
  const etiqueta = etiquetas[regularidad] ?? regularidad;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${clase}`}>
      {etiqueta}
    </span>
  );
}

// ─── Sub-tabs ───────────────────────────────────────────────────────────────

function SubTabCadencia({
  detalle,
  recompra,
}: {
  detalle: DetalleCache;
  recompra: RecompraCliente;
}) {
  const { contexto, resumen, historial } = detalle;

  const nivelFallback = calcularNivelUrgencia(
    recompra.dias_retraso,
    recompra.intervalo_promedio_dias,
  );
  const nivel = contexto?.nivelUrgencia ?? nivelFallback;
  const regularidad = contexto?.regularidad ?? 'irregular';

  const estimadaPasada = resumen
    ? fechaEstimadaYaPasada(resumen.fechaEstimadaProxima, recompra.ultima_compra_fecha)
    : false;

  const historialReciente = [...historial].reverse().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-sm text-gray-700 flex-1 min-w-[280px]">
          {contexto?.textoCadencia ?? 'Sin contexto de cadencia disponible.'}
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <BadgeRegularidad regularidad={regularidad} />
          <BadgeUrgencia nivel={nivel} />
        </div>
      </div>

      {resumen && resumen.fechaEstimadaProxima && (
        <div className="text-xs text-gray-600">
          <span className="font-medium text-gray-700">Próxima compra estimada:</span>{' '}
          <span className={estimadaPasada ? 'text-red-600 font-medium' : 'text-gray-700'}>
            {formatFechaCorta(resumen.fechaEstimadaProxima)}
            {estimadaPasada && ' (atrasada)'}
          </span>
        </div>
      )}

      {resumen && resumen.cantidadPromedio !== null && resumen.valorPromedio !== null && (
        <div className="text-xs text-gray-600">
          <span className="font-medium text-gray-700">Cantidad habitual:</span>{' '}
          ~{formatUnidades(resumen.cantidadPromedio)} unidades ·{' '}
          <span className="font-medium text-gray-700">Valor habitual:</span>{' '}
          ~{formatMXNTabla(resumen.valorPromedio)}
        </div>
      )}

      {historialReciente.length > 0 && (
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium text-right">Cantidad</th>
                <th className="px-3 py-2 font-medium text-right">Monto</th>
                <th className="px-3 py-2 font-medium text-right">Intervalo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historialReciente.map((h, i) => (
                <tr key={`${h.fecha}-${i}`}>
                  <td className="px-3 py-1.5 text-gray-700">{formatFechaCorta(h.fecha)}</td>
                  <td className="px-3 py-1.5 text-gray-700 text-right">{formatUnidades(h.cantidad)}</td>
                  <td className="px-3 py-1.5 text-gray-700 text-right">{formatMXNTabla(h.subtotal)}</td>
                  <td className="px-3 py-1.5 text-gray-500 text-right">
                    {h.intervaloDias === null ? '—' : `${h.intervaloDias} días`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SubTabUso({ detalle }: { detalle: DetalleCache }) {
  const { resumen, historial } = detalle;

  if (!resumen) {
    return <p className="text-sm text-gray-500">Sin datos de uso disponibles.</p>;
  }

  const mesesRelacion =
    resumen.primeraCompra && resumen.ultimaCompra
      ? Math.max(
          0,
          Math.round(diasEntreFechas(resumen.primeraCompra, resumen.ultimaCompra) / 30),
        )
      : 0;

  // Datos para la gráfica: cada compra con su cantidad
  const datosGrafica = historial.map((h) => ({
    fecha: formatFechaCorta(h.fecha),
    cantidad: h.cantidad,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-md border border-gray-200 px-3 py-2">
          <p className="text-xs text-gray-500">Total de compras</p>
          <p className="text-sm font-semibold text-gray-900">{resumen.totalCompras}</p>
        </div>
        <div className="bg-white rounded-md border border-gray-200 px-3 py-2">
          <p className="text-xs text-gray-500">Primera compra</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatFechaCorta(resumen.primeraCompra)}
          </p>
        </div>
        <div className="bg-white rounded-md border border-gray-200 px-3 py-2">
          <p className="text-xs text-gray-500">Última compra</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatFechaCorta(resumen.ultimaCompra)}
          </p>
        </div>
      </div>

      <div className="text-xs text-gray-600">
        <span className="font-medium text-gray-700">Relación de</span>{' '}
        {conConteo(mesesRelacion, 'mes', 'meses')}{' '}
        <span className="text-gray-500">entre primera y última compra</span>
      </div>

      {historial.length >= 3 ? (
        <div className="bg-white rounded-md border border-gray-200 p-3">
          <p className="text-xs text-gray-500 mb-2">Cantidad comprada por transacción</p>
          <div style={{ width: '100%', height: 150 }}>
            <ResponsiveContainer>
              <BarChart data={datosGrafica} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 6 }}
                  formatter={(valor) => [formatUnidades(Number(valor) || 0), 'Cantidad']}
                />
                <Bar dataKey="cantidad" fill="#0f172a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Historial insuficiente para mostrar tendencia de uso.</p>
      )}
    </div>
  );
}

function SubTabEstacional({ detalle }: { detalle: DetalleCache }) {
  const { estacionalidad, contexto } = detalle;

  const hayPatron = estacionalidad.some((m) => m.tienePatron);

  return (
    <div className="space-y-4">
      {contexto?.textoEstacionalidad && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
          <p className="text-sm text-emerald-900">{contexto.textoEstacionalidad}</p>
        </div>
      )}

      {!hayPatron && (
        <p className="text-sm text-gray-500">
          No se detectó patrón estacional para este producto con este cliente.
        </p>
      )}

      {estacionalidad.length > 0 && (
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="px-3 py-2 font-medium">Mes</th>
                <th className="px-3 py-2 font-medium text-right">Compras (año pasado)</th>
                <th className="px-3 py-2 font-medium text-right">Compras (año actual)</th>
                <th className="px-3 py-2 font-medium text-right">Cantidad (año pasado)</th>
                <th className="px-3 py-2 font-medium text-right">Cantidad (año actual)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estacionalidad.map((m) => (
                <tr key={m.mes} className={m.tienePatron ? 'bg-emerald-50' : ''}>
                  <td className="px-3 py-1.5 text-gray-700">{m.nombreMes}</td>
                  <td className="px-3 py-1.5 text-gray-700 text-right">{m.comprasAnioAnterior}</td>
                  <td className="px-3 py-1.5 text-gray-700 text-right">{m.comprasAnioActual}</td>
                  <td className="px-3 py-1.5 text-gray-700 text-right">
                    {formatUnidades(m.cantidadAnioAnterior)}
                  </td>
                  <td className="px-3 py-1.5 text-gray-700 text-right">
                    {formatUnidades(m.cantidadAnioActual)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────

export function FilaRecompraExpandible({ clienteId, recompra }: Props) {
  const [expandido, setExpandido] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [detalle, setDetalle] = useState<DetalleCache | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<SubTab>('cadencia');

  const nivelUrgencia = calcularNivelUrgencia(
    recompra.dias_retraso,
    recompra.intervalo_promedio_dias,
  );

  async function toggleExpandir() {
    const siguiente = !expandido;
    setExpandido(siguiente);

    if (siguiente && !detalle && !cargando) {
      setCargando(true);
      setError(null);
      try {
        const [historial, resumen, estacionalidad, contexto] = await Promise.all([
          getCadenciaClienteSku(clienteId, recompra.sku),
          getResumenCadenciaClienteSku(clienteId, recompra.sku),
          getEstacionalidadClienteSku(clienteId, recompra.sku),
          getContextoOportunidadRecompra(clienteId, recompra.sku),
        ]);
        setDetalle({ historial, resumen, estacionalidad, contexto });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error cargando detalle');
      } finally {
        setCargando(false);
      }
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-3 py-2.5 w-8 align-top">
          <button
            onClick={toggleExpandir}
            className="text-gray-400 hover:text-gray-700 transition-colors p-0.5"
            aria-label={expandido ? 'Colapsar detalle' : 'Expandir detalle'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${expandido ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </td>
        <td className="px-5 py-2.5">
          <div className="font-medium text-gray-900 truncate max-w-[220px]" title={recompra.nombre_producto}>
            <ProductoLink sku={recompra.sku} nombre={recompra.nombre_producto} />
          </div>
          <div className="text-xs text-gray-500 font-mono">{recompra.sku}</div>
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-500">{recompra.categoria}</td>
        <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
          cada {conConteo(recompra.intervalo_promedio_dias, 'día', 'días')}
        </td>
        <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">
          {formatFechaCorta(recompra.ultima_compra_fecha)}
          <span className="text-gray-500"> (hace {conConteo(recompra.dias_desde_ultima_compra, 'día', 'días')})</span>
        </td>
        <td className="px-3 py-2.5 text-right whitespace-nowrap">
          <span className="text-red-600 font-medium">
            {conConteo(recompra.dias_retraso, 'día de retraso', 'días de retraso')}
          </span>
        </td>
        <td className="px-3 py-2.5 text-center">
          <BadgeUrgencia nivel={nivelUrgencia} />
        </td>
        <td className="px-5 py-2.5 text-right font-medium text-gray-700 whitespace-nowrap">
          {formatMXNTabla(recompra.valor_estimado_mensual)}
        </td>
      </tr>
      {expandido && (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-6 py-4">
            {cargando && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Cargando detalle de cadencia…
              </div>
            )}
            {error && (
              <p className="text-sm text-red-600">Error: {error}</p>
            )}
            {detalle && !cargando && (
              <div>
                <div className="flex gap-4 border-b border-gray-200 mb-4">
                  {(['cadencia', 'uso', 'estacional'] as const).map((t) => {
                    const etiquetas = { cadencia: 'Cadencia', uso: 'Uso', estacional: 'Estacional' };
                    const activo = subTab === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setSubTab(t)}
                        className={`text-xs font-medium px-1 pb-2 -mb-px border-b-2 transition-colors ${
                          activo
                            ? 'border-slate-900 text-slate-900'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {etiquetas[t]}
                      </button>
                    );
                  })}
                </div>
                {subTab === 'cadencia' && <SubTabCadencia detalle={detalle} recompra={recompra} />}
                {subTab === 'uso' && <SubTabUso detalle={detalle} />}
                {subTab === 'estacional' && <SubTabEstacional detalle={detalle} />}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
