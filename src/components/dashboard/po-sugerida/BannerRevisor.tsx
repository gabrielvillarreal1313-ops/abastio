'use client';

/**
 * BannerRevisor — Muestra el estado del revisor y acciones según el caso.
 * 5 estados posibles: sin revisor, revisor=yo, revisor=otro, aprobada, descartada.
 */

import { formatearFechaHora } from '@/lib/textos/formato';
import type { PoSugeridaDetalle } from '@/lib/queries/po-sugerida-detalle';
import type { UsuarioActual } from '@/lib/auth/roles';

interface Props {
  po: PoSugeridaDetalle;
  usuario: UsuarioActual;
  onTomarRevision: () => void;
  guardando: boolean;
}

export function BannerRevisor({ po, usuario, onTomarRevision, guardando }: Props) {
  // Caso 4 — Aprobada
  if (po.estado === 'aprobada') {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 mb-6">
        <p className="text-sm text-emerald-800">
          Esta PO fue aprobada por {po.comprador_nombre_revisor ?? 'un revisor'} el {formatearFechaHora(po.fecha_revision)}.
        </p>
        {po.notas && <p className="text-sm text-emerald-700 italic mt-1">{po.notas}</p>}
      </div>
    );
  }

  // Caso 5 — Descartada
  if (po.estado === 'descartada') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-6">
        <p className="text-sm text-red-800">
          Esta PO fue descartada por {po.comprador_nombre_revisor ?? 'un revisor'} el {formatearFechaHora(po.fecha_revision)}.
        </p>
        {po.notas && <p className="text-sm text-red-700 italic mt-1">{po.notas}</p>}
      </div>
    );
  }

  // Caso 1 — Sin revisor
  if (!po.comprador_id_revisor) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-700">
          Esta PO no tiene revisor asignado. Tómala para empezar a editarla.
        </p>
        <button
          onClick={onTomarRevision}
          disabled={guardando}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {guardando ? 'Tomando...' : 'Tomar revisión'}
        </button>
      </div>
    );
  }

  // Caso 2 — Revisor es el usuario actual
  if (po.comprador_id_revisor === usuario.id) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 mb-6">
        <p className="text-sm text-emerald-800">
          Estás revisando esta PO. Puedes editar cantidades, agregar o eliminar items.
        </p>
      </div>
    );
  }

  // Caso 3 — Revisor es otro
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-6">
      <p className="text-sm text-amber-800">
        Esta PO está siendo revisada por {po.comprador_nombre_revisor}. Puedes verla en modo solo lectura.
      </p>
    </div>
  );
}
