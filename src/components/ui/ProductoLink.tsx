'use client';

/**
 * ProductoLink — Link inline a la página de detalle de un producto.
 *
 * Renderiza el nombre como texto que hereda el color del contexto
 * con hover:underline y cursor-pointer, para integrarse visualmente
 * en tablas sin romper la jerarquía visual.
 */

import { useRouter } from 'next/navigation';

interface Props {
  sku: string;
  nombre: string;
  className?: string;
}

export function ProductoLink({ sku, nombre, className }: Props) {
  const router = useRouter();

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/dashboard/productos/${encodeURIComponent(sku)}`);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          router.push(`/dashboard/productos/${encodeURIComponent(sku)}`);
        }
      }}
      className={`text-[#92400e] hover:text-[#78350f] hover:underline cursor-pointer ${className ?? ''}`}
    >
      {nombre}
    </span>
  );
}
