# CLAUDE.md — Contexto para Claude Code

Este archivo se carga automáticamente al inicio de cada sesión de Claude Code. Contiene todo lo necesario para arrancar con contexto completo.

---

## Proyecto

**Ferretería MVP** — Dashboard de business intelligence para mayoristas mexicanos. Capa de IA sobre ERPs existentes (SAP Business One, CONTPAQi, Aspel) que convierte datos transaccionales en insights accionables.

**Empresa ficticia para el V0:** Ferretera del Bajío, S.A. de C.V. (León, Guanajuato + bodega en Querétaro). 750 SKUs, 110 clientes, 7 vendedores, ~$255M MXN/año de ingresos.

**Objetivo del V0:** Dashboard funcional con datos sintéticos que demuestre el valor del producto a inversionistas y primeros clientes potenciales. No es un prototipo — es código de producción con datos simulados.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript estricto + Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL) — queries analíticas vía RPC functions
- **Gráficas:** Recharts
- **Deploy:** Vercel (auto-deploy desde GitHub main)
- **Seed:** scripts en TypeScript ejecutados con tsx

## Base de datos

15 tablas en Supabase (project: `talinunhftglhoghwacq`):

**Datos del negocio (seed):**
- `bodegas` — 2 filas (León, Querétaro)
- `productos` — 772 filas (750 base + 22 duplicados intencionales como anomalía)
- `clientes` — 122 filas (110 base + 12 duplicados intencionales)
- `vendedores` — 7 filas con perfiles diferenciados
- `transacciones` — ~113K filas, 18 meses (oct 2024 → abr 2026), cada fila es una línea de venta/devolución/nota de crédito
- `inventario` — ~1,544 filas (SKU × bodega)

**Cotizaciones (creadas por la app):**
- `cotizaciones` — header con estado, totales, fechas
- `cotizacion_lineas` — líneas con precios, cantidades, margen

**Identidad y roles:**
- `usuarios` — 9 filas, vincula cuentas de Supabase Auth con vendedores
- `usuario_roles` — roles por usuario (relación N a N)

**POs sugeridas (Fase 3):**
- `po_sugeridas` — POs generadas por el sistema, agrupadas por bodega. Líneas como JSONB array editable

**Tracking de acciones (Fase 4A):**
- `acciones_comprador` — log de eventos de decisiones del comprador. Única fuente de verdad para métricas de tiempo. Tipos: `po_toma_revision`, `po_aprobacion`, `po_descarte`, `po_modificacion`, `min_max_override`. Extensible a nuevos tipos vía CHECK constraint.

**Overrides de min/max (Fase 4B):**
- `min_max_overrides` — overrides vigentes de mínimo/máximo por par producto-bodega. Tres tipos: `recomendado`, `actual_erp`, `personalizado`. Constraint único en (producto_id, bodega_id) — solo un override vigente por par. El historial completo se deriva de `acciones_comprador`. Las 4 RPCs de cálculo de inventario (`get_planeacion_inventario`, `get_sugerencias_compra`, `get_items_desabasto_critico`, `get_items_proximos_desabasto`) ahora respetan los overrides vía LEFT JOIN.

**Cache de oportunidades (pre-computado con `refrescar_oportunidades()`):**
- `oportunidades_recompra_cache` — 3,021 pares cliente-SKU vencidos
- `oportunidades_cross_sell_cache` — 2,880 oportunidades por tipo de cliente

60+ RPC functions de Postgres (todas las agregaciones en SQL, nunca en JS):

**Resumen Ejecutivo:**
- `get_kpis_periodo(fecha_desde, fecha_hasta)` — KPIs agregados
- `get_ingresos_mensuales(fecha_desde, fecha_hasta)` — ingresos/costos por mes
- `get_top_skus_por_ingresos(fecha_desde, fecha_hasta)` — top 10 SKUs por ingresos
- `get_top_skus_por_margen(fecha_desde, fecha_hasta)` — top 10 SKUs por margen %
- `get_deadstock()` — SKUs sin ventas en 90+ días con inventario > 0
- `get_clientes_en_riesgo()` — clientes con declive ≥50% o inactivos 60+ días
- `get_rendimiento_vendedores(fecha_desde, fecha_hasta)` — métricas por vendedor
- `get_alertas_margen()` — categorías con caída de margen >3pp

**Módulo de Compras:**
- `get_forecast_skus()` — pronóstico por SKU × bodega (~1,544 filas, requiere paginación .range())
- `get_planeacion_inventario()` — min/max actuales vs recomendados (~1,544 filas)
- `get_sugerencias_compra()` — detección de desabasto/sobrestock/sin_movimiento con fórmula unificada (demanda×21). Incluye `bodega_id`, `demanda_diaria_promedio`, `minimo_recomendado`. Estados: desabasto, ok, sobrestock, sin_movimiento

