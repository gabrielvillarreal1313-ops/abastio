/**
 * KPICard — Tarjeta de KPI individual para el resumen ejecutivo.
 *
 * Muestra un número grande, etiqueta descriptiva, subtítulo opcional,
 * y opcionalmente un indicador de cambio porcentual.
 *
 * Identidad visual "Ámbar equilibrado" (Fase 14): labels en uppercase
 * tracking-wide, deltas con paleta verde/rojo estandarizada.
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
    <div className="bg-white rounded-lg border border-[#e2e5ea] shadow-sm px-5 py-5">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      {subtitle && (
        <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
      )}
      {hasChange && (
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
              isPositive
                ? 'text-[#166534] bg-[#f0fdf4]'
                : 'text-[#991b1b] bg-[#fef2f2]'
            }`}
          >
            {formatCambioPct(changePct)}
          </span>
          {changeLabel && (
            <span className="text-[11px] text-slate-500">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
