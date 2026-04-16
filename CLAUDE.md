# CLAUDE.md — Contexto para Claude Code

Este archivo se carga automáticamente al inicio de cada sesión de Claude Code. Contiene todo lo necesario para arrancar con contexto completo.

---

## Proyecto

**Ferretería MVP** — Dashboard de business intelligence para mayoristas mexicanos. Capa de IA sobre ERPs existentes (SAP Business One, CONTPAQi, Aspel) que convierte datos transaccionales en insights accionables.

**Empresa ficticia para el V0:** Ferretera del Bajío, S.A. de C.V. (León, Guanajuato + bodega en Querétaro). 750 SKUs, 110 clientes, 7 vendedores, ~$255M MXN/año de ingresos.

**Objetivo del V0:** Dashboard funcional con datos sintéticos que demuestre el valor del producto a inversionistas y primeros clientes potenciales. No es un prototipo — es código de producción con datos simulados.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript estricto + Tailwind CSS + sonner (toasts)
- **Backend/DB:** Supabase (PostgreSQL) — queries analíticas vía RPC functions
- **Gráficas:** Recharts
- **Deploy:** Vercel (auto-deploy desde GitHub main)
- **Seed:** scripts en TypeScript ejecutados con tsx

## Base de datos

13 tablas en Supabase (project: `talinunhftglhoghwacq`):

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

**Tracking de acciones del comprador (Fase 4A):**
- `acciones_comprador` — log de eventos de decisiones del comprador. Única fuente de verdad para métricas de tiempo. Tipos de acción: `po_toma_revision`, `po_aprobacion`, `po_descarte`, `po_modificacion`, `min_max_override`. Tipos de entidad: `po_sugerida` e `inventario`. Para acciones sobre inventario (overrides de min/max), el `entidad_id` es NULL y el par `(producto_id, bodega_id)` vive en el metadata JSONB.

**Tracking de acciones del rep (Fase 9):**
- `oportunidades_trabajadas` — acciones del rep sobre oportunidades de clientes. Tipos de acción: `cotizada`, `descartada`, `pospuesta`. Pospuestas tienen `fecha_reaparicion` obligatoria. Opcionalmente linkea a `cotizacion_id`

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
- `get_planeacion_inventario()` — min/max actuales vs recomendados (~1,544 filas). Incluye `tiene_accion_registrada` y `tipo_ultima_accion` derivados de `acciones_comprador` para el badge de intervención del comprador
- `get_sugerencias_compra()` — detección de desabasto/sobrestock/sin_movimiento. Usa `inventario.cantidad_minima` como umbral de desabasto. Incluye `bodega_id`, `demanda_diaria_promedio`, `minimo_recomendado`. Estados: desabasto, ok, sobrestock, sin_movimiento

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
- `get_productos_busqueda(p_termino)` — buscador por SKU o nombre (top 20). Retorna `stock_total` (suma de inventario por SKU en todas las bodegas)
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
- `get_items_desabasto_critico()` — SKU × bodega con stock < inventario.cantidad_minima
- `get_items_proximos_desabasto(p_horizonte_dias DEFAULT 14)` — stock >= mínimo PERO días hasta stockout < horizonte. Mutuamente excluyente con desabasto crítico
- `get_alertas_sobrestock()` — SKU × bodega con > 6 meses de inventario (excluye deadstock)
- `get_items_sin_movimiento_reciente()` — SKUs con stock > 0, sin venta en 30 días pero sí en 90 días (alerta temprana, mutuamente excluyente con deadstock)
- `get_kpis_comprador_mes()` — KPIs agregados del mes actual (algunos campos placeholder NULL hasta fases futuras)

**POs sugeridas persistentes (Fase 3):**
- `generar_pos_sugeridas()` — genera POs por bodega desde `get_sugerencias_compra`. Conserva POs con revisor asignado, elimina huérfanas sin revisor. **Excluye items que ya están en POs con estado `aprobada`** para evitar re-sugerir lo ya aprobado. Items eliminados por el comprador antes de aprobar SÍ vuelven a aparecer
- `get_pos_sugeridas_pendientes()` — lista de POs pendientes de revisión (cabecera sin líneas)
- `get_po_sugerida_detalle(p_po_id)` — detalle completo con líneas JSONB
- `tomar_revision_po(p_po_id, p_usuario_id)` — asigna revisor. Anti-conflicto: no sobreescribe si otro ya es revisor. **Side effect:** inserta en `acciones_comprador` (Fase 4A)
- `aprobar_po(p_po_id, p_usuario_id, p_notas)` — solo el revisor asignado puede aprobar. **Side effect:** inserta en `acciones_comprador`
- `descartar_po(p_po_id, p_usuario_id, p_notas)` — solo el revisor asignado puede descartar. **Side effect:** inserta en `acciones_comprador`
- `actualizar_lineas_po(p_po_id, p_usuario_id, p_lineas)` — reemplaza líneas y recalcula metadatos. NO usar JSON.stringify. **Side effect:** inserta en `acciones_comprador` con metadata de antes/después