**Módulo de Clientes:**
- `get_clientes_lista(p_vendedor_id INTEGER DEFAULT NULL)` — 110 clientes con métricas 12m. Si se pasa vendedor_id, filtra solo clientes cuyo vendedor principal es ese vendedor
- `get_cliente_detalle(p_cliente_id)` — KPIs + info básica de un cliente
- `get_cliente_ingresos_mensuales(p_cliente_id)` — 13 meses de historial
- `get_cliente_top_skus(p_cliente_id)` — top 10 SKUs con patrón de compra

**Módulo de Productos:**
- `get_productos_lista()` — 772 SKUs con métricas y clase ABC
- `get_producto_detalle(p_sku)` — KPIs + inventario por bodega
- `get_producto_ingresos_mensuales(p_sku)` — 13 meses de historial
- `get_producto_top_clientes(p_sku)` — top 10 clientes con patrón de compra

**Módulo de Vendedores:**
- `get_vendedores_lista()` — 7 vendedores con métricas mensuales
- `get_vendedor_detalle(p_vendedor_id)` — KPIs 12m + clientes en riesgo
- `get_vendedor_ingresos_mensuales(p_vendedor_id)` — 13 meses de historial
- `get_vendedor_top_clientes(p_vendedor_id)` — top 10 clientes con estado riesgo
- `get_vendedor_top_skus(p_vendedor_id)` — top 10 SKUs vendidos

**Sales Intelligence (oportunidades pre-computadas en cache):**
- `get_oportunidades_recompra()` — 3,021 pares cliente-SKU vencidos (query pesada, solo para poblar cache)
- `get_oportunidades_cross_sell()` — 2,880 oportunidades por tipo de cliente (query pesada, solo para poblar cache)
- `refrescar_oportunidades()` — trunca y re-llena tablas de cache desde las RPCs pesadas
- `get_lista_oportunidades(p_vendedor_id INTEGER DEFAULT NULL)` — lee del cache, 110 clientes con conteos y valores (~95ms). Si se pasa vendedor_id, filtra por vendedor principal del cliente usando CTE `vendedor_rank` sobre transacciones (JOIN por `vendedor_id` entero, NO por nombre denormalizado)
- `get_resumen_oportunidades()` — totales agregados del cache (~3ms)
- `get_top_clientes_oportunidades(p_limite)` — top N del cache (~6ms)
- `get_oportunidades_recompra_cliente(p_cliente_id)` — lee del cache para un cliente
- `get_oportunidades_cross_sell_cliente(p_cliente_id)` — lee del cache para un cliente
- `get_cliente_compro_una_vez(p_cliente_id)` — SKUs con exactamente 1 compra
- `get_productos_busqueda(p_termino)` — buscador por SKU o nombre (top 20)
- `get_precio_cliente_sku(p_cliente_id, p_sku)` — último precio pagado o precio de lista

**Cotizaciones (tablas: cotizaciones + cotizacion_lineas):**
- `get_cotizaciones_lista()` — todas las cotizaciones con cliente y vendedor
- `get_cotizacion_detalle(p_cotizacion_id)` — header de una cotización
- `get_cotizacion_lineas(p_cotizacion_id)` — líneas de una cotización
- `crear_cotizacion(p_cliente_id, p_vendedor_id, p_notas, p_fecha_vencimiento)` — crea header
- `agregar_linea_cotizacion(...)` — inserta línea y recalcula totales
- `eliminar_linea_cotizacion(p_linea_id)` — elimina línea y recalcula
- `actualizar_estado_cotizacion(p_cotizacion_id, p_nuevo_estado)` — cambia estado
- `duplicar_cotizacion(p_cotizacion_id)` — copia completa como borrador
- `actualizar_cotizacion_header(...)` — actualiza header (solo borradores)
- `reemplazar_lineas_cotizacion(p_cotizacion_id, p_lineas JSONB)` — reemplaza todas las líneas
- `eliminar_cotizacion(p_cotizacion_id)` — DELETE de borrador completo (header + líneas)
- `busqueda_global(p_termino)` — busca en clientes, productos y cotizaciones simultáneamente, retorna JSON con top 5/5/3 + conteos

**Tablero de compras (Fase 2) — ventana fija de 90 días para demanda:**
- `get_items_desabasto_critico()` — SKU × bodega con stock < mínimo recomendado (demanda_diaria × 21)
- `get_items_proximos_desabasto(p_horizonte_dias DEFAULT 14)` — stock >= mínimo PERO días hasta stockout < horizonte. Mutuamente excluyente con desabasto crítico
- `get_alertas_sobrestock()` — SKU × bodega con > 6 meses de inventario (excluye deadstock)
- `get_items_sin_movimiento_reciente()` — SKUs con stock > 0, sin venta en 30 días pero sí en 90 días (alerta temprana, mutuamente excluyente con deadstock)
- `get_kpis_comprador_mes()` — KPIs agregados del mes actual (algunos campos placeholder NULL hasta fases futuras)

