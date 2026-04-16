/**
 * OperacionCompras — Sección del Resumen Ejecutivo con estado de la operación de compras.
 * Fase 5-3: da visibilidad al dueño sin entrar al módulo completo.
 */

import Link from 'next/link';
import type { KpisComprador } from '@/lib/queries/kpis-comprador';
import { formatMXNCorto, formatUnidades } from '@/lib/textos/formato';

interface Props {
  data: KpisComprador | null;
}

export function OperacionCompras({ data }: Props) {
  if (!data) return null;

  const pendientesEsCritico = data.pos_pendientes_revision > 0;
  const desabastoEsCritico = data.skus_desabasto_critico > 0;

  return (
    <div>
      {/* Título */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          Operación de compras
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Estado general de la gestión de inventario y compras
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* POs aprobadas este mes */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-5">
          <p className="text-sm font-medium text-gray-500 mb-1">POs aprobadas este mes</p>
          <p className="text-2xl font-semibold text-gray-900 tracking-tight">
            {formatMXNCorto(data.valor_pos_aprobadas_mes)}
          </p>
        </div>

        {/* Pendientes de revisión */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Pendientes de revisión</p>
          <p className={`text-2xl font-semibold tracking-tight ${
            pendientesEsCritico ? 'text-red-700' : 'text-emerald-700'
          }`}>
            {formatUnidades(data.pos_pendientes_revision)}
          </p>
          {pendientesEsCritico && (
            <p className="text-xs text-red-600 mt-0.5">Requieren atención</p>
          )}
        </div>

        {/* SKUs en desabasto crítico */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-5">
          <p className="text-sm font-medium text-gray-500 mb-1">SKUs en desabasto crítico</p>
          <p className={`text-2xl font-semibold tracking-tight ${
            desabastoEsCritico ? 'text-red-700' : 'text-emerald-700'
          }`}>
            {formatUnidades(data.skus_desabasto_critico)}
          </p>
        </div>

        {/* Capital atrapado */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Capital atrapado</p>
          <p className="text-2xl font-semibold text-gray-900 tracking-tight">
            {formatMXNCorto(data.valor_capital_atrapado_total)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Sobrestock + deadstock combinado</p>
        </div>
      </div>

      {/* Link al módulo */}
      <div className="flex justify-end mt-3">
        <Link
          href="/dashboard/compras"
          className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          Ver módulo de compras →
        </Link>
      </div>
    </div>
  );
}