**Tracking de acciones y overrides (Fases 4A + 4B):**
- `get_historial_comprador(p_usuario_id, p_fecha_desde, p_fecha_hasta, p_tipo_accion, p_entidad_tipo, p_entidad_id)` — historial polimórfico del comprador. Maneja `entidad_tipo = 'po_sugerida'` e `'inventario'`. Filtros opcionales por entidad específica
- `upsert_min_max_override(...)` — escribe min/max directamente en `inventario.cantidad_minima/maxima` y registra acción en `acciones_comprador` con `entidad_tipo = 'inventario'`. Si tipo es `recomendado`, calcula valores frescos desde `_calcular_recomendados` e ignora p_minimo/p_maximo. Si tipo es `personalizado`, usa los valores pasados. Tipo `actual_erp` no válido en V0
- `bulk_aplicar_recomendados(p_pares jsonb, p_usuario_id)` — aplica recomendado a múltiples items: calcula vía `_calcular_recomendados`, escribe en `inventario`, registra cada cambio en `acciones_comprador`
- `_calcular_recomendados(p_producto_id, p_bodega_id)` — fuente de verdad para los valores recomendados de min/max (ventana operacional de 90 días). Las RPCs de cálculo mantienen fórmula inline por performance con comentario SQL de sincronización
- `get_calculo_recomendado(p_producto_id, p_bodega_id)` — expone componentes de la fórmula de recomendado para el popover del modal (demanda diaria, días de cobertura, valores calculados)

**Mi actividad del comprador (Fase 4C):**
- `get_pos_por_revisor(p_usuario_id)` — todas las POs donde el usuario es o fue revisor, sin importar estado. Ordenadas: `pendiente_revision` primero, luego por `actualizada_en` DESC. JOIN a bodegas para nombre
- `get_overrides_recientes(p_usuario_id, p_limite DEFAULT 20)` — últimos N overrides de min/max del usuario. Resuelve producto (nombre, SKU) y bodega desde metadata JSONB de `acciones_comprador`. Extrae `tipo_seleccion`, valores antes/después

**Tablero de ventas (Fase 7):**
- `get_kpis_rep_mes(p_vendedor_id)` — KPIs del mes actual para un vendedor: ingresos, margen, transacciones, clientes activos, cotizaciones, ticket promedio, con comparación vs mes anterior
- `get_clientes_en_riesgo(p_vendedor_id DEFAULT NULL)` — ahora acepta filtro opcional de vendedor. Sin parámetro retorna todos (comportamiento original). Con vendedor, filtra por vendedor principal del cliente
- `get_cotizaciones_lista(p_vendedor_id DEFAULT NULL)` — ahora acepta filtro opcional de vendedor. Sin parámetro retorna todas (comportamiento original)

**Mi desempeño del comprador (Fase 5):**
- `get_kpis_comprador_personal(p_usuario_id)` — KPIs del mes actual filtrados por comprador: POs aprobadas/descartadas, valor aprobado, overrides, tiempo promedio de revisión (pares toma→cierre del usuario), comparación con mes anterior
- `get_actividad_mensual_comprador(p_usuario_id)` — serie de 12 meses con aprobaciones, descartes, overrides, valor aprobado por mes. LEFT JOIN a generate_series para incluir meses con 0 actividad