**POs sugeridas persistentes (Fase 3):**
- `generar_pos_sugeridas()` — genera POs por bodega desde `get_sugerencias_compra`. Conserva POs con revisor asignado, elimina huérfanas
- `get_pos_sugeridas_pendientes()` — lista de POs pendientes de revisión (cabecera sin líneas)
- `get_po_sugerida_detalle(p_po_id)` — detalle completo con líneas JSONB
- `tomar_revision_po(p_po_id, p_usuario_id)` — asigna revisor. Anti-conflicto: no sobreescribe si otro ya es revisor. **Side effect:** inserta en `acciones_comprador` (Fase 4A)
- `aprobar_po(p_po_id, p_usuario_id, p_notas)` — solo el revisor asignado puede aprobar. **Side effect:** inserta en `acciones_comprador`
- `descartar_po(p_po_id, p_usuario_id, p_notas)` — solo el revisor asignado puede descartar. **Side effect:** inserta en `acciones_comprador`
- `actualizar_lineas_po(p_po_id, p_usuario_id, p_lineas)` — reemplaza líneas y recalcula metadatos. NO usar JSON.stringify. **Side effect:** inserta en `acciones_comprador` con metadata de antes/después

**Tracking de acciones (Fase 4A):**
**Overrides de min/max (Fase 4B):**
- `get_min_max_override(p_producto_id, p_bodega_id)` — retorna el override vigente o NULL
- `upsert_min_max_override(...)` — crea o actualiza un override y registra acción en `acciones_comprador` atómicamente
- `bulk_aplicar_recomendados(p_pares jsonb, p_usuario_id)` — aplica el tipo recomendado a múltiples items
- `_calcular_recomendados(p_producto_id, p_bodega_id)` — fuente de verdad para los valores recomendados de min/max (ventana operacional de 90 días). Las RPCs de cálculo mantienen fórmula inline por performance (procesan todos los SKUs a la vez) pero con comentario SQL indicando que debe coincidir con este helper
- `get_calculo_recomendado(p_producto_id, p_bodega_id)` — expone componentes de la fórmula de recomendado para el popover del modal (demanda diaria, días de cobertura, valores calculados)

**Tracking de acciones (Fase 4A):**
- `get_historial_comprador(p_usuario_id, p_fecha_desde, p_fecha_hasta, p_tipo_accion, p_entidad_tipo, p_entidad_id)` — historial polimórfico del comprador. Maneja `po_sugerida` y `min_max_override`. Filtros opcionales por entidad específica (Fase 4B-3)

**Estados de cotización y transiciones:**
- `borrador` → `enviada` (Enviar a ERP) | eliminado (Cancelar → DELETE)
- `enviada` → `completada` (Completar) | `cancelada` (Cancelar → UPDATE)
- `completada` → sin transiciones (solo Duplicar)
- `cancelada` → sin transiciones (solo Duplicar)
- Regla: borrador cancelado se ELIMINA (DELETE), enviada cancelada se MARCA (UPDATE estado)

El generador de datos sintéticos vive en `scripts/seed/` (9 archivos). Se ejecuta con `npm run seed`. Incluye anomalías deliberadas (duplicados, NULLs, outliers, cliente en declive, margen erosionado en plomería). Después del seed, ejecutar `SELECT refrescar_oportunidades()` para poblar las tablas de cache.

Seed de usuarios de prueba: `npm run seed:usuarios` (9 cuentas con Auth + roles).

## Modelo de identidad

3 roles: `rep` (vendedor), `comprador`, `dueno`. Un usuario puede tener múltiples roles simultáneamente (relación N a N vía `usuario_roles`).

- **rep** — tiene `vendedor_id` poblado, ve solo sus clientes/oportunidades.
- **comprador** — ve módulo de compras, sin restricción de vendedor.
- **dueno** — ve todo, acceso completo al dashboard.

Jerarquía de rol primario para aterrizaje al login: `dueno` > `comprador` > `rep`. Si un usuario tiene múltiples roles, aterriza en la vista del rol de mayor jerarquía.

Solo usuarios con rol `rep` requieren `vendedor_id` poblado. Los demás lo tienen NULL.

## Autenticación y middleware

- Existe un cliente Supabase server-side en `src/lib/supabase-server.ts` separado del cliente original en `src/lib/supabase.ts`. El original se usa para queries que no necesitan contexto de usuario. El server-side usa `@supabase/ssr` con cookies.
- El middleware en la raíz (`middleware.ts`) protege todas las rutas bajo `/dashboard/*`. Si no hay sesión, redirige a `/login`.
- Para obtener el usuario logueado en cualquier Server Component, importar `getUsuarioActual()` de `src/lib/auth/usuario-actual.ts`.
- Los tipos y utilidades de roles (`Rol`, `calcularRolPrimario`, `paginaAterrizajePorRol`) viven en `src/lib/auth/roles.ts` para que los componentes `'use client'` puedan importarlos sin arrastrar `next/headers`.
- Mutaciones de auth (login, logout) DEBEN redirigir con `window.location.href` desde el cliente, no con `router.push`.
- **Filtrado por vendedor:** las RPCs `get_clientes_lista` y `get_lista_oportunidades` reciben `p_vendedor_id` solo cuando el usuario actual tiene exactamente un rol y es `rep`. Multi-rol siempre ve sin filtro (perspectiva de empresa).

