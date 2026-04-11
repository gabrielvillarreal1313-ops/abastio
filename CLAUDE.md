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

6 tablas en Supabase (project: `talinunhftglhoghwacq`):

- `bodegas` — 2 filas (León, Querétaro)
- `productos` — 772 filas (750 base + 22 duplicados intencionales como anomalía)
- `clientes` — 122 filas (110 base + 12 duplicados intencionales)
- `vendedores` — 7 filas con perfiles diferenciados
- `transacciones` — ~113K filas, 18 meses (oct 2024 → abr 2026), cada fila es una línea de venta/devolución/nota de crédito
- `inventario` — ~1,544 filas (SKU × bodega)

RPC functions de Postgres para el dashboard:
- `get_kpis_periodo(fecha_desde, fecha_hasta)` — KPIs agregados
- `get_ingresos_mensuales(fecha_desde, fecha_hasta)` — ingresos/costos por mes
- `get_top_skus_por_ingresos(fecha_desde, fecha_hasta)` — top 10 SKUs por ingresos
- `get_top_skus_por_margen(fecha_desde, fecha_hasta)` — top 10 SKUs por margen % (min 20 uds, $50K)
- `get_deadstock()` — SKUs activos sin ventas en 90+ días con inventario > 0, incluye bodegas_con_stock
- `get_clientes_en_riesgo()` — clientes con declive ≥50% o inactivos 60+ días
- `get_rendimiento_vendedores(fecha_desde, fecha_hasta)` — métricas por vendedor con comparación vs mes anterior

El generador de datos sintéticos vive en `scripts/seed/` (9 archivos). Se ejecuta con `npm run seed`. Incluye anomalías deliberadas (duplicados, NULLs, outliers, cliente en declive, margen erosionado en plomería).

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

11. **Nombres de entidades clickeables deben usar componentes de link de `src/components/ui/`.** ClienteLink para clientes, ProductoLink y VendedorLink (futuro) para productos y vendedores. Estos componentes heredan el color del contexto con hover:underline, para integrarse en tablas sin romper jerarquía visual.

## Estructura del proyecto

```
src/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx    — Sidebar fijo (slate-900) + área principal
│   │   ├── page.tsx      — Server Component, orquesta todas las queries
│   │   ├── compras/      — Módulo de Compras (Pronóstico, Planeación, Compras)
│   │   └── clientes/     — Lista + detalle [id]
│   ├── page.tsx           — Test de conexión a Supabase (legacy)
│   └── layout.tsx         — Root layout
├── components/
│   ├── ui/
│   │   └── ClienteLink.tsx — Link inline a detalle de cliente
│   └── dashboard/
│       ├── KPICard.tsx
│       ├── GraficaIngresosMensuales.tsx  ('use client' — Recharts)
│       ├── TopSKUs.tsx
│       ├── Deadstock.tsx                  ('use client' — estado expandir)
│       ├── ClientesEnRiesgo.tsx            ('use client' — filas clickeables)
│       ├── RendimientoVendedores.tsx
│       ├── AlertasMargen.tsx
│       ├── compras/                        — TabPronostico, TabPlaneacion, TabCompras, ComprasTabs
│       └── clientes/                       — ListaClientes
├── lib/
│   ├── queries/           — Una query por archivo, cada una llama a supabase.rpc()
│   │   ├── types.ts       — Tipos TS para resultados de queries
│   │   ├── kpis.ts
│   │   ├── ingresos-mensuales.ts
│   │   ├── top-skus.ts
│   │   ├── deadstock.ts
│   │   ├── clientes-en-riesgo.ts
│   │   └── rendimiento-vendedores.ts
│   ├── textos/            — Módulo centralizado de texto y formato
│   │   ├── pluralizar.ts  — Concordancia gramatical español
│   │   ├── formato.ts     — Formatters de moneda, %, unidades
│   │   └── callouts.ts    — Generadores de texto de callouts
│   └── supabase.ts        — Cliente Supabase (anon key, para el frontend)
scripts/seed/              — Generador de datos sintéticos (9 archivos)
```

## Estado actual del dashboard

**Terminados (semana 2):**
- KPIs del resumen ejecutivo (5 cards con mes parcial handling)
- Gráfica de ingresos y margen mensual (combo chart, 13 meses)
- Top 10 SKUs por ingresos vs por margen % (dos tablas + callout de insight)
- Detección de deadstock (hero stat + tabla expandible con columna bodega + callout)
- Clientes en riesgo (hero stat doble + tabla con fila destacada + callout)
- Rendimiento por vendedor (tabla 8 columnas + callout automático que detecta peor caso)

**Pendiente semana 3+:**
- Módulo de Purchasing (forecasting, PO suggestions)
- Módulo de Sales intelligence
- Páginas de detalle (Productos, Clientes, Vendedores en sidebar)

## Convenciones de código

- TypeScript estricto (`strict: true`)
- Comentarios en español explicando decisiones no obvias
- Nombres de variables en español cuando son de dominio del negocio (ej: `margenBrutoPct`, `razonSocial`, `diasSinComprar`)
- Nombres de funciones/componentes en inglés técnico cuando son de framework (ej: `getKPIsResumen`, `insertBatch`)
- Server Components por defecto. `'use client'` solo cuando hay hooks o interactividad
- Cada query en su propio archivo en `src/lib/queries/`
- Cada componente de dashboard en `src/components/dashboard/`

## Instrucción

Antes de escribir código, verifica si lo que vas a hacer es consistente con las reglas arquitectónicas de este archivo. Si hay duda, pregunta.
