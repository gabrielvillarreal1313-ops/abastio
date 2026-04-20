# Abastio — Brand Assets V0

Paquete inicial de identidad visual. Estos archivos viven en `public/brand/` del repo de Next.js y se referencian desde metadata y componentes.

> **Nota importante:** este es el V0 del branding — decente para demos a inversionistas y primer piloto. Antes de cerrar ronda o salir a múltiples clientes, contratar a un diseñador profesional (~$200-500 USD en Dribbble/99designs) para refinar el logo final, agregar sistema de iconografía, y crear un brand guidelines completo.

## Paleta de color

| Token | Valor | Uso |
|---|---|---|
| `brand.primary` | `#f59e0b` | Símbolo en fondo oscuro. Color principal de la marca. |
| `brand.primary-dark` | `#d97706` | Símbolo en fondo claro (para mayor contraste). |
| `brand.bg-dark` | `#0f1419` | Fondo oscuro (sidebar, íconos, OG). |
| `brand.text-dark` | `#0f1419` | Wordmark en fondo claro. |
| `brand.text-light` | `#ffffff` | Wordmark en fondo oscuro. |

## Tipografía

El wordmark `abastio` usa **IBM Plex Sans peso 700** (Bold) con letter-spacing `-0.03em`. La app ya tiene IBM Plex Sans cargado en `src/app/layout.tsx` vía `next/font/google`.

## Archivos y su uso

### Logos horizontales (símbolo + wordmark)

| Archivo | viewBox | Contexto de uso |
|---|---|---|
| `logo.svg` | 160×40 | Wordmark usa `currentColor` — para componentes React que heredan color del contenedor. |
| `logo-dark.svg` | 160×40 | Wordmark blanco. Para sidebar, footer oscuro, email signatures sobre oscuro. |
| `logo-light.svg` | 160×40 | Wordmark negro + símbolo ámbar más oscuro (`#d97706`). Para headers claros, marketing. |

### Símbolo solo (sin wordmark)

| Archivo | viewBox | Contexto de uso |
|---|---|---|
| `mark.svg` | 40×40 | Solo la sparkline + halo. Para usos donde ya hay wordmark cerca, o decoración. |

### Íconos de app

| Archivo | Tamaño | Contexto de uso |
|---|---|---|
| `icon.svg` | 32×32 | Fuente de verdad del ícono (fondo oscuro + símbolo). Base para favicon moderno y PWA. |
| `favicon-16.svg` | 16×16 | Versión simplificada del ícono (4 puntos, sin halo) para pestañas de navegador. |
| `favicon-16.png` | 16×16 | Fallback PNG del favicon chico. |
| `favicon-32.png` | 32×32 | Fallback PNG del favicon mediano. |
| `favicon.ico` | 16/32/48 | Multi-resolution ICO para browsers legacy (IE, etc). |
| `apple-touch-icon.png` | 180×180 | iOS home screen icon. |
| `icon-192.png` | 192×192 | PWA manifest (Android). |
| `icon-512.png` | 512×512 | PWA manifest (splash screen en Android). |

### Social / OpenGraph

| Archivo | Tamaño | Contexto de uso |
|---|---|---|
| `og-image.svg` | 1200×630 | Fuente editable del OG image. |
| `og-image.png` | 1200×630 | Imagen para Twitter Card, LinkedIn, Slack, WhatsApp previews. |

## Cómo referenciar desde Next.js metadata

```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'Abastio',
    template: '%s · Abastio',
  },
  description: 'Inteligencia operativa sobre tu ERP.',
  icons: {
    icon: [
      { url: '/brand/favicon.ico', sizes: 'any' },
      { url: '/brand/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/brand/apple-touch-icon.png',
  },
  manifest: '/brand/site.webmanifest',
  openGraph: {
    title: 'Abastio',
    description: 'Inteligencia operativa sobre tu ERP.',
    images: [{ url: '/brand/og-image.png', width: 1200, height: 630 }],
    type: 'website',
    locale: 'es_MX',
  },
};
```

## Pendientes antes de V1 (anotar en BACKLOG.md)

- [ ] Verificar disponibilidad de dominio `abastio.com` / `abastio.mx` / `abastio.ai`
- [ ] Búsqueda de trademark en IMPI (marcanet.impi.gob.mx) — clase 9 (software) y 42 (SaaS)
- [ ] Registrar handles `@abastio` en X, LinkedIn, Instagram
- [ ] Rediseño profesional del logo con diseñador
- [ ] Finalizar tagline oficial (actual: "Inteligencia operativa sobre tu ERP")
- [ ] Brand guidelines completo (tipografía, paleta extendida, usos correctos/incorrectos)
- [ ] Ícono de app para iOS/Android (marca en app stores) — más pulido
- [ ] Variante stacked del logo para avatars cuadrados y presentaciones
