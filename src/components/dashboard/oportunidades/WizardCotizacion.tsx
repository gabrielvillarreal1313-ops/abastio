'use client';

/**
 * WizardCotizacion — Wizard de 3 pasos para crear cotizaciones.
 * Paso 1: Header (cliente, vendedor, fecha, notas)
 * Paso 2: Líneas (tabla editable + panel de recomendaciones)
 * Paso 3: Revisión (resumen read-only + guardar/enviar)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatMXN, formatMXNTabla, formatPct } from '@/lib/textos/formato';
import { conConteo } from '@/lib/textos/pluralizar';
import { getPrecioClienteSKU } from '@/lib/queries/precio-cliente-sku';
import { buscarProductos } from '@/lib/queries/productos-busqueda';
import { getRecomprasCliente } from '@/lib/queries/oportunidades-cliente';
import { getCrossSellCliente } from '@/lib/queries/oportunidades-cliente';
import { getClienteComproUnaVez } from '@/lib/queries/cliente-compro-una-vez';
import { crearCotizacion, agregarLineaCotizacion, actualizarEstadoCotizacion, actualizarCotizacionHeader, reemplazarLineasCotizacion } from '@/lib/queries/cotizacion-mutations';
import { getCotizacionDetalle, getCotizacionLineas } from '@/lib/queries/cotizacion-detalle';
import type { RecompraCliente, CrossSellCliente } from '@/lib/queries/oportunidades-cliente';
import type { ComproUnaVez } from '@/lib/queries/cliente-compro-una-vez';
import type { ProductoBusqueda } from '@/lib/queries/productos-busqueda';

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface ClienteSimple {
  id: number;
  nombre: string;
  tipo: string;
  vendedor_principal: string;
}

interface VendedorSimple {
  id: number;
  nombre: string;
}

interface LineaCotizacion {
  key: string; // ID temporal client-side
  sku: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
  descuento_pct: number;
  origen: 'recompra' | 'cross_sell' | 'una_vez' | 'manual';
}

interface Props {
  clientes: ClienteSimple[];
  vendedores: VendedorSimple[];
}

// ─── Auto-guardado en localStorage ──────────────────────────────────────────

const STORAGE_KEY_NUEVO = 'cotizacion_borrador_wizard';
const STORAGE_KEY_EDITAR = (id: string) => `cotizacion_editar_${id}`;
const AUTOSAVE_DEBOUNCE_MS = 500;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas

interface BorradorAutoguardado {
  paso: number;
  header: {
    clienteId: number | null;
    clienteNombre: string | null;
    vendedorId: number | null;
    fechaVencimiento: string;
    notas: string;
  };
  lineas: {
    sku: string;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    costoUnitario: number;
    descuentoPct: number;
    origen: string;
  }[];
  editandoId: string | null;
  timestamp: number;
}

/** Guarda en localStorage de forma segura (no rompe si no está disponible). */
function guardarBorrador(key: string, data: BorradorAutoguardado): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage no disponible (modo incógnito, storage lleno) — ignorar
  }
}

/** Lee un borrador de localStorage. Retorna null si no existe o está expirado. */
function leerBorrador(key: string): BorradorAutoguardado | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data: BorradorAutoguardado = JSON.parse(raw);
    if (Date.now() - data.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function limpiarBorrador(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignorar
  }
}

/** Texto relativo: "hace X segundos/minutos" */
function tiempoRelativo(timestamp: number): string {
  const segs = Math.floor((Date.now() - timestamp) / 1000);
  if (segs < 10) return 'hace unos segundos';
  if (segs < 60) return `hace ${segs} segundos`;
  const mins = Math.floor(segs / 60);
  if (mins === 1) return 'hace 1 minuto';
  return `hace ${mins} minutos`;
}

// ─── Helpers de cálculo (client-side, no son agregaciones analíticas) ────────

function precioFinal(precio: number, descuento: number): number {
  return precio * (1 - descuento / 100);
}

function totalLinea(precio: number, descuento: number, cantidad: number): number {
  return precioFinal(precio, descuento) * cantidad;
}

function margenPct(precio: number, descuento: number, costo: number): number {
  const pf = precioFinal(precio, descuento);
  return pf > 0 ? ((pf - costo) / pf) * 100 : 0;
}

function generarKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Stepper visual ─────────────────────────────────────────────────────────

const PASOS = ['Información', 'Productos', 'Revisión'];

