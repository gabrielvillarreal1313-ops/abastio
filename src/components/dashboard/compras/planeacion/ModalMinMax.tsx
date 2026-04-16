'use client';

/**
 * ModalMinMax.tsx — Modal para configurar override de min/max por par producto-bodega.
 *
 * Permite elegir entre valores recomendados (calculados) o valores personalizados
 * con motivo obligatorio. Incluye historial de cambios previos del par.
 */

import { useState, useEffect, useCallback } from 'react';
import { upsertMinMaxOverride } from '@/lib/queries/min-max-overrides';
import { getCalculoRecomendado, type CalculoRecomendado } from '@/lib/queries/calculo-recomendado';
import { getHistorialComprador, type HistorialAccion } from '@/lib/queries/historial-comprador';
import { formatearFechaHora, formatUnidades } from '@/lib/textos/formato';

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface Props {
  productoId: string;
  bodegaId: number;
  productoNombre: string;
  bodegaNombre: string;
  productoSku: string;
  usuarioId: string;
  minActual: number;
  maxActual: number;
  minRecomendado: number;
  abierto: boolean;
  onCerrar: () => void;
}

type TipoSeleccion = 'recomendado' | 'personalizado' | '';

// ─── Componente ─────────────────────────────────────────────────────────────

export function ModalMinMax({
  productoId,
  bodegaId,
  productoNombre,
  bodegaNombre,
  productoSku,
  usuarioId,
  minActual,
  maxActual,
  minRecomendado,
  abierto,
  onCerrar,
}: Props) {
  // Estado del formulario
  const [tipo, setTipo] = useState<TipoSeleccion>('');
  const [minPersonalizado, setMinPersonalizado] = useState<string>('');
  const [maxPersonalizado, setMaxPersonalizado] = useState<string>('');
  const [motivo, setMotivo] = useState('');

  // Datos cargados
  const [calculo, setCalculo] = useState<CalculoRecomendado | null>(null);
  const [historial, setHistorial] = useState<HistorialAccion[]>([]);
  const [formulaVisible, setFormulaVisible] = useState(false);

  // Estado de carga y errores
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Cargar datos al abrir
  const cargarDatos = useCallback(async () => {
    if (!abierto) return;
    setCargando(true);
    setError(null);

    try {
      const [calc, hist] = await Promise.all([
        getCalculoRecomendado(productoId, bodegaId),
        getHistorialComprador(usuarioId, { entidadTipo: 'inventario' }),
      ]);

      setCalculo(calc);

      // Filtrar historial para este par producto-bodega específico
      const histFiltrado = hist.filter((h) => {
        const meta = h.metadata ?? {};
        return (
          String(meta.producto_id ?? '') === productoId &&
          Number(meta.bodega_id ?? 0) === bodegaId
        );
      });
      setHistorial(histFiltrado);

      // Pre-selección basada en acciones previas (regla 28 de CLAUDE.md)
      // Si hay historial de overrides para este par, usar el tipo de la última acción.
      // Si no hay historial, nadie ha tocado este ítem → no pre-seleccionar nada.
      if (histFiltrado.length > 0) {
        const ultimaAccion = histFiltrado[0]; // ya viene ORDER BY creada_en DESC
        const ultimoTipo = (ultimaAccion.metadata?.tipo_seleccion as string) ?? 'personalizado';
        if (ultimoTipo === 'recomendado') {
          setTipo('recomendado');
          setMinPersonalizado('');
          setMaxPersonalizado('');
        } else {
          setTipo('personalizado');
          setMinPersonalizado(String(minActual));
          setMaxPersonalizado(String(maxActual));
        }
      } else {
        // Nadie ha intervenido → no pre-seleccionar, el comprador decide
        setTipo('' as TipoSeleccion);
        setMinPersonalizado('');
        setMaxPersonalizado('');
      }
      setMotivo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setCargando(false);
    }
  }, [abierto, productoId, bodegaId, usuarioId, minActual, maxActual, minRecomendado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ─── Validación ─────────────────────────────────────────────────────────

  function validar(): boolean {
    setErrorValidacion(null);

    if (tipo === '') {
      setErrorValidacion('Selecciona una opción antes de guardar.');
      return false;
    }

    if (tipo === 'recomendado') {
      if (!calculo || calculo.demandaDiariaPromedio <= 0) {
        setErrorValidacion('No se puede aplicar recomendado: demanda diaria es 0.');
        return false;
      }
      return true;
    }

    if (tipo === 'personalizado') {
      const min = Number(minPersonalizado);
      const max = Number(maxPersonalizado);

      if (isNaN(min) || min < 0) {
        setErrorValidacion('El mínimo debe ser un número mayor o igual a 0.');
        return false;
      }
      if (isNaN(max) || max < 0) {
        setErrorValidacion('El máximo debe ser un número mayor o igual a 0.');
        return false;
      }
      if (min > max) {
        setErrorValidacion('El mínimo no puede ser mayor que el máximo.');
        return false;
      }
      if ((motivo ?? '').trim().length < 10) {
        setErrorValidacion('El motivo debe tener al menos 10 caracteres.');
        return false;
      }
      return true;
    }

    return true;
  }

  // ─── Guardar ────────────────────────────────────────────────────────────

  async function handleGuardar() {
    if (!validar()) return;
    setGuardando(true);
    setError(null);

    try {
      let minVal = 0;
      let maxVal = 0;
      let notas: string | null = null;

      if (tipo === 'recomendado' && calculo) {
        minVal = calculo.minimoCalculado;
        maxVal = calculo.maximoCalculado;
      } else if (tipo === 'personalizado') {
        minVal = Number(minPersonalizado);
        maxVal = Number(maxPersonalizado);
        notas = motivo.trim();
      }

      await upsertMinMaxOverride({
        producto_id: productoId,
        bodega_id: bodegaId,
        tipo_seleccion: tipo as 'recomendado' | 'personalizado',
        minimo: minVal,
        maximo: maxVal,
        notas,
        usuario_id: usuarioId,
      });

      // Regla 13: después de mutaciones, window.location.href
      // Forzar ?tab=planeacion para que el refresh vuelva al tab correcto
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'planeacion');
      url.searchParams.set('toast', 'override_guardado');
      window.location.href = url.toString();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando override');
      setGuardando(false);
    }
  }

  // ─── Texto de cambio en historial ───────────────────────────────────────

  function textoDelCambio(accion: HistorialAccion): string {
    const meta = accion.metadata ?? {};
    const minAnterior = meta.minimo_anterior;
    const maxAnterior = meta.maximo_anterior;
    const minNuevo = meta.minimo_nuevo;
    const maxNuevo = meta.maximo_nuevo;
    const tipoSel = (meta.tipo_seleccion as string) ?? '';

    const partes: string[] = [];
    if (minAnterior != null && minNuevo != null) {
      partes.push(`Mínimo: ${formatUnidades(Number(minAnterior))} → ${formatUnidades(Number(minNuevo))}`);
    }
    if (maxAnterior != null && maxNuevo != null) {
      partes.push(`Máximo: ${formatUnidades(Number(maxAnterior))} → ${formatUnidades(Number(maxNuevo))}`);
    }
    if (tipoSel) {
      const etiquetas: Record<string, string> = {
        recomendado: 'Recomendado',
        personalizado: 'Personalizado',
        actual_erp: 'ERP',
      };
      partes.push(`Tipo: ${etiquetas[tipoSel] ?? tipoSel}`);
    }
    return partes.length > 0 ? partes.join(', ') : 'Modificación registrada';
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCerrar}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Configurar mín/máx</h3>
            <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm font-medium text-gray-900 mt-1">{productoNombre}</p>
          <p className="text-xs text-gray-500">{productoSku} · {bodegaNombre}</p>
        </div>

        <div className="px-6 py-4 space-y-5">
          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900" />
              <span className="ml-3 text-sm text-gray-500">Cargando datos...</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              {/* ─── Valores actuales (contexto) ─────────────────────── */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Valores actuales</p>
                <p className="text-sm text-gray-700">Mín: {formatUnidades(minActual)} · Máx: {formatUnidades(maxActual)}</p>
              </div>

              {/* ─── Opción 1: Recomendado ──────────────────────────── */}
              <label
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  tipo === 'recomendado' ? 'border-slate-900 bg-slate-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="tipo_seleccion"
                  value="recomendado"
                  checked={tipo === 'recomendado'}
                  onChange={() => setTipo('recomendado')}
                  className="mt-0.5 accent-slate-900"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">Recomendado</span>
                    {calculo && calculo.demandaDiariaPromedio > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setFormulaVisible(!formulaVisible);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="Ver fórmula de cálculo"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {calculo && calculo.demandaDiariaPromedio > 0 ? (
                    <p className="text-xs text-gray-500 mt-1">
                      Mín: {formatUnidades(calculo.minimoCalculado)} · Máx: {formatUnidades(calculo.maximoCalculado)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">Sin demanda registrada para calcular</p>
                  )}

                  {/* Fórmula expandida */}
                  {formulaVisible && calculo && calculo.demandaDiariaPromedio > 0 && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 space-y-2">
                      <div>
                        <p className="font-medium text-gray-700">Mínimo recomendado</p>
                        <p>Demanda diaria promedio (últimos {calculo.ventanaDias} días): <strong>{calculo.demandaDiariaPromedio.toFixed(2)} unidades</strong></p>
                        <p>× Días de cobertura: <strong>{calculo.diasCoberturaMinimo}</strong></p>
                        <p>= Mínimo recomendado: <strong>{formatUnidades(calculo.minimoCalculado)} unidades</strong></p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Máximo recomendado</p>
                        <p>Demanda diaria promedio (últimos {calculo.ventanaDias} días): <strong>{calculo.demandaDiariaPromedio.toFixed(2)} unidades</strong></p>
                        <p>× Días de cobertura: <strong>{calculo.diasCoberturaMaximo}</strong></p>
                        <p>= Máximo recomendado: <strong>{formatUnidades(calculo.maximoCalculado)} unidades</strong></p>
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* ─── Opción 2: Personalizado ────────────────────────── */}
              <label
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  tipo === 'personalizado' ? 'border-slate-900 bg-slate-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="tipo_seleccion"
                  value="personalizado"
                  checked={tipo === 'personalizado'}
                  onChange={() => setTipo('personalizado')}
                  className="mt-0.5 accent-slate-900"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Personalizado</span>

                  {tipo === 'personalizado' && (
                    <div className="mt-3 space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
                          <input
                            type="number"
                            min="0"
                            value={minPersonalizado}
                            onChange={(e) => setMinPersonalizado(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Máximo</label>
                          <input
                            type="number"
                            min="0"
                            value={maxPersonalizado}
                            onChange={(e) => setMaxPersonalizado(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Motivo del ajuste <span className="text-gray-400">(mínimo 10 caracteres)</span>
                        </label>
                        <textarea
                          value={motivo}
                          onChange={(e) => setMotivo(e.target.value)}
                          rows={2}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none resize-none"
                          placeholder="Ej: Ajuste por temporada alta de construcción"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {(motivo ?? '').trim().length}/10 caracteres
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Validación */}
              {errorValidacion && (
                <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">{errorValidacion}</div>
              )}

              {/* ─── Botones ───────────────────────────────────────── */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={onCerrar}
                  disabled={guardando}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>

              {/* ─── Historial ─────────────────────────────────────── */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Historial de cambios
                </h4>
                {historial.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">Este ítem no ha sido modificado.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {historial.map((h) => (
                      <div key={h.accion_id} className="rounded-md bg-gray-50 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-gray-600">{textoDelCambio(h)}</p>
                          <p className="text-xs text-gray-400 whitespace-nowrap">
                            {formatearFechaHora(h.creada_en)}
                          </p>
                        </div>
                        {h.notas && (
                          <p className="text-xs text-gray-400 mt-1 italic">{h.notas}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
