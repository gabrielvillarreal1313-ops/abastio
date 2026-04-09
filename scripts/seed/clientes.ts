/**
 * clientes.ts — Generador de 110 clientes con razones sociales mexicanas realistas.
 *
 * La distribución de tipos, ciudades, listas de precios, límites de crédito
 * y días de crédito se controla desde config.ts.
 */

import { faker } from '@faker-js/faker';
import {
  TOTAL_CLIENTES,
  DISTRIBUCION_TIPO_CLIENTE,
  CIUDADES,
  LISTA_PRECIOS_POR_TIPO,
  LIMITE_CREDITO_POR_TIPO,
  DIAS_CREDITO_POR_TIPO,
  FAKER_SEED,
} from './config';

faker.seed(FAKER_SEED + 100); // Offset para no colisionar con catálogo

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface Cliente {
  razon_social: string;
  rfc: string;
  tipo_cliente: string;
  ciudad: string;
  estado: string;
  lista_precios: string;
  limite_credito: number;
  dias_credito: number;
}

// ─── Plantillas de razones sociales por tipo de cliente ─────────────────────

const APELLIDOS_COMUNES = [
  'García', 'Hernández', 'López', 'Martínez', 'González', 'Rodríguez', 'Pérez',
  'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Morales',
  'Jiménez', 'Reyes', 'Ruiz', 'Ortiz', 'Castillo', 'Gutiérrez', 'Vargas', 'Mendoza',
  'Chávez', 'Romero', 'Herrera', 'Medina', 'Aguilar', 'Vega', 'Guerrero', 'Cruz',
  'Salazar', 'Cervantes', 'Delgado', 'Navarro', 'Estrada', 'Campos', 'Ramos',
];

const NOMBRES_PROPIOS = [
  'José', 'María', 'Juan', 'Francisco', 'Pedro', 'Carlos', 'Luis',
  'Miguel', 'Jorge', 'Alejandro', 'Roberto', 'Eduardo', 'Fernando', 'Rafael',
  'Manuel', 'Arturo', 'Ángel', 'Raúl', 'Enrique', 'Sergio',
];

/**
 * Genera razones sociales realistas según el tipo de cliente.
 * Cada tipo tiene patrones comunes del mercado mexicano.
 */