**Tracking del rep (Fase 9):**
- `registrar_oportunidad_trabajada(p_vendedor_id, p_cliente_id, p_accion, p_notas, p_fecha_reaparicion, p_cotizacion_id)` — registra acción del rep. Valida tipo de acción y fecha obligatoria para pospuestas
- `get_oportunidades_tablero_rep(p_vendedor_id)` — oportunidades filtradas: excluye cotizadas/descartadas, incluye pospuestas reaparecidas con badge. Campos extra: `fue_pospuesta`, `fecha_posposicion_original`
- `get_historial_oportunidades_rep(p_vendedor_id, p_fecha_desde, p_fecha_hasta)` — historial de acciones con JOIN a clientes. Filtros opcionales por fecha. LIMIT 200
- `get_resumen_oportunidades_rep(p_vendedor_id)` — contadores: total, trabajadas_hoy, pendientes, pospuestas_activas, descartadas_total

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

20. **Una sola fórmula de mínimo efectivo en todo el producto, basada en `inventario.cantidad_minima`.** El criterio único es `stock_actual < inventario.cantidad_minima`. Este valor es el estado vigente de los parámetros de inventario — modificable por el comprador vía el modal de min/max. Las RPCs `get_items_desabasto_critico`, `get_sugerencias_compra`, `get_items_proximos_desabasto`, y `get_planeacion_inventario` leen directamente de `inventario.cantidad_minima`. El helper `_calcular_recomendados` calcula el valor algorítmico sugerido (`demanda_diaria_promedio_90d × 21`) que aparece como "Mín. recomendado" en Tab Planeación; este helper NO determina el mínimo operativo — solo es una recomendación visible para que el comprador decida si aceptarla o no.

21. **El módulo Compras acepta `?tab=pronostico|planeacion|ordenes-compra` para deep-linking.** Solo entrada — el cambio manual de tab no actualiza la URL. El slug anterior `compras` sigue siendo aceptado por compatibilidad y se mapea a `ordenes-compra`.

22. **Búsqueda de productos usa `pg_trgm` para tolerar typos.** Extensión activada con índices GIN en `productos.sku` y `productos.nombre`. Threshold de similitud bajado a 0.2 dentro de la función. Para términos de 1-2 caracteres usa ILIKE como fallback. Limitación conocida: transposiciones de caracteres adyacentes (ej: "tonrillo") no se encuentran con el threshold actual.

23. **Lead time es placeholder fijo de 14 días en V0.** Presente en `get_sugerencias_compra` y en las líneas JSONB de `generar_pos_sugeridas`. En V1 se calculará del historial real de POs por proveedor. La UI usa `?? 14` como fallback para POs creadas antes de este campo.

24. **El cliente Supabase DEBE usar `cache: 'no-store'` en todas las llamadas fetch.** Next.js 14 cachea `fetch` por defecto en Server Components. `export const dynamic = 'force-dynamic'` solo evita pre-rendering estático pero NO desactiva el cache de fetch individual. Sin `cache: 'no-store'`, las llamadas `.rpc()` retornan datos cacheados indefinidamente después de la primera llamada, causando que mutaciones (crear, editar, cancelar cotizaciones) no se reflejen en la UI. Configurado en `src/lib/supabase.ts` con `global.fetch` override. Bug real: todas las operaciones de cotizaciones parecían no funcionar porque la lista seguía mostrando datos cacheados.

25. **Métricas de tiempo del comprador siempre desde `acciones_comprador`.** No dupliques timestamps por tipo de acción en `po_sugeridas` ni en otras tablas de dominio. Los timestamps que existen en `po_sugeridas` (`generada_en`, `actualizada_en`, `fecha_revision`) son para display del estado actual de la PO, no para métricas agregadas. Cualquier cálculo de "tiempo promedio", "cantidad de acciones en periodo", o similar, se computa leyendo `acciones_comprador`. Esta regla aplica también a acciones futuras que agreguemos (ej: overrides de min/max en Fase 4B).

26. **`acciones_comprador` cubre dos `entidad_tipo`: `po_sugerida` e `inventario`.** Para acciones de tipo `inventario` (overrides de min/max), el `entidad_id` es NULL y el par `(producto_id, bodega_id)` vive en el metadata JSONB. La RPC `get_historial_comprador` maneja polimorfismo de display según `entidad_tipo`: acciones sobre `po_sugerida` linkean a detalle de PO, acciones sobre `inventario` linkean a detalle del producto.

27. **Sistema de jerarquía de texto en gris.** El producto usa 4 niveles de texto sobre fondo blanco, en orden de prominencia: `text-gray-900` (principal), `text-gray-700` (secundario), `text-gray-500` (terciario/metadata), `text-gray-400` (placeholders y deshabilitado). NO usar `text-gray-300` o más claro para texto, porque falla WCAG AA. Los grises más claros (`gray-200`, `gray-100`, `gray-50`) están reservados para bordes, fondos y dividers, no para texto.

