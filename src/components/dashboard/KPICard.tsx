/**
 * KPICard — Tarjeta de KPI individual para el resumen ejecutivo.
 *
 * Muestra un número grande, etiqueta descriptiva, subtítulo opcional,
 * y opcionalmente un indicador de cambio porcentual.
 */

import { formatCambioPct } from '@/lib/textos/formato';

interface KPICardProps {
  label: string;
  value: string;
  /** Texto pequeño debajo del valor (ej: "9 de 30 días") */
  subtitle?: string;
  changePct?: number;
  changeLabel?: string;
}

export function KPICard({ label, value, subtitle, changePct, changeLabel }: KPICardProps) {
  const hasChange = changePct !== undefined && changePct !== null;
  const isPositive = hasChange && changePct >= 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 px-5 py-5">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      )}
      {hasChange && (
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
              isPositive
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-red-700 bg-red-50'
            }`}
          >
            {formatCambioPct(changePct)}
          </span>
          {changeLabel && (
            <span className="text-xs text-gray-400">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
