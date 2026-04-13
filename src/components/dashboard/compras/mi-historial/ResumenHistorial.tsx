/**
 * ResumenHistorial — Banner con resumen del periodo del historial.
 * Server Component que recibe datos por props.
 */

import { conConteo } from '@/lib/textos/pluralizar';
import { formatMXNCorto } from '@/lib/textos/formato';
import type { HistorialAccion } from '@/lib/queries/historial-comprador';

interface Props {
  acciones: HistorialAccion[];
}

export function ResumenHistorial({ acciones }: Props) {
  if (acciones.length === 0) return null;

  const aprobadas = acciones.filter((a) => a.tipo_accion === 'po_aprobacion');
  const descartadas = acciones.filter((a) => a.tipo_accion === 'po_descarte');
  const modificaciones = acciones.filter((a) => a.tipo_accion === 'po_modificacion');

  const valorAprobado = aprobadas.reduce((sum, a) => sum + (a.valor_monetario ?? 0), 0);

  // Construir partes del resumen dinámicamente
  const partes: string[] = [];

  if (aprobadas.length > 0) {
    partes.push(
      `aprobado ${conConteo(aprobadas.length, 'PO', 'POs')} por ${formatMXNCorto(valorAprobado)}`
    );
  }

  if (descartadas.length > 0) {
    partes.push(`descartado ${conConteo(descartadas.length, 'PO', 'POs')}`);
  }

  if (modificaciones.length > 0) {
    partes.push(
      `modificado ${conConteo(modificaciones.length, 'PO', 'POs')} antes de decidir`
    );
  }

  // Overrides de min/max
  const overrides = acciones.filter((a) => a.tipo_accion === 'min_max_override');
  if (overrides.length > 0) {
    partes.push(
      `ajustado mínimos o máximos en ${conConteo(overrides.length, 'ítem', 'ítems')}`
    );
  }

  if (partes.length === 0) {
    // Solo tomas de revisión
    const tomas = acciones.filter((a) => a.tipo_accion === 'po_toma_revision');
    if (tomas.length > 0) {
      partes.push(`tomado ${conConteo(tomas.length, 'PO', 'POs')} para revisión`);
    }
  }

  // Unir con comas y "y" antes del último
  let textoResumen: string;
  if (partes.length === 1) {
    textoResumen = partes[0];
  } else if (partes.length === 2) {
    textoResumen = `${partes[0]} y ${partes[1]}`;
  } else {
    textoResumen = `${partes.slice(0, -1).join(', ')}, y ${partes[partes.length - 1]}`;
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-3 mb-6">
      <p className="text-sm text-blue-800">
        En este periodo has {textoResumen}.
      </p>
    </div>
  );
}