28. **El badge de "Rec./Custom" en Tab Planeación se deriva de `acciones_comprador`, no de comparación de valores.** El campo `tiene_accion_registrada` de `get_planeacion_inventario` lee de `acciones_comprador` (filtrando por `tipo_accion = 'min_max_override'` y el par producto-bodega en metadata). Si hay al menos una acción registrada, el badge aplica con el `tipo_seleccion` de la última acción. Si no hay acciones, no hay badge. NO usar comparación `min_actual === min_recomendado` porque un valor del seed casualmente distinto al recomendado se vería como "Custom" sin que nadie lo haya tocado.

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
│   │   │   ├── page.tsx        — Tablero de ventas del rep (Fase 7, KPIs + oportunidades + cotizaciones + riesgo)
│   │   │   └── mi-actividad/page.tsx — Mi actividad del rep (Fase 9, historial de oportunidades trabajadas)
│   │   ├── tablero-compras/
│   │   │   └── page.tsx        — Tablero de compras (KPIs, POs, desabasto, alertas)
│   │   ├── compras/
│   │   │   ├── page.tsx        — Módulo de Compras (3 tabs con ?tab= deep-linking)
│   │   │   ├── po/[id]/page.tsx — Detalle de PO sugerida (edición, aprobación, descarte)
│   │   │   ├── mi-actividad/page.tsx — Mi actividad del comprador (Fase 4C, 2 tabs)
│   │   │   ├── mi-desempeno/page.tsx — Mi desempeño del comprador (Fase 5, KPIs + gráfica)
│   │   │   └── mi-historial/page.tsx — Redirect a mi-actividad?tab=historial (legacy)
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
│       ├── OperacionCompras.tsx           — Sección de compras en Resumen Ejecutivo (Fase 5)
│       ├── tablero-ventas/
│       │   ├── TableroVentas.tsx          — Tablero operativo del rep (Fase 7+9, KPIs + acciones inline + cotizaciones + riesgo)
│       │   ├── MiActividadRep.tsx         — Historial de oportunidades trabajadas (Fase 9, cards + tabla filtrable)
│       │   ├── ModalDescartarOportunidad.tsx — Modal de descarte con notas opcionales
│       │   └── ModalPosponerOportunidad.tsx — Modal de posposición con date picker y quick picks
│       ├── tablero-compras/
│       │   ├── HeaderTablero.tsx          — Saludo + conteos + timestamp + botón generar
│       │   ├── KPIsCompradorCards.tsx     — 4 cards con datos reales (Fase 4A)
│       │   ├── SeccionPOsSugeridas.tsx    — POs persistentes por bodega
│       │   ├── BotonGenerarPos.tsx        — Generación manual ('use client')
│       │   ├── SeccionDesabastoCritico.tsx — Top 10 items en desabasto
│       │   ├── SeccionProximosDesabasto.tsx — Top 10 próximos a desabasto
│       │   └── SeccionAlertasInventario.tsx — 3 tarjetas informativas
│       ├── compras/mi-actividad/
│       │   └── MiActividadTabs.tsx        — Tabs Actividad reciente + Historial completo (Fase 4C)
│       ├── compras/mi-desempeno/
│       │   └── MiDesempeno.tsx            — KPIs personales + gráfica Recharts 12 meses (Fase 5)
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
│   ├── queries/                — 47 archivos, una query por archivo
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
│   │   ├── min-max-overrides.ts  — Fase 4B (upsert en inventario, bulk)
│   │   ├── calculo-recomendado.ts  — Fase 4B (componentes de fórmula para popover)
│   │   ├── pos-por-revisor.ts  — Fase 4C (POs asignadas a un comprador, todos los estados)
│   │   ├── overrides-recientes.ts  — Fase 4C (últimos overrides de min/max del comprador)
│   │   ├── kpis-comprador-personal.ts  — Fase 5 (KPIs del mes por comprador, con comparación mes anterior)
│   │   ├── actividad-mensual-comprador.ts  — Fase 5 (serie 12 meses de actividad del comprador)
│   │   ├── kpis-rep-mes.ts  — Fase 7 (KPIs del mes por vendedor, con comparación mes anterior)
│   │   ├── oportunidades-trabajadas.ts  — Fase 9 (mutación: registrar acción del rep)
│   │   ├── oportunidades-tablero-rep.ts  — Fase 9 (oportunidades filtradas para tablero del rep)
│   │   ├── historial-oportunidades-rep.ts  — Fase 9 (historial de acciones del rep)
│   │   ├── resumen-oportunidades-rep.ts  — Fase 9 (contadores para header del tablero)
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
- Ventana de cálculo de demanda: 90 días fijos. Criterio de desabasto: `stock < inventario.cantidad_minima`

