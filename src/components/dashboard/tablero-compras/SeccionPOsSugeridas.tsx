/**
 * SeccionPOsSugeridas — POs sugeridas persistentes del Tablero de compras.
 * Lee de la tabla po_sugeridas (Fase 3A), no de get_sugerencias_compra en tiempo real.
 * Cada bloque es una PO con link al detalle individual.
 * Server Component.
 */

import Link from 'next/link';
import { formatMXNCorto } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';
import type { PoSugeridaResumen } from '@/lib/queries/pos-sugeridas-pendientes';

interface Props {
  pos: PoSugeridaResumen[];
  usuarioId: string | null;
}

const BADGE_URGENCIA: Record<string, { texto: string; clase: string }> = {
  alta: { texto: 'Urgencia alta', clase: 'text-red-700 bg-red-50' },
  media: { texto: 'Urgencia media', clase: 'text-amber-700 bg-amber-50' },
  baja: { texto: 'Urgencia baja', clase: 'text-blue-700 bg-blue-50' },
};

export function SeccionPOsSugeridas({ pos, usuarioId }: Props) {
  return (
    <section id="pos-sugeridas" className="mb-10 scroll-mt-16">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Órdenes de compra sugeridas pendientes de revisión</h2>
      <p className="text-xs text-gray-500 mb-4 max-w-3xl">
        Órdenes de compra generadas por el sistema, agrupadas por bodega. Revisa, ajusta cantidades,
        y aprueba o descarta cada una. Las que están en revisión por otro comprador se muestran pero solo en modo lectura.
      </p>

      {pos.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 px-8 py-12 text-center">
          <p className="text-gray-500 text-sm">No hay órdenes de compra sugeridas pendientes de revisión.</p>
          <p className="text-gray-500 text-xs mt-1">
            Esto puede significar que tu inventario está saludable, o que aún no has generado órdenes sugeridas para esta sesión.
            Usa el botón &ldquo;Generar órdenes sugeridas&rdquo; en el header para crear nuevas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pos.map((po) => {
            const badgeUrg = BADGE_URGENCIA[po.urgencia] ?? BADGE_URGENCIA.media;
            const revisorEsOtro = po.comprador_id_revisor !== null && po.comprador_id_revisor !== usuarioId;
            const tieneRevisor = po.comprador_id_revisor !== null;

            return (
              <div key={po.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Header del bloque */}
                <div className="px-5 py-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">{po.bodega_nombre}</h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badgeUrg.clase}`}>
                        {badgeUrg.texto}
                      </span>
                      {tieneRevisor && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-amber-700 bg-amber-50">
                          En revisión por {po.comprador_nombre_revisor ?? 'alguien'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {conConteo(po.cantidad_items, 'item por reponer', 'items por reponer')}
                      <span className="text-gray-400 mx-1.5">·</span>
                      ≈ {formatMXNCorto(po.valor_total_estimado)} estimado
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/compras/po/${po.id}`}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex-shrink-0 ${
                      revisorEsOtro
                        ? 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {revisorEsOtro ? 'Ver (en revisión)' : 'Revisar y aprobar →'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