## Reglas arquitectónicas

1. **Agregaciones siempre en Postgres, nunca en JavaScript.** Supabase tiene un límite default de 1000 filas por query con `.select()`. Todas las queries analíticas deben implementarse como RPC functions y llamarse con `supabase.rpc()`.

2. **RPCs que retornan >1000 filas DEBEN paginarse con `.range()`.** El límite de 1000 filas es del servidor PostgREST (`max-rows`), no del cliente. Ni `.limit()` ni `.select('*').limit()` pueden superarlo. La solución es paginar: traer `.range(0, 999)`, y si vienen 1000 filas, traer `.range(1000, 1999)`, etc. Ver `forecast-skus.ts` como ejemplo. Bug real: la tabla de pronóstico (1,544 filas) se truncaba silenciosamente a 1,000.

3. **Valores de filtros client-side deben coincidir exactamente con los datos de la DB.** Nunca hardcodear valores de filtro sin verificar primero qué retorna la RPC. Siempre ejecutar un `SELECT DISTINCT campo FROM funcion() LIMIT 5` antes de escribir las opciones del filtro. Bug real: el filtro de bodega usaba "León"/"Querétaro" pero la DB retornaba "Bodega Central León"/"Bodega Querétaro".

4. **Campos de RPCs pueden ser null — usar `??` y guards defensivos.** En `src/lib/queries/`, todo campo string debe usar `?? ''`, todo número `|| 0`, todo booleano `r.campo === true || r.campo === 'true'` (nunca `Boolean()` porque Postgres puede retornar el string `"false"` y `Boolean("false")` es `true` en JS), y arrays `Array.isArray()`. Nunca usar `as string` sin `??` porque convierte null en la string literal `"undefined"`.

5. **Todo texto dinámico que interpola números debe pasar por `src/lib/textos/`.** Usar `pluralizar()`, `conConteo()`, `pluralizarVerbo()` para concordancia gramatical en español. Usar funciones de `callouts.ts` para textos de callout. Nunca interpolar números directamente en JSX.

6. **Formato de moneda y números siempre desde `src/lib/textos/formato.ts`.** Nunca crear formatters locales en componentes.

7. **Todos los textos en español deben tener ortografía perfecta incluyendo acentos** (á, é, í, ó, ú, ü, ñ). Aplica a títulos, subtítulos, placeholders, comentarios HTML visibles, y cualquier string que el usuario vea.

8. **Cumplimiento fiscal (CFDI/SAT): NUNCA entrar aquí.** Dejamos que los ERPs lo manejen.

9. **Single-tenant por ahora.** Sin autenticación en el V0. RLS diferido a V1.

10. **"Mes actual" = el mes más reciente con datos en MAX(fecha) de transacciones**, no la fecha del sistema. Crítico porque los datos sintéticos terminan en abril 2026.

11. **Nombres de entidades clickeables deben usar componentes de link de `src/components/ui/`.** ClienteLink, ProductoLink y VendedorLink. Estos componentes heredan el color del contexto con hover:underline, para integrarse en tablas sin romper jerarquía visual.

12. **Navegación "Volver" siempre con `BotonVolver` (`src/components/ui/BotonVolver.tsx`).** Usa `router.back()` en vez de rutas hardcodeadas. Acepta prop `texto` (default: "Volver"). Nunca usar `<Link href="/ruta/padre">` para botones de regreso.

13. **Después de mutaciones (INSERT/UPDATE/DELETE), redirigir con `window.location.href`.** No usar `router.push()` ni `router.refresh()` — el cache de Next.js es impredecible con datos recién cambiados. `window.location.href` fuerza un full page reload que limpia todo cache.

14. **Después de crear tablas o funciones nuevas en Supabase, ejecutar `NOTIFY pgrst, 'reload schema'`.** PostgREST cachea el schema y no detecta cambios automáticamente. Sin el NOTIFY, `supabase.rpc()` retorna `[]` sin error para funciones que PostgREST no conoce.

15. **No pasar `JSON.stringify()` a parámetros JSONB de `supabase.rpc()`.** Supabase JS serializa automáticamente. `JSON.stringify()` causa doble serialización — Postgres recibe un scalar string en vez de un objeto/array.

16. **Auto-guardado de wizards con localStorage.** El wizard de cotizaciones guarda estado en `localStorage` con debounce de 500ms (key: `cotizacion_borrador_wizard` para nuevas, `cotizacion_editar_UUID` para edición). Se recupera al reabrir con banner de confirmación. Se limpia al guardar exitosamente en DB. Expira a las 24 horas. Siempre usar `try/catch` al acceder a `localStorage` (puede no estar disponible en modo incógnito).

