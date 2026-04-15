'use client';

/**
 * HeaderPoSugerida — Header con título, badges de estado/urgencia, timestamps y totales.
 */

import { tiempoRelativo, formatMXNCorto } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';
import type { PoSugeridaDetalle } from '@/lib/queries/po-sugerida-detalle';

const BADGE_ESTADO: Record<string, { texto: string; clase: string }> = {
  pendiente_revision: { texto: 'Pendiente de revisión', clase: 'text-amber-700 bg-amber-50 border-amber-200' },
  aprobada: { texto: 'Aprobada', clase: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  descartada: { texto: 'Descartada', clase: 'text-gray-600 bg-gray-100 border-gray-200' },
};

const BADGE_URGENCIA: Record<string, { texto: string; clase: string }> = {
  alta: { texto: 'Urgencia alta', clase: 'text-red-700 bg-red-50' },
  media: { texto: 'Urgencia media', clase: 'text-amber-700 bg-amber-50' },
  baja: { texto: 'Urgencia baja', clase: 'text-blue-700 bg-blue-50' },
};

interface Props {
  po: PoSugeridaDetalle;
  cantidadItemsActual: number;
  valorTotalActual: number;
}

export function HeaderPoSugerida({ po, cantidadItemsActual, valorTotalActual }: Props) {
  const badgeEstado = BADGE_ESTADO[po.estado] ?? BADGE_ESTADO.pendiente_revision;
  const badgeUrgencia = BADGE_URGENCIA[po.urgencia] ?? BADGE_URGENCIA.media;
  const modificado = cantidadItemsActual !== po.cantidad_items ||
    Math.round(valorTotalActual) !== Math.round(po.valor_total_estimado);

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Orden de compra sugerida — {po.bodega_nombre}
      </h1>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded border ${badgeEstado.clase}`}>
          {badgeEstado.texto}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${badgeUrgencia.clase}`}>
          {badgeUrgencia.texto}
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Generada {tiempoRelativo(po.generada_en)} · Última actualización {tiempoRelativo(po.actualizada_en)}
      </p>
      <p className="text-sm text-gray-600 mt-1">
        {conConteo(cantidadItemsActual, 'item', 'items')} · {formatMXNCorto(valorTotalActual)}
        {modificado && <span className="text-gray-400 ml-1">(modificado)</span>}
      </p>
    </div>
  );
}
