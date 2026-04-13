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

- **Fase:** V0 (MVP con datos sintéticos) — Módulo del comprador completado (Fases 1, 2, 3, 4A del pivot)
- **Última actividad:** Fase 4A completada (tracking de acciones del comprador, KPIs reales, página Mi historial)
- **Siguiente:** Fase 4B-2 del pivot (refactor de RPCs para respetar overrides)
- **Stack:** Next.js 14 + TypeScript + Tailwind + Supabase + Vercel + Recharts
- **Repo:** GitHub privado `ferreteria-mvp`
- **Deploy:** Vercel con auto-deploy desde main
- **Rutas:** 16 páginas (login, resumen, tablero-ventas, tablero-compras, compras, PO detalle, clientes, productos, vendedores, oportunidades, cotizaciones)
- **RPCs:** 59 funciones de Postgres (agregaciones, CRUD, búsqueda typo-tolerant, POs sugeridas)
- **Tablas:** 15 (6 seed + 2 cotizaciones + 2 cache oportunidades + 2 identidad + 1 POs sugeridas + 1 acciones comprador + 1 overrides min/max)

**Lo que está construido:**
- Generador de datos sintéticos completo (scripts/seed/) — 113K transacciones de una ferretería mayorista ficticia "Ferretera del Bajío" con 750 SKUs, 110 clientes, 7 vendedores, 18 meses de historia
- Dashboard de resumen ejecutivo con: KPIs principales, gráfica de ingresos/margen mensual, Top 10 SKUs (ingresos vs margen), alertas de margen por categoría (detecta erosión de Plomería), detección de deadstock, detección de clientes en riesgo, rendimiento por vendedor con callouts automáticos
- Módulo de Compras completo con tres tabs funcionales:
  - **Tab Pronóstico:** tabla de 1,544 filas (772 SKUs × 2 bodegas) con clasificación ABC, sparklines de tendencia, pronóstico ponderado, porcentaje de cambio con color condicional, sorting por columna, y filtros de bodega/categoría/clase ABC/demanda reciente/horizonte (1/3/6 meses)
  - **Tab Planeación:** análisis de min/max de inventario con mínimos y máximos recomendados calculados automáticamente. Fórmulas: mín. recomendado = demanda diaria promedio × (7 días safety stock + 14 días lead time); máx. recomendado = demanda mensual promedio × 2 meses. Incluye modal de detalle del cálculo, filtros por estado (OK/Revisar), búsqueda, y sorting
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
| Abr 2026 | `min_max_overrides` guarda solo el estado vigente, no el historial | El historial se deriva de `acciones_comprador` filtrando por `entidad_tipo = 'min_max_override'`. Mantiene una sola fuente de verdad consistente con la regla 25, evita drift entre tablas, y mantiene `min_max_overrides` chica y rápida para lookups en las RPCs de cálculo |
| Abr 2026 | Override es por par `(producto_id, bodega_id)`, no global por producto | Un producto puede tener distinto comportamiento de inventario en León vs Querétaro (distintas demandas, distintas restricciones operativas). Granularidad item-bodega es consistente con el resto del modelo de datos |
| Abr 2026 | Override de min/max es la verdad operativa (Camino B) | Las RPCs de cálculo de inventario respetan el override cuando existe vía COALESCE. Un override personalizado de mínimo cambia qué items aparecen en desabasto crítico, qué POs se sugieren, y los valores de la tabla de planeación. Esto materializa el principio de que las decisiones del comprador mueven la operación, no son cosméticas |
| Abr 2026 | Fórmula de "Recomendado" unificada a ventana operacional de 90 días | Antes existían dos fórmulas: una con historial completo (Tab Planeación) y otra con 90 días (RPCs operacionales). Esto creaba incoherencia entre lo que el modal mostraría como recomendado y lo que el sistema usaba para detectar desabasto. La unificación a 90 días refleja la realidad operativa reciente, que es lo que importa para las decisiones diarias del comprador, y elimina la posibilidad de que el modal de min/max contradiga al resto del producto |
| Abr 2026 | Modal de override sigue patrón "recomendación + override + historia" tipo Recurrency | Tres opciones de selección con justificación visible (popover de fórmula). El historial vive embebido en el mismo modal, no en página separada. Esto convierte el modal en una herramienta educativa: el comprador no solo ajusta valores, entiende por qué el sistema recomendó lo que recomendó y qué ha pasado antes con ese ítem |
| Abr 2026 | POs en revisión se conservan al regenerar | `generar_pos_sugeridas()` solo elimina POs pendientes sin revisor. Protege trabajo en progreso |
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

