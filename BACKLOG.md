# Backlog — Cosas diferidas del V0

Este archivo documenta decisiones explícitas de dejar cosas fuera del V0 para mantener scope manejable. Nada aquí está "olvidado" — está intencionalmente aplazado con fecha de revisión.

**Principio operativo:** cada vez que decidimos no construir algo ahora, se agrega aquí en la misma sesión. Cada entrada tiene: qué es, por qué se difiere, y el horizonte tentativo (V1 = primer cliente pagando, V2 = 10 clientes, V3+ = escala).

---

## Seguridad y acceso

- **Autenticación de usuarios.** Diferido a V1. El dashboard actual es público (cualquiera con la URL puede ver). Implementar con Supabase Auth cuando tengamos primer cliente real. Estimación: 4-6 horas.
- **Row-level security (RLS) multi-tenant.** Diferido a V1. Actualmente la DB es single-tenant (una sola "empresa" = Ferretera del Bajío). Para servir múltiples clientes reales, agregar columna `empresa_id` a todas las tablas y políticas RLS. Estimación: 8-12 horas más refactor de queries.
- **Manejo de roles y permisos** (dueño vs vendedor vs contador). Diferido a V2. Por ahora cualquier usuario autenticado ve todo.

## Integraciones con ERPs

- **Integración con SAP Business One** vía Service Layer (REST/OData). Diferido a V1. El V0 usa CSV/Excel import como concierge MVP. Cuando tengamos primer cliente SAP B1, construir conector nativo.
- **Integración con CONTPAQi Comercial** vía SDK o wrapper REST de AR Software. Diferido a V2. Después de validar PMF con SAP B1.
- **Integración con Aspel SAE** vía acceso directo a DB (Firebird/SQL Server). Diferido a V3+. Técnicamente la más compleja, solo abordar con ingresos suficientes para mantener un ingeniero dedicado.

## Módulos de producto

- **Módulo de Purchasing completo** (forecasting, PO suggestions, min/max dinámicos). En roadmap del V0 semanas 3-4, pero si no llegamos, se difiere a V1.
- **Módulo de Sales intelligence** (cross-sell/upsell, alertas de recompra, pricing dinámico). En roadmap del V0 semanas 5-6, si no llegamos se difiere a V1.
- **Agente de WhatsApp para captura de pedidos.** Diferido a V2. Es un complemento natural al core de la capa sobre ERP pero no es el wedge inicial.
- **Detección y merge automático de SKUs/clientes duplicados.** El V0 los detecta y muestra, pero no los resuelve automáticamente. Diferido a V1.
- **Módulo de riesgo crediticio y cobranza.** Diferido a V2.

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

## Datos y analytics

- **Cumplimiento CFDI/SAT.** Decisión estratégica: NUNCA entrar aquí. Dejamos que Aspel/CONTPAQi/SAP manejen el cumplimiento fiscal. Esta es la lección de Gestionix.
- **Ingesta de datos en tiempo real** desde ERPs. V0 usa snapshots/imports. Tiempo real diferido a V2.
- **Data warehouse separado** para analytics pesados. Por ahora Supabase directo es suficiente. Considerar cuando los queries se vuelvan lentos.

---

## Calidad de datos y edge cases

- **Selector de periodo en el dashboard** (mes actual, mes anterior, últimos 30 días, trimestre, año). Por ahora solo mostramos el mes más reciente con datos. Diferido a V1.

## Calidad del dataset sintético

- **Los `margenObjetivo` y rangos de descuento en los perfiles de vendedores del seed son aspiracionales, no determinísticos.** El margen real resultante depende del mix de productos vendidos y las listas de precios de los clientes asignados. Si en el futuro queremos demos más punchy donde vendedores estrella realmente destaquen con 28%+ de margen, hay que implementar lógica en el generador de transacciones que ajuste activamente la selección de productos/clientes para cada vendedor según su perfil objetivo. Estimación: 2-3 horas.

## Reglas arquitectónicas del proyecto

- **Agregaciones siempre en Postgres, nunca en JavaScript.** Supabase tiene un límite default de 1000 filas por query con `.select()`. Traer filas individuales al cliente para agregarlas en JS produce datos silenciosamente incorrectos (solo se agregan las primeras 1000 filas sin warning). Todas las queries analíticas deben implementarse como RPC functions de Postgres y llamarse con `supabase.rpc()`. Esto aplica a todas las queries actuales y futuras del dashboard.
- **Todo texto dinámico del dashboard (especialmente el que interpola números) debe pasar por `src/lib/textos/`.** Nunca usar `${n} palabras` directamente en JSX — usar `pluralizar()` o una función específica del callout. Esto previene bugs de concordancia gramatical en español (1 cliente vs 2 clientes, está vs están, etc.).

## Insights por exhibir que el V0 actual diluye

- **Caída de margen en categoría Plomería.** El escenario del proveedor inyectado en el seed (+15% costos en ~40 SKUs desde dic 2025 sin ajuste de precio) es visible en agregados por categoría pero invisible en vista global. Requiere construir una vista de margen por categoría en el módulo de Reporting, y/o una sección de "Alertas de margen" que detecte automáticamente categorías con caídas >2 puntos porcentuales. Prioridad alta para semana 2-3 del V0.
- **Análisis de mix de productos** — comparación de concentración de ingresos vs concentración de margen. Actualmente el dashboard solo muestra tablas; a futuro agregar visualizaciones de cuadrantes (volumen × margen) para identificar estrellas, vacas, dogs, y question marks del catálogo.

## Polish visual pendiente para cierre de semana 2

- **Formato de "días sin vender" en la tabla de deadstock:** cambiar "134d" a "134 días" usando `conConteo()`.
- **Tabla de deadstock: agregar columna "Bodega"** para mostrar dónde está físicamente el inventario muerto. Si un SKU tiene inventario en ambas bodegas, mostrar "León + Querétaro" o la bodega con más inventario.
- **Revisar todos los componentes del dashboard** buscando usos de formatos raros (abreviaciones, sin pluralización, sin separadores de miles) y normalizarlos usando el módulo de textos.

---

## Cómo usar este archivo

- **Al diferir algo:** agregarlo aquí en la misma sesión con categoría apropiada.
- **Al terminar algo del backlog:** mover a `CHANGELOG.md` (crear cuando sea necesario).
- **Al planear un sprint:** revisar este archivo antes que cualquier idea nueva.
- **Revisión completa:** cada vez que cerramos una versión (V0 → V1, V1 → V2, etc.).

**Última actualización:** 2026-04-10