function Stepper({ pasoActual }: { pasoActual: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {PASOS.map((label, i) => {
        const completado = i < pasoActual;
        const activo = i === pasoActual;
        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div className={`w-16 h-0.5 ${completado ? 'bg-slate-900' : 'bg-gray-200'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                completado ? 'bg-slate-900 text-white'
                  : activo ? 'bg-slate-900 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {completado ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-xs ${activo || completado ? 'text-slate-900 font-medium' : 'text-gray-400'}`}>{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export function WizardCotizacion({ clientes, vendedores }: Props) {
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get('cliente_id');
  const editarId = searchParams.get('editar');
  const modoEdicion = Boolean(editarId);

  // ─── Estado del wizard ──────────────────────────────────────────
  const [paso, setPaso] = useState(0);
  const [cargandoEdicion, setCargandoEdicion] = useState(modoEdicion);

  // Paso 1: Header
  const [clienteId, setClienteId] = useState<number | null>(
    clienteIdParam ? parseInt(clienteIdParam, 10) : null
  );
  const [vendedorId, setVendedorId] = useState<number | null>(null);
  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [notas, setNotas] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');

  // Paso 2: Líneas
  const [lineas, setLineas] = useState<LineaCotizacion[]>([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ProductoBusqueda[]>([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);

  // Recomendaciones (cargadas cuando se selecciona cliente)
  const [recompras, setRecompras] = useState<RecompraCliente[]>([]);
  const [comproUnaVez, setComproUnaVez] = useState<ComproUnaVez[]>([]);
  const [crossSell, setCrossSell] = useState<CrossSellCliente[]>([]);
  const [cargandoRecs, setCargandoRecs] = useState(false);

  // Paso 3: Guardado
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState('');

  // Auto-guardado
  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);
  const [borradorRecuperado, setBorradorRecuperado] = useState<BorradorAutoguardado | null>(null);
  const [ultimoAutoguardado, setUltimoAutoguardado] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoguardadoActivo = useRef(true); // se desactiva al guardar exitosamente

  // ─── Efectos ────────────────────────────────────────────────────

  // Cargar datos existentes en modo edición
  useEffect(() => {
    if (!editarId) return;
    (async () => {
      try {
        const [detalle, lineasExistentes] = await Promise.all([
          getCotizacionDetalle(editarId),
          getCotizacionLineas(editarId),
        ]);
        if (!detalle || detalle.estado !== 'borrador') {
          // No es borrador — redirigir al detalle read-only
          window.location.href = `/dashboard/oportunidades/${editarId}`;
          return;
        }
        setClienteId(detalle.cliente_id);
        setVendedorId(detalle.vendedor_id);
        setNotas(detalle.notas ?? '');
        if (detalle.fecha_vencimiento) {
          setFechaVencimiento(detalle.fecha_vencimiento.split('T')[0]);
        }
        setLineas(lineasExistentes.map((l) => ({
          key: generarKey(),
          sku: l.sku,
          nombre_producto: l.nombre_producto,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          costo_unitario: l.costo_unitario,
          descuento_pct: l.descuento_pct,
          origen: l.origen as LineaCotizacion['origen'],
        })));
      } catch (err) {
        setToast(`Error cargando cotización: ${err instanceof Error ? err.message : 'desconocido'}`);
      } finally {
        setCargandoEdicion(false);
      }
    })();
  }, [editarId]);

  // Auto-llenar vendedor al seleccionar cliente (solo en modo creación)
  useEffect(() => {
    if (!clienteId || modoEdicion) return;
    const cliente = clientes.find((c) => c.id === clienteId);
    if (cliente) {
      const vendedor = vendedores.find((v) => v.nombre === cliente.vendedor_principal);
      if (vendedor) setVendedorId(vendedor.id);
    }
  }, [clienteId, clientes, vendedores, modoEdicion]);

  // Cargar recomendaciones cuando se selecciona cliente
  useEffect(() => {
    if (!clienteId) return;
    setCargandoRecs(true);
    Promise.all([
      getRecomprasCliente(clienteId),
      getClienteComproUnaVez(clienteId),
      getCrossSellCliente(clienteId),
    ]).then(([r, u, cs]) => {
      setRecompras(r);
      setComproUnaVez(u);
      setCrossSell(cs);
    }).finally(() => setCargandoRecs(false));
  }, [clienteId]);

  // Recuperar borrador de localStorage al montar
  useEffect(() => {
    if (editarId) {
      // Modo edición: verificar si hay cambios no guardados para este UUID
      const borrador = leerBorrador(STORAGE_KEY_EDITAR(editarId));
      if (borrador) {
        setBorradorRecuperado(borrador);
        setMostrarRecuperacion(true);
      }
    } else if (!clienteIdParam) {
      // Modo creación sin cliente preseleccionado: verificar borrador nuevo
      const borrador = leerBorrador(STORAGE_KEY_NUEVO);
      if (borrador) {
        setBorradorRecuperado(borrador);
        setMostrarRecuperacion(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  // Auto-guardar estado con debounce de 500ms
  const storageKey = editarId ? STORAGE_KEY_EDITAR(editarId) : STORAGE_KEY_NUEVO;

  useEffect(() => {
    if (!autoguardadoActivo.current) return;
    // No guardar si no hay datos relevantes aún (wizard vacío)
    if (!clienteId && lineas.length === 0) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const clienteNombre = clientes.find((c) => c.id === clienteId)?.nombre ?? null;
      const data: BorradorAutoguardado = {
        paso,
        header: {
          clienteId,
          clienteNombre,
          vendedorId,
          fechaVencimiento,
          notas,
        },
        lineas: lineas.map((l) => ({
          sku: l.sku,
          nombreProducto: l.nombre_producto,
          cantidad: l.cantidad,
          precioUnitario: l.precio_unitario,
          costoUnitario: l.costo_unitario,
          descuentoPct: l.descuento_pct,
          origen: l.origen,
        })),
        editandoId: editarId,
        timestamp: Date.now(),
      };
      guardarBorrador(storageKey, data);
      setUltimoAutoguardado(data.timestamp);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [paso, clienteId, vendedorId, fechaVencimiento, notas, lineas, editarId, storageKey, clientes]);

  // Actualizar texto relativo del indicador cada 15 segundos
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (!ultimoAutoguardado) return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), 15_000);
    return () => clearInterval(interval);
  }, [ultimoAutoguardado]);

  /** Restaura el estado desde un borrador recuperado */
  const restaurarBorrador = useCallback((borrador: BorradorAutoguardado) => {
    setPaso(borrador.paso);
    setClienteId(borrador.header.clienteId);
    setVendedorId(borrador.header.vendedorId);
    setFechaVencimiento(borrador.header.fechaVencimiento);
    setNotas(borrador.header.notas);
    setLineas(borrador.lineas.map((l) => ({
      key: generarKey(),
      sku: l.sku,
      nombre_producto: l.nombreProducto,
      cantidad: l.cantidad,
      precio_unitario: l.precioUnitario,
      costo_unitario: l.costoUnitario,
      descuento_pct: l.descuentoPct,
      origen: l.origen as LineaCotizacion['origen'],
    })));
    setUltimoAutoguardado(borrador.timestamp);
    setMostrarRecuperacion(false);
    setBorradorRecuperado(null);
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────

  const clientesFiltrados = busquedaCliente.trim()
    ? clientes.filter((c) => c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()))
    : clientes;

  const clienteSeleccionado = clientes.find((c) => c.id === clienteId);

  // Búsqueda de productos con debounce manual
  const handleBuscarProducto = useCallback(async (termino: string) => {
    setBusquedaProducto(termino);
    if (termino.trim().length < 2) {
      setResultadosBusqueda([]);
      return;
    }
    setBuscandoProducto(true);
    try {
      const resultados = await buscarProductos(termino);
      // Excluir productos ya agregados
      const skusEnLineas = new Set(lineas.map((l) => l.sku));
      setResultadosBusqueda(resultados.filter((r) => !skusEnLineas.has(r.sku)));
    } finally {
      setBuscandoProducto(false);
    }
  }, [lineas]);

  const agregarProducto = useCallback(async (
    sku: string,
    nombre: string,
    origen: LineaCotizacion['origen'],
    cantidadDefault?: number,
  ) => {
    // Evitar duplicados
    if (lineas.some((l) => l.sku === sku)) return;

    // Obtener precio del cliente
    let precio = 0;
    let costo = 0;
    if (clienteId) {
      try {
        const p = await getPrecioClienteSKU(clienteId, sku);
        precio = p.precio_unitario;
        costo = p.costo_unitario;
      } catch {
        // Si falla, usar 0 y el usuario edita manualmente
      }
    }

    setLineas((prev) => [...prev, {
      key: generarKey(),
      sku,
      nombre_producto: nombre,
      cantidad: cantidadDefault ?? 1,
      precio_unitario: precio,
      costo_unitario: costo,
      descuento_pct: 0,
      origen,
    }]);

    setBusquedaProducto('');
    setResultadosBusqueda([]);
  }, [clienteId, lineas]);

  const actualizarLinea = useCallback((key: string, campo: keyof LineaCotizacion, valor: number) => {
    setLineas((prev) => prev.map((l) =>
      l.key === key ? { ...l, [campo]: valor } : l
    ));
  }, []);

  const eliminarLinea = useCallback((key: string) => {
    setLineas((prev) => prev.filter((l) => l.key !== key));
  }, []);

  // Totales
  const subtotal = lineas.reduce((s, l) => s + totalLinea(l.precio_unitario, l.descuento_pct, l.cantidad), 0);
  const gananciaBruta = lineas.reduce((s, l) => {
    const pf = precioFinal(l.precio_unitario, l.descuento_pct);
    return s + (pf - l.costo_unitario) * l.cantidad;
  }, 0);
  const margenBruto = subtotal > 0 ? (gananciaBruta / subtotal) * 100 : 0;

  // ─── Guardar cotización ─────────────────────────────────────────

  const guardar = useCallback(async (estado: 'borrador' | 'enviada') => {
    if (!clienteId || !vendedorId || lineas.length === 0) return;
    setGuardando(true);
    try {
      let cotId: string;

      if (modoEdicion && editarId) {
        // Modo edición: actualizar header y reemplazar líneas
        cotId = editarId;
        await actualizarCotizacionHeader(cotId, vendedorId, notas || undefined, fechaVencimiento);
        await reemplazarLineasCotizacion(cotId, lineas.map((l) => ({
          sku: l.sku,
          nombre_producto: l.nombre_producto,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          costo_unitario: l.costo_unitario,
          descuento_pct: l.descuento_pct,
          origen: l.origen === 'una_vez' ? 'manual' : l.origen,
        })));
      } else {
        // Modo creación: crear cotización y agregar líneas
        cotId = await crearCotizacion(
          clienteId, vendedorId, notas || undefined, fechaVencimiento
        );
        for (const l of lineas) {
          await agregarLineaCotizacion(
            cotId, l.sku, l.cantidad, l.precio_unitario, l.costo_unitario,
            l.descuento_pct, l.origen === 'una_vez' ? 'manual' : l.origen
          );
        }
      }

      // Limpiar auto-guardado de localStorage al guardar exitosamente
      autoguardadoActivo.current = false;
      limpiarBorrador(storageKey);

      if (estado === 'enviada') {
        await actualizarEstadoCotizacion(cotId, 'enviada');
        setToast('Cotización enviada. Integración con ERP disponible en V1.');
        setTimeout(() => { window.location.href = '/dashboard/oportunidades?tab=cotizaciones'; }, 1500);
      } else if (modoEdicion) {
        setToast('Cotización actualizada.');
        setTimeout(() => { window.location.href = `/dashboard/oportunidades/${cotId}`; }, 1500);
      } else {
        setToast('Cotización guardada como borrador.');
        setTimeout(() => { window.location.href = '/dashboard/oportunidades?tab=borradores'; }, 1500);
      }
    } catch (err) {
      setToast(`Error: ${err instanceof Error ? err.message : 'desconocido'}`);
    } finally {
      setGuardando(false);
    }
  }, [clienteId, vendedorId, lineas, notas, fechaVencimiento, modoEdicion, editarId, storageKey]);

  // ─── Render ─────────────────────────────────────────────────────

  // Cargando datos en modo edición
  if (cargandoEdicion) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-400 text-sm">Cargando cotización...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Banner de recuperación de borrador */}
      {mostrarRecuperacion && borradorRecuperado && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm text-blue-800">
              Tienes una cotización sin terminar
              {borradorRecuperado.header.clienteNombre
                ? <> para <span className="font-semibold">{borradorRecuperado.header.clienteNombre}</span></>
                : null
              }.
              <span className="text-blue-600 ml-1">
                Guardada {tiempoRelativo(borradorRecuperado.timestamp)}.
              </span>
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => {
                limpiarBorrador(storageKey);
                setMostrarRecuperacion(false);
                setBorradorRecuperado(null);
              }}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={() => restaurarBorrador(borradorRecuperado)}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      <Stepper pasoActual={paso} />

      {/* ═══ Paso 1: Header ═══════════════════════════════════════ */}
      {paso === 0 && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <input
                type="text"
                value={clienteSeleccionado ? clienteSeleccionado.nombre : busquedaCliente}
                onChange={(e) => { if (!modoEdicion) { setBusquedaCliente(e.target.value); setClienteId(null); } }}
                placeholder="Buscar cliente por nombre..."
                readOnly={modoEdicion}
                className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${modoEdicion ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              {!clienteId && busquedaCliente.trim() && (
                <div className="border border-gray-200 rounded-md mt-1 max-h-48 overflow-y-auto bg-white shadow-lg">
                  {clientesFiltrados.slice(0, 10).map((c) => (
                    <button key={c.id} type="button" onClick={() => { setClienteId(c.id); setBusquedaCliente(''); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50">
                      <span className="font-medium text-gray-900">{c.nombre}</span>
                      <span className="text-xs text-gray-400 ml-2">{c.tipo}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vendedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
              <select value={vendedorId ?? ''} onChange={(e) => setVendedorId(Number(e.target.value) || null)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
                <option value="">Seleccionar vendedor</option>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </div>

            {/* Fecha vencimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Válida hasta</label>
              <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)}
                className="block w-48 rounded-md border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500" />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} placeholder="Notas internas (opcional)"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500" />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button onClick={() => setPaso(1)} disabled={!clienteId}
              className="px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium disabled:opacity-40 hover:bg-slate-800 transition-colors">
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* ═══ Paso 2: Líneas ═══════════════════════════════════════ */}
      {paso === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabla de líneas (2/3) */}
          <div className="lg:col-span-2">
            {/* Buscador de productos */}
            <div className="mb-4 relative">
              <input type="text" value={busquedaProducto}
                onChange={(e) => handleBuscarProducto(e.target.value)}
                placeholder="+ Agregar producto (buscar por SKU o nombre)..."
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500" />
              {resultadosBusqueda.length > 0 && (
                <div className="absolute z-10 w-full border border-gray-200 rounded-md mt-1 max-h-48 overflow-y-auto bg-white shadow-lg">
                  {resultadosBusqueda.map((p) => (
                    <button key={p.sku} type="button"
                      onClick={() => agregarProducto(p.sku, p.nombre, 'manual')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50">
                      <span className="font-mono text-xs text-gray-400 mr-2">{p.sku}</span>
                      <span className="text-gray-900">{p.nombre}</span>
                      <span className="text-xs text-gray-400 ml-2">{p.categoria}</span>
                    </button>
                  ))}
                </div>
              )}
              {buscandoProducto && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}
            </div>

            {/* Tabla */}
            {lineas.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                        <th className="px-3 py-2 font-medium">Producto</th>
                        <th className="px-2 py-2 font-medium text-right w-20">Cantidad</th>
                        <th className="px-2 py-2 font-medium text-right w-24">Precio</th>
                        <th className="px-2 py-2 font-medium text-right w-16">Desc. %</th>
                        <th className="px-2 py-2 font-medium text-right">P. final</th>
                        <th className="px-2 py-2 font-medium text-right">Margen</th>
                        <th className="px-2 py-2 font-medium text-right">Total</th>
                        <th className="px-2 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {lineas.map((l) => (
                        <tr key={l.key}>
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-900 truncate max-w-[160px]">{l.nombre_producto}</div>
                            <div className="text-xs text-gray-400 font-mono">{l.sku}</div>
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" min="1" step="1" value={l.cantidad}
                              onChange={(e) => actualizarLinea(l.key, 'cantidad', Number(e.target.value) || 1)}
                              className="w-full text-right rounded border border-gray-200 px-2 py-1 text-sm text-slate-900" />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" min="0" step="0.01" value={l.precio_unitario}
                              onChange={(e) => actualizarLinea(l.key, 'precio_unitario', Number(e.target.value) || 0)}
                              className="w-full text-right rounded border border-gray-200 px-2 py-1 text-sm text-slate-900" />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" min="0" max="100" step="0.5" value={l.descuento_pct}
                              onChange={(e) => actualizarLinea(l.key, 'descuento_pct', Number(e.target.value) || 0)}
                              className="w-full text-right rounded border border-gray-200 px-2 py-1 text-sm text-slate-900" />
                          </td>
                          <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap text-xs">
                            {formatMXNTabla(precioFinal(l.precio_unitario, l.descuento_pct))}
                          </td>
                          <td className="px-2 py-2 text-right whitespace-nowrap text-xs">
                            <span className={margenPct(l.precio_unitario, l.descuento_pct, l.costo_unitario) < 15 ? 'text-red-600' : 'text-emerald-600'}>
                              {formatPct(margenPct(l.precio_unitario, l.descuento_pct, l.costo_unitario))}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-right font-medium text-gray-900 whitespace-nowrap text-xs">
                            {formatMXNTabla(totalLinea(l.precio_unitario, l.descuento_pct, l.cantidad))}
                          </td>
                          <td className="px-2 py-2">
                            <button onClick={() => eliminarLinea(l.key)} className="text-gray-400 hover:text-red-600">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totales */}
                <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                  <div className="flex justify-end gap-6 text-sm">
                    <span className="text-gray-500">{conConteo(lineas.length, 'línea', 'líneas')}</span>
                    <span className="text-gray-500">Subtotal: <span className="font-medium text-gray-900">{formatMXN(subtotal)}</span></span>
                    <span className="text-gray-500">Margen: <span className={`font-medium ${margenBruto < 15 ? 'text-red-600' : 'text-emerald-600'}`}>{formatPct(margenBruto)}</span></span>
                    <span className="text-gray-500">Ganancia: <span className="font-medium text-gray-900">{formatMXN(gananciaBruta)}</span></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 px-8 py-12 text-center">
                <p className="text-gray-400 text-sm">Agrega productos buscando arriba o desde las recomendaciones</p>
              </div>
            )}

            {/* Navegación */}
            <div className="flex justify-between mt-6">
              <button onClick={() => setPaso(0)} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
                Anterior
              </button>
              <button onClick={() => setPaso(2)} disabled={lineas.length === 0}
                className="px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium disabled:opacity-40 hover:bg-slate-800">
                Siguiente
              </button>
            </div>
          </div>

          {/* Panel de recomendaciones (1/3) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Productos recomendados</h3>

            {cargandoRecs && <p className="text-xs text-gray-400">Cargando recomendaciones...</p>}

            {/* Recompras */}
            {recompras.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 bg-amber-50 border-b border-amber-100">
                  <h4 className="text-xs font-semibold text-amber-800">Recompras tardías ({recompras.length})</h4>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                  {recompras.slice(0, 10).map((r) => {
                    const yaAgregado = lineas.some((l) => l.sku === r.sku);
                    return (
                      <div key={r.sku} className="px-3 py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">{r.nombre_producto}</div>
                          <div className="text-[10px] text-gray-400">Hace {r.dias_desde_ultima_compra} días · cada {r.intervalo_promedio_dias}d</div>
                        </div>
                        <button onClick={() => agregarProducto(r.sku, r.nombre_producto, 'recompra', r.cantidad_ultima_compra)}
                          disabled={yaAgregado}
                          className={`text-xs px-2 py-1 rounded flex-shrink-0 ${yaAgregado ? 'text-gray-400 bg-gray-100' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'}`}>
                          {yaAgregado ? '✓' : '+ Agregar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Compró una vez */}
            {comproUnaVez.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-700">Compró una vez ({comproUnaVez.length})</h4>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                  {comproUnaVez.slice(0, 10).map((u) => {
                    const yaAgregado = lineas.some((l) => l.sku === u.sku);
                    return (
                      <div key={u.sku} className="px-3 py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">{u.nombre_producto}</div>
                          <div className="text-[10px] text-gray-400">{u.cantidad} uds · {new Date(u.fecha_compra).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}</div>
                        </div>
                        <button onClick={() => agregarProducto(u.sku, u.nombre_producto, 'una_vez', u.cantidad)}
                          disabled={yaAgregado}
                          className={`text-xs px-2 py-1 rounded flex-shrink-0 ${yaAgregado ? 'text-gray-400 bg-gray-100' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}>
                          {yaAgregado ? '✓' : '+ Agregar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cross-sell */}
            {crossSell.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 bg-blue-50 border-b border-blue-100">
                  <h4 className="text-xs font-semibold text-blue-800">Nuevos para este cliente ({crossSell.reduce((s, cs) => s + cs.top_skus.length, 0)})</h4>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                  {crossSell.slice(0, 5).flatMap((cs) =>
                    cs.top_skus.map((s) => {
                      const yaAgregado = lineas.some((l) => l.sku === s.sku);
                      return (
                        <div key={s.sku} className="px-3 py-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">{s.nombre}</div>
                            <div className="text-[10px] text-gray-400">{formatPct(cs.pct_clientes_similares)} de clientes similares</div>
                          </div>
                          <button onClick={() => agregarProducto(s.sku, s.nombre, 'cross_sell')}
                            disabled={yaAgregado}
                            className={`text-xs px-2 py-1 rounded flex-shrink-0 ${yaAgregado ? 'text-gray-400 bg-gray-100' : 'text-blue-700 bg-blue-50 hover:bg-blue-100'}`}>
                            {yaAgregado ? '✓' : '+ Agregar'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Paso 3: Revisión ═════════════════════════════════════ */}
      {paso === 2 && (
        <div className="max-w-4xl mx-auto">
          {/* Header resumen */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Cliente:</span> <span className="font-medium text-gray-900">{clienteSeleccionado?.nombre}</span></div>
              <div><span className="text-gray-500">Vendedor:</span> <span className="font-medium text-gray-900">{vendedores.find((v) => v.id === vendedorId)?.nombre}</span></div>
              <div><span className="text-gray-500">Válida hasta:</span> <span className="font-medium text-gray-900">{new Date(fechaVencimiento).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              {notas && <div><span className="text-gray-500">Notas:</span> <span className="text-gray-700">{notas}</span></div>}
            </div>
          </div>

          {/* Tabla read-only */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2 font-medium">SKU</th>
                    <th className="px-3 py-2 font-medium">Producto</th>
                    <th className="px-3 py-2 font-medium text-right">Cantidad</th>
                    <th className="px-3 py-2 font-medium text-right">Precio final</th>
                    <th className="px-3 py-2 font-medium text-right">Margen</th>
                    <th className="px-4 py-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lineas.map((l) => (
                    <tr key={l.key}>
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{l.sku}</td>
                      <td className="px-3 py-2">
                        <span className="font-medium text-gray-900">{l.nombre_producto}</span>
                        {l.origen !== 'manual' && (
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${
                            l.origen === 'recompra' ? 'text-amber-700 bg-amber-50'
                              : l.origen === 'cross_sell' ? 'text-blue-700 bg-blue-50'
                              : 'text-gray-500 bg-gray-50'
                          }`}>
                            {l.origen === 'recompra' ? 'Recompra' : l.origen === 'cross_sell' ? 'Cross-sell' : 'Compró 1 vez'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">{l.cantidad}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{formatMXNTabla(precioFinal(l.precio_unitario, l.descuento_pct))}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={margenPct(l.precio_unitario, l.descuento_pct, l.costo_unitario) < 15 ? 'text-red-600' : 'text-emerald-600'}>
                          {formatPct(margenPct(l.precio_unitario, l.descuento_pct, l.costo_unitario))}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">{formatMXNTabla(totalLinea(l.precio_unitario, l.descuento_pct, l.cantidad))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
              <div className="flex justify-end gap-6 text-sm">
                <span className="text-gray-500">{conConteo(lineas.length, 'línea', 'líneas')}</span>
                <span className="text-gray-500">Subtotal: <span className="font-semibold text-gray-900">{formatMXN(subtotal)}</span></span>
                <span className="text-gray-500">Margen: <span className={`font-semibold ${margenBruto < 15 ? 'text-red-600' : 'text-emerald-600'}`}>{formatPct(margenBruto)}</span></span>
                <span className="text-gray-500">Ganancia: <span className="font-semibold text-gray-900">{formatMXN(gananciaBruta)}</span></span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-between">
            <button onClick={() => setPaso(1)} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
              Anterior
            </button>
            <div className="flex gap-3">
              <button onClick={() => guardar('borrador')} disabled={guardando}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
                {guardando ? 'Guardando...' : 'Guardar borrador'}
              </button>
              <button onClick={() => guardar('enviada')} disabled={guardando}
                className="px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-40">
                {guardando ? 'Guardando...' : 'Enviar a ERP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de auto-guardado */}
      {ultimoAutoguardado && !guardando && (
        <div className="fixed bottom-6 left-6 z-40 flex items-center gap-1.5 text-xs text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Borrador auto-guardado · {tiempoRelativo(ultimoAutoguardado)}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-lg shadow-lg px-5 py-3 flex items-center gap-3">
          <p className="text-sm">{toast}</p>
          <button onClick={() => setToast('')} className="text-slate-400 hover:text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
