/**
 * KPIsCompradorCards — Grid de 4 KPIs para el Tablero de compras.
 * Reutiliza KPICard existente. Fase 4A: datos reales desde acciones_comprador.
 * Server Component.
 */

import { KPICard } from '@/components/dashboard/KPICard';
import { formatMXNCorto, formatUnidades, formatearDuracionHoras } from '@/lib/textos/formato';
import type { KpisComprador } from '@/lib/queries/kpis-comprador';

interface Props {
  kpis: KpisComprador;
}

export function KPIsCompradorCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <KPICard
        label="SKUs en desabasto crítico"
        value={kpis.skus_desabasto_critico > 0
          ? formatUnidades(kpis.skus_desabasto_critico)
          : '0'
        }
        subtitle="Items por debajo del mínimo recomendado"
      />

      <KPICard
        label="Capital atrapado en inventario"
        value={formatMXNCorto(kpis.valor_capital_atrapado_total)}
        subtitle="Sobrestock + deadstock combinado"
      />

      <KPICard
        label="POs aprobadas este mes"
        value={formatMXNCorto(kpis.valor_pos_aprobadas_mes)}
        subtitle={kpis.pos_pendientes_revision > 0
          ? `${formatUnidades(kpis.pos_pendientes_revision)} pendientes de revisar`
          : 'Sin POs pendientes'
        }
      />

      <KPICard
        label="Tiempo promedio de revisión"
        value={formatearDuracionHoras(kpis.tiempo_promedio_revision_horas)}
        subtitle={kpis.tiempo_promedio_revision_horas != null
          ? 'De toma a decisión este mes'
          : 'Sin POs cerradas este mes'
        }
      />
    </div>
  );
}
