'use client';

/**
 * VendedorLink — Link inline a la página de detalle de un vendedor.
 *
 * Renderiza el nombre como texto que hereda el color del contexto
 * con hover:underline y cursor-pointer, para integrarse visualmente
 * en tablas sin romper la jerarquía visual.
 */

import { useRouter } from 'next/navigation';

interface Props {
  vendedorId: number;
  nombre: string;
  className?: string;
}

export function VendedorLink({ vendedorId, nombre, className }: Props) {
  const router = useRouter();

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/dashboard/vendedores/${vendedorId}`);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          router.push(`/dashboard/vendedores/${vendedorId}`);
        }
      }}
      className={`hover:underline cursor-pointer ${className ?? ''}`}
    >
      {nombre}
    </span>
  );
}
