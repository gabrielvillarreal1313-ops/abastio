# Contexto del Proyecto — Ferretería MVP

Este documento contiene el contexto completo del proyecto para usar en conversaciones con Claude en claude.ai. Pégalo al inicio de un chat nuevo para arrancar con contexto completo.

---

## Resumen ejecutivo

Estoy construyendo una **capa de inteligencia operativa sobre ERPs mexicanos** para distribuidores y mayoristas. El producto toma datos transaccionales que ya existen en sistemas como SAP Business One, CONTPAQi Comercial y Aspel SAE, y los convierte en insights accionables: qué productos están perdiendo margen, qué clientes están dejando de comprar, qué vendedor da demasiados descuentos, qué inventario lleva meses sin moverse.

El segmento target son **mayoristas mexicanos de $85M-$1,700M MXN anuales** (~$5M-$100M USD) en verticales como autopartes, ferretería y alimentos, con foco inicial en **autopartes de $85M-$850M MXN** (~$5M-$50M USD). Estas empresas tienen un ERP que usan para facturar y cumplir con el SAT, pero no extraen inteligencia de negocio de sus datos. El dueño toma decisiones con intuición y reportes manuales en Excel.

La tesis es que esta capa de BI + IA se convierte en la **herramienta operativa indispensable** del dueño, y desde ahí expandimos a módulos de purchasing, pricing dinámico, y eventualmente fintech (crédito comercial embebido basado en datos transaccionales). El approach es **ERP-first** (conectar al sistema que ya usan) en vez de WhatsApp-first (WhatsApp es complemento, no wedge). La integración con SAP Business One va primero por ser la más técnicamente limpia (REST/OData), después CONTPAQi (SDK), después Aspel (acceso directo a DB). Decisión explícita: **nunca construir funcionalidad de CFDI/compliance fiscal** — lección de Gestionix, ERP mexicano que cerró en 2023 después de ser adquirido por Konfío, parcialmente por la carga de mantener compliance SAT. Dejamos que Aspel/CONTPAQi/SAP lo manejen.

## Landscape competitivo

No hay un competidor dominante construyendo esto para el mercado mexicano. Yalo (MX, $100M+ levantados) sirve al lado de marcas (Coca-Cola FEMSA), no a distribuidores independientes. Coconut Control es un ERP completo bootstrapped. Edit Innovation es consultoría. Los competidores US (Recurrency, Canals, Proton) están enfocados en Epicor Prophet 21 que no tiene presencia en México.

## Perfil del founder

- **Gabriel** — MBA en Wharton, graduación mayo 2027
- Sin background técnico profundo — aprendiendo a construir producto con vibe coding usando Claude
- Regresa a México post-MBA para lanzar esto
- ~20 horas/semana dedicadas al proyecto actualmente
- El MVP lo está construyendo él mismo con Claude Code como co-pilot

## Estado actual

- **Fase:** V0 (MVP con datos sintéticos) — Fase 9 del pivot completada, tracking de acciones del rep operativo
- **Última actividad:** Fase 9 completa — acciones inline (Cotizar/Descartar/Posponer), oportunidades filtradas, Mi actividad del rep
- **Siguiente:** Fase 10 del pivot (Métricas personales del rep). Roadmap restante: Fase 10 (módulo rep), Fase 11 (inteligencia de oportunidades), Fases 12-13 (Explorer + reportes), Fase 14 (polish final)
- **Stack:** Next.js 14 + TypeScript + Tailwind + Supabase + Vercel + Recharts
- **Repo:** GitHub privado `ferreteria-mvp`
- **Deploy:** Vercel con auto-deploy desde main
- **Rutas:** 20 páginas (login, resumen, tablero-ventas, mi-actividad-rep, tablero-compras, compras, PO detalle, mi-actividad, mi-desempeno, mi-historial redirect, clientes, productos, vendedores, oportunidades, cotizaciones)
- **RPCs:** 70+ funciones de Postgres (agregaciones, CRUD, búsqueda typo-tolerant, POs sugeridas, tracking comprador + rep, overrides)
- **Tablas:** 14 (6 seed + 2 cotizaciones + 2 cache oportunidades + 2 identidad + 1 POs sugeridas + 1 acciones comprador + 1 oportunidades trabajadas)
- **Tablas:** 13 (6 seed + 2 cotizaciones + 2 cache oportunidades + 2 identidad + 1 POs sugeridas + 1 acciones comprador)

**Lo que está construido:**
- Generador de datos sintéticos completo (scripts/seed/) — 113K transacciones de una ferretería mayorista ficticia "Ferretera del Bajío" con 750 SKUs, 110 clientes, 7 vendedores, 18 meses de historia
- Dashboard de resumen ejecutivo con: KPIs principales, gráfica de ingresos/margen mensual, Top 10 SKUs (ingresos vs margen), alertas de margen por categoría (detecta erosión de Plomería), detección de deadstock, detección de clientes en riesgo, rendimiento por vendedor con callouts automáticos
- Módulo de Compras completo con tres tabs funcionales:
  - **Tab Pronóstico:** tabla de 1,544 filas (772 SKUs × 2 bodegas) con clasificación ABC, sparklines de tendencia, pronóstico ponderado, porcentaje de cambio con color condicional, sorting por columna, y filtros de bodega/categoría/clase ABC/demanda reciente/horizonte (1/3/6 meses)
  - **Tab Planeación:** análisis de min/max de inventario con mínimos y máximos recomendados calculados automáticamente. Fórmulas: mín. recomendado = demanda_diaria_promedio_90d × 21 días; máx. recomendado = demanda_diaria_promedio_90d × 60 días (equivalente a demanda_mensual × 2). Ambas calculadas sobre ventana operacional de los últimos 90 días. Incluye modal de override min/max con opciones Recomendado/Personalizado, selección múltiple con bulk, filtros por estado (OK/Revisar), búsqueda, y sorting
  - **Tab Compras:** sugerencias de órdenes de compra con detección de desabasto/sobrestock, cantidad a pedir, meses de suministro (cantidad actual ÷ demanda mensual), selección múltiple, y botón "Generar orden de compra" (placeholder V1)
