/**
 * Redirect legacy — redirige a la nueva ubicación en Mi actividad, tab Historial.
 * Se mantiene el archivo para que la ruta vieja no dé 404.
 */

import { redirect } from 'next/navigation';

export default function MiHistorialPage() {
  redirect('/dashboard/compras/mi-actividad?tab=historial');
}
