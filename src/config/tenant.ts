// src/config/tenant.ts
//
// Configuración del tenant (empresa cliente) activo en la sesión.
//
// En V0 el tenant está hardcoded porque la app es single-tenant.
// Cuando se implemente multi-tenant en V1 con RLS (ver BACKLOG), esta función
// se reemplazará por una query a la tabla `empresas` filtrando por la sesión
// del usuario. Como el resto de la app consume solo `getTenantActivo()`,
// ese refactor no tocará componentes ni UI.

export interface Tenant {
  id: string;
  nombre: string;
  ubicacion: string;
  nombreLegal: string;
}

const TENANT_ACTIVO: Tenant = {
  id: 'ferretera-bajio',
  nombre: 'Ferretera del Bajío',
  ubicacion: 'León, Guanajuato',
  nombreLegal: 'Ferretera del Bajío, S.A. de C.V.',
};

export function getTenantActivo(): Tenant {
  return TENANT_ACTIVO;
}