- Módulo de Clientes completo:
  - **Lista de clientes** (/dashboard/clientes): tabla de 110 clientes con ingresos 12m, ticket promedio, días sin comprar, cambio %, estado activo/en riesgo, vendedor principal. Filtros por estado/tipo/búsqueda, sorting por columna, filas clickeables al detalle
  - **Detalle de cliente** (/dashboard/clientes/[id]): header con estado, 5 KPI cards (ingresos 12m, YTD, ticket, transacciones, margen), gráfica de ingresos mensuales (reutiliza componente existente), top 10 SKUs comprados con patrón de compra y días desde última compra
  - **Filas clickeables en Clientes en Riesgo** del Resumen Ejecutivo: navegan directamente al detalle del cliente
- Módulo de Productos completo:
  - **Lista de productos** (/dashboard/productos): tabla de 772 SKUs con ingresos 12m, margen %, stock, clase ABC, proveedor, días sin vender, estado activo/deadstock. Filtros por categoría/clase/estado/búsqueda, sorting por columna, filas clickeables al detalle
  - **Detalle de producto** (/dashboard/productos/[sku]): header con estado, 5 KPI cards (ingresos 12m, margen con comparación histórica, stock, clientes activos, días sin vender), gráfica de ingresos mensuales + card de inventario por bodega con barras visuales de nivel, top 10 clientes con ClienteLink
  - **SKUs clickeables** en TopSKUs, Deadstock, y detalle de cliente: todos usan ProductoLink (src/components/ui/ProductoLink.tsx)
- Módulo de Vendedores completo:
  - **Lista de vendedores** (/dashboard/vendedores): tabla de 7 vendedores con ingresos mes actual, cambio vs anterior, margen, descuento promedio, clientes activos. Filtros por zona y tipo, sorting por columna, filas clickeables al detalle
  - **Detalle de vendedor** (/dashboard/vendedores/[id]): header con zona y tipo, KPI cards (ingresos 12m, margen, descuento, clientes activos + card de clientes en riesgo si >0), gráfica de ingresos mensuales, dos tablas lado a lado (top clientes con ClienteLink + top SKUs con ProductoLink)
  - **Vendedores clickeables** en RendimientoVendedores del Resumen Ejecutivo: usan VendedorLink (src/components/ui/VendedorLink.tsx)
- Patrón de navegación: tres componentes de link en src/components/ui/ (ClienteLink, ProductoLink, VendedorLink). Cualquier nombre de entidad en cualquier pantalla debe usar su link correspondiente para navegación consistente
- Sales Intelligence completo:
  - **Oportunidades** (/dashboard/oportunidades): detección automática de recompras tardías (3,021) y cross-sell (2,880) con tablas de cache pre-computadas. Tabs: Oportunidades, Borradores, Cotizaciones
  - **Cotizaciones**: wizard de 3 pasos (Header → Líneas → Revisión) con panel de recomendaciones (recompras, compró una vez, cross-sell), buscador de productos, precios históricos del cliente. Edición de borradores, duplicación, y state machine (borrador → enviada → completada/cancelada). Borrador cancelado = DELETE, enviada cancelada = UPDATE estado
  - **Tab Oportunidades en detalle de cliente**: recompras tardías + cross-sell por cliente, botón "Nueva cotización" que abre wizard pre-llenado
  - **Sección en Resumen Ejecutivo**: valor total de oportunidades detectadas + top 5 clientes por oportunidad
- Anomalías deliberadas inyectadas en los datos para demostrar capacidad de detección (duplicados, margen erosionado en plomería, cliente en declive, deadstock)
- Autenticación y roles operativos (Fase 1 del pivot):
  - 9 usuarios de prueba con Supabase Auth y `@supabase/ssr` para manejo server-side de cookies
  - 3 roles (`dueno`, `comprador`, `rep`) asignables múltiples por usuario, con jerarquía de aterrizaje dueno > comprador > rep
  - Sidebar dinámico según roles, header con selector de vista para multi-rol, middleware protegiendo `/dashboard/*`
  - Filtrado automático por vendedor en RPCs `get_clientes_lista` y `get_lista_oportunidades` cuando el usuario es rep puro
- Tablero de compras (Fase 2 del pivot):
  - Página de aterrizaje del comprador en `/dashboard/tablero-compras` con header personalizado y conteos accionables
  - 4 KPI cards (desabasto crítico, capital atrapado, 2 placeholders para Fase 4), sección POs sugeridas por bodega
  - Desabasto crítico (top 10), próximos a desabasto (horizonte 14 días), alertas de inventario (deadstock + sobrestock + sin movimiento)
  - Fórmula unificada de desabasto en todo el producto: `stock < demanda_diaria_promedio_90d × 21`
