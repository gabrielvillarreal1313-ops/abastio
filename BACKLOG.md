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

## Cómo usar este archivo

- **Al diferir algo:** agregarlo aquí en la misma sesión con categoría apropiada.
- **Al terminar algo del backlog:** mover a `CHANGELOG.md` (crear cuando sea necesario).
- **Al planear un sprint:** revisar este archivo antes que cualquier idea nueva.
- **Revisión completa:** cada vez que cerramos una versión (V0 → V1, V1 → V2, etc.).

**Última actualización:** 2026-04-09