17. **RPCs pesadas deben pre-computar en tablas de cache.** Las queries de oportunidades (recompra + cross-sell) tardan 1.5s+ en tiempo real. Se pre-computan en `oportunidades_recompra_cache` y `oportunidades_cross_sell_cache` via `refrescar_oportunidades()`. Las RPCs del dashboard leen del cache (~5ms).

18. **Filtrado por vendedor solo cuando el usuario es rep puro.** Si `roles.length === 1 && roles[0] === 'rep'`, pasar `p_vendedor_id` a las RPCs. Multi-rol siempre ve sin filtro porque tiene perspectiva de empresa. Nunca filtrar basándose en la "vista activa" del selector — esa solo afecta aterrizaje y sidebar.

19. **Formateo de fechas tipo "mes"**: Usar `formatearMesAnio()` de `src/lib/textos/formato.ts`. NO usar `new Date(string).toLocaleDateString()` para strings tipo `"YYYY-MM-DD"` porque JavaScript los interpreta como UTC medianoche, lo que en zona horaria mexicana (UTC-6) retrocede al día anterior y muestra el mes equivocado. Regla general: si el dato representa un mes (no un instante), tratarlo como string y parsearlo, nunca convertirlo a `Date` para formatear.

20. **Una sola fórmula de mínimo efectivo en todo el producto, con ventana operacional de 90 días.** El criterio único es `stock_actual < minimo_efectivo`, donde `minimo_efectivo = COALESCE(override.minimo, demanda_diaria_promedio_90d × 21)`. La ventana de 90 días refleja la realidad operativa reciente del comprador, no historial de largo plazo. Las 4 RPCs (`get_items_desabasto_critico`, `get_sugerencias_compra`, `get_items_proximos_desabasto`, `get_planeacion_inventario`) comparten esta fórmula vía LEFT JOIN con `min_max_overrides`. La columna `cantidad_minima` de la tabla `inventario` sigue siendo legacy del seed y NO se debe usar. El helper `_calcular_recomendados` es la fuente de verdad para los valores recomendados que aparecen como fallback del COALESCE — usa la misma lógica de demanda 90 días que las RPCs operacionales.

21. **El módulo Compras acepta `?tab=pronostico|planeacion|compras` para deep-linking.** Solo entrada — el cambio manual de tab no actualiza la URL.

22. **Búsqueda de productos usa `pg_trgm` para tolerar typos.** Extensión activada con índices GIN en `productos.sku` y `productos.nombre`. Threshold de similitud bajado a 0.2 dentro de la función. Para términos de 1-2 caracteres usa ILIKE como fallback. Limitación conocida: transposiciones de caracteres adyacentes (ej: "tonrillo") no se encuentran con el threshold actual.

23. **Lead time es placeholder fijo de 14 días en V0.** Presente en `get_sugerencias_compra` y en las líneas JSONB de `generar_pos_sugeridas`. En V1 se calculará del historial real de POs por proveedor. La UI usa `?? 14` como fallback para POs creadas antes de este campo.

24. **El cliente Supabase DEBE usar `cache: 'no-store'` en todas las llamadas fetch.** Next.js 14 cachea `fetch` por defecto en Server Components. `export const dynamic = 'force-dynamic'` solo evita pre-rendering estático pero NO desactiva el cache de fetch individual. Sin `cache: 'no-store'`, las llamadas `.rpc()` retornan datos cacheados indefinidamente después de la primera llamada, causando que mutaciones (crear, editar, cancelar cotizaciones) no se reflejen en la UI. Configurado en `src/lib/supabase.ts` con `global.fetch` override. Bug real: todas las operaciones de cotizaciones parecían no funcionar porque la lista seguía mostrando datos cacheados.

25. **Métricas de tiempo del comprador siempre desde `acciones_comprador`.** No dupliques timestamps por tipo de acción en `po_sugeridas` ni en otras tablas de dominio. Los timestamps que existen en `po_sugeridas` (`generada_en`, `actualizada_en`, `fecha_revision`) son para display del estado actual de la PO, no para métricas agregadas. Cualquier cálculo de "tiempo promedio", "cantidad de acciones en periodo", o similar, se computa leyendo `acciones_comprador`. Esta regla aplica también a acciones futuras que agreguemos (ej: overrides de min/max en Fase 4B).

26. **`acciones_comprador` cubre dos `entidad_tipo`: `po_sugerida` y `min_max_override`.** Cuando se agreguen tipos nuevos en el futuro, actualizar el CHECK constraint y documentar acá. La RPC `get_historial_comprador` ya maneja polimorfismo de display según `entidad_tipo`: links a PO para `po_sugerida`, links a producto para `min_max_override`.

## Estructura del proyecto

