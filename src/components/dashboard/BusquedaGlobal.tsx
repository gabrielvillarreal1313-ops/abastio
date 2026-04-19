'use client';

/**
 * BusquedaGlobal — Barra de búsqueda global en el header del dashboard.
 * Busca simultáneamente en clientes, productos y cotizaciones.
 * Se activa con Ctrl+K / Cmd+K.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { busquedaGlobal, type ResultadoBusquedaGlobal } from '@/lib/queries/busqueda-global';
import { formatMXNTabla } from '@/lib/textos/formato';

const BADGE_TIPO: Record<string, string> = {
  ferreteria_minorista: 'Ferretería',
  constructor: 'Constructor',
  plomero: 'Plomero',
  electricista: 'Electricista',
  carpintero: 'Carpintero',
  industrial: 'Industrial',
  otro: 'Otro',
};

const BADGE_ESTADO: Record<string, { texto: string; clase: string }> = {
  borrador: { texto: 'Borrador', clase: 'text-gray-600 bg-gray-100' },
  enviada: { texto: 'Enviada', clase: 'text-blue-700 bg-blue-50' },
  completada: { texto: 'Completada', clase: 'text-emerald-700 bg-emerald-50' },
  cancelada: { texto: 'Cancelada', clase: 'text-red-700 bg-red-50' },
};

const DEBOUNCE_MS = 300;

export function BusquedaGlobal() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [termino, setTermino] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusquedaGlobal | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);

  // ─── Atajo de teclado: Ctrl+K / Cmd+K ─────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setAbierto(true);
      }
      if (e.key === 'Escape') {
        setAbierto(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Cerrar al hacer clic fuera ────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Búsqueda con debounce ─────────────────────────────────────
  const buscar = useCallback(async (texto: string) => {
    if (texto.trim().length < 2) {
      setResultados(null);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    try {
      const res = await busquedaGlobal(texto.trim());
      setResultados(res);
    } catch {
      setResultados(null);
    } finally {
      setBuscando(false);
    }
  }, []);

  function handleChange(texto: string) {
    setTermino(texto);
    setAbierto(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (texto.trim().length < 2) {
      setResultados(null);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    debounceRef.current = setTimeout(() => buscar(texto), DEBOUNCE_MS);
  }

  function navegar(href: string) {
    setAbierto(false);
    setTermino('');
    setResultados(null);
    router.push(href);
  }

  const hayResultados = resultados &&
    (resultados.clientes.length > 0 || resultados.productos.length > 0 || resultados.cotizaciones.length > 0);
  const sinResultados = resultados && !hayResultados && termino.trim().length >= 2 && !buscando;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Input */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={termino}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (termino.trim().length >= 2) setAbierto(true); }}
          placeholder="Buscar clientes, productos, cotizaciones... (Ctrl+K)"
          className="block w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
        />
        {buscando && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown de resultados */}
      {abierto && (hayResultados || sinResultados) && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-[70vh] overflow-y-auto">

          {/* Sin resultados */}
          {sinResultados && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">No se encontraron resultados para &ldquo;{termino}&rdquo;</p>
            </div>
          )}

          {/* Clientes */}
          {resultados && resultados.clientes.length > 0 && (
            <div>
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Clientes
                  <span className="ml-1.5 text-gray-500 font-normal normal-case">({resultados.conteo_clientes})</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {resultados.clientes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navegar(`/dashboard/clientes/${c.id}`)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{c.nombre}</div>
                      {c.ciudad && <div className="text-xs text-gray-500">{c.ciudad}</div>}
                    </div>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 flex-shrink-0">
                      {BADGE_TIPO[c.tipo] ?? c.tipo}
                    </span>
                  </button>
                ))}
                {resultados.conteo_clientes > 5 && (
                  <button
                    onClick={() => navegar(`/dashboard/clientes?busqueda=${encodeURIComponent(termino)}`)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 font-medium"
                  >
                    Ver los {resultados.conteo_clientes} clientes que coinciden →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Productos */}
          {resultados && resultados.productos.length > 0 && (
            <div>
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Productos
                  <span className="ml-1.5 text-gray-500 font-normal normal-case">({resultados.conteo_productos})</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {resultados.productos.map((p) => (
                  <button
                    key={p.sku}
                    onClick={() => navegar(`/dashboard/productos/${encodeURIComponent(p.sku)}`)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{p.nombre}</div>
                      <div className="text-xs text-gray-500 font-mono">{p.sku}</div>
                    </div>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 flex-shrink-0">
                      {p.categoria}
                    </span>
                  </button>
                ))}
                {resultados.conteo_productos > 5 && (
                  <button
                    onClick={() => navegar(`/dashboard/productos?busqueda=${encodeURIComponent(termino)}`)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 font-medium"
                  >
                    Ver los {resultados.conteo_productos} productos que coinciden →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cotizaciones */}
          {resultados && resultados.cotizaciones.length > 0 && (
            <div>
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cotizaciones</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {resultados.cotizaciones.map((cot) => {
                  const badge = BADGE_ESTADO[cot.estado] ?? BADGE_ESTADO.borrador;
                  return (
                    <button
                      key={cot.id}
                      onClick={() => navegar(`/dashboard/oportunidades/${cot.id}`)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          COT-{String(cot.numero_cotizacion).padStart(4, '0')}
                          <span className="text-gray-500 font-normal ml-2">{cot.cliente_nombre}</span>
                        </div>
                        <div className="text-xs text-gray-500">{formatMXNTabla(cot.subtotal ?? 0)}</div>
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${badge.clase}`}>
                        {badge.texto}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
