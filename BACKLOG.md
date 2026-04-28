# Backlog — Cosas diferidas del V0

> **V0 CERRADO** — todas las fases (1-14) completadas. Este backlog ahora es la referencia para V1.

Este archivo documenta decisiones explícitas de dejar cosas fuera del V0 para mantener scope manejable. Nada aquí está "olvidado" — está intencionalmente aplazado con fecha de revisión.

**Principio operativo:** cada vez que decidimos no construir algo ahora, se agrega aquí en la misma sesión. Cada entrada tiene: qué es, por qué se difiere, y el horizonte tentativo (V1 = primer cliente pagando, V2 = 10 clientes, V3+ = escala).

---

## Seguridad y acceso

- ~~**Autenticación de usuarios.**~~ COMPLETADO — Fase 1 del pivot. Tablas `usuarios`/`usuario_roles`, 9 cuentas de prueba con Supabase Auth, UI de login, middleware de protección, sidebar dinámico por roles, filtrado automático para reps puros. Nota histórica: originalmente diferido a V1, se adelantó por el pivot al usuario operativo.
- **Row-level security (RLS) multi-tenant.** Diferido a V1. Actualmente la DB es single-tenant (una sola "empresa" = Ferretera del Bajío). Para servir múltiples clientes reales, agregar columna `empresa_id` a todas las tablas y políticas RLS. Estimación: 8-12 horas más refactor de queries.
- **Manejo de roles y permisos** (dueño vs vendedor vs contador). Diferido a V2. Por ahora cualquier usuario autenticado ve todo.
- **Asignación de compradores a bodegas específicas.** Diferido. El modelo de datos contempla esta posibilidad pero el filtro "Solo mis bodegas" que aparecerá en el módulo Compras será un placeholder hasta tener datos reales o decisión de producto. No requiere tabla nueva todavía.
- **Configuración por tenant: "permitir a reps ver datos de otros reps".** Diferido a V1 cuando se construya la tabla `configuracion_empresa`. Decisión de producto: en V0, el rep solo ve sus propios datos en Explorer (consistente con regla 18 y con cultura de empresas mexicanas familiares donde la transparencia entre vendedores no es la norma). En V1, esta será la primera setting de `configuracion_empresa`, junto con los umbrales hardcodeados ya documentados como deuda. El default propuesto para V1 es `false` (restrictivo), con opción de activar para empresas con cultura más transparente. Esta decisión está cableada hoy en `get_explorer(p_vendedor_id)` y en la lógica de UI que pasa el vendedor cuando aplica regla 18.

## Integraciones con ERPs

- **Integración con SAP Business One** vía Service Layer (REST/OData). Diferido a V1. El V0 usa CSV/Excel import como concierge MVP. Cuando tengamos primer cliente SAP B1, construir conector nativo.
- **Integración con CONTPAQi Comercial** vía SDK o wrapper REST de AR Software. Diferido a V2. Después de validar PMF con SAP B1.
- **Integración con Aspel SAE** vía acceso directo a DB (Firebird/SQL Server). Diferido a V3+. Técnicamente la más compleja, solo abordar con ingresos suficientes para mantener un ingeniero dedicado.

## Módulos de producto

- ~~**Módulo de Purchasing completo.**~~ COMPLETADO en semana 3 — tres tabs funcionales (Pronóstico, Planeación, Compras).
- ~~**Módulo de Sales Intelligence completo.**~~ COMPLETADO en semana 5 — oportunidades (recompra + cross-sell), cotizaciones con wizard de 3 pasos, tabs Borradores/Cotizaciones, state machine de estados.
- **Agente de WhatsApp para captura de pedidos.** Diferido a V2. Es un complemento natural al core de la capa sobre ERP pero no es el wedge inicial.
- **Detección y merge automático de SKUs/clientes duplicados.** El V0 los detecta y muestra, pero no los resuelve automáticamente. Diferido a V1.
- **Modelo de ML para cross-sell con % Match por SKU-cliente.** Diferido a V2+. V0 usa coocurrencia simple (SQL) que muestra "X% de clientes similares compran esto." Prerequisitos: datos transaccionales reales de al menos 3-5 clientes con 12+ meses de historial.
- **Módulo de riesgo crediticio y cobranza.** Diferido a V2.

## Módulo de Clientes

