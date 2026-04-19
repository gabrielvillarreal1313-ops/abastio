'use client';

/**
 * ClienteLink — Link inline a la página de detalle de un cliente.
 *
 * Renderiza el nombre como texto que hereda el color del contexto
 * con hover:underline y cursor-pointer, para integrarse visualmente
 * en tablas sin romper la jerarquía visual.
 */

import { useRouter } from 'next/navigation';

interface Props {
  clienteId: number;
  nombre: string;
  /** Clase CSS adicional para el contenedor */
  className?: string;
}

export function ClienteLink({ clienteId, nombre, className }: Props) {
  const router = useRouter();

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/dashboard/clientes/${clienteId}`);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          router.push(`/dashboard/clientes/${clienteId}`);
        }
      }}
      className={`text-[#92400e] hover:text-[#78350f] hover:underline cursor-pointer ${className ?? ''}`}
    >
      {nombre}
    </span>
  );
}
