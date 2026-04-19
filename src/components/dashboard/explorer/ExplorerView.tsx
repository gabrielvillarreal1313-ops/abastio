'use client';

/**
 * ExplorerView — Vista multidimensional interactiva.
 *
 * Fase 12-2: Tabs de dimensiones + filtros cruzados como chips removibles +
 * búsqueda client-side + tabla ordenable con sparklines + navegación al detalle
 * para clientes/productos/vendedores. Los cambios de dimensión y filtros
 * disparan re-fetch a get_explorer manteniendo la estructura visible (overlay
 * semi-transparente mientras carga).
 */

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import {
  getExplorer,
  type DimensionExplorer,
  type FilaExplorer,
  type FiltrosExplorer,
} from '@/lib/queries/explorer';
import {
  guardarReporte,
  toggleAnclaReporte,
  type ReporteGuardado,
  type ConfiguracionReporte,
} from '@/lib/queries/reportes-guardados';
import { formatMXNTabla } from '@/lib/textos/formato';
import { ClienteLink } from '@/components/ui/ClienteLink';
import { ProductoLink } from '@/components/ui/ProductoLink';
import { VendedorLink } from '@/components/ui/VendedorLink';
import { useToastFromUrl } from '@/hooks/useToastFromUrl';

// ─── Configuración de dimensiones ───────────────────────────────────────────

const DIMENSIONES: { key: DimensionExplorer; label: string; colLabel: string }[] = [
  { key: 'bodegas', label: 'Bodegas', colLabel: 'Bodega' },
  { key: 'vendedores', label: 'Vendedores', colLabel: 'Vendedor' },
  { key: 'clientes', label: 'Clientes', colLabel: 'Cliente' },
  { key: 'categorias', label: 'Categorías', colLabel: 'Categoría' },
  { key: 'productos', label: 'Productos', colLabel: 'Producto' },
  { key: 'meses', label: 'Meses', colLabel: 'Mes' },
  { key: 'ciudades', label: 'Ciudades', colLabel: 'Ciudad' },
];

// Mapeo: cuando aplicas una fila como filtro, qué llave del filtro usar
const DIMENSION_A_FILTRO: Partial<Record<DimensionExplorer, keyof FiltrosExplorer>> = {
  bodegas: 'bodega_id',
  vendedores: 'vendedor_id',
  clientes: 'cliente_id',
  categorias: 'categoria',
  productos: 'sku',
  ciudades: 'ciudad',
  // meses no se puede filtrar como dimensión cruzada
};

// Orden sugerido al aplicar un filtro: salta a la siguiente dimensión natural
const SIGUIENTE_DIMENSION: Partial<Record<DimensionExplorer, DimensionExplorer>> = {
  bodegas: 'vendedores',
  vendedores: 'clientes',
  clientes: 'productos',
  categorias: 'productos',
  ciudades: 'clientes',
};

const LLAVES_FILTRO_NUMERICAS: (keyof FiltrosExplorer)[] = ['bodega_id', 'vendedor_id', 'cliente_id'];
const LABEL_FILTRO: Record<keyof FiltrosExplorer, string> = {
  bodega_id: 'Bodega',
  vendedor_id: 'Vendedor',
  cliente_id: 'Cliente',
  categoria: 'Categoría',
  sku: 'Producto',
  ciudad: 'Ciudad',
};

// ─── Tipo para estado de sorting ────────────────────────────────────────────

type ColumnaSort =
  | 'dimension_id'
  | 'dimension_label'
  | 'ventas_ytd'
  | 'ventas_lytd'
  | 'ventas_delta'
  | 'ventas_delta_pct'
  | 'gm_ytd'
  | 'gm_lytd'
  | 'gm_delta';

interface EstadoSort {
  columna: ColumnaSort;
  direccion: 'asc' | 'desc';
}

// Guarda el label legible de cada filtro para renderizar el chip ("Bodega: Bodega Central León")
type LabelsFiltros = Partial<Record<keyof FiltrosExplorer, string>>;

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  datosIniciales: FilaExplorer[];
  dimensionInicial: DimensionExplorer;
  usuarioId: string;
  reportes: ReporteGuardado[];
}

// ─── Componente ─────────────────────────────────────────────────────────────