- ~~**Búsqueda global.**~~ COMPLETADO — barra en header del dashboard, busca en clientes/productos/cotizaciones con Ctrl+K, resultados agrupados con links a detalle y listas filtradas.
- **Exportar lista de clientes a CSV.** Diferido a V1. Botón de descarga con los filtros aplicados.
- **Historial de transacciones completo en página de detalle.** Diferido a V1. Tabla paginada de todas las compras del cliente, con filtros de fecha y búsqueda por producto.
- **Notas y tareas por cliente (CRM básico).** Diferido a V2. Agregar notas de seguimiento y tareas asignables al vendedor principal.

## Módulo de Vendedores

- **Comparación de rendimiento entre vendedores en una sola vista.** Diferido a V1. Vista de radar o tabla comparativa lado a lado con métricas normalizadas.
- **Historial de transacciones paginado por vendedor.** Diferido a V1. Tabla de todas las ventas del vendedor con filtros de fecha, cliente, y producto.
- **Metas de ventas por vendedor con seguimiento de avance.** Diferido a V2. Definir metas mensuales de ingresos/margen y mostrar progreso en barras visuales.

## Módulo de Productos

- **Historial de transacciones paginado en detalle de producto.** Diferido a V1. Tabla de todas las ventas del producto con filtros de fecha, cliente, y bodega.
- **Comparación de margen entre períodos configurable.** Diferido a V1. Actualmente compara últimos 12 meses vs primeros 9 meses. Permitir al usuario seleccionar períodos arbitrarios.
- **Alertas de precio cuando costo_unitario difiere del costo en transacciones recientes.** Diferido a V2. Detecta automáticamente el escenario del proveedor de plomería: costo en tabla productos desactualizado vs costo real que se está pagando.

## Sales Intelligence y Cotizaciones

- ~~**UI de creación de cotizaciones.**~~ COMPLETADO — wizard de 3 pasos (Header → Líneas → Revisión) con panel de recomendaciones (recompras, compró una vez, cross-sell), buscador de productos, precios históricos del cliente, cálculos de margen en tiempo real.
- ~~**Tab "Borradores" y "Cotizaciones" con contenido real.**~~ COMPLETADO — tablas filtrables con sorting, filtros por vendedor/estado/búsqueda. Detalle de cotización con tabla de líneas read-only y acciones por estado (enviar, duplicar, completar, cancelar con confirmación).
- ~~**Edición de cotizaciones en borrador.**~~ COMPLETADO — botón "Editar" en detalle de borrador abre wizard en modo edición con datos pre-llenados. Usa RPCs `actualizar_cotizacion_header` y `reemplazar_lineas_cotizacion`.
- **Tab "Órdenes" (ORDERS) en sección de Oportunidades.** Diferido a V1. Requiere integración con ERP para convertir cotización enviada en orden de compra real.
- **Generación de PDF de cotización.** Diferido a V1. Exportar cotización como PDF con logo, datos fiscales, y condiciones de pago.
- **Historial de cotizaciones por cliente en detalle de cliente.** Diferido a V1. Tab adicional o sección en el detalle del cliente mostrando todas sus cotizaciones.
- **Pricing dinámico en cotizaciones.** Diferido a V2. Sugerir precios óptimos basados en historial de compra del cliente, margen objetivo, y competencia.
- **Aprobación de descuentos por supervisor.** Diferido a V2. Workflow de aprobación cuando un vendedor aplica descuento mayor al umbral configurado.
- **Análisis de dispersión de precios por SKU.** Diferido a V1. Precursor de pricing dinámico: mostrar en detalle de producto que al cliente A se le vende a $X-15% y al cliente B a $X+8% vs el precio promedio. Calculable con datos actuales pero diferido por prioridad.
- **Auto-guardado de cotizaciones en DB (no solo localStorage).** Diferido a V2. Actualmente el auto-guardado del wizard usa localStorage del navegador, lo que no sincroniza entre dispositivos. Para V2, guardar borradores automáticamente en Supabase para que un vendedor pueda empezar una cotización en desktop y continuarla en tablet.
- ~~**Aplicación del filtro `p_vendedor_id` en RPCs adicionales (productos, kpis, ingresos mensuales, etc.) cuando el usuario es rep puro.**~~ DESCARTADO — Fase 7. Evaluado y decidido que no aporta valor: Productos debe mostrar todo el catálogo para habilitar cross-sell, Resumen Ejecutivo da contexto de empresa útil, y la visibilidad de otras páginas se controla vía sidebar (no vía filtrado de RPCs). El filtrado operativo relevante (oportunidades, clientes en riesgo, cotizaciones) ya está implementado.
- **Persistencia server-side de la "vista activa" del selector multi-rol.** Actualmente vive en `localStorage`, lo que no sincroniza entre dispositivos. Diferido a V1+ cuando haya usuarios reales que usen multi-dispositivo.