- POs sugeridas persistentes (Fase 3 del pivot):
  - Tabla `po_sugeridas` con líneas como JSONB array editable, generación manual con botón en el Tablero
  - Página de detalle `/dashboard/compras/po/[id]` con edición inline, paginación de 50, auto-guardado en localStorage
  - Flujo anti-conflicto de revisor con 5 estados, modal de descarte con notas obligatorias
  - Búsqueda typo-tolerant con `pg_trgm` (threshold 0.2), lead time placeholder (14 días) visible inline
- Tracking de acciones del comprador (Fase 4A del pivot):
  - Tabla `acciones_comprador` con log de eventos (toma de revisión, aprobación, descarte, modificación). Diseñada para ser extensible a otros tipos de acciones
  - Hooks automáticos en las 4 RPCs existentes de POs que insertan una acción por cada mutación exitosa
  - Página `/dashboard/compras/mi-historial` con filtros de fecha, tipo, y resumen del periodo
  - KPIs del Tablero de compras actualizados con datos reales: `valor_pos_aprobadas_mes`, `pos_pendientes_revision`, y nuevo `tiempo_promedio_revision_horas`
- Mi actividad del comprador (Fase 4C del pivot):
  - Página `/dashboard/compras/mi-actividad` con 2 tabs: Actividad reciente + Historial completo
  - Tab Actividad reciente con 4 secciones: POs en revisión por mí (badge urgencia, botón "Continuar revisión"), aprobadas recientes, descartadas recientes (con motivo), ajustes de inventario recientes (overrides min/max con link a producto)
  - Tab Historial completo: migrado desde `/mi-historial` con filtros de fecha, tipo, y resumen del periodo
  - Sidebar actualizado ("Mi historial" → "Mi actividad"), ruta vieja redirige con `?tab=historial`
  - RPCs: `get_pos_por_revisor` (POs por revisor asignado) y `get_overrides_recientes` (últimos overrides min/max)
- Mi desempeño del comprador (Fase 5 del pivot):
  - Página `/dashboard/compras/mi-desempeno` con KPIs personales del mes (POs aprobadas/descartadas, valor, tiempo revisión, overrides) con comparación vs mes anterior
  - Gráfica Recharts de barras apiladas (aprobaciones + descartes) con serie de 12 meses
  - Entrada "Mi desempeño" en sidebar para roles comprador y dueño
  - RPCs: `get_kpis_comprador_personal` y `get_actividad_mensual_comprador`
- Operación de compras en Resumen Ejecutivo (Fase 5 del pivot):
  - Sección con 4 métricas globales: valor POs aprobadas, pendientes de revisión, SKUs desabasto crítico, capital atrapado
  - Colores condicionales rojo/verde para pendientes y desabasto, link al módulo de compras
- Polish del módulo comprador (Fase 6 del pivot):
  - Sistema de toasts con sonner: confirmaciones en todas las mutaciones (POs, overrides, cotizaciones) vía hook `useToastFromUrl` con pattern `?toast=CODIGO` en redirects
  - Estados vacíos amigables en 8 componentes (mensajes contextuales en español cuando no hay datos o filtros no retornan resultados)
  - Loading skeletons (`loading.tsx`) en 5 rutas del módulo comprador con `animate-pulse`
  - Verificación end-to-end: 14/15 checks pasaron en flujos comprador (María) y dueño (Roberto)
- Tablero de ventas del rep (Fase 7 del pivot):
  - Página `/dashboard/tablero-ventas` con header personalizado, 6 KPI cards con comparación vs mes anterior
  - Oportunidades de mayor valor (top 7 con "Crear cotización"), cotizaciones pendientes (borradores + enviadas), clientes en riesgo (declive/inactivo)
  - Filtrado por vendedor en RPCs: `get_clientes_en_riesgo(p_vendedor_id)`, `get_cotizaciones_lista(p_vendedor_id)`, `get_kpis_rep_mes(p_vendedor_id)`
  - Sidebar dinámico: dueño ve 10 items, comprador 5, rep 4. Dueño puede acceder a ambos tableros
  - Loading skeleton + estados vacíos amigables
- Velocidad de cotización (Fase 8 del pivot):
  - Auto-asignación de vendedor logueado al abrir wizard (prop `vendedorIdLogueado`)
  - Stock total inline en dropdown de búsqueda de productos ("Stock: N" o "Sin stock" en rojo)
  - Botón duplicar línea en tabla del wizard (copia con nuevo key, inserta debajo)
  - Atajos de teclado: Enter agrega primer resultado de búsqueda, Escape cierra dropdown
  - RPC `get_productos_busqueda` ahora retorna `stock_total`
- Tracking de acciones del rep (Fase 9 del pivot):
  - Tabla `oportunidades_trabajadas` con acciones cotizada/descartada/pospuesta por par vendedor-cliente
  - Botones inline Cotizar/Descartar/Posponer en cada oportunidad del Tablero de ventas
  - Modales de descarte (notas) y posposición (date picker + quick picks)
  - Oportunidades trabajadas se ocultan del tablero; pospuestas reaparecen con badge "Regresó"
  - Header con contadores: pendientes, trabajadas hoy, pospuestas activas
  - Página `/dashboard/tablero-ventas/mi-actividad` con 4 cards de resumen + tabla filtrable de acciones
  - RPCs: `registrar_oportunidad_trabajada`, `get_oportunidades_tablero_rep`, `get_historial_oportunidades_rep`, `get_resumen_oportunidades_rep`

