'use client';

/**
 * TablaLineasPo — Tabla paginada de líneas de PO con buscador y edición.
 * Paginación visual de 50 líneas por página. Estado editable vive en el padre.
 */

import { useState, useRef, useCallback } from 'react';
import { ProductoLink } from '@/components/ui/ProductoLink';
import { formatMXNTabla, formatUnidades } from '@/lib/textos/formato';
import type { LineaPoSugerida } from '@/lib/queries/po-sugerida-detalle';

const PAGE_SIZE = 50;

interface Props {
  lineasFiltradas: LineaPoSugerida[];
  totalSinFiltro: number;
  busqueda: string;
  puedeEditar: boolean;
  onBusquedaChange: (v: string) => void;
  onCantidadChange: (sku: string, cantidad: number) => void;
  onEliminarLinea: (sku: string) => void;
  onAgregarItem: () => void;
}

export function TablaLineasPo({
  lineasFiltradas, totalSinFiltro, busqueda, puedeEditar,
  onBusquedaChange, onCantidadChange, onEliminarLinea, onAgregarItem,
}: Props) {
  const [paginaActual, setPaginaActual] = useState(1);
  const totalPaginas = Math.ceil(lineasFiltradas.length / PAGE_SIZE);
  const inicio = (paginaActual - 1) * PAGE_SIZE;
  const fin = Math.min(inicio + PAGE_SIZE, lineasFiltradas.length);
  const lineasPaginadas = lineasFiltradas.slice(inicio, fin);

  // Refs para navegación con Enter entre inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      const next = inputRefs.current[idx + 1];
      if (next) next.focus();
    }
  }, []);

  // Reset a página 1 cuando cambia la búsqueda
  const handleBusqueda = (v: string) => {
    onBusquedaChange(v);
    setPaginaActual(1);
  };

  return (
    <div className="mb-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => handleBusqueda(e.target.value)}
          placeholder="Buscar por SKU o nombre..."
          className="block w-80 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
        />
        {puedeEditar && (
          <button
            onClick={onAgregarItem}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar item
          </button>
        )}
      </div>

      {/* Conteo */}
      <p className="text-xs text-gray-400 mb-2">
        Mostrando {inicio + 1}–{fin} de {lineasFiltradas.length} items
        {busqueda.trim() && ` (filtrados de ${totalSinFiltro})`}
      </p>

      {/* Estado vacío */}
      {lineasFiltradas.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 px-8 py-12 text-center">
          {busqueda.trim() ? (
            <p className="text-gray-400 text-sm">
              Ningún item coincide con la búsqueda.{' '}
              <button onClick={() => handleBusqueda('')} className="text-slate-600 underline">
                Limpiar búsqueda
              </button>
            </p>
          ) : (
            <p className="text-gray-400 text-sm">
              Esta orden no tiene ítems. Agrega productos con el botón &lsquo;+ Agregar ítem&rsquo;.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5 font-medium">SKU</th>
                  <th className="px-3 py-2.5 font-medium">Producto</th>
                  <th className="px-2 py-2.5 font-medium text-right">Stock</th>
                  <th className="px-2 py-2.5 font-medium text-right">Mínimo</th>
                  <th className="px-2 py-2.5 font-medium text-right">Sugerida</th>
                  <th className="px-2 py-2.5 font-medium text-right">{puedeEditar ? 'Ajustada' : 'Cantidad'}</th>
                  <th className="px-2 py-2.5 font-medium text-right">Costo/ud</th>
                  <th className="px-2 py-2.5 font-medium text-right">Total línea</th>
                  {puedeEditar && <th className="px-2 py-2.5 w-8"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lineasPaginadas.map((linea, idx) => (
                  <FilaLinea
                    key={linea.sku}
                    linea={linea}
                    puedeEditar={puedeEditar}
                    inputRef={(el) => { inputRefs.current[idx] = el; }}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onCantidadChange={onCantidadChange}
                    onEliminar={onEliminarLinea}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4 mt-3">
          <button
            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300"
          >
            ← Anterior
          </button>
          <span className="text-xs text-gray-500">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componente de fila ─────────────────────────────────────────────────

interface FilaProps {
  linea: LineaPoSugerida;
  puedeEditar: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCantidadChange: (sku: string, cantidad: number) => void;
  onEliminar: (sku: string) => void;
}

function FilaLinea({ linea, puedeEditar, inputRef, onKeyDown, onCantidadChange, onEliminar }: FilaProps) {
  const [valorLocal, setValorLocal] = useState(String(linea.cantidad_ajustada));

  // Sincronizar si la prop cambia externamente
  if (Number(valorLocal) !== linea.cantidad_ajustada && document.activeElement?.getAttribute('data-sku') !== linea.sku) {
    setValorLocal(String(linea.cantidad_ajustada));
  }

  function handleBlur() {
    const num = parseInt(valorLocal, 10);
    if (isNaN(num) || num < 1) {
      setValorLocal(String(linea.cantidad_ajustada)); // restaurar
      return;
    }
    if (num !== linea.cantidad_ajustada) {
      onCantidadChange(linea.sku, num);
    }
  }

  return (
    <tr className="hover:bg-gray-50/50">
      <td className="px-3 py-2">
        <ProductoLink sku={linea.sku} nombre={linea.sku} className="font-mono text-xs" />
      </td>
      <td className="px-3 py-2 max-w-[180px]">
        <div className="text-gray-900 truncate">{linea.nombre_producto}</div>
        <div className="text-[10px] text-gray-500">Lead time: {linea.lead_time_dias ?? 14} días</div>
      </td>
      <td className="px-2 py-2 text-right text-gray-500 tabular-nums text-xs">{formatUnidades(linea.stock_actual)}</td>
      <td className="px-2 py-2 text-right text-gray-500 tabular-nums text-xs">{formatUnidades(linea.minimo_recomendado)}</td>
      <td className="px-2 py-2 text-right text-gray-400 tabular-nums text-xs">
        {linea.cantidad_sugerida != null ? formatUnidades(linea.cantidad_sugerida) : '—'}
      </td>
      <td className="px-2 py-2 text-right">
        {puedeEditar ? (
          <input
            ref={inputRef}
            data-sku={linea.sku}
            type="number"
            min="1"
            step="1"
            value={valorLocal}
            onChange={(e) => setValorLocal(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={onKeyDown}
            className="w-20 text-right rounded border border-gray-200 px-2 py-1 text-sm text-gray-900 tabular-nums"
          />
        ) : (
          <span className="text-gray-900 font-medium tabular-nums">{formatUnidades(linea.cantidad_ajustada)}</span>
        )}
      </td>
      <td className="px-2 py-2 text-right text-gray-500 tabular-nums text-xs">{formatMXNTabla(linea.costo_unitario_proxy)}</td>
      <td className="px-2 py-2 text-right text-gray-900 font-medium tabular-nums text-xs">{formatMXNTabla(linea.total_linea)}</td>
      {puedeEditar && (
        <td className="px-2 py-2">
          <button onClick={() => onEliminar(linea.sku)} className="text-gray-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </td>
      )}
    </tr>
  );
}