### Visualizaciones del Explorer (diferidas a V2)

- **Barras apiladas (YTD vs LYTD).** Diferido a V2. Caso de uso: dueño quiere ver tamaño total acumulado año contra año en una sola lectura. Reconsiderar cuando un cliente real pida esta vista. Razón del diferimiento: barras agrupadas ya muestran el comparativo claramente, y la diferencia visual con apiladas es sutil para el usuario promedio.
- **Combo charts (barras + línea en un solo gráfico).** Diferido a V2. Caso de uso: comparar dos métricas de magnitud distinta en el mismo eje (ej. ingresos en barras, margen % en línea). Razón del diferimiento: UX compleja, requiere familiaridad con dashboards avanzados.
- **Cruce de dos dimensiones simultáneas en Explorer.** Diferido a V2+. Caso de uso: ver ventas por bodega segmentadas por categoría (matriz). Razón del diferimiento: requiere refactor mayor de la RPC `get_explorer` para retornar resultados pivoteados por dos dimensiones a la vez. El Explorer actual y stacked bars de una sola dimensión cubren los casos de uso comunes.
- **UI de edición de reportes guardados (renombrar, cambiar descripción, cambiar anclaje sin pasar por sobreescribir).** La RPC `actualizarReporte` ya existe y soporta patch parcial. Falta una UI dedicada para editar metadata sin tener que abrir el reporte en Explorer y sobreescribirlo. Diferido a V1.
- **Performance hint en Explorer con Top 100 + comparativo.** Cambio de métrica con 200 barras toma ~284ms en máquina de desarrollo (target era ≤200ms). Aceptable en uso normal (Top 15 promedio es instantáneo). Si feedback real reporta lag, optimizar con `useMemo` en data array, `useCallback` en tickFormatter, o evaluar virtualización con `react-window`. Diferido a V1 con datos de uso real.
- **Consolidar `parseGrafica` y `sanearConfiguracionGrafica`.** Hoy son dos capas con overlap parcial: el parser de `src/lib/queries/reportes-guardados.ts` valida campos individuales en deserialización, y `sanearConfiguracionGrafica` en `src/lib/explorer/reglas-grafica.ts` valida combinaciones a nivel consumo. Funciona correctamente, pero duplica un poco la responsabilidad. Refactor mecánico de bajo riesgo. Diferido a V1.
- **Extraer helpers compartidos de gráficas a `grafica-utils.ts`.** Hoy `GraficaExplorer.tsx` y `GraficaCompacta.tsx` duplican inline los helpers `obtenerValorFila`, `formatearValor`, `formatearEje`, `metricaComparativa`, `ordenarCronologicamente`, `aplicarTopN`, y la constante `PALETA_DONUT`. Refactor mecánico de bajo riesgo, no urgente. La duplicación está documentada con comentario inline en `GraficaCompacta.tsx`. Diferido a V1.

## Alertas de margen

- **Criterio de alerta basado en rangos objetivo por categoría.** Diferido a V1. Actualmente el umbral es fijo (caída >3pp). Implementar tabla `MARGENES_POR_CATEGORIA` en config con rangos objetivo por categoría para alertas más inteligentes.
- **Drill-down al hacer clic en una card de alerta.** Diferido a V1. Mostrar los SKUs específicos afectados dentro de la categoría, ordenados por contribución a la caída de margen.
- **Alertas agrupadas por proveedor en lugar de categoría.** Diferido a V2. Permitiría detectar que un aumento de costos viene de un proveedor específico que afecta múltiples categorías.
- **Notificaciones automáticas por email o WhatsApp al cruzar umbral crítico.** Diferido a V2. Integrar con sistema de alertas push cuando una categoría cruza el umbral de caída crítica (>5pp).