## Decisiones tomadas

| Fecha | Decisión | Razón |
|-------|----------|-------|
| Abr 2026 | Stack: Next.js + Supabase + Vercel | Velocidad de desarrollo, costo cero inicial, Supabase tiene PostgreSQL completo para analytics |
| Abr 2026 | Segmento: mayoristas MX $85M-$1,700M MXN, foco autopartes $85M-$850M | Sweet spot donde hay dolor real pero no hay presupuesto para SAP Analytics Cloud |
| Abr 2026 | ERP-first, no WhatsApp-first | WhatsApp es feature, no wedge. El valor está en los datos del ERP |
| Abr 2026 | SAP B1 → CONTPAQi → Aspel | Orden de integración por complejidad técnica ascendente |
| Abr 2026 | V0 con datos sintéticos | Validar UX y storytelling antes de integrar ERPs reales |
| Abr 2026 | Nunca tocar CFDI/compliance fiscal | Gestionix (ERP MX, cerró 2023 post-adquisición Konfío) mostró que mantener compliance SAT es carga insostenible. Dejar que Aspel/CONTPAQi/SAP lo manejen |
| Abr 2026 | Agregaciones en Postgres, no JS | Supabase limita a 1000 filas por query — todo analytics vía RPC functions |
| Abr 2026 | Textos dinámicos centralizados | Prevenir bugs de concordancia gramatical en español |
| Abr 2026 | Componentes de link en src/components/ui/ | ClienteLink, ProductoLink y VendedorLink — patrón estándar de navegación para cualquier entidad |
| Abr 2026 | "Patrón de compra" en vez de "Frecuencia" | Más accionable para vendedores que una frecuencia abstracta. Muestra patrón (regularmente/ocasionalmente/esporádicamente) + días desde última compra con color condicional basado en intervalo promedio del cliente |
| Abr 2026 | Cross-sell con coocurrencia SQL, no ML | Transparente y explicable ("80% de clientes similares compran esto"). ML diferido a V2+ cuando haya datos reales de múltiples clientes |
| Abr 2026 | Borrador cancelado = DELETE, enviada cancelada = UPDATE estado | Borradores no tienen valor de registro. Cotizaciones enviadas sí porque fueron propuestas a un cliente |
| Abr 2026 | Precio default en cotización: último precio del cliente o precio de lista | Prioriza historial del cliente, fallback a catálogo |
| Abr 2026 | Cache pre-computado para oportunidades | Queries de recompra y cross-sell tardan >8s en tiempo real. Pre-computar en tablas cache, refrescar con refrescar_oportunidades(). Patrón estándar de BI |
| Abr 2026 | Auto-guardado de wizard con localStorage | Evita perder trabajo en progreso. No en DB para no crear borradores basura. Sincronización entre dispositivos diferida a V2 |
| Abr 2026 | Pivot al usuario operativo | Resumen Ejecutivo estaba orientado al dueño. La propuesta de valor real es facilitar la vida al rep y al comprador. Reorientar alrededor de sus flujos diarios con "Tablero de ventas" y "Tablero de compras" como páginas de aterrizaje |
| Abr 2026 | Jerarquía de aterrizaje dueno > comprador > rep | Multi-rol: usuario con varios roles aterriza en el de mayor jerarquía |
| Abr 2026 | Nombres: "Tablero de ventas" / "Tablero de compras" | Originalmente "Mi día", pero ambiguo para multi-rol. "Tablero" comunica panel operativo |
| Abr 2026 | Ventana de demanda: 90 días fijos | Ventana única para todas las RPCs del Tablero de compras. Consistencia entre "próximo a desabasto" y "sobrestock" |
| Abr 2026 | Fórmula única de desabasto: `stock < demanda_diaria × 21` | Se unificaron dos fórmulas (una con `cantidad_minima` del seed, otra con demanda calculada) para evitar drift entre módulos |
| Abr 2026 | POs sugeridas: generación manual, no automática | Botón visible para comprador/dueno, con indicador "última generación hace X". Evita que el comprador vea datos cambiando sin su acción |
| Abr 2026 | Anti-conflicto de revisor en POs sugeridas | El `comprador_id_revisor` solo se asigna vía `tomar_revision_po`, nunca automáticamente. No se sobreescribe si otro usuario ya es revisor |
| Abr 2026 | `acciones_comprador` como única fuente de verdad para métricas de tiempo del comprador | Evita duplicación de timestamps en tablas de dominio. Single source of truth facilita agregaciones consistentes y extensibilidad a nuevos tipos de acción sin cambiar el modelo |
| Abr 2026 | `min_max_overrides` eliminada — los overrides escriben directamente en `inventario` | El modelo de "override como entidad separada" creaba dos verdades operativas paralelas. En V0 tratamos `inventario.cantidad_minima/maxima` como "el ERP" y escribimos directamente. `acciones_comprador` sigue siendo el log de cambios vía metadata JSONB. En V1, `upsert_min_max_override` llamará al API del ERP |
| Abr 2026 | Badge de "Rec./Custom" en Tab Planeación se deriva de `acciones_comprador`, no de comparación de valores | Comparar `min_actual === min_recomendado` es ambiguo: un valor del seed casualmente distinto al recomendado se vería como "Custom" sin que nadie lo haya tocado. La única forma correcta de saber si hubo intervención del comprador es leer de `acciones_comprador` directamente |
| Abr 2026 | `inventario.cantidad_minima/maxima` restaurado desde seed después de UPDATE masivo erróneo | Durante el refactor 4B-refactor-1, se ejecutó un UPDATE masivo que sobrescribió las 1,544 filas de inventario con los valores del cálculo recomendado. El fix restauró los valores usando la fórmula determinística del seed original (`scripts/seed/inventario.ts`) |
| Abr 2026 | Override es por par `(producto_id, bodega_id)`, no global por producto | Un producto puede tener distinto comportamiento de inventario en León vs Querétaro (distintas demandas, distintas restricciones operativas). Granularidad item-bodega es consistente con el resto del modelo de datos |
| Abr 2026 | Override de min/max es la verdad operativa (Camino B) | Las RPCs de cálculo de inventario respetan el override cuando existe vía COALESCE. Un override personalizado de mínimo cambia qué items aparecen en desabasto crítico, qué POs se sugieren, y los valores de la tabla de planeación. Esto materializa el principio de que las decisiones del comprador mueven la operación, no son cosméticas |
| Abr 2026 | Fórmula de "Recomendado" unificada a ventana operacional de 90 días | Antes existían dos fórmulas: una con historial completo (Tab Planeación) y otra con 90 días (RPCs operacionales). Esto creaba incoherencia entre lo que el modal mostraría como recomendado y lo que el sistema usaba para detectar desabasto. La unificación a 90 días refleja la realidad operativa reciente, que es lo que importa para las decisiones diarias del comprador, y elimina la posibilidad de que el modal de min/max contradiga al resto del producto |
| Abr 2026 | Modal de override sigue patrón "recomendación + override + historia" tipo Recurrency | Tres opciones de selección con justificación visible (popover de fórmula). El historial vive embebido en el mismo modal, no en página separada. Esto convierte el modal en una herramienta educativa: el comprador no solo ajusta valores, entiende por qué el sistema recomendó lo que recomendó y qué ha pasado antes con ese ítem |
| Abr 2026 | POs en revisión se conservan al regenerar | `generar_pos_sugeridas()` solo elimina POs pendientes sin revisor. Protege trabajo en progreso |
| Abr 2026 | POs aprobadas excluyen sus items de futuras regeneraciones | Coherente con Camino B (las decisiones del comprador son la verdad operativa). Una vez que un item-bodega está en una PO aprobada, no se vuelve a sugerir hasta que algo cambie en V1 con integración real al ERP. Items eliminados conscientemente antes de aprobar SÍ siguen sugiriéndose |
| Abr 2026 | Paginación de POs: 50 items por página en detalle | POs del seed actual tienen 750+ líneas. Paginación con buscador inline por simplicidad |

