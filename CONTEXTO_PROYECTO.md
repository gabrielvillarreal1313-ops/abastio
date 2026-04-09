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

- **Fase:** V0 (MVP con datos sintéticos)
- **Semana:** 2 de 8-10 planeadas
- **Stack:** Next.js 14 + TypeScript + Tailwind + Supabase + Vercel + Recharts
- **Repo:** GitHub privado `ferreteria-mvp`
- **Deploy:** Vercel con auto-deploy desde main

**Lo que está construido:**
- Generador de datos sintéticos completo (scripts/seed/) — 113K transacciones de una ferretería mayorista ficticia "Ferretera del Bajío" con 750 SKUs, 110 clientes, 7 vendedores, 18 meses de historia
- Dashboard de resumen ejecutivo con: KPIs principales, gráfica de ingresos/margen mensual, Top 10 SKUs (ingresos vs margen), detección de deadstock, detección de clientes en riesgo
- Anomalías deliberadas inyectadas en los datos para demostrar capacidad de detección (duplicados, margen erosionado en plomería, cliente en declive, deadstock)

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

## Cosas diferidas

Ver `BACKLOG.md` en el repo para la lista completa con horizonte tentativo (V1, V2, V3+). Highlights:
- Autenticación y multi-tenant (V1)
- Integraciones reales con ERPs (V1-V3)
- Mobile responsive (V1)
- WhatsApp agent (V2)
- Fintech/lending (V3+)

## Próximos pasos inmediatos

**Cerrar semana 2:**
- Módulo de rendimiento de vendedores (Top Vendedores)
- Polish visual del dashboard
- Commit y deploy a Vercel

**Semana 3:**
- Módulo de Purchasing: forecasting de demanda, sugerencias de PO, análisis de min/max
- Alertas de margen por categoría (hacer visible el escenario de plomería)

**Semana 4:**
- Módulo de Sales intelligence: cross-sell/upsell, patrones de recompra
- Empezar a investigar API de SAP Business One Service Layer

---

## Cómo usar este documento

1. **Chat nuevo en claude.ai:** Pega este documento completo al inicio del primer mensaje. Después de pegarlo, escribe tu pregunta o tarea específica.

2. **Continuación de trabajo técnico:** Si vas a pedirle a Claude que escriba código, especifica que el repo se llama `ferreteria-mvp`, usa Next.js 14 App Router, y las reglas arquitectónicas del proyecto (agregaciones en Postgres, textos vía módulo centralizado, TypeScript estricto, comentarios en español).

3. **Actualización:** Este documento se actualiza al final de cada semana. Si el estado cambió significativamente, re-genera desde Claude Code con el comando "actualiza CONTEXTO_PROYECTO.md con el estado actual".

**Última actualización:** 2026-04-10 (semana 2, día 3)
