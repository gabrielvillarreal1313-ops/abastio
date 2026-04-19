'use client';

/**
 * ListaReportes — Tabla de reportes guardados del usuario.
 *
 * Fase 13-2: lista con acciones inline (abrir, anclar/desanclar, eliminar).
 * El nombre del reporte linkea al Explorer con `?reporte=<id>` para aplicar
 * la configuración guardada. El toggle de ancla y el delete recargan la
 * página con `?toast=...` para mostrar confirmación vía useToastFromUrl.
 */

import { useState } from 'react';
import Link from 'next/link';
import { toggleAnclaReporte, eliminarReporte, type ReporteGuardado } from '@/lib/queries/reportes-guardados';
import { tiempoRelativo } from '@/lib/textos/formato';
import { useToastFromUrl } from '@/hooks/useToastFromUrl';

// ─── Config de display ──────────────────────────────────────────────────────

const NOMBRE_DIMENSION: Record<string, string> = {
  bodegas: 'Bodegas',
  vendedores: 'Vendedores',
  clientes: 'Clientes',
  categorias: 'Categorías',
  productos: 'Productos',
  meses: 'Meses',
  ciudades: 'Ciudades',
};

function formatFechaReporte(iso: string): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const dias = ms / (1000 * 60 * 60 * 24);
  if (dias < 7) return tiempoRelativo(iso);
  // Fecha corta parseada manualmente para evitar bug de timezone (regla 19)
  const partes = iso.slice(0, 10).split('-');
  if (partes.length !== 3) return '—';
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const anio = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10);
  const dia = parseInt(partes[2], 10);
  return `${dia} ${meses[mes - 1]} ${anio}`;
}

// ─── Componente ─────────────────────────────────────────────────────────────

interface Props {
  reportes: ReporteGuardado[];
  usuarioId: string;
}

export function ListaReportes({ reportes, usuarioId }: Props) {
  useToastFromUrl();
  const [confirmarEliminar, setConfirmarEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [procesando, setProcesando] = useState(false);

  if (reportes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 px-8 py-12 text-center">
        <p className="text-sm text-gray-500">
          No tienes reportes guardados.{' '}
          <Link href="/dashboard/explorer" className="text-slate-700 hover:text-slate-900 underline">
            Crea uno desde el Explorer
          </Link>
          .
        </p>
      </div>
    );
  }

  async function manejarToggleAncla(r: ReporteGuardado) {
    if (procesando) return;
    setProcesando(true);
    try {
      await toggleAnclaReporte(r.id, usuarioId, !r.anclado);
      const toast = r.anclado ? 'reporte_desanclado' : 'reporte_anclado';
      window.location.href = `/dashboard/reportes?toast=${toast}`;
    } catch (e) {
      setProcesando(false);
      alert(e instanceof Error ? e.message : 'Error actualizando ancla');
    }
  }

  async function manejarEliminar() {
    if (!confirmarEliminar || procesando) return;
    setProcesando(true);
    try {
      await eliminarReporte(confirmarEliminar.id, usuarioId);
      window.location.href = '/dashboard/reportes?toast=reporte_eliminado';
    } catch (e) {
      setProcesando(false);
      setConfirmarEliminar(null);
      alert(e instanceof Error ? e.message : 'Error eliminando reporte');
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2.5 font-medium">Nombre</th>
                <th className="px-3 py-2.5 font-medium">Descripción</th>
                <th className="px-3 py-2.5 font-medium">Dimensión</th>
                <th className="px-3 py-2.5 font-medium">Filtros</th>
                <th className="px-3 py-2.5 font-medium text-center">Anclado</th>
                <th className="px-3 py-2.5 font-medium">Fecha</th>
                <th className="px-4 py-2.5 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportes.map((r) => {
                const numFiltros = Object.keys(r.configuracion.filtros ?? {}).length;
                const nombreDim = NOMBRE_DIMENSION[r.configuracion.dimension] ?? r.configuracion.dimension;
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/dashboard/explorer?reporte=${r.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {r.nombre}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-xs">
                      <div className="truncate" title={r.descripcion ?? ''}>
                        {r.descripcion ?? <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">{nombreDim}</td>
                    <td className="px-3 py-2.5">
                      {numFiltros === 0 ? (
                        <span className="text-xs text-gray-400">Sin filtros</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {numFiltros === 1 ? '1 filtro' : `${numFiltros} filtros`}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => manejarToggleAncla(r)}
                        disabled={procesando}
                        aria-label={r.anclado ? 'Desanclar reporte' : 'Anclar reporte'}
                        title={r.anclado ? 'Desanclar' : 'Anclar al dashboard'}
                        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                          r.anclado ? 'text-amber-600' : 'text-gray-400'
                        } disabled:opacity-50`}
                      >
                        {r.anclado ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14l-5-3-5 3V4z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                          </svg>
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">
                      {formatFechaReporte(r.actualizado_en)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => setConfirmarEliminar({ id: r.id, nombre: r.nombre })}
                        aria-label="Eliminar reporte"
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmación */}
      {confirmarEliminar && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => !procesando && setConfirmarEliminar(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">Eliminar reporte</h3>
            <p className="text-sm text-gray-600">
              ¿Eliminar el reporte <span className="font-medium">&ldquo;{confirmarEliminar.nombre}&rdquo;</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmarEliminar(null)}
                disabled={procesando}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={manejarEliminar}
                disabled={procesando}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {procesando ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