**Fase 4B-1 — Fundación de overrides de min/max (completada):**
- Tabla `min_max_overrides` con constraints (UNIQUE por par, CHECK min≤max, notas obligatorias para personalizado)
- 4 RPCs nuevas: `get_min_max_override`, `upsert_min_max_override`, `bulk_aplicar_recomendados`, `_calcular_recomendados`
- CHECK constraints de `acciones_comprador` ampliados para aceptar `min_max_override`
- Wrapper TypeScript con tipos y guards defensivos
- Tabla vacía intencionalmente — las RPCs de cálculo no la consultan hasta 4B-2

**Fase 4B-2 — Refactor de RPCs para respetar overrides (completada):**
- Las 4 RPCs de cálculo de inventario ahora hacen LEFT JOIN con `min_max_overrides` y usan COALESCE
- Snapshots pre/post coinciden bit por bit (tabla vacía = comportamiento idéntico)
- Test funcional: override con mínimo 99999 hace aparecer item saludable en desabasto crítico

**Fase 4B-2.5 — Unificación de fórmula a ventana operacional de 90 días (completada):**
- `_calcular_recomendados` y `get_planeacion_inventario` ahora usan ventana de 90 días, igual que las RPCs operacionales
- 98.3% de SKUs cambiaron sus valores recomendados (esperado: la ventana reciente refleja mejor la demanda actual)
- RPCs operacionales no cambiaron (misma fórmula desde antes)

**Fase 4B-3 — UI del modal min/max (completada):**
- Modal de override en Tab Planeación con tres opciones (Recomendado / Actual ERP / Personalizado)
- Popover de fórmula expandida con valores reales del item (educativo, no documentación externa)
- Historial embebido en el modal mostrando todos los cambios anteriores del par producto-bodega
- Selección múltiple en la tabla con bulk de "Aplicar recomendados"
- Integración con Mi historial: las acciones de override aparecen junto con las de POs, filtrables por tipo
- Las 4 RPCs de cálculo de inventario respetan los overrides automáticamente (Camino B)

**Fase 4B completa (4B-1 + 4B-2 + 4B-2.5 + 4B-3)**

**Post-Fase 4B:**
- Polish visual y UX del V0
- Regenerar seed con distribución realista de inventario antes de demo
- Preparar deck/demo para inversionistas
- Investigación de API SAP B1 diferida hasta tener primer cliente real

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
| Min/max dinámicos por SKU | Implementado | Tab Planeación: mín = demanda diaria × 21 días, máx = demanda mensual × 2 |
| Modal de detalle de cálculo | Implementado | Muestra fórmula completa con valores reales del SKU |
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

---

## Cómo usar este documento

1. **Chat nuevo en claude.ai:** Pega este documento completo al inicio del primer mensaje. Después de pegarlo, escribe tu pregunta o tarea específica.

2. **Continuación de trabajo técnico:** Si vas a pedirle a Claude que escriba código, especifica que el repo se llama `ferreteria-mvp`, usa Next.js 14 App Router, y las reglas arquitectónicas del proyecto (agregaciones en Postgres, textos vía módulo centralizado, TypeScript estricto, comentarios en español).

3. **Actualización:** Este documento se actualiza al final de cada semana. Si el estado cambió significativamente, re-genera desde Claude Code con el comando "actualiza CONTEXTO_PROYECTO.md con el estado actual".

**Última actualización:** 2026-04-13 (Fase 4B completa — override editable de min/max con modal, bulk, e integración con Mi historial)