## Módulo de Compras

- **Persistir tab activo en la URL como query param.** Diferido a V1. Actualmente el tab activo es estado local del componente. Usar `?tab=pronostico` para que un link directo a un tab específico funcione.
- **Badge de "nuevo" en el link de Compras en el sidebar.** Diferido a V1. Agregar ícono o badge visual para destacar que es funcionalidad nueva y atraer atención del usuario.
- **Paginación de la tabla de pronóstico.** Diferido a V1. Actualmente carga todos los SKUs (~772 filas). Implementar paginación server-side o virtual scrolling para mejor rendimiento.
- **Filtro por proveedor en tab Pronóstico.** Diferido a V1. Requiere campo `proveedor_principal` poblado en tabla productos, disponible cuando se conecten ERPs reales con catálogo completo.
- **Selector de horizonte extendido hasta 18 meses.** Diferido a V1. Actualmente el selector ofrece 1, 3, 6 meses. Extender a 12 y 18 meses como en Recurrency para planeación a largo plazo.
- **Sparkline con dos segmentos visuales (historial + pronóstico).** Diferido a V1. Deuda técnica conocida: actualmente la sparkline solo muestra historial. Implementar dos segmentos — historial en gris y proyección en color — igual que Recurrency, para distinguir visualmente dato real de proyección.
- ~~**Modelo de forecasting con detección de estacionalidad.**~~ COMPLETADO — Fase 11. Implementación simple con SQL (comparación mes a mes entre años), sin ML. La RPC `get_estacionalidad_cliente_sku` compara compras del año actual vs año anterior por mes y marca `tiene_patron = true` cuando hay compras en ambos. Integrado al contexto de oportunidades de recompra ("Este cliente también compró este producto en abril del año pasado"). El forecasting del Tab Pronóstico sigue usando promedio ponderado simple — detección estacional específica para pronóstico de demanda queda diferida a V2.
- **Herencia de item entre SKUs.** Diferido a V2. Cuando un SKU nuevo reemplaza a uno descontinuado, heredar su historial de demanda para que el pronóstico del nuevo no arranque de cero.
- **Lead time calculado automáticamente del historial de órdenes de compra del ERP.** Diferido a V1. Actualmente usa un valor fijo de 14 días. Con datos reales del ERP, calcular lead time promedio por proveedor/SKU desde el historial de POs.
- **Columna de proveedor en tab Compras.** Diferido a V1. Requiere campo `proveedor_principal` poblado en tabla productos, disponible cuando se conecten ERPs reales.
- **Botón "Generar orden de compra" con write-back real al ERP.** Diferido a V1. Actualmente muestra un toast placeholder. Implementar creación de PO en SAP B1 / CONTPAQi vía API.
- **Fill rate y rotación de inventario (inventory turns) por SKU en tab Planeación.** Diferido a V1. Métricas adicionales para evaluar eficiencia de inventario.
- **Safety stock dinámico según nivel de servicio objetivo.** Diferido a V2. Actualmente el safety stock es fijo (7 días). Calcular dinámicamente basado en variabilidad de demanda y nivel de servicio configurable por cliente (ej: 95%, 99%).
- ~~**KPIs del comprador con datos reales.**~~ COMPLETADO PARCIALMENTE en Fase 4A — `valor_pos_aprobadas_mes` y `pos_pendientes_revision` ahora usan datos reales desde `acciones_comprador` y `po_sugeridas`. Se agregó `tiempo_promedio_revision_horas` como 4º KPI. `skus_desabasto_mes_anterior` sigue diferido a V1 por requerir snapshot histórico de inventario que no existe en V0.
- **Costo real por SKU para cálculo de capital atrapado en sobrestock.** Actualmente se usa `costo_unitario` de la tabla `productos`. Con ERPs reales, usar costo promedio ponderado del último lote recibido. Diferido a V1.
- **Ventana configurable para cálculo de demanda en RPCs del Tablero de compras.** Actualmente fija a 90 días. Diferido si en pruebas con usuarios resulta que algunos verticales (ej: estacionales) necesitan ventanas distintas.
- **Página de listado completo paginado de desabasto crítico (`/dashboard/tablero-compras/desabasto-critico`).** Hoy el Tablero muestra solo top 10 con un link que va a 404. Diferido a 2C o post-Fase 2.
- **Página de listado completo paginado de próximos a desabasto (`/dashboard/tablero-compras/proximos-desabasto`).** Igual que la anterior.
- **Lógica de mínimo configurable por el usuario / por SKU.** Cuando se conecten ERPs reales, algunos clientes van a querer override manual del mínimo calculado (ej: para SKUs estacionales o con compromisos contractuales). Diferido a V1+. Por ahora la fórmula `demanda × 21` es universal.
- **Sincronización bidireccional del query param `?tab=` en el módulo Compras.** Hoy es solo entrada — cuando el usuario cambia de tab manualmente, la URL no se actualiza. Diferido si los usuarios piden poder copiar la URL del tab actual.
- **Deep-linking a filtros del tab Compras desde el Tablero.** Hoy el botón "Revisar y aprobar" lleva a `/dashboard/compras?tab=compras` sin filtro de bodega, así que el usuario aplica el filtro manualmente. Diferido a polish o Fase 3.
- **Drill-down de las tarjetas de alertas de inventario.** Hoy son informativas sin link. Si los compradores piden explorar la lista detallada de SKUs, construir páginas de detalle. Diferido a Fase 6 (polish del comprador).
- **Costo unitario real por SKU para `valor_total_estimado` en POs sugeridas.** Hoy se usa `costo_unitario` de tabla `productos` que es dato del seed. Con ERPs reales, usar costo promedio ponderado del último lote recibido. Diferido a V1.
- **Lock pesimista o optimista en edición concurrente de POs sugeridas.** Hoy si dos usuarios editan la misma PO, el segundo puede sobreescribir sin warning. En V0 hay un solo comprador. Diferido a V2.
- **Auditoría de cambios a POs sugeridas (quién cambió qué cantidad).** Hoy `actualizar_lineas_po` reemplaza el array sin tracking. Diferido a V1 si los clientes piden auditabilidad.

