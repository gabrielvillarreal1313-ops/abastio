/**
 * ReportesAnclados — Secciones compactas de los reportes anclados al dashboard.
 *
 * Fase 13-3: por cada reporte anclado del dueño, renderiza un bloque con las
 * primeras 5-7 filas y un link al Explorer para abrir la vista completa. Si no
 * hay reportes anclados, retorna null — la sección simplemente no existe.
 *
 * Server Component (puro display). La navegación a detalle usa los mismos
 * ClienteLink/ProductoLink/VendedorLink del resto del producto.
 */

import Link from 'next/link';
import type { FilaExplorer } from '@/lib/queries/explorer';
import type { ReporteGuardado } from '@/lib/queries/reportes-guardados';
import { ClienteLink } from '@/components/ui/ClienteLink';
import { ProductoLink } from '@/components/ui/ProductoLink';
import { VendedorLink } from '@/components/ui/VendedorLink';
import { formatMXNTabla } from '@/lib/textos/formato';
import { GraficaCompacta } from '@/components/dashboard/explorer/GraficaCompacta';

// ─── Config de display por dimensión ────────────────────────────────────────

const COL_LABEL_POR_DIMENSION: Record<string, string> = {
  bodegas: 'Bodega',
  vendedores: 'Vendedor',
  clientes: 'Cliente',
  categorias: 'Categoría',
  productos: 'Producto',
  meses: 'Mes',
  ciudades: 'Ciudad',
};

// Cuántas filas mostrar como preview
const MAX_FILAS_PREVIEW = 7;

// ─── Props ──────────────────────────────────────────────────────────────────

export interface ReporteAncladoConDatos {
  reporte: ReporteGuardado;
  datos: FilaExplorer[];
}

interface Props {
  reportes: ReporteAncladoConDatos[];
}

// ─── Componente ─────────────────────────────────────────────────────────────

export function ReportesAnclados({ reportes }: Props) {
  if (!reportes || reportes.length === 0) return null;

  return (
    <div className="space-y-10">
      {reportes.map(({ reporte, datos }) => (
        <BloqueReporte key={reporte.id} reporte={reporte} datos={datos} />
      ))}
    </div>
  );
}

// ─── Bloque de un reporte ───────────────────────────────────────────────────

function BloqueReporte({
  reporte,
  datos,
}: {
  reporte: ReporteGuardado;
  datos: FilaExplorer[];
}) {
  const dimension = reporte.configuracion.dimension;
  const colLabel = COL_LABEL_POR_DIMENSION[dimension] ?? 'Elemento';
  const filasPreview = datos.slice(0, MAX_FILAS_PREVIEW);
  // `vista` es undefined en reportes pre-Fase 15 → tratar como tabla.
  const esGrafica =
    reporte.configuracion.vista === 'grafica' && reporte.configuracion.grafica;

  return (
    <div>
      {/* Título + descripción + link */}
      <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{reporte.nombre}</h2>
          {reporte.descripcion && (
            <p className="text-sm text-gray-500 mt-0.5">{reporte.descripcion}</p>
          )}
        </div>
        <Link
          href={`/dashboard/explorer?reporte=${reporte.id}`}
          className="text-sm text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
        >
          Abrir en Explorer →
        </Link>
      </div>

      {/* Body — gráfica compacta o tabla compacta según vista guardada */}
      {datos.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 px-6 py-6 text-center">
          <p className="text-sm text-gray-500">Este reporte no tiene datos para mostrar.</p>
        </div>
      ) : esGrafica && reporte.configuracion.grafica ? (
        <GraficaCompacta
          filas={datos}
          dimension={dimension}
          configuracion={reporte.configuracion.grafica}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-3 py-2 font-medium">{colLabel}</th>
                  <th className="px-3 py-2 font-medium text-right">Ventas YTD</th>
                  <th className="px-3 py-2 font-medium text-right">Δ Ventas</th>
                  <th className="px-3 py-2 font-medium text-right">GM YTD</th>
                  <th className="px-3 py-2 font-medium text-right">Δ GM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filasPreview.map((fila) => (
                  <FilaPreview key={fila.dimension_id} fila={fila} dimension={dimension} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Fila del preview ───────────────────────────────────────────────────────

function FilaPreview({ fila, dimension }: { fila: FilaExplorer; dimension: string }) {
  const nombre = renderNombreClickeable(fila, dimension);
  const deltaVentasColor = fila.ventas_delta >= 0 ? 'text-emerald-600' : 'text-red-600';
  const deltaGmColor = fila.gm_delta >= 0 ? 'text-emerald-600' : 'text-red-600';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-3 py-2">
        <div className="font-medium text-gray-900">{nombre}</div>
        {fila.dimension_extra && (
          <div className="text-xs text-gray-500 mt-0.5">{fila.dimension_extra}</div>
        )}
      </td>
      <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
        {formatMXNTabla(fila.ventas_ytd)}
      </td>
      <td className={`px-3 py-2 text-right whitespace-nowrap ${deltaVentasColor}`}>
        {fila.ventas_delta_pct === null ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
            Nuevo
          </span>
        ) : (
          <>
            {fila.ventas_delta_pct > 0 ? '+' : ''}
            {fila.ventas_delta_pct.toFixed(1)}%
          </>
        )}
      </td>
      <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
        {formatMXNTabla(fila.gm_ytd)}
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        {fila.gm_delta_pct === null ? (
          <span className="text-xs font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Nuevo</span>
        ) : (
          <span className={deltaGmColor}>
            {fila.gm_delta_pct > 0 ? '+' : ''}
            {fila.gm_delta_pct.toFixed(1)}%
          </span>
        )}
      </td>
    </tr>
  );
}

function renderNombreClickeable(fila: FilaExplorer, dimension: string): React.ReactNode {
  if (dimension === 'clientes') {
    return <ClienteLink clienteId={Number(fila.dimension_id)} nombre={fila.dimension_label} />;
  }
  if (dimension === 'productos') {
    return <ProductoLink sku={fila.dimension_id} nombre={fila.dimension_label} />;
  }
  if (dimension === 'vendedores') {
    return <VendedorLink vendedorId={Number(fila.dimension_id)} nombre={fila.dimension_label} />;
  }
  return <span>{fila.dimension_label}</span>;
}