```
middleware.ts                    — Protección de rutas /dashboard/* (redirige a /login si no hay sesión)
src/
├── app/
│   ├── login/
│   │   ├── page.tsx            — Página de login (verifica sesión, muestra formulario)
│   │   └── acciones.ts         — Server Actions: accionLogin, accionLogout
│   ├── dashboard/
│   │   ├── layout.tsx          — Sidebar dinámico por roles + HeaderUsuario
│   │   ├── page.tsx            — Resumen Ejecutivo (Server Component)
│   │   ├── tablero-ventas/
│   │   │   └── page.tsx        — Aterrizaje rep (placeholder Fase 7)
│   │   ├── tablero-compras/
│   │   │   └── page.tsx        — Tablero de compras (KPIs, POs, desabasto, alertas)
│   │   ├── compras/
│   │   │   ├── page.tsx        — Módulo de Compras (3 tabs con ?tab= deep-linking)
│   │   │   ├── po/[id]/page.tsx — Detalle de PO sugerida (edición, aprobación, descarte)
│   │   │   └── mi-historial/page.tsx — Historial de acciones del comprador (Fase 4A)
│   │   ├── clientes/
│   │   │   ├── page.tsx        — Lista de clientes
│   │   │   └── [id]/page.tsx   — Detalle de cliente
│   │   ├── productos/
│   │   │   ├── page.tsx        — Lista de productos
│   │   │   └── [sku]/page.tsx  — Detalle de producto
│   │   ├── vendedores/
│   │   │   ├── page.tsx        — Lista de vendedores
│   │   │   └── [id]/page.tsx   — Detalle de vendedor
│   │   └── oportunidades/
│   │       ├── page.tsx        — Oportunidades + Borradores + Cotizaciones (3 tabs)
│   │       ├── nueva/page.tsx  — Wizard de cotización (crear/editar)
│   │       └── [id]/page.tsx   — Detalle de cotización con acciones
│   ├── page.tsx                — Test de conexión a Supabase (legacy)
│   └── layout.tsx              — Root layout
├── components/
│   ├── auth/
│   │   └── FormularioLogin.tsx — Formulario de login ('use client')
│   ├── ui/
│   │   ├── BotonVolver.tsx     — Navegación atrás con router.back()
│   │   ├── ClienteLink.tsx     — Link inline a detalle de cliente
│   │   ├── ProductoLink.tsx    — Link inline a detalle de producto
│   │   └── VendedorLink.tsx    — Link inline a detalle de vendedor
│   └── dashboard/
│       ├── BusquedaGlobal.tsx             — Búsqueda global (Ctrl+K) en header
│       ├── HeaderUsuario.tsx              — Header con usuario, badges, selector, logout
│       ├── SelectorVista.tsx              — Dropdown multi-rol ('use client')
│       ├── BotonLogout.tsx                — Cierra sesión ('use client')
│       ├── KPICard.tsx
│       ├── GraficaIngresosMensuales.tsx   — Recharts, reutilizado en detalles
│       ├── TopSKUs.tsx
│       ├── Deadstock.tsx
│       ├── ClientesEnRiesgo.tsx
│       ├── RendimientoVendedores.tsx
│       ├── AlertasMargen.tsx
│       ├── OportunidadesVenta.tsx
│       ├── tablero-compras/
│       │   ├── HeaderTablero.tsx          — Saludo + conteos + timestamp + botón generar
│       │   ├── KPIsCompradorCards.tsx     — 4 cards con datos reales (Fase 4A)
│       │   ├── SeccionPOsSugeridas.tsx    — POs persistentes por bodega
│       │   ├── BotonGenerarPos.tsx        — Generación manual ('use client')
│       │   ├── SeccionDesabastoCritico.tsx — Top 10 items en desabasto
│       │   ├── SeccionProximosDesabasto.tsx — Top 10 próximos a desabasto
│       │   └── SeccionAlertasInventario.tsx — 3 tarjetas informativas
│       ├── compras/mi-historial/
│       │   ├── FiltrosHistorial.tsx       — Filtros de fecha y tipo ('use client')
│       │   ├── ResumenHistorial.tsx       — Banner con resumen del periodo (polimórfico POs + overrides)
│       │   └── TablaHistorial.tsx         — Tabla polimórfica con links a POs y productos
│       ├── compras/planeacion/
│       │   ├── ModalMinMax.tsx            — Modal de override min/max (3 opciones + fórmula + historial)
│       │   └── BarraSeleccionMultiple.tsx — Barra fija inferior para acciones bulk
│       ├── po-sugerida/
│       │   ├── DetallePoSugerida.tsx      — Componente principal ('use client')
│       │   ├── HeaderPoSugerida.tsx       — Título, badges, timestamps, totales
│       │   ├── BannerRevisor.tsx          — 5 estados de revisor
│       │   ├── TablaLineasPo.tsx          — Tabla paginada (50/pág) con buscador
│       │   ├── AgregarItemModal.tsx       — Modal de búsqueda de productos
│       │   ├── AccionesPoSugerida.tsx     — Guardar/Aprobar/Descartar
│       │   └── DescartarModal.tsx         — Confirmación con notas obligatorias
│       ├── compras/
│       │   ├── ComprasTabs.tsx            — Wrapper de tabs con ?tab= deep-linking
│       │   ├── TabPronostico.tsx          — Forecast con sparklines y filtros
│       │   ├── TabPlaneacion.tsx          — Min/max con modal de cálculo
│       │   └── TabCompras.tsx             — Sugerencias con lead time inline
│       ├── clientes/
│       │   ├── ListaClientes.tsx          — Tabla filtrable con sorting
│       │   ├── ClienteDetalleTabs.tsx     — Tabs Resumen + Oportunidades
│       │   └── TabOportunidades.tsx       — Recompras + cross-sell por cliente
│       ├── productos/
│       │   └── ListaProductos.tsx         — Tabla filtrable con sorting
│       ├── vendedores/
│       │   └── ListaVendedores.tsx        — Tabla filtrable con sorting
│       └── oportunidades/
│           ├── OportunidadesTabs.tsx       — Tabs Oportunidades/Borradores/Cotizaciones
│           ├── ListaOportunidades.tsx      — Tabla de clientes con oportunidades
│           ├── TablaCotizaciones.tsx       — Tabla reutilizable de cotizaciones
│           ├── WizardCotizacion.tsx        — Wizard 3 pasos (crear/editar)
│           └── AccionesCotizacion.tsx      — Botones de acción por estado
├── lib/
│   ├── auth/
│   │   ├── roles.ts            — Tipos Rol, UsuarioActual + calcularRolPrimario + paginaAterrizajePorRol
│   │   └── usuario-actual.ts   — getUsuarioActual() (server-only, usa supabase-server)
│   ├── queries/                — 38 archivos, una query por archivo
│   │   ├── types.ts            — Tipos TS compartidos
│   │   ├── kpis.ts, ingresos-mensuales.ts, top-skus.ts, deadstock.ts
│   │   ├── clientes-en-riesgo.ts, rendimiento-vendedores.ts, alertas-margen.ts
│   │   ├── forecast-skus.ts, planeacion-inventario.ts, sugerencias-compra.ts  — Con paginación .range()
│   │   ├── clientes-lista.ts, cliente-detalle.ts, productos-lista.ts, producto-detalle.ts
│   │   ├── vendedores-lista.ts, vendedor-detalle.ts
│   │   ├── oportunidades-recompra.ts, oportunidades-cross-sell.ts, oportunidades-cliente.ts
│   │   ├── oportunidades-lista.ts, resumen-oportunidades.ts
│   │   ├── cotizaciones-lista.ts, cotizacion-detalle.ts, cotizacion-mutations.ts
│   │   ├── precio-cliente-sku.ts, productos-busqueda.ts, cliente-compro-una-vez.ts
│   │   ├── busqueda-global.ts
│   │   ├── items-desabasto-critico.ts, items-proximos-desabasto.ts  — Fase 2
│   │   ├── alertas-sobrestock.ts, items-sin-movimiento-reciente.ts, kpis-comprador.ts  — Fase 2
│   │   ├── pos-sugeridas-pendientes.ts, po-sugerida-detalle.ts  — Fase 3
│   │   ├── po-sugeridas-mutations.ts, ultima-generacion-pos.ts  — Fase 3
│   │   ├── historial-comprador.ts  — Fase 4A
│   │   ├── min-max-overrides.ts  — Fase 4B (lectura, upsert, bulk)
│   │   ├── calculo-recomendado.ts  — Fase 4B (componentes de fórmula para popover)
│   │   └── (todos con paginación defensiva .range() si pueden exceder 1000 filas)
│   ├── textos/
│   │   ├── pluralizar.ts       — Concordancia gramatical español
│   │   ├── formato.ts          — Formatters de moneda, %, unidades, tiempoRelativo, formatearMesAnio, formatearFechaHora
│   │   └── callouts.ts         — Generadores de texto de callouts
│   ├── supabase.ts             — Cliente Supabase (anon key, cache: no-store)
│   ├── supabase-server.ts      — Cliente Supabase server-side con cookies (@supabase/ssr)
│   └── supabase-middleware.ts  — Cliente para middleware de Next.js
scripts/seed/                   — Generador de datos sintéticos (9 archivos + seed-usuarios.ts)
```

