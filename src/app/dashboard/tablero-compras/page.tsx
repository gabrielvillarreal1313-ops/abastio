/**
 * Tablero de compras — Página de aterrizaje para compradores.
 * Server Component que carga datos en paralelo y renderiza todas las secciones.
 *
 * Secciones (Fase 3C):
 * - Header con conteos, timestamp de última generación, botón de generar POs
 * - KPIs del comprador
 * - POs sugeridas persistentes (de tabla po_sugeridas, link al detalle individual)
 * - Items en desabasto crítico (top 10)
 * - Items próximos a entrar en desabasto (top 10)
 * - Alertas de inventario (deadstock, sobrestock, sin movimiento)
 */

import { getUsuarioActual } from '@/lib/auth/usuario-actual';
import { getItemsDesabastoCritico } from '@/lib/queries/items-desabasto-critico';
import { getItemsProximosDesabasto } from '@/lib/queries/items-proximos-desabasto';
import { getKpisComprador } from '@/lib/queries/kpis-comprador';
import { getPosSugeridasPendientes } from '@/lib/queries/pos-sugeridas-pendientes';
import { getUltimaGeneracionPos } from '@/lib/queries/ultima-generacion-pos';
import { getAlertasSobrestock } from '@/lib/queries/alertas-sobrestock';
import { getItemsSinMovimientoReciente } from '@/lib/queries/items-sin-movimiento-reciente';
import { getDeadstock } from '@/lib/queries/deadstock';

import { HeaderTablero } from '@/components/dashboard/tablero-compras/HeaderTablero';
import { KPIsCompradorCards } from '@/components/dashboard/tablero-compras/KPIsCompradorCards';
import { SeccionPOsSugeridas } from '@/components/dashboard/tablero-compras/SeccionPOsSugeridas';
import { SeccionDesabastoCritico } from '@/components/dashboard/tablero-compras/SeccionDesabastoCritico';
import { SeccionProximosDesabasto } from '@/components/dashboard/tablero-compras/SeccionProximosDesabasto';
import { SeccionAlertasInventario } from '@/components/dashboard/tablero-compras/SeccionAlertasInventario';

export const dynamic = 'force-dynamic';

export default async function TableroComprasPage() {
  const [
    usuario,
    desabastoCritico,
    proximosDesabasto,
    kpis,
    posPendientes,
    ultimaGeneracion,
    alertasSobrestock,
    itemsSinMovimiento,
    deadstockData,
  ] = await Promise.all([
    getUsuarioActual(),
    getItemsDesabastoCritico(),
    getItemsProximosDesabasto(14),
    getKpisComprador(),
    getPosSugeridasPendientes(),
    getUltimaGeneracionPos(),
    getAlertasSobrestock(),
    getItemsSinMovimientoReciente(),
    getDeadstock(),
  ]);

  // Conteos para el header
  const bodegasConPos = new Set(posPendientes.map((p) => p.bodega_id));
  const conteoAlertas = alertasSobrestock.length + itemsSinMovimiento.length;

  // ¿Puede generar POs? Solo comprador y dueño
  const rolesUsuario = usuario?.roles ?? [];
  const puedeGenerar = rolesUsuario.includes('comprador') || rolesUsuario.includes('dueno');

  return (
    <>
      <HeaderTablero
        nombreUsuario={usuario?.nombre ?? 'comprador'}
        conteoDesabastoCritico={desabastoCritico.length}
        conteoProximosDesabasto={proximosDesabasto.length}
        conteoBodegas={bodegasConPos.size}
        conteoAlertasInventario={conteoAlertas}
        mesActual={kpis?.mes_actual ?? ''}
        ultimaGeneracion={ultimaGeneracion}
        puedeGenerar={puedeGenerar}
      />

      {kpis && <KPIsCompradorCards kpis={kpis} />}

      <SeccionPOsSugeridas pos={posPendientes} usuarioId={usuario?.id ?? null} />

      <SeccionDesabastoCritico items={desabastoCritico} />

      <SeccionProximosDesabasto items={proximosDesabasto} />

      <SeccionAlertasInventario
        deadstock={deadstockData.items}
        alertasSobrestock={alertasSobrestock}
        itemsSinMovimiento={itemsSinMovimiento}
      />
    </>
  );
}