## Cosas diferidas

Ver `BACKLOG.md` en el repo para la lista completa con horizonte tentativo (V1, V2, V3+). Highlights:
- Multi-tenant con RLS (V1)
- Integraciones reales con ERPs (V1-V3)
- ~~KPIs del comprador con datos reales~~ — Fase 4A completada (parcial: `skus_desabasto_mes_anterior` sigue diferido)
- Lead time real desde historial de POs del ERP (V1)
- Mobile responsive (V1)
- WhatsApp agent (V2)
- Fintech/lending (V3+)

## Próximos pasos inmediatos

**Semana 3 (completada):**
- ~~Módulo de Compras completo~~ — tres tabs funcionales (Pronóstico, Planeación, Compras)
- ~~Alertas de margen por categoría~~ — detecta erosión de Plomería

**Semana 4 (completada):**
- ~~Módulo de Clientes completo~~ — lista filtrable + detalle con KPIs, gráfica y top SKUs
- ~~Módulo de Productos completo~~ — lista filtrable + detalle con inventario por bodega y top clientes
- ~~Módulo de Vendedores completo~~ — lista filtrable + detalle con top clientes y top SKUs
- ~~Navegación entre entidades~~ — ClienteLink, ProductoLink, VendedorLink en todas las pantallas
- ~~Patrón de compra~~ — reemplazó "frecuencia" por análisis de intervalos más accionable

**Semana 5 (completada):**
- ~~Sales Intelligence completo~~ — oportunidades (recompra + cross-sell), cotizaciones con wizard, tabs Borradores/Cotizaciones, state machine
- ~~Sección de oportunidades en Resumen Ejecutivo~~ — valor total + top 5 clientes

**Fase 1 — Pivot orientado al usuario operativo (completada):**
- 1A: Backend de identidad — tablas `usuarios`/`usuario_roles`, 9 cuentas de prueba, RPCs con filtro opcional por vendedor
- 1B: Frontend de identidad — login con Supabase Auth, middleware de protección, sidebar dinámico por roles, header con usuario/badges/selector de vista, filtrado automático para reps puros

**Fase 2 — Tablero de compras (completada):**
- 2A: Backend — RPCs de desabasto, próximos, sobrestock, KPIs comprador con ventana de 90 días
- 2B: UI — header, KPI cards, tablas desabasto y próximos
- 2C: Migración fórmula unificada, POs sugeridas por bodega, alertas de inventario (deadstock+sobrestock+sin movimiento), query param ?tab= en Compras