## Estado actual del dashboard

**Resumen Ejecutivo (semana 2):**
- KPIs (5 cards con mes parcial), gráfica ingresos/margen mensual, Top 10 SKUs, alertas de margen por categoría, deadstock, clientes en riesgo, rendimiento por vendedor

**Módulo de Compras (semana 3):**
- Tab Pronóstico: forecast con sparklines, clasificación ABC, filtros, sorting, horizonte 1/3/6 meses
- Tab Planeación: min/max recomendados con modal de cálculo, filtros estado/bodega/búsqueda
- Tab Compras: sugerencias de PO, selección múltiple, botón "Generar OC" (placeholder V1)

**Módulo de Clientes (semana 4):**
- Lista filtrable (110 clientes) + detalle con KPIs, gráfica mensual, top SKUs con patrón de compra

**Módulo de Productos (semana 4):**
- Lista filtrable (772 SKUs) + detalle con inventario por bodega (barras visuales), top clientes

**Módulo de Vendedores (semana 4):**
- Lista filtrable (7 vendedores) + detalle con top clientes y top SKUs lado a lado

**Sales Intelligence (semana 5):**
- Oportunidades: detección automática de recompras tardías (3,021) y cross-sell (2,880) con tablas de cache pre-computadas
- Cotizaciones: wizard de 3 pasos (Header → Líneas → Revisión) con panel de recomendaciones, edición de borradores, duplicación, y state machine completo (borrador → enviada → completada/cancelada)
- Página /dashboard/oportunidades con 3 tabs: Oportunidades, Borradores, Cotizaciones
- Tab Oportunidades en detalle de cliente con recompras + cross-sell + botón "Nueva cotización"
- Sección "Oportunidades de venta" en Resumen Ejecutivo con valor total y top 5 clientes

