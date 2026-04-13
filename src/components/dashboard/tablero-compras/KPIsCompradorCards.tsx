/**
 * KPIsCompradorCards — Grid de 4 KPIs para el Tablero de compras.
 * Reutiliza KPICard existente. Los campos placeholder se muestran como "—".
 * Server Component.
 */

import { KPICard } from '@/components/dashboard/KPICard';
import { formatMXNCorto, formatUnidades } from '@/lib/textos/formato';
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
        value={kpis.valor_pos_aprobadas_mes != null
          ? formatMXNCorto(kpis.valor_pos_aprobadas_mes)
          : '—'
        }
        subtitle={kpis.valor_pos_aprobadas_mes != null
          ? undefined
          : 'Se activa con tracking (Fase 4)'
        }
      />

      <KPICard
        label="POs pendientes de revisar"
        value={kpis.pos_pendientes_revision != null
          ? formatUnidades(kpis.pos_pendientes_revision)
          : '—'
        }
        subtitle={kpis.pos_pendientes_revision != null
          ? undefined
          : 'Se activa con tracking (Fase 4)'
        }
      />
    </div>
  );
}