**Fase 3 — POs sugeridas persistentes (completada):**
- 3A: Backend — tabla `po_sugeridas`, 7 RPCs (generar, listar, detalle, tomar revisión, aprobar, descartar, actualizar líneas)
- 3B: Página de detalle — edición inline, paginación 50, auto-guardado, flujo revisor anti-conflicto
- 3C-1: Integración Tablero — POs persistentes, botón generar manual, link a detalle individual
- 3C-2: Búsqueda typo-tolerant con pg_trgm, lead time placeholder (14 días) visible inline

**Fase 4A — Tracking de acciones del comprador (completada):**
- Tabla `acciones_comprador` con hooks automáticos en 4 RPCs de POs
- Página Mi historial con filtros y resumen del periodo
- KPIs del Tablero con datos reales (3 de 4 activos, 1 placeholder documentado)

**Fase 4B — Override editable de min/max (completada, incluyendo refactor):**
- Sub-fases: 4B-1 (backend), 4B-2 (RPCs con COALESCE), 4B-2.5 (fórmula unificada a 90 días), 4B-3 (UI modal + bulk + historial polimórfico)
- Refactor 4B-refactor-1: tabla `min_max_overrides` eliminada, overrides escriben directamente en `inventario.cantidad_minima/maxima`
- Hot fixes post-4B: estandarización PO→Orden de compra, tab renombrado, refresh de tab preservado, ícono de ojo eliminado de tabla, botones huérfanos eliminados
- Audit de contrastes: 20 cambios de grises para cumplir WCAG AA (regla 27)
- Fix: POs aprobadas no re-aparecen al regenerar (`generar_pos_sugeridas` con NOT EXISTS)
- Fix: seed de `inventario.cantidad_minima/maxima` restaurado después de UPDATE masivo erróneo
- Fix: badge de Tab Planeación derivado de `acciones_comprador` (no comparación de valores)

**Fase 4C — Mi actividad del comprador (completada):**
- Página `/dashboard/compras/mi-actividad` con 2 tabs (Actividad reciente + Historial completo)
- 4 secciones en Actividad reciente: POs en revisión, aprobadas, descartadas, overrides min/max
- Historial completo migrado desde `/mi-historial` con filtros y resumen intactos
- Sidebar actualizado, ruta vieja redirige, deep-linking con `?tab=historial`
- RPCs: `get_pos_por_revisor`, `get_overrides_recientes`

**Fase 5 — Métricas y vista de dueño sobre compras (completada):**
- Página `/dashboard/compras/mi-desempeno` con KPIs personales (POs aprobadas/descartadas, valor, tiempo revisión, overrides) + comparación vs mes anterior
- Gráfica Recharts de barras apiladas (aprobaciones + descartes) con serie de 12 meses
- Sección "Operación de compras" en Resumen Ejecutivo con 4 métricas globales y colores condicionales
- RPCs: `get_kpis_comprador_personal`, `get_actividad_mensual_comprador`
- Sidebar: entrada "Mi desempeño" para comprador y dueño

**Fase 6 — Polish del módulo comprador (completada):**
- Toasts con sonner: confirmaciones en todas las mutaciones vía `?toast=CODIGO` en redirects
- Estados vacíos amigables en 8 componentes (mensajes en español, centrados, `text-gray-400`)
- Loading skeletons en 5 rutas (`loading.tsx` con `animate-pulse`)
- Verificación end-to-end: flujos comprador (María) y dueño (Roberto), 14/15 checks pasaron
- Hito: módulo del comprador funcional y pulido. Arranca el rep.

**Fase 7 — Tablero de ventas del rep (completada):**
- Página `/dashboard/tablero-ventas` con header personalizado, 6 KPI cards, oportunidades top 7, cotizaciones pendientes, clientes en riesgo
- Filtrado por vendedor en RPCs: `get_clientes_en_riesgo`, `get_cotizaciones_lista`, `get_lista_oportunidades`, `get_kpis_rep_mes`
- Sidebar dinámico: dueño ve todo (10 items), comprador 5, rep 4
- Loading skeleton + estados vacíos amigables
- Nota: renombrado de "Mi día del rep" a "Tablero de ventas" por consistencia con "Tablero de compras"

**Fase 8 — Velocidad de cotización (completada):**
- Auto-asignación de vendedor logueado al wizard (prop `vendedorIdLogueado`)
- Stock inline en búsqueda de productos (`get_productos_busqueda` retorna `stock_total`)
- Botón duplicar línea con ícono de copiar
- Atajos de teclado: Enter agrega primer resultado, Escape cierra dropdown
- Búsqueda typo-tolerant ya existía desde Fase 3 (pg_trgm, threshold 0.2)

**Fase 9 — Tracking de acciones del rep (completada):**
- Tabla `oportunidades_trabajadas` con acciones cotizada/descartada/pospuesta
- Botones inline Cotizar/Descartar/Posponer con modales de confirmación
- Oportunidades trabajadas se ocultan del tablero, pospuestas reaparecen con badge
- Página Mi actividad del rep con cards + tabla filtrable
- RPCs: `registrar_oportunidad_trabajada`, `get_oportunidades_tablero_rep`, `get_historial_oportunidades_rep`, `get_resumen_oportunidades_rep`

**Siguiente: Fase 10 — Métricas personales del rep (semana 15, ~10 horas)**

Objetivo: Análoga a Mi desempeño del comprador.

Trabajo:

- Página `/dashboard/mi-desempeno` (visible solo para rol rep)
- KPIs personales del mes
- Gráfica histórica de los últimos 12 meses
- Top clientes y top SKUs del rep

Criterio de éxito:
Como rep, veo mi progreso del mes y me motiva a usar la herramienta.