**Autenticación y roles operativos (Fase 1):**
- 9 usuarios de prueba sembrados con Supabase Auth (`npm run seed:usuarios`)
- 3 roles: `dueno`, `comprador`, `rep` (asignables múltiples por usuario)
- Jerarquía de aterrizaje: dueno → `/dashboard`, comprador → `/dashboard/tablero-compras`, rep → `/dashboard/tablero-ventas`
- Sidebar dinámico según roles del usuario, header con selector de vista para multi-rol
- Filtrado automático de RPCs `get_clientes_lista` y `get_lista_oportunidades` por vendedor cuando el usuario es rep puro
- Middleware protegiendo `/dashboard/*`, redirigiendo a `/login` si no hay sesión

**Tablero de compras (Fase 2):**
- Página de aterrizaje del comprador en `/dashboard/tablero-compras`
- Header con saludo personalizado, conteos accionables vía anchor links, timestamp de última generación de POs, botón "Generar POs sugeridas"
- 4 KPI cards (2 reales: desabasto crítico, capital atrapado; 2 placeholders para Fase 4)
- Sección POs sugeridas persistentes agrupadas por bodega (migrada de lectura en tiempo real a tabla `po_sugeridas` en Fase 3)
- Sección de desabasto crítico con top 10 y link a listado completo (pendiente)
- Sección de próximos a desabasto con horizonte de 14 días
- Sección de alertas de inventario: deadstock, sobrestock, sin movimiento reciente (3 tarjetas informativas)
- Ventana de cálculo de demanda: 90 días fijos. Fórmula unificada: `stock < demanda_diaria × 21`

**POs sugeridas persistentes (Fase 3):**
- Tabla `po_sugeridas` con líneas como JSONB array editable
- Generación manual vía botón en el Tablero (visible solo para roles comprador/dueno)
- Página de detalle `/dashboard/compras/po/[id]` con edición inline de cantidades, paginación de 50, auto-guardado en localStorage, banner de recuperación
- Flujo de revisor anti-conflicto con 5 estados (sin revisor, soy revisor, otro revisor, aprobada, descartada)
- Modal de descarte con notas obligatorias, botón Aprobar con confirmación
- Búsqueda typo-tolerant con `pg_trgm` (threshold 0.2) en buscador de productos
- Lead time inline (placeholder 14 días) en tab Compras y en líneas de PO

## Convenciones de código

- TypeScript estricto (`strict: true`)
- Comentarios en español explicando decisiones no obvias
- Nombres de variables en español cuando son de dominio del negocio (ej: `margenBrutoPct`, `razonSocial`, `diasSinComprar`)
- Nombres de funciones/componentes en inglés técnico cuando son de framework (ej: `getKPIsResumen`, `insertBatch`)
- Server Components por defecto. `'use client'` solo cuando hay hooks o interactividad
- Cada query en su propio archivo en `src/lib/queries/`
- Cada componente de dashboard en `src/components/dashboard/`

## Flujo de trabajo

- **Trabajar directo en main local.** No usar worktrees ni PRs. Solo hacer `git push` cuando el usuario lo pida explícitamente. No crear branches a menos que lo solicite.
- **Documentar aprendizajes.** Cada vez que se descubra un bug no obvio o un patrón que deba seguirse, guardarlo como memoria en `~/.claude/projects/.../memory/` y como regla en este archivo si aplica a todo el proyecto.
- **Todos los textos en español con ortografía perfecta** incluyendo acentos (á, é, í, ó, ú, ü, ñ).

## Instrucción

Antes de escribir código, verifica si lo que vas a hacer es consistente con las reglas arquitectónicas de este archivo. Si hay duda, pregunta.
