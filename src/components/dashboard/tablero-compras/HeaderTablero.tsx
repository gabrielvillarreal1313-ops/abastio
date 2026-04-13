/**
 * HeaderTablero — Header del Tablero de compras con saludo, conteos, timestamp y botón generar.
 * Server Component. Los anchor links son HTML nativo. El botón de generar es un componente cliente separado.
 */

import { formatUnidades, formatearMesAnio, tiempoRelativo } from '@/lib/textos/formato';
import { pluralizar } from '@/lib/textos/pluralizar';
import { BotonGenerarPos } from './BotonGenerarPos';

interface Props {
  nombreUsuario: string;
  conteoDesabastoCritico: number;
  conteoProximosDesabasto: number;
  conteoBodegas: number;
  conteoAlertasInventario: number;
  mesActual: string;
  ultimaGeneracion: string | null;
  puedeGenerar: boolean;
}

export function HeaderTablero({
  nombreUsuario, conteoDesabastoCritico, conteoProximosDesabasto,
  conteoBodegas, conteoAlertasInventario, mesActual,
  ultimaGeneracion, puedeGenerar,
}: Props) {
  const hayDesabasto = conteoDesabastoCritico > 0;
  const hayProximos = conteoProximosDesabasto > 0;
  const hayAlertas = conteoAlertasInventario > 0;

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-gray-900">Tablero de compras</h1>
      <p className="text-sm text-gray-500 mt-1">
        Hola, {nombreUsuario}. Esto es lo que necesita tu atención hoy.
      </p>

      {/* Conteos accionables */}
      <p className="text-sm text-gray-600 mt-3">
        {hayDesabasto ? (
          <>
            Tienes{' '}
            <a href="#pos-sugeridas" className="font-medium text-red-700 underline underline-offset-2 decoration-red-300 hover:decoration-red-500">
              {formatUnidades(conteoDesabastoCritico)} {pluralizar(conteoDesabastoCritico, 'SKU', 'SKUs')} en desabasto crítico
            </a>
            {conteoBodegas > 0 && (
              <> distribuido{pluralizar(conteoDesabastoCritico, '', 's')} en {formatUnidades(conteoBodegas)} {pluralizar(conteoBodegas, 'bodega', 'bodegas')}</>
            )}
            {hayProximos && (
              <>
                , <a href="#proximos-desabasto" className="font-medium text-amber-700 underline underline-offset-2 decoration-amber-300 hover:decoration-amber-500">
                  {formatUnidades(conteoProximosDesabasto)} {pluralizar(conteoProximosDesabasto, 'próximo', 'próximos')} a desabasto
                </a>
              </>
            )}
            {hayAlertas && (
              <>
                , y <a href="#alertas-inventario" className="font-medium text-gray-700 underline underline-offset-2 decoration-gray-300 hover:decoration-gray-500">
                  {formatUnidades(conteoAlertasInventario)} {pluralizar(conteoAlertasInventario, 'alerta', 'alertas')} de inventario {pluralizar(conteoAlertasInventario, 'activa', 'activas')}
                </a>
              </>
            )}
            .
          </>
        ) : (
          <>Tu inventario está saludable. No hay items en desabasto crítico ni próximos a entrar.</>
        )}
      </p>

      {/* Indicador de última generación + botón */}
      <div className="flex items-center gap-3 mt-3">
        <p className="text-xs text-gray-400">
          {ultimaGeneracion
            ? <>Última generación de POs: {tiempoRelativo(ultimaGeneracion)}</>
            : 'Nunca se han generado POs sugeridas. Genera la primera para empezar.'
          }
        </p>
        {puedeGenerar && <BotonGenerarPos />}
      </div>

      {mesActual && (
        <p className="text-xs text-gray-400 mt-1">
          Datos del mes: {formatearMesAnio(mesActual)}
        </p>
      )}
    </div>
  );
}