export function ExplorerView({ datosIniciales, dimensionInicial, usuarioId, reportes }: Props) {
  useToastFromUrl();
  const searchParams = useSearchParams();
  const reporteIdParam = searchParams.get('reporte');
  const reporteActivo = reporteIdParam
    ? reportes.find((r) => r.id === reporteIdParam) ?? null
    : null;

  const [dimension, setDimension] = useState<DimensionExplorer>(
    reporteActivo?.configuracion.dimension ?? dimensionInicial
  );
  const [filas, setFilas] = useState<FilaExplorer[]>(datosIniciales);
  const [filtros, setFiltros] = useState<FiltrosExplorer>(
    reporteActivo?.configuracion.filtros ?? {}
  );
  const [labelsFiltros, setLabelsFiltros] = useState<LabelsFiltros>(() => {
    // Al cargar un reporte guardado no conocemos el label humano de cada filtro,
    // solo el valor. Usamos el valor como fallback; el usuario puede remover.
    const base: LabelsFiltros = {};
    const f = reporteActivo?.configuracion.filtros ?? {};
    (Object.keys(f) as (keyof FiltrosExplorer)[]).forEach((k) => {
      base[k] = String(f[k]);
    });
    return base;
  });
  const [busqueda, setBusqueda] = useState('');
  const [sort, setSort] = useState<EstadoSort>(() => {
    const cfg = reporteActivo?.configuracion;
    if (cfg?.sort_column && cfg.sort_direction) {
      return {
        columna: cfg.sort_column as ColumnaSort,
        direccion: cfg.sort_direction,
      };
    }
    return { columna: 'ventas_ytd', direccion: 'desc' };
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal de guardar reporte
  const [modalGuardarAbierto, setModalGuardarAbierto] = useState(false);

  // Al cargar un reporte con configuración completa, traer los datos filtrados
  // (los datosIniciales fueron cargados en el server sin filtros).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (reporteActivo) {
      const cfg = reporteActivo.configuracion;
      recargar(cfg.dimension, cfg.filtros ?? {});
    }
    // Se ejecuta solo una vez al montar con un reporte activo. No queremos
    // disparar refetch adicional si el usuario empieza a interactuar luego.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reporteIdParam]);

  // Recarga datos con la dimensión y filtros dados. Mantiene las filas actuales
  // visibles mientras llega la respuesta; el overlay indica que hay fetch en vuelo.
  function recargar(nuevaDim: DimensionExplorer, nuevosFiltros: FiltrosExplorer) {
    setError(null);
    setCargando(true);
    (async () => {
      try {
        const nuevasFilas = await getExplorer(nuevaDim, nuevosFiltros);
        setFilas(nuevasFilas);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error cargando datos');
      } finally {
        setCargando(false);
      }
    })();
  }

  function cambiarDimension(nueva: DimensionExplorer) {
    if (nueva === dimension) return;
    setDimension(nueva);
    setBusqueda('');
    setSort({ columna: 'ventas_ytd', direccion: 'desc' });
    recargar(nueva, filtros);
  }

  function aplicarFiltroDesdeFila(fila: FilaExplorer) {
    const llave = DIMENSION_A_FILTRO[dimension];
    if (!llave) return; // meses no aplicable

    const valor = LLAVES_FILTRO_NUMERICAS.includes(llave)
      ? Number(fila.dimension_id)
      : fila.dimension_id;

    const nuevosFiltros: FiltrosExplorer = { ...filtros, [llave]: valor };
    const nuevosLabels: LabelsFiltros = { ...labelsFiltros, [llave]: fila.dimension_label };
    setFiltros(nuevosFiltros);
    setLabelsFiltros(nuevosLabels);

    const siguiente = SIGUIENTE_DIMENSION[dimension] ?? dimension;
    setDimension(siguiente);
    setBusqueda('');
    setSort({ columna: 'ventas_ytd', direccion: 'desc' });
    recargar(siguiente, nuevosFiltros);
  }

  function removerFiltro(llave: keyof FiltrosExplorer) {
    const nuevosFiltros = { ...filtros };
    delete nuevosFiltros[llave];
    const nuevosLabels = { ...labelsFiltros };
    delete nuevosLabels[llave];
    setFiltros(nuevosFiltros);
    setLabelsFiltros(nuevosLabels);
    recargar(dimension, nuevosFiltros);
  }

  function limpiarFiltros() {
    setFiltros({});
    setLabelsFiltros({});
    recargar(dimension, {});
  }

  function toggleSort(columna: ColumnaSort) {
    setSort((prev) =>
      prev.columna === columna
        ? { columna, direccion: prev.direccion === 'asc' ? 'desc' : 'asc' }
        : { columna, direccion: 'desc' }
    );
  }

  // ─── Filas filtradas y ordenadas (client-side) ────────────────────────────
  const filasVisibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtradas = q
      ? filas.filter((r) => {
          const label = r.dimension_label?.toLowerCase() ?? '';
          const extra = r.dimension_extra?.toLowerCase() ?? '';
          return label.includes(q) || extra.includes(q);
        })
      : filas;

    const ordenadas = [...filtradas].sort((a, b) => {
      const col = sort.columna;
      let va: string | number = '';
      let vb: string | number = '';
      if (col === 'dimension_id' || col === 'dimension_label') {
        va = a[col] ?? '';
        vb = b[col] ?? '';
      } else {
        va = a[col] ?? 0;
        vb = b[col] ?? 0;
      }
      if (va < vb) return sort.direccion === 'asc' ? -1 : 1;
      if (va > vb) return sort.direccion === 'asc' ? 1 : -1;
      return 0;
    });

    return ordenadas;
  }, [filas, busqueda, sort]);

  const dimActiva = DIMENSIONES.find((d) => d.key === dimension) ?? DIMENSIONES[0];
  const filtrosActivos = Object.keys(filtros) as (keyof FiltrosExplorer)[];

  return (
    <div className="space-y-4">
      {/* ─── Tabs de dimensiones ───────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 flex-wrap">
          {DIMENSIONES.map((d) => {
            const activa = d.key === dimension;
            return (
              <button
                key={d.key}
                onClick={() => cambiarDimension(d.key)}
                className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
                  activa
                    ? 'border-slate-900 text-slate-900 bg-slate-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Barra de filtros activos ─────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap min-h-[2rem]">
        {filtrosActivos.length === 0 ? (
          <span className="text-xs text-gray-500">Sin filtros aplicados</span>
        ) : (
          <>
            {filtrosActivos.map((llave) => (
              <span
                key={llave}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700"
              >
                <span className="font-medium">{LABEL_FILTRO[llave]}:</span>
                <span>{labelsFiltros[llave] ?? String(filtros[llave])}</span>
                <button
                  onClick={() => removerFiltro(llave)}
                  className="text-slate-500 hover:text-slate-900 ml-0.5"
                  aria-label={`Remover filtro ${LABEL_FILTRO[llave]}`}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={limpiarFiltros}
              className="text-xs text-slate-600 hover:text-slate-900 underline underline-offset-2 ml-1"
            >
              Limpiar filtros
            </button>
          </>
        )}
      </div>

      {/* ─── Banner de reporte activo ─────────────────────────────────── */}
      {reporteActivo && (
        <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-md px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14l-5-3-5 3V4z" />
            </svg>
            <span className="text-slate-700">
              Viendo reporte: <span className="font-medium">{reporteActivo.nombre}</span>
            </span>
          </div>
          <button
            onClick={() => {
              // Limpiar el query param y recargar en estado default
              const url = new URL(window.location.href);
              url.searchParams.delete('reporte');
              window.location.href = url.toString();
            }}
            className="text-xs text-slate-600 hover:text-slate-900 transition-colors"
          >
            × Cerrar reporte
          </button>
        </div>
      )}

      {/* ─── Controles (buscador + contador + guardar) ─────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={`Buscar en ${dimActiva.label.toLowerCase()}...`}
            className="px-3 py-2 text-sm text-slate-900 placeholder:text-gray-400 border border-gray-300 rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
          />
          <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-100">
            Período: YTD
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {filasVisibles.length} {filasVisibles.length === 1 ? 'resultado' : 'resultados'}
          </span>
          <button
            onClick={() => setModalGuardarAbierto(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
            Guardar como reporte
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">Error: {error}</p>
      )}

      {/* ─── Modal de guardar reporte ──────────────────────────────────── */}
      {modalGuardarAbierto && (
        <ModalGuardarReporte
          usuarioId={usuarioId}
          dimension={dimension}
          filtros={filtros}
          labelsFiltros={labelsFiltros}
          sort={sort}
          nombreDimension={dimActiva.label}
          onCerrar={() => setModalGuardarAbierto(false)}
        />
      )}

      {/* ─── Tabla ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative">
        {cargando && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
            <svg className="w-6 h-6 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                <ColumnaHeader label="ID" col="dimension_id" sort={sort} onSort={toggleSort} align="left" />
                <ColumnaHeader label={dimActiva.colLabel} col="dimension_label" sort={sort} onSort={toggleSort} align="left" />
                <ColumnaHeader label="Ventas YTD" col="ventas_ytd" sort={sort} onSort={toggleSort} align="right" />
                <ColumnaHeader label="Ventas LYTD" col="ventas_lytd" sort={sort} onSort={toggleSort} align="right" />
                <ColumnaHeader label="Δ Ventas" col="ventas_delta" sort={sort} onSort={toggleSort} align="right" />
                <ColumnaHeader label="Δ %" col="ventas_delta_pct" sort={sort} onSort={toggleSort} align="right" />
                <th className="px-3 py-2.5 font-medium text-left">Tendencia</th>
                <ColumnaHeader label="GM YTD" col="gm_ytd" sort={sort} onSort={toggleSort} align="right" />
                <ColumnaHeader label="GM LYTD" col="gm_lytd" sort={sort} onSort={toggleSort} align="right" />
                <ColumnaHeader label="Δ GM" col="gm_delta" sort={sort} onSort={toggleSort} align="right" />
                <th className="px-3 py-2.5 font-medium text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filasVisibles.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-10 text-center text-sm text-gray-500">
                    {filas.length === 0
                      ? 'Sin datos para esta combinación de dimensión y filtros.'
                      : 'Ningún resultado coincide con la búsqueda.'}
                  </td>
                </tr>
              ) : (
                filasVisibles.map((r) => (
                  <FilaTabla
                    key={r.dimension_id}
                    fila={r}
                    dimension={dimension}
                    onAplicar={aplicarFiltroDesdeFila}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Header de columna con sorting ──────────────────────────────────────────

function ColumnaHeader({
  label,
  col,
  sort,
  onSort,
  align,
}: {
  label: string;
  col: ColumnaSort;
  sort: EstadoSort;
  onSort: (col: ColumnaSort) => void;
  align: 'left' | 'right';
}) {
  const activo = sort.columna === col;
  return (
    <th className={`px-3 py-2.5 font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 hover:text-gray-700 transition-colors ${
          activo ? 'text-gray-900' : ''
        }`}
      >
        {label}
        {activo && (
          <span className="text-[10px]">{sort.direccion === 'asc' ? '▲' : '▼'}</span>
        )}
      </button>
    </th>
  );
}

// ─── Fila de tabla ──────────────────────────────────────────────────────────

function FilaTabla({
  fila,
  dimension,
  onAplicar,
}: {
  fila: FilaExplorer;
  dimension: DimensionExplorer;
  onAplicar: (f: FilaExplorer) => void;
}) {
  const deltaVentasColor = fila.ventas_delta >= 0 ? 'text-emerald-600' : 'text-red-600';
  const deltaGmColor = fila.gm_delta >= 0 ? 'text-emerald-600' : 'text-red-600';
  const flechaVentas = fila.ventas_delta >= 0 ? '↑' : '↓';
  const puedeAplicar = dimension !== 'meses';

  const renderNombre = (): React.ReactNode => {
    if (dimension === 'clientes') {
      return <ClienteLink clienteId={Number(fila.dimension_id)} nombre={fila.dimension_label} />;
    }
    if (dimension === 'productos') {
      return <ProductoLink sku={fila.dimension_id} nombre={fila.dimension_label} />;
    }
    if (dimension === 'vendedores') {
      return <VendedorLink vendedorId={Number(fila.dimension_id)} nombre={fila.dimension_label} />;
    }
    return <span className="text-gray-900">{fila.dimension_label}</span>;
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{fila.dimension_id}</td>
      <td className="px-3 py-2.5">
        <div className="font-medium">{renderNombre()}</div>
        {fila.dimension_extra && (
          <div className="text-xs text-gray-500 mt-0.5">{fila.dimension_extra}</div>
        )}
      </td>
      <td className="px-3 py-2.5 text-right text-gray-700 whitespace-nowrap">
        {formatMXNTabla(fila.ventas_ytd)}
      </td>
      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
        {formatMXNTabla(fila.ventas_lytd)}
      </td>
      <td className={`px-3 py-2.5 text-right whitespace-nowrap ${deltaVentasColor}`}>
        {flechaVentas} {formatMXNTabla(Math.abs(fila.ventas_delta))}
      </td>
      <td className={`px-3 py-2.5 text-right whitespace-nowrap`}>
        {fila.ventas_delta_pct === null ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
            Nuevo
          </span>
        ) : (
          <span className={deltaVentasColor}>
            {fila.ventas_delta_pct > 0 ? '+' : ''}
            {fila.ventas_delta_pct.toFixed(1)}%
          </span>
        )}
      </td>
      <td className="px-3 py-2.5">
        <Sparkline data={fila.sparkline_data} />
      </td>
      <td className="px-3 py-2.5 text-right text-gray-700 whitespace-nowrap">
        {formatMXNTabla(fila.gm_ytd)}
      </td>
      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
        {formatMXNTabla(fila.gm_lytd)}
      </td>
      <td className={`px-3 py-2.5 text-right whitespace-nowrap ${deltaGmColor}`}>
        {fila.gm_delta >= 0 ? '+' : '-'}
        {formatMXNTabla(Math.abs(fila.gm_delta))}
      </td>
      <td className="px-3 py-2.5 text-right">
        {puedeAplicar && (
          <button
            onClick={() => onAplicar(fila)}
            className="px-2 py-1 text-xs font-medium rounded border border-gray-300 text-gray-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
          >
            Aplicar
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Sparkline compacta ─────────────────────────────────────────────────────

function Sparkline({ data }: { data: { mes: number; valor: number }[] }) {
  if (!data || data.length < 2) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  return (
    <div style={{ width: 120, height: 30 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="valor"
            stroke="#94a3b8"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Modal: guardar reporte ─────────────────────────────────────────────────

function ModalGuardarReporte({
  usuarioId,
  dimension,
  filtros,
  labelsFiltros,
  sort,
  nombreDimension,
  onCerrar,
}: {
  usuarioId: string;
  dimension: DimensionExplorer;
  filtros: FiltrosExplorer;
  labelsFiltros: LabelsFiltros;
  sort: EstadoSort;
  nombreDimension: string;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [anclar, setAnclar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const chipsFiltros = Object.keys(filtros) as (keyof FiltrosExplorer)[];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setErrorLocal('El nombre es obligatorio');
      return;
    }
    setGuardando(true);
    setErrorLocal(null);
    try {
      const configuracion: ConfiguracionReporte = {
        dimension,
        filtros,
        sort_column: sort.columna,
        sort_direction: sort.direccion,
      };
      const id = await guardarReporte(
        usuarioId,
        nombreLimpio,
        descripcion.trim() || null,
        configuracion
      );
      if (anclar && id) {
        await toggleAnclaReporte(id, usuarioId, true);
      }
      window.location.href = window.location.pathname + '?toast=reporte_guardado';
    } catch (err) {
      setErrorLocal(err instanceof Error ? err.message : 'Error guardando reporte');
      setGuardando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onCerrar}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
      >
        <h3 className="text-lg font-semibold text-gray-900">Guardar como reporte</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del reporte <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Top Clientes de Plomería"
            autoFocus
            className="w-full px-3 py-2 text-sm text-slate-900 placeholder:text-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe qué muestra este reporte"
            rows={2}
            className="w-full px-3 py-2 text-sm text-slate-900 placeholder:text-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 resize-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={anclar}
            onChange={(e) => setAnclar(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-400"
          />
          Anclar a mi dashboard
        </label>

        <div className="text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2">
          Se guardará con la dimensión <span className="font-medium text-gray-700">{nombreDimension}</span>
          {chipsFiltros.length > 0 && (
            <>
              {' y los filtros: '}
              {chipsFiltros.map((k, i) => (
                <span key={k} className="font-medium text-gray-700">
                  {LABEL_FILTRO[k]}: {labelsFiltros[k] ?? String(filtros[k])}
                  {i < chipsFiltros.length - 1 ? ', ' : ''}
                </span>
              ))}
            </>
          )}
          .
        </div>

        {errorLocal && (
          <p className="text-sm text-red-600">{errorLocal}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="px-4 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
