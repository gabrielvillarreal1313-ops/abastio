'use client';

/**
 * AgregarItemModal — Modal de búsqueda de productos para agregar a la PO.
 * Reutiliza la query existente buscarProductos().
 */

import { useState, useCallback } from 'react';
import { buscarProductos, type ProductoBusqueda } from '@/lib/queries/productos-busqueda';
import { formatMXNTabla } from '@/lib/textos/formato';

interface Props {
  onAgregar: (producto: ProductoBusqueda) => void;
  onCerrar: () => void;
  skusYaIncluidos: string[];
}

export function AgregarItemModal({ onAgregar, onCerrar, skusYaIncluidos }: Props) {
  const [termino, setTermino] = useState('');
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const debounceRef = useState<ReturnType<typeof setTimeout> | null>(null);

  const buscar = useCallback(async (texto: string) => {
    setTermino(texto);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    if (texto.trim().length < 2) { setResultados([]); setBuscando(false); return; }
    setBuscando(true);
    debounceRef[0] = setTimeout(async () => {
      try {
        const res = await buscarProductos(texto.trim());
        setResultados(res);
      } catch { setResultados([]); }
      finally { setBuscando(false); }
    }, 300);
  }, [debounceRef]);

  const skusSet = new Set(skusYaIncluidos);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[70vh] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Agregar item a la PO</h3>
            <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={termino}
            onChange={(e) => buscar(e.target.value)}
            placeholder="Buscar por SKU o nombre..."
            autoFocus
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {buscando && <p className="px-4 py-3 text-xs text-gray-400">Buscando...</p>}
          {!buscando && termino.trim().length >= 2 && resultados.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No se encontraron productos</p>
          )}
          {resultados.map((p) => {
            const yaIncluido = skusSet.has(p.sku);
            return (
              <div key={p.sku} className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-50">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{p.nombre}</div>
                  <div className="text-xs text-gray-400">
                    <span className="font-mono">{p.sku}</span>
                    <span className="mx-1">·</span>{p.categoria}
                    <span className="mx-1">·</span>{formatMXNTabla(p.costo_unitario)}/ud
                  </div>
                </div>
                {yaIncluido ? (
                  <span className="text-xs text-gray-400 flex-shrink-0">Ya en la PO</span>
                ) : (
                  <button
                    onClick={() => { onAgregar(p); onCerrar(); }}
                    className="text-xs px-3 py-1 rounded bg-slate-900 text-white hover:bg-slate-800 flex-shrink-0"
                  >
                    Agregar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
