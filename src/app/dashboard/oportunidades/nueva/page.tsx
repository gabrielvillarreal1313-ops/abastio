/**
 * Nueva cotización — Página wrapper para el wizard de creación/edición.
 * Carga la lista de clientes y vendedores para los selectores.
 * Soporta ?editar=UUID para modo edición de borrador.
 */

import { Suspense } from 'react';
import { getClientesLista } from '@/lib/queries/clientes-lista';
import { getVendedoresLista } from '@/lib/queries/vendedores-lista';
import { WizardCotizacion } from '@/components/dashboard/oportunidades/WizardCotizacion';

export const dynamic = 'force-dynamic';

export default async function NuevaCotizacionPage() {
  const [clientes, vendedores] = await Promise.all([
    getClientesLista(),
    getVendedoresLista(),
  ]);

  const clientesSimple = clientes.map((c) => ({
    id: c.cliente_id,
    nombre: c.razon_social,
    tipo: c.tipo_cliente,
    vendedor_principal: c.vendedor_principal,
  }));

  const vendedoresSimple = vendedores.map((v) => ({
    id: v.vendedor_id,
    nombre: v.nombre,
  }));

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Cotización</h1>
        <p className="text-sm text-gray-500 mt-1">
          Crea o edita una cotización
        </p>
      </div>

      <Suspense fallback={<div className="flex items-center justify-center py-16"><p className="text-gray-400 text-sm">Cargando...</p></div>}>
        <WizardCotizacion clientes={clientesSimple} vendedores={vendedoresSimple} />
      </Suspense>
    </>
  );
}