- **Persistencia server-side de borradores de POs sugeridas.** Hoy viven en localStorage. Diferido a V2 si los compradores editan POs desde múltiples dispositivos.
- **Notificación al revisor original cuando otro intentó tomar la PO.** Hoy si Carlos intenta tomar la PO de María, ve "está siendo revisada por María" pero María no se entera. Diferido.
- **Notificación al comprador cuando hay POs nuevas pendientes.** Hoy debe entrar al Tablero y hacer click en Generar. En V1, alertar vía email/push cuando se detecten items en desabasto sin PO en revisión.
- **Auto-regeneración programada de POs sugeridas (cron diario).** Hoy es manual. En V1+, programar cron que regenere cada mañana.
- **Threshold de similitud configurable para búsqueda typo-tolerant.** Hoy es 0.2 (fijo dentro de la función). Si compradores reales necesitan búsquedas más permisivas, permitir configurar. Diferido.
- **Fallback para typos de transposición en búsqueda de productos.** `pg_trgm` no maneja bien transposiciones de caracteres adyacentes (ej: "tonrillo" no encuentra "tornillo"). Alternativas: agregar extensión `fuzzystrmatch` con distancia de Levenshtein como fallback, o diccionario de correcciones frecuentes. Diferido. La transposición es el typo humano más común.
- **Lead time real desde historial de POs del ERP.** Hoy es constante de 14 días. Reemplazar en V1 con cálculo `AVG(fecha_recepcion - fecha_orden)` por proveedor/SKU.

## Fintech y monetización expandida

- **Crédito comercial embebido.** Diferido a V3+. Tesis de largo plazo: después de tener la capa operativa instalada, agregar lending basado en datos transaccionales.
- **Procesamiento de pagos B2B.** Diferido a V3+.
- **Factoraje de facturas.** Diferido a V3+.

## Infraestructura técnica

