'use client';

/**
 * DetallePoSugerida — Componente cliente principal de la página de detalle de PO.
 * Maneja estado editable, auto-guardado en localStorage, y todas las mutaciones.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BotonVolver } from '@/components/ui/BotonVolver';
import { HeaderPoSugerida } from './HeaderPoSugerida';
import { BannerRevisor } from './BannerRevisor';
import { TablaLineasPo } from './TablaLineasPo';
import { AccionesPoSugerida } from './AccionesPoSugerida';
import { DescartarModal } from './DescartarModal';
import { AgregarItemModal } from './AgregarItemModal';
import { formatMXNCorto } from '@/lib/textos/formato';
import { tomarRevisionPo, actualizarLineasPo, aprobarPo, descartarPo } from '@/lib/queries/po-sugeridas-mutations';
import type { PoSugeridaDetalle, LineaPoSugerida } from '@/lib/queries/po-sugerida-detalle';
import type { UsuarioActual } from '@/lib/auth/roles';
import type { ProductoBusqueda } from '@/lib/queries/productos-busqueda';

const STORAGE_KEY = (id: string) => `po_sugerida_borrador_${id}`;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface Props {
  poInicial: PoSugeridaDetalle;
  usuario: UsuarioActual;
}

export default function DetallePoSugerida({ poInicial, usuario }: Props) {
  const [po] = useState(poInicial);
  const [lineasEditadas, setLineasEditadas] = useState<LineaPoSugerida[]>(poInicial.lineas);
  const [busqueda, setBusqueda] = useState('');
  const [hayBorradorPendiente, setHayBorradorPendiente] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarDescartar, setMostrarDescartar] = useState(false);
  const [mostrarAgregarItem, setMostrarAgregarItem] = useState(false);

  // ─── Cálculos derivados ──────────────────────────────────────────
  const puedeEditar = po.estado === 'pendiente_revision' && po.comprador_id_revisor === usuario.id;
  const valorTotalActual = useMemo(
    () => lineasEditadas.reduce((s, l) => s + l.total_linea, 0),
    [lineasEditadas]
  );
  const cantidadItemsActual = lineasEditadas.length;
  const haCambios = useMemo(
    () => JSON.stringify(lineasEditadas) !== JSON.stringify(poInicial.lineas),
    [lineasEditadas, poInicial.lineas]
  );
  const lineasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return lineasEditadas;
    const q = busqueda.toLowerCase();
    return lineasEditadas.filter(
      (l) => l.sku.toLowerCase().includes(q) || l.nombre_producto.toLowerCase().includes(q)
    );
  }, [lineasEditadas, busqueda]);

  // ─── Recuperación de borrador ─────────────────────────────────────
  useEffect(() => {
    if (!puedeEditar) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY(po.id));
      if (!raw) return;
      const borrador = JSON.parse(raw);
      if (Date.now() - borrador.guardadoEn > MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY(po.id));
        return;
      }
      setHayBorradorPendiente(true);
    } catch { /* localStorage no disponible */ }
  }, [po.id, puedeEditar]);

  // ─── Auto-guardado con debounce ───────────────────────────────────
  useEffect(() => {
    if (!puedeEditar || !haCambios) return;
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY(po.id),
          JSON.stringify({ lineas: lineasEditadas, guardadoEn: Date.now() })
        );
      } catch { /* ignorar */ }
    }, 500);
    return () => clearTimeout(handle);
  }, [lineasEditadas, po.id, puedeEditar, haCambios]);

  // ─── Handlers de edición local ────────────────────────────────────
  const actualizarCantidad = useCallback((sku: string, nuevaCantidad: number) => {
    setLineasEditadas((prev) =>
      prev.map((l) => {
        if (l.sku !== sku) return l;
        return { ...l, cantidad_ajustada: nuevaCantidad, total_linea: nuevaCantidad * l.costo_unitario_proxy };
      })
    );
  }, []);

  const eliminarLinea = useCallback((sku: string) => {
    setLineasEditadas((prev) => prev.filter((l) => l.sku !== sku));
  }, []);

  const agregarLinea = useCallback((producto: ProductoBusqueda) => {
    if (lineasEditadas.some((l) => l.sku === producto.sku)) {
      setError(`El SKU ${producto.sku} ya está en esta PO`);
      return;
    }
    const costo = producto.costo_unitario || producto.precio_lista * 0.65;
    const nuevaLinea: LineaPoSugerida = {
      sku: producto.sku,
      nombre_producto: producto.nombre,
      cantidad_sugerida: 0,
      cantidad_ajustada: 1,
      costo_unitario_proxy: costo,
      total_linea: costo,
      stock_actual: 0,
      minimo_recomendado: 0,
      meses_de_suministro: null,
      lead_time_dias: 14,
    };
    setLineasEditadas((prev) => [...prev, nuevaLinea]);
    setMostrarAgregarItem(false);
  }, [lineasEditadas]);

  // ─── Handlers de borrador ─────────────────────────────────────────
  function restaurarBorrador() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(po.id));
      if (raw) {
        const borrador = JSON.parse(raw);
        setLineasEditadas(borrador.lineas);
      }
    } catch { /* ignorar */ }
    setHayBorradorPendiente(false);
  }

  function descartarBorrador() {
    try { localStorage.removeItem(STORAGE_KEY(po.id)); } catch { /* ignorar */ }
    setHayBorradorPendiente(false);
  }

  // ─── Handlers de mutación DB ──────────────────────────────────────
  async function manejarTomarRevision() {
    setGuardando(true);
    setError(null);
    try {
      const resultado = await tomarRevisionPo(po.id, usuario.id);
      if (resultado.tomada) {
        const url = new URL(window.location.href);
        url.searchParams.set('toast', 'po_tomada');
        window.location.href = url.toString();
      } else {
        setError('Esta PO ya está siendo revisada por otro usuario.');
      }
    } catch { setError('No se pudo tomar la revisión. Intenta de nuevo.'); }
    finally { setGuardando(false); }
  }

  async function manejarGuardar() {
    if (lineasEditadas.length === 0) {
      setError('No puedes guardar una PO sin líneas. Si quieres descartarla, usa el botón Descartar.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await actualizarLineasPo(po.id, usuario.id, lineasEditadas);
      try { localStorage.removeItem(STORAGE_KEY(po.id)); } catch { /* ignorar */ }
      const url = new URL(window.location.href);
      url.searchParams.set('toast', 'po_guardada');
      window.location.href = url.toString();
    } catch { setError('No se pudieron guardar los cambios. Intenta de nuevo.'); }
    finally { setGuardando(false); }
  }

  async function manejarAprobar() {
    if (!confirm(`¿Aprobar esta PO con ${cantidadItemsActual} items por un total de ${formatMXNCorto(valorTotalActual)}?`)) return;
    setGuardando(true);
    setError(null);
    try {
      if (haCambios) {
        await actualizarLineasPo(po.id, usuario.id, lineasEditadas);
      }
      await aprobarPo(po.id, usuario.id);
      try { localStorage.removeItem(STORAGE_KEY(po.id)); } catch { /* ignorar */ }
      window.location.href = '/dashboard/tablero-compras?toast=po_aprobada';
    } catch { setError('No se pudo aprobar la PO. Intenta de nuevo.'); }
    finally { setGuardando(false); }
  }

  async function manejarDescartar(notas: string) {
    if (!notas.trim() || notas.trim().length < 10) {
      setError('Debes proporcionar una razón para descartar la PO (mínimo 10 caracteres).');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await descartarPo(po.id, usuario.id, notas);
      try { localStorage.removeItem(STORAGE_KEY(po.id)); } catch { /* ignorar */ }
      window.location.href = '/dashboard/tablero-compras?toast=po_descartada';
    } catch { setError('No se pudo descartar la PO. Intenta de nuevo.'); }
    finally { setGuardando(false); }
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div>
      <BotonVolver texto="Volver" />

      <HeaderPoSugerida po={po} cantidadItemsActual={cantidadItemsActual} valorTotalActual={valorTotalActual} />

      {/* Banner de borrador */}
      {hayBorradorPendiente && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-blue-800">
            Tienes cambios sin guardar de una sesión anterior. ¿Quieres continuar con esos cambios o descartarlos?
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={descartarBorrador} className="px-3 py-1.5 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-100">
              Descartar cambios
            </button>
            <button onClick={restaurarBorrador} className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
              Continuar con cambios
            </button>
          </div>
        </div>
      )}

      <BannerRevisor po={po} usuario={usuario} onTomarRevision={manejarTomarRevision} guardando={guardando} />

      {/* Banner de error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-6 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <TablaLineasPo
        lineasFiltradas={lineasFiltradas}
        totalSinFiltro={lineasEditadas.length}
        busqueda={busqueda}
        puedeEditar={puedeEditar}
        onBusquedaChange={setBusqueda}
        onCantidadChange={actualizarCantidad}
        onEliminarLinea={eliminarLinea}
        onAgregarItem={() => setMostrarAgregarItem(true)}
      />

      {puedeEditar && (
        <AccionesPoSugerida
          onGuardar={manejarGuardar}
          onAprobar={manejarAprobar}
          onDescartar={() => setMostrarDescartar(true)}
          cantidadItems={cantidadItemsActual}
          guardando={guardando}
          haCambios={haCambios}
        />
      )}

      {mostrarDescartar && (
        <DescartarModal onConfirmar={manejarDescartar} onCerrar={() => setMostrarDescartar(false)} />
      )}

      {mostrarAgregarItem && (
        <AgregarItemModal
          onAgregar={agregarLinea}
          onCerrar={() => setMostrarAgregarItem(false)}
          skusYaIncluidos={lineasEditadas.map((l) => l.sku)}
        />
      )}
    </div>
  );
}
