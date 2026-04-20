// src/components/ui/Logo.tsx
//
// Logo de Abastio como SVG inline. El wordmark usa `currentColor` para
// que el contenedor padre controle el color vía Tailwind (ej: `text-white`,
// `text-slate-900`). El símbolo (sparkline + halo + punto) siempre es ámbar
// porque es parte de la identidad visual fija.

interface PropsLogo {
  /** Alto del logo en píxeles. Width escala proporcionalmente según la variante. */
  alto?: number;
  /** Si true, muestra solo el símbolo sin el wordmark. */
  soloSimbolo?: boolean;
  className?: string;
}

export function Logo({ alto = 24, soloSimbolo = false, className = '' }: PropsLogo) {
  if (soloSimbolo) {
    return (
      <svg
        viewBox="0 0 40 40"
        height={alto}
        width={alto}
        className={className}
        role="img"
        aria-label="Abastio"
      >
        <polyline
          points="4,34 12,36 21,24 27,28 34,14"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="34" cy="14" r="3.5" fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.4" />
        <circle cx="34" cy="14" r="2.2" fill="#f59e0b" />
      </svg>
    );
  }

  // Ancho del logo horizontal = alto × 4 (viewBox 160×40)
  const ancho = alto * 4;

  return (
    <svg
      viewBox="0 0 160 40"
      height={alto}
      width={ancho}
      className={className}
      role="img"
      aria-label="Abastio"
    >
      <polyline
        points="4,34 12,36 21,24 27,28 34,14"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="34" cy="14" r="3.5" fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.4" />
      <circle cx="34" cy="14" r="2.2" fill="#f59e0b" />
      <text
        x="46"
        y="28"
        fontSize="24"
        fontWeight="700"
        letterSpacing="-0.03em"
        fill="currentColor"
        style={{ fontFamily: 'var(--font-ibm-plex), system-ui, sans-serif' }}
      >
        abastio
      </text>
    </svg>
  );
}