- **Mobile-responsive design del dashboard.** Diferido a V1. El V0 se optimiza para desktop porque los dueños revisan reportes desde la oficina.
- **Exportación de dashboards a Excel/PDF.** Diferido a V1. Feature que pide todo mundo pero no es diferenciador.
- **Alertas por email/WhatsApp** cuando se detectan insights críticos. Diferido a V1.
- **Real-time updates vía WebSockets** (Supabase Realtime). Diferido a V2. V0 usa polling/refresh manual.
- **Testing automatizado** (unit + integration). Diferido a V1 cuando el producto sea más estable.
- **Observability y monitoring** (Sentry, analytics de uso). Diferido a V1.
- **CI/CD más sofisticado.** Actualmente usamos auto-deploy de Vercel que es suficiente. GitHub Actions con tests y staging environment diferido a V2.
- **Paginación server-side en `get_explorer`.** Diferido a V1+. Hoy la RPC retorna hasta 5,000 filas, suficiente para el segmento target ($85M-$850M MXN, ~500-3,000 SKUs típicos). Cuando aparezca un cliente real con catálogo de 10,000+ SKUs activos, implementar paginación con `p_offset`, `p_limit`, total count separado, sort server-side, y refactor de UI del Explorer (paginación numerada vs scroll infinito vs cargar más, decisión de UX dependiente de feedback). El cap actual de 5,000 es una salvaguarda; eliminar antes de implementar paginación causa que la UI cargue muy lento sin paginación apropiada.

## Datos y analytics

- **Cumplimiento CFDI/SAT.** Decisión estratégica: NUNCA entrar aquí. Dejamos que Aspel/CONTPAQi/SAP manejen el cumplimiento fiscal. Esta es la lección de Gestionix.
- **Ingesta de datos en tiempo real** desde ERPs. V0 usa snapshots/imports. Tiempo real diferido a V2.
- **Data warehouse separado** para analytics pesados. Por ahora Supabase directo es suficiente. Considerar cuando los queries se vuelvan lentos.

---

## Calidad de datos y edge cases

- **Selector de periodo en el dashboard** (mes actual, mes anterior, últimos 30 días, trimestre, año). Por ahora solo mostramos el mes más reciente con datos. Diferido a V1.
- **Auditoría de uso de `toLocaleDateString` y `new Date(string)` en el codebase.** Encontrados 8 usos potencialmente afectados por el bug de timezone (cotización detalle, listas de clientes, deadstock, oportunidades, compras, wizard). Revisar caso por caso y migrar a parseo manual cuando se trate de meses o fechas sin componente horario. Diferido — fix puntual cada vez que se toque uno de esos archivos.

## Calidad del dataset sintético

- ~~**Regenerar el seed con distribución realista de inventario antes del demo a inversionistas.**~~ COMPLETADO — Fase 14-2. Script `scripts/seed/regenerar-inventario.ts` generó distribución 70.6/15.8/8.7/4.9 (saludable/sobrestock/próximo/crítico). POs regeneradas con ~204 ítems en desabasto (antes 1,500+).
- **Los `margenObjetivo` y rangos de descuento en los perfiles de vendedores del seed son aspiracionales, no determinísticos.** El margen real resultante depende del mix de productos vendidos y las listas de precios de los clientes asignados. Si en el futuro queremos demos más punchy donde vendedores estrella realmente destaquen con 28%+ de margen, hay que implementar lógica en el generador de transacciones que ajuste activamente la selección de productos/clientes para cada vendedor según su perfil objetivo. Estimación: 2-3 horas.
- **Columna `cantidad_clientes_similares` en `oportunidades_cross_sell_cache` está tipada como `text` cuando debería ser `integer`.** Deuda técnica preexistente, no afecta funcionalidad pero debería corregirse cuando se toque la generación del cache.

## Reglas arquitectónicas del proyecto

- **Agregaciones siempre en Postgres, nunca en JavaScript.** Supabase tiene un límite default de 1000 filas por query con `.select()`. Traer filas individuales al cliente para agregarlas en JS produce datos silenciosamente incorrectos (solo se agregan las primeras 1000 filas sin warning). Todas las queries analíticas deben implementarse como RPC functions de Postgres y llamarse con `supabase.rpc()`. Esto aplica a todas las queries actuales y futuras del dashboard.
- **Todo texto dinámico del dashboard (especialmente el que interpola números) debe pasar por `src/lib/textos/`.** Nunca usar `${n} palabras` directamente en JSX — usar `pluralizar()` o una función específica del callout. Esto previene bugs de concordancia gramatical en español (1 cliente vs 2 clientes, está vs están, etc.).
- **Filtros y JOINs entre tablas relacionales usar siempre llaves enteras, nunca texto.** JOINs por texto son frágiles ante homónimos, errores ortográficos, y son lentos. Si una tabla denormaliza un nombre por conveniencia de display, bien — pero los filtros funcionales siempre por id.