**POs sugeridas persistentes (Fase 3):**
- Tabla `po_sugeridas` con líneas como JSONB array editable
- Generación manual vía botón en el Tablero (visible solo para roles comprador/dueno)
- Página de detalle `/dashboard/compras/po/[id]` con edición inline de cantidades, paginación de 50, auto-guardado en localStorage, banner de recuperación
- Flujo de revisor anti-conflicto con 5 estados (sin revisor, soy revisor, otro revisor, aprobada, descartada)
- Modal de descarte con notas obligatorias, botón Aprobar con confirmación
- Búsqueda typo-tolerant con `pg_trgm` (threshold 0.2) en buscador de productos
- Lead time inline (placeholder 14 días) en tab Compras y en líneas de PO

**Mi actividad del comprador (Fase 4C):**
- Página `/dashboard/compras/mi-actividad` con 2 tabs: Actividad reciente + Historial completo
- Tab Actividad reciente con 4 secciones: POs en revisión por mí (con badge urgencia y botón "Continuar revisión"), aprobadas recientes (cards clickeables), descartadas recientes (con motivo), ajustes de inventario recientes (overrides min/max con ProductoLink)
- Tab Historial completo: migrado desde `/dashboard/compras/mi-historial` — mismos componentes (FiltrosHistorial, ResumenHistorial, TablaHistorial), filtros por query params funcionan igual
- Sidebar actualizado: "Mi historial" → "Mi actividad" con nueva ruta
- Ruta vieja `/dashboard/compras/mi-historial` redirige a `/dashboard/compras/mi-actividad?tab=historial`
- Deep-linking con `?tab=historial` para abrir directo en el tab de historial
- RPCs: `get_pos_por_revisor` y `get_overrides_recientes`

**Mi desempeño del comprador (Fase 5):**
- Página `/dashboard/compras/mi-desempeno` con KPIs personales del mes (POs aprobadas/descartadas, valor, tiempo de revisión, overrides) con comparación vs mes anterior
- Gráfica Recharts de barras apiladas (aprobaciones + descartes) con serie de 12 meses
- Sidebar: entrada "Mi desempeño" para roles comprador y dueño
- RPCs: `get_kpis_comprador_personal` y `get_actividad_mensual_comprador`

**Operación de compras en Resumen Ejecutivo (Fase 5):**
- Sección "Operación de compras" en el Resumen Ejecutivo del dueño con 4 métricas globales: valor POs aprobadas, pendientes de revisión (rojo si >0), SKUs desabasto crítico (rojo si >0), capital atrapado
- Link "Ver módulo de compras →" al final de la sección
- Usa la RPC existente `get_kpis_comprador_mes()`

**Polish del módulo comprador (Fase 6):**
- Sistema de toasts con sonner: `<Toaster>` en root layout, hook `useToastFromUrl` en `src/hooks/useToastFromUrl.ts` con guards contra doble disparo (Strict Mode + múltiples instancias)
- Toasts conectados en todas las mutaciones: POs (tomada, guardada, aprobada, descartada), overrides (guardado, bulk), cotizaciones (creada, enviada, completada, cancelada, duplicada, eliminada, actualizada)
- Componente `ToastListener` (`src/components/ui/ToastListener.tsx`) para páginas Server Component que reciben redirects con `?toast=`
- Estados vacíos amigables en 8 componentes del módulo de compras (SeccionPOsSugeridas, SeccionDesabastoCritico, SeccionProximosDesabasto, TablaLineasPo, TabPronostico, TabPlaneacion, TabCompras, MiDesempeno)
- Loading skeletons (`loading.tsx`) en 5 rutas: tablero-compras, compras, po/[id], mi-actividad, mi-desempeno
- Verificación end-to-end completada: 14/15 checks pasaron (búsqueda global inconclusa por limitación del preview tool, no es bug)