**Fase 11 — Inteligencia de oportunidades (semana 17-18, ~20 horas)**

Objetivo: Que cada recomendación de venta tenga contexto profundo que genere confianza en el vendedor. Pasar de "quizás le interese" a "va a necesitar esto la próxima semana".

Trabajo:

- Análisis de cadencia por par cliente-SKU: calcular intervalo promedio de compra, detectar si el cliente está atrasado, y predecir fecha estimada de próxima compra
- Enriquecer las oportunidades de recompra con contexto: "Este cliente compra este producto cada ~45 días. Última compra hace 52 días — probablemente necesita reorden pronto"
- Detección de estacionalidad simple (sin ML): comparar compras del mismo mes del año anterior para cada par cliente-SKU. Etiquetar como "Este cliente suele comprar este producto en esta época del año" cuando hay patrón
- Tabs de contexto por recomendación en el panel de oportunidades del cliente: Cadencia (intervalo, historial de compras), Uso (volúmenes, tendencia), Estacional (comparación mes a mes)
- Integrar el contexto enriquecido en el wizard de cotizaciones (panel de recomendaciones) y en Mi día del rep (Fase 7)

Criterio de éxito:
Como rep, abro una oportunidad de recompra y veo exactamente por qué el sistema la está sugiriendo, con datos concretos que puedo usar en la llamada al cliente.

**Fase 12 — Explorer: vista multidimensional de datos (semana 19-20, ~20 horas)**

Objetivo: Que cualquier usuario pueda explorar los datos transaccionales libremente, pivotando por cualquier dimensión, sin depender de vistas preconstruidas.

Trabajo:

- Crear página `/dashboard/explorer` con tabla multidimensional
- Dimensiones pivotables: Bodegas, Vendedores, Clientes, Destinos (Ship To), Categorías de producto, Productos, Meses
- Métricas por fila: Ventas YTD, Ventas año anterior (LYTD), Delta ventas ($, %), Margen bruto YTD, Margen LYTD, Delta margen ($, %), sparkline de tendencia
- Filtros cruzados: seleccionar una fila aplica como filtro a la siguiente dimensión (ej: click en un vendedor filtra para ver solo sus clientes)
- Botón "Apply" por fila que navega al detalle de la entidad
- Sorting por cualquier columna
- Buscador dentro de cada vista
- RPCs parametrizadas que acepten la dimensión como argumento y retornen las métricas agregadas con comparación YTD vs LYTD

Criterio de éxito:
Como dueño, puedo responder "¿cuáles productos perdieron más margen este año vs el anterior en la zona de Querétaro?" en menos de 30 segundos.

**Fase 13 — Reportes guardados y dashboard personalizable (semana 21, ~12 horas)**

Objetivo: Que cada usuario pueda guardar las vistas del Explorer que más usa y acceder a ellas rápidamente.

Trabajo:

- Botón "Guardar como reporte" en el Explorer que captura: dimensión activa, filtros aplicados, ordenamiento, y nombre del reporte
- Tabla `reportes_guardados` con `usuario_id`, `nombre`, `configuracion` (JSONB), timestamps
- Página `/dashboard/reportes` que lista los reportes guardados del usuario con fecha de creación y acciones (abrir, eliminar)
- Capacidad de anclar reportes al dashboard principal del usuario (sección "Reportes anclados" en el Resumen Ejecutivo o en el tablero de aterrizaje según el rol)
- Reportes predefinidos por tipo de usuario: "Top Territories", "Top Customers", "Top Items" (los 3 que Recurrency muestra como defaults)

Criterio de éxito:
Como dueño, guardo "Clientes con margen en declive" como reporte, lo anclo a mi dashboard, y cada vez que abro el producto lo veo actualizado sin configurar nada.

**Fase 14 — Polish final y demo prep (semana 22, ~10 horas)**

Objetivo: Que todo el producto esté pulido para mostrarse a inversionistas y primeros clientes.

Trabajo:

- Identidad visual: definir color de acento, jerarquía tipográfica, personalidad del sidebar y cards
- Estados vacíos en todas las páginas que falten (explorer, reportes, tablero del rep)
- Loading states consistentes en páginas nuevas
- Toasts en todas las mutaciones nuevas
- Screenshots de los tres flujos (rep, comprador, dueño) para deck
- Documentación completa en CONTEXTO_PROYECTO.md, BACKLOG.md, CLAUDE.md
- Verificar los flujos end-to-end de los tres roles
- Regenerar el seed con distribución realista de inventario (actualmente ~97% en stock cero)

Criterio de éxito:
Puedes mostrar el producto completo a un inversionista o cliente potencial sin pedir disculpas por nada.

**Crítico antes del demo (fuera del cronograma de fases):** Regenerar el seed con distribución realista de inventario. Hoy ~97% del inventario está en stock cero. Distribución target: ~70% saludable, ~15% sobrestock, ~10% próximo a desabasto, ~5% desabasto crítico.

## Paridad con Recurrency — Módulo Compras