## Deuda técnica para integración con ERP (documentada en Fase 12)

Estos puntos no afectan el V0 pero van a requerir refactor cuando se conecte un ERP real. Documentados para que no sean sorpresa.

### Alta prioridad (refactor real en V1)

- **Vendedor principal de cliente es calculado, no asignado.** Hoy se deriva contando quién le ha vendido más al cliente (CTE `vendedor_rank` con `ROW_NUMBER() OVER (ORDER BY SUM(subtotal) DESC)`). Se repite en `get_clientes_en_riesgo`, `get_lista_oportunidades`, `get_clientes_lista`, y `get_oportunidades_recompra`. En un ERP real, el vendedor principal es un campo asignado en la ficha del cliente. **Fix V1:** agregar columna `vendedor_id` a tabla `clientes`, poblarla desde el ERP, y reemplazar todos los CTEs de `vendedor_rank` por un JOIN directo. Estimar ~8 RPCs afectadas.

- **No existe tabla de proveedores.** `productos.proveedor_principal` es texto libre, no FK. En un ERP, cada producto tiene proveedor primario (y a veces secundarios) como entidad separada. Esto afecta especialmente al módulo de Compras: las POs sugeridas deberían agruparse por proveedor (así se envía una sola orden), no solo por bodega. **Fix V1:** crear tabla `proveedores`, agregar `proveedor_id` FK en productos, modificar `generar_pos_sugeridas` para agrupar por (proveedor, bodega), y agregar "Proveedores" como dimensión del Explorer.

- **Umbrales de negocio hardcodeados en SQL.** Valores que deberían ser configurables por empresa: días de cobertura mínima (21), máxima (60), ventana de demanda (90 días), safety stock (7 días), declive de cliente (≥50%), inactividad (>60 días), alerta de margen (>3pp), ABC (20%/50%). **Fix V1:** crear tabla `configuracion_empresa` tipo key-value o columnas tipadas, y que las RPCs lean de ahí en lugar de constantes. Refactor mecánico pero toca ~15 RPCs.

### Media prioridad (refactor menor en V1)

- **Categorías como texto plano.** `productos.categoria` es un string, no FK a tabla de categorías. En ERPs como SAP B1, las categorías son jerárquicas (ItemGroups con niveles). **Fix V1:** crear tabla `categorias` con `id`, `nombre`, `padre_id` para jerarquía. Impacto bajo en lógica de negocio (alertas de margen, ABC) porque solo cambia el GROUP BY. Impacto medio en Explorer si se quiere drill-down por subcategoría.

- **`inventario` usa `sku` (text) como referencia al producto, no `producto_id` (integer).** Inconsistente con `clientes` y `vendedores` que usan IDs enteros. Si un ERP usa IDs internos distintos al SKU visible, necesitaríamos `producto_id` FK. **Fix V1:** agregar `producto_id` integer FK, mantener `sku` para display. Refactor en RPCs que hacen JOIN por `sku`.

- **Sin unidad de medida (UOM) visible en la UI.** `productos.unidad_medida` existe en la tabla pero no se muestra en ninguna pantalla. En un ERP real, las cantidades siempre van acompañadas de su unidad (piezas, cajas, metros, kg). Recurrency muestra UOM en forecasting y POs. **Fix V1:** mostrar UOM en tablas de pronóstico, planeación, compras, y líneas de PO/cotización. Cambio puramente de UI, no de modelo.

### Baja prioridad (decisiones de diseño correctas)

- **`subcategoria` y `marca` existen en `productos` pero no se usan en dashboard.** Ambos campos están poblados en el seed y disponibles en ERPs. Oportunidad para el Explorer: agregar como dimensiones de análisis. No es deuda técnica sino funcionalidad por habilitar.

- **Sin campos fiscales en transacciones (IVA, forma de pago, método de pago).** Decisión intencional — nunca tocar CFDI (lección de Gestionix). Cuando se conecte un ERP, estos campos existirán en origen pero nuestro modelo los ignora deliberadamente. Si en el futuro queremos analytics de formas de pago o antigüedad de cartera, se agregan entonces.