const GENERADORES_RAZON_SOCIAL: Record<string, () => string> = {
  ferreteria_minorista: () => {
    const patrones = [
      () => `Ferretería ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
      () => `Materiales ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
      () => `Ferretería y Materiales "${faker.helpers.arrayElement(NOMBRES_PROPIOS)}"`,
      () => `Tlapalería y Ferretería ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
      () => `Ferretería La ${faker.helpers.arrayElement(['Paloma', 'Herradura', 'Llave', 'Tuerca', 'Esquina', 'Central', 'Económica'])}`,
      () => `Materiales para Construcción ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
      () => `Ferretería El ${faker.helpers.arrayElement(['Tornillo', 'Clavo', 'Martillo', 'Candado', 'Constructor', 'Maestro'])}`,
    ];
    return faker.helpers.arrayElement(patrones)();
  },

  constructor: () => {
    const patrones = [
      () => `Constructora ${faker.helpers.arrayElement(APELLIDOS_COMUNES)} y Asociados, S.A. de C.V.`,
      () => `Construcciones ${faker.helpers.arrayElement(['del Bajío', 'del Centro', 'del Norte', 'Regionales', 'Modernas', 'Integrales'])}, S.A. de C.V.`,
      () => `Grupo Constructor ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
      () => `${faker.helpers.arrayElement(APELLIDOS_COMUNES)} Constructores, S. de R.L.`,
      () => `Edificaciones ${faker.helpers.arrayElement(['Premium', 'Sustentables', 'del Centro', 'Metropolitanas'])}, S.A. de C.V.`,
    ];
    return faker.helpers.arrayElement(patrones)();
  },

  plomero: () => {
    const patrones = [
      () => `Plomería y Servicios ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
      () => `${faker.helpers.arrayElement(NOMBRES_PROPIOS)} ${faker.helpers.arrayElement(APELLIDOS_COMUNES)} — Plomero`,
      () => `Instalaciones Hidráulicas ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
      () => `Servicios de Plomería ${faker.helpers.arrayElement(['Profesional', 'del Bajío', 'Express', 'Integral'])}`,
    ];
    return faker.helpers.arrayElement(patrones)();
  },

  electricista: () => {
    const patrones = [
      () => `Instalaciones Eléctricas ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
      () => `${faker.helpers.arrayElement(NOMBRES_PROPIOS)} ${faker.helpers.arrayElement(APELLIDOS_COMUNES)} — Electricista`,
      () => `Electro Servicios ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
      () => `Mantenimiento Eléctrico ${faker.helpers.arrayElement(['Industrial', 'Profesional', 'del Bajío', 'Integral'])}`,
    ];
    return faker.helpers.arrayElement(patrones)();
  },

  carpintero: () => {
    const patrones = [
      () => `Carpintería ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
      () => `Muebles y Carpintería "${faker.helpers.arrayElement(NOMBRES_PROPIOS)}"`,
      () => `Taller de Carpintería ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
      () => `${faker.helpers.arrayElement(NOMBRES_PROPIOS)} ${faker.helpers.arrayElement(APELLIDOS_COMUNES)} — Carpintero`,
    ];
    return faker.helpers.arrayElement(patrones)();
  },

  industrial: () => {
    const patrones = [
      () => `Industrias ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}, S.A. de C.V.`,
      () => `Manufactura ${faker.helpers.arrayElement(['del Bajío', 'Central', 'del Norte', 'Avanzada'])}, S.A. de C.V.`,
      () => `Grupo Industrial ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
      () => `${faker.helpers.arrayElement(['Metal', 'Auto', 'Agro', 'Plasti'])}${faker.helpers.arrayElement(['mex', 'parts', 'tec', 'ind'])}, S.A. de C.V.`,
    ];
    return faker.helpers.arrayElement(patrones)();
  },

  otro: () => {
    const patrones = [
      () => `${faker.helpers.arrayElement(NOMBRES_PROPIOS)} ${faker.helpers.arrayElement(APELLIDOS_COMUNES)} ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
      () => `Servicios Generales ${faker.helpers.arrayElement(APELLIDOS_COMUNES)}`,
    ];
    return faker.helpers.arrayElement(patrones)();
  },
};

// ─── Generador de RFC mexicano ──────────────────────────────────────────────

/**
 * Genera un RFC con formato válido para persona moral (3 letras + 6 dígitos + 3 alfanuméricos)
 * o persona física (4 letras + 6 dígitos + 3 alfanuméricos) según el tipo.
 *
 * Nota: No es un RFC válido ante el SAT, pero tiene formato correcto.
 */
function generarRFC(esMoral: boolean): string {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const alfanum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const prefijo = esMoral
    ? Array.from({ length: 3 }, () => faker.helpers.arrayElement([...letras])).join('')
    : Array.from({ length: 4 }, () => faker.helpers.arrayElement([...letras])).join('');

  // Fecha de constitución/nacimiento ficticia (6 dígitos: AAMMDD)
  const año = faker.number.int({ min: 80, max: 99 });
  const mes = faker.number.int({ min: 1, max: 12 });
  const dia = faker.number.int({ min: 1, max: 28 });
  const fecha = `${String(año).padStart(2, '0')}${String(mes).padStart(2, '0')}${String(dia).padStart(2, '0')}`;

  // Homoclave (3 caracteres alfanuméricos)
  const homoclave = Array.from({ length: 3 }, () => faker.helpers.arrayElement([...alfanum])).join('');

  return `${prefijo}${fecha}${homoclave}`;
}

// ─── Selección de ciudad ponderada ──────────────────────────────────────────

function seleccionarCiudad(): { ciudad: string; estado: string } {
  const random = faker.number.float({ min: 0, max: 1 });
  let acumulado = 0;
  for (const c of CIUDADES) {
    acumulado += c.peso;
    if (random <= acumulado) {
      return { ciudad: c.ciudad, estado: c.estado };
    }
  }
  // Fallback al último
  return { ciudad: CIUDADES[CIUDADES.length - 1].ciudad, estado: CIUDADES[CIUDADES.length - 1].estado };
}

// ─── Generador principal ────────────────────────────────────────────────────

/**
 * Genera los 110 clientes con distribución exacta de tipos.
 * Retorna el array para inserción directa en Supabase.
 */
export function generarClientes(): Cliente[] {
  const clientes: Cliente[] = [];
  const razonesUsadas = new Set<string>();

  for (const [tipo, cantidad] of Object.entries(DISTRIBUCION_TIPO_CLIENTE)) {
    const esMoral = ['constructor', 'industrial', 'ferreteria_minorista'].includes(tipo);

    for (let i = 0; i < cantidad; i++) {
      // Generar razón social única
      let razonSocial: string;
      let intentos = 0;
      do {
        razonSocial = GENERADORES_RAZON_SOCIAL[tipo]();
        intentos++;
        if (intentos > 50) {
          razonSocial = `${razonSocial} (${i + 1})`;
          break;
        }
      } while (razonesUsadas.has(razonSocial));
      razonesUsadas.add(razonSocial);

      const { ciudad, estado } = seleccionarCiudad();
      const listaPrecio = faker.helpers.arrayElement(LISTA_PRECIOS_POR_TIPO[tipo]);
      const limiteCredito = faker.number.int(LIMITE_CREDITO_POR_TIPO[tipo]);
      const diasCredito = faker.helpers.arrayElement(DIAS_CREDITO_POR_TIPO[tipo]);

      clientes.push({
        razon_social: razonSocial,
        rfc: generarRFC(esMoral),
        tipo_cliente: tipo,
        ciudad,
        estado,
        lista_precios: listaPrecio,
        limite_credito: limiteCredito,
        dias_credito: diasCredito,
      });
    }
  }

  return clientes;
}