| Feature de Recurrency | Estado | Notas |
|------------------------|--------|-------|
| Tabla de forecasting por SKU | Implementado | Tab Pronóstico con 772 SKUs × 2 bodegas |
| Clasificación ABC por ingresos | Implementado | A (top 20%), B (20-50%), C (resto) |
| Sparkline de tendencia por fila | Implementado | Serie de 6 meses con Recharts |
| Filtro por bodega/ubicación | Implementado | Todas / León / Querétaro |
| Filtro por categoría | Implementado | 9 categorías del catálogo |
| Filtro por clase ABC | Implementado | Todas / A / B / C |
| Toggle de demanda reciente | Implementado | Muestra/oculta SKUs sin ventas en 6 meses |
| Selector de horizonte (1-6 meses) | Implementado | 1, 3, 6 meses; extensión a 18 meses en backlog V1 |
| Porcentaje de cambio con color | Implementado | Verde >+10%, rojo <-10%, gris neutro |
| Sorting por columna | Implementado | SKU, clase ABC, demanda, pronóstico, cambio %, ingresos |
| Filtro por proveedor (Primary Vendor) | Backlog V1 | Requiere datos de ERP reales |
| Horizonte extendido hasta 18 meses | Backlog V1 | Actualmente máximo 6 meses |
| Sparkline con segmento de pronóstico | Backlog V1 | Historial gris + proyección en color |
| Detección de estacionalidad | Backlog V2 | Modelo actual es promedio ponderado simple |
| Herencia de item (SKU sucesor) | Backlog V2 | Para SKUs que reemplazan descontinuados |
| Min/max dinámicos por SKU | Implementado | Tab Planeación: mín = demanda_90d × 21, máx = demanda_90d × 60. Override editable por comprador |
| Modal de override min/max | Implementado | Opciones Recomendado/Personalizado, popover de fórmula, historial, selección múltiple con bulk |
| Estado de inventario (OK/Revisar) | Implementado | Filtros tipo Recurrency con conteo por estado |
| Sugerencias de PO automáticas | Implementado | Tab Compras: detecta desabasto, calcula cantidad a pedir |
| Selección múltiple para PO | Implementado | Checkbox por fila + seleccionar todos + botón "Generar OC" |
| Meses de suministro por SKU | Implementado | cantidad actual ÷ demanda mensual, con color condicional |
| Estado desabasto/OK/sobrestock | Implementado | Badges de color como Recurrency + filtros por estado |
| Búsqueda por SKU/nombre | Implementado | Client-side en tabs Planeación y Compras |
| Lead time calculado del ERP | Backlog V1 | Actualmente fijo a 14 días |
| Fill rate e inventory turns | Backlog V1 | Métricas adicionales de eficiencia |
| Safety stock dinámico | Backlog V2 | Actualmente fijo a 7 días |
| Generación real de PO en ERP | Backlog V1 | Actualmente muestra toast placeholder |
| Integración con ERP para POs | N/A en V0 | V0 usa datos sintéticos, no se conecta a ERPs |
| Epicor Prophet 21 integration | N/A | Recurrency usa P21; nosotros usaremos SAP B1 / CONTPAQi / Aspel |
| Pricing dinámico desde forecasting | N/A en V0 | Feature diferido a módulo de Sales intelligence |

## Paridad con Recurrency — Sales Intelligence

| Feature de Recurrency | Estado | Notas |
|------------------------|--------|-------|
| Opportunities: lista priorizada | Implementado | Recompras + cross-sell con cache pre-computado |
| Cadencia por par cliente-SKU | Backlog Fase 11 | Intervalo promedio, predicción de próxima compra |
| Estacionalidad por par cliente-SKU | Backlog Fase 11 | Comparación mes a mes sin ML |
| Tabs Cadence/Usage/Seasonal | Backlog Fase 11 | Contexto profundo por recomendación |
| Crear cotización desde oportunidad | Implementado | Wizard 3 pasos con recomendaciones |
| Draft Quotes | Implementado | Borradores con auto-guardado |
| Quote → Order workflow | Backlog V1 | Requiere integración ERP |
| Upsell en órdenes inbound | Backlog V2 | Recomendaciones al recibir orden |

## Paridad con Recurrency — Explorer / Reporting

| Feature de Recurrency | Estado | Notas |
|------------------------|--------|-------|
| Explorer multidimensional | Backlog Fase 12 | Pivot por 7 dimensiones |
| YTD vs LYTD con deltas | Backlog Fase 12 | Ventas y margen |
| Sparklines por fila | Backlog Fase 12 | Tendencia inline |
| Filtros cruzados | Backlog Fase 12 | Click en fila filtra siguiente dimensión |
| Guardar como reporte | Backlog Fase 13 | Nombre + configuración JSONB |
| Anclar al dashboard | Backlog Fase 13 | Reportes favoritos en vista principal |
| Reportes predefinidos por rol | Backlog Fase 13 | Top Territories/Customers/Items |
| Búsqueda global (keyword) | Implementado | Ctrl+K en header |

---

## Cómo usar este documento

1. **Chat nuevo en claude.ai:** Pega este documento completo al inicio del primer mensaje. Después de pegarlo, escribe tu pregunta o tarea específica.

2. **Continuación de trabajo técnico:** Si vas a pedirle a Claude que escriba código, especifica que el repo se llama `ferreteria-mvp`, usa Next.js 14 App Router, y las reglas arquitectónicas del proyecto (agregaciones en Postgres, textos vía módulo centralizado, TypeScript estricto, comentarios en español).

3. **Actualización:** Este documento se actualiza al final de cada semana. Si el estado cambió significativamente, re-genera desde Claude Code con el comando "actualiza CONTEXTO_PROYECTO.md con el estado actual".

**Última actualización:** 2026-04-15 (Fase 9 completada — Tracking de acciones del rep)