**Tablero de ventas del rep (Fase 7):**
- Página `/dashboard/tablero-ventas` con header personalizado, 6 KPI cards (ingresos, margen, transacciones, clientes activos, cotizaciones, ticket promedio) con comparación vs mes anterior
- Secciones: oportunidades de mayor valor (top 7 con botón "Crear cotización"), cotizaciones pendientes (borradores + enviadas), clientes en riesgo (con badges declive/inactivo)
- Filtrado por vendedor en `get_clientes_en_riesgo(p_vendedor_id)`, `get_cotizaciones_lista(p_vendedor_id)`, y `get_lista_oportunidades(vendedorIdOverride)`
- Sidebar dinámico: dueño ve 10 items (todo), comprador ve 5, rep ve 4. Tableros de ventas y compras visibles para dueño
- Loading skeleton y estado vacío con mensajes amigables por sección
- RPCs: `get_kpis_rep_mes`

**Velocidad de cotización (Fase 8):**
- Auto-asignación de vendedor logueado: WizardCotizacion recibe prop `vendedorIdLogueado` del Server Component, pre-selecciona el vendedor del usuario al abrir
- Stock inline en búsqueda de productos: `get_productos_busqueda` retorna `stock_total`, el dropdown muestra "Stock: N" en gris o "Sin stock" en rojo
- Duplicar línea: botón con ícono de copiar al lado del botón eliminar en cada fila del wizard, inserta copia debajo con nuevo key
- Atajos de teclado: Enter en buscador de productos agrega el primer resultado, Escape cierra dropdown y limpia búsqueda

**Tracking de acciones del rep (Fase 9):**
- Tabla `oportunidades_trabajadas` con 3 tipos de acción: cotizada, descartada, pospuesta (con fecha de reaparición)
- Botones inline Cotizar/Descartar/Posponer en cada fila de oportunidades del Tablero de ventas
- Modales de descarte (notas opcionales) y posposición (date picker con quick picks: 3d/1sem/2sem/1mes)
- Oportunidades trabajadas se ocultan del tablero. Pospuestas reaparecen en la fecha indicada con badge "Regresó"
- Header del tablero con contadores dinámicos: pendientes, trabajadas hoy, pospuestas activas
- Página `/dashboard/tablero-ventas/mi-actividad` con cards de resumen + tabla filtrable de acciones recientes
- Sidebar: "Mi actividad" agregada para rol rep después de Oportunidades
- Toasts: `oportunidad_descartada` y `oportunidad_pospuesta`
- RPCs: `registrar_oportunidad_trabajada`, `get_oportunidades_tablero_rep`, `get_historial_oportunidades_rep`, `get_resumen_oportunidades_rep`

## Convenciones de código

- TypeScript estricto (`strict: true`)
- Comentarios en español explicando decisiones no obvias
- Nombres de variables en español cuando son de dominio del negocio (ej: `margenBrutoPct`, `razonSocial`, `diasSinComprar`)
- Nombres de funciones/componentes en inglés técnico cuando son de framework (ej: `getKPIsResumen`, `insertBatch`)
- Server Components por defecto. `'use client'` solo cuando hay hooks o interactividad
- Cada query en su propio archivo en `src/lib/queries/`
- Cada componente de dashboard en `src/components/dashboard/`
- Toasts: después de toda mutación con `window.location.href`, agregar `?toast=CODIGO` al URL. El hook `useToastFromUrl` lo lee y muestra el toast. Los códigos disponibles están definidos en `src/hooks/useToastFromUrl.ts`. En páginas Server Component, usar `<ToastListener />` de `src/components/ui/ToastListener.tsx`

## Flujo de trabajo

- **Trabajar directo en main local.** No usar worktrees ni PRs. Solo hacer `git push` cuando el usuario lo pida explícitamente. No crear branches a menos que lo solicite.
- **Documentar aprendizajes.** Cada vez que se descubra un bug no obvio o un patrón que deba seguirse, guardarlo como memoria en `~/.claude/projects/.../memory/` y como regla en este archivo si aplica a todo el proyecto.
- **Todos los textos en español con ortografía perfecta** incluyendo acentos (á, é, í, ó, ú, ü, ñ).

## Instrucción

Antes de escribir código, verifica si lo que vas a hacer es consistente con las reglas arquitectónicas de este archivo. Si hay duda, pregunta.
