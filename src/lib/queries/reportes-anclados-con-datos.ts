/**
 * reportes-anclados-con-datos.ts — Helper que combina la lectura de reportes
 * anclados con la ejecución de `getExplorer` para producir las tuplas
 * `{reporte, datos}` que renderiza `<ReportesAnclados>`.
 *
 * Se usa desde tres páginas (Resumen Ejecutivo, Tablero de Compras, Tablero
 * de Ventas) para evitar duplicar la lógica de:
 * - Tope de 5 anclados (acotar fetches paralelos)
 * - Filtrado por vendedor cuando el usuario es rep puro (regla 18)
 * - Degradación silenciosa si una RPC falla (devuelve datos vacíos)
 */

import { getReportesAnclados } from '@/lib/queries/reportes-guardados';
import { getExplorer } from '@/lib/queries/explorer';
import type { ReporteAncladoConDatos } from '@/components/dashboard/ReportesAnclados';

const MAX_ANCLADOS_POR_PAGINA = 5;

export async function getReportesAncladosConDatos(
  usuarioId: string,
  vendedorIdFiltro: number | null
): Promise<ReporteAncladoConDatos[]> {
  const anclados = (await getReportesAnclados(usuarioId)).slice(0, MAX_ANCLADOS_POR_PAGINA);
  return Promise.all(
    anclados.map(async (reporte) => {
      try {
        const datos = await getExplorer(
          reporte.configuracion.dimension,
          reporte.configuracion.filtros ?? {},
          vendedorIdFiltro
        );
        return { reporte, datos };
      } catch {
        return { reporte, datos: [] };
      }
    })
  );
}