- **Folio de transacciones es formato custom del seed (VTA-202504-00001).** ERPs tienen sus propios formatos de folio. Nuestras RPCs no dependen del formato del folio para nada funcional — solo es display. Se adapta trivialmente al mapear datos del ERP.

## Insights por exhibir que el V0 actual diluye

- **~~Caída de margen en categoría Plomería.~~** RESUELTO — implementada sección "Alertas de margen por categoría" en el dashboard que detecta automáticamente categorías con caídas >3pp. Plomería aparece como alerta.
- **Análisis de mix de productos** — comparación de concentración de ingresos vs concentración de margen. Actualmente el dashboard solo muestra tablas; a futuro agregar visualizaciones de cuadrantes (volumen × margen) para identificar estrellas, vacas, dogs, y question marks del catálogo.

---

## Hallazgos post-4B (diferidos)

- ~~**Items aprobados de POs sugeridas no deben re-aparecer en la siguiente generación.**~~ COMPLETADO — `generar_pos_sugeridas` ahora excluye items que ya están en POs con estado `aprobada` vía NOT EXISTS con jsonb_array_elements. Items eliminados por el comprador antes de aprobar siguen apareciendo en regeneraciones (lógica intencional del producto).
- ~~**Reformular Mi historial → vista operativa de "Mi trabajo".**~~ COMPLETADO — Fase 4C. Mi historial reemplazado por Mi actividad con tabs Actividad reciente + Historial completo. 4 secciones en Actividad reciente (POs en revisión, aprobadas, descartadas, overrides). Sidebar actualizado, ruta vieja redirige.

## Post-refactor 4B (diferidos)

- **Reconectar historial de cambios en el modal de min/max.** Después del refactor 4B-refactor-1, la sección "Cambios desde la última actualización" dentro del modal quedó vacía porque la consulta usaba `entidad_id` del override, y ahora los cambios viven indexados por `(producto_id, bodega_id)` en el metadata JSONB de `acciones_comprador`. Implementar una query que lea del metadata y retorne el historial para ese par. Diferido a Fase 4C o polish posterior.

## Cómo usar este archivo

- **Al diferir algo:** agregarlo aquí en la misma sesión con categoría apropiada.
- **Al terminar algo del backlog:** mover a `CHANGELOG.md` (crear cuando sea necesario).
- **Al planear un sprint:** revisar este archivo antes que cualquier idea nueva.
- **Revisión completa:** cada vez que cerramos una versión (V0 → V1, V1 → V2, etc.).

**Última actualización:** 2026-04-28 (Fases 15 y 16 completadas — vista gráfica configurable en Explorer con 5 tipos, persistencia en reportes guardados, modal sobreescribir/nuevo, apertura del Explorer y Reportes a comprador y rep con filtrado por vendedor para reps puros. V0 extendido cerrado, listo para demos. Siguiente milestone: refactor de deuda técnica pre-ERP — proveedores como tabla, vendedor_id en clientes, configuracion_empresa.)

## Branding (V0 entregado, pendiente para V1)

- Verificar disponibilidad de dominio `abastio.com` / `abastio.mx` / `abastio.ai` y comprar el mejor disponible.
- Búsqueda de trademark en IMPI México (marcanet.impi.gob.mx) — clase 9 (software) y clase 42 (SaaS).
- Registrar handles `@abastio` en X, LinkedIn e Instagram antes de hacerlo público.
- Rediseño profesional del logo con diseñador (Dribbble o 99designs, ~$200-500 USD) antes de ronda o salida a múltiples clientes. El logo V0 es decente para demos pero no es diferenciador suficiente para brand maduro.
- Finalizar tagline oficial. Actual provisional: "Inteligencia operativa sobre tu ERP".
- Brand guidelines completo (tipografía, paleta extendida, usos correctos/incorrectos del logo, espaciado mínimo).
- Variante stacked del logo (símbolo arriba, wordmark abajo) para avatars cuadrados en redes sociales y presentaciones.
- Configurar env var `NEXT_PUBLIC_SITE_URL` en Vercel cuando el dominio esté confirmado, y refactorizar `metadataBase` en `src/app/layout.tsx` para leerlo.
- Renombrar el repo de GitHub de `ferreteria-mvp` a `abastio` (requiere acción manual en GitHub y actualizar el remote local con `git remote set-url origin ...`).
