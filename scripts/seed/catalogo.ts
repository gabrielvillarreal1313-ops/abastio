/**
 * catalogo.ts — Generador de 750 SKUs con nombres realistas en español mexicano.
 *
 * Cada categoría tiene plantillas de nombres, subcategorías, marcas, unidades de medida,
 * y rangos de costos. Los nombres se construyen combinatoriamente para evitar repeticiones.
 * Los precios se calculan a partir del costo para respetar los márgenes objetivo por categoría.
 */

import { faker } from '@faker-js/faker';
import {
  SKUS_POR_CATEGORIA,
  PREFIJO_SKU,
  MARGENES_POR_CATEGORIA,
  MARCAS_POR_CATEGORIA,
  FAKER_SEED,
} from './config';

faker.seed(FAKER_SEED);

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface Producto {
  sku: string;
  nombre: string;
  categoria: string;
  subcategoria: string;
  marca: string | null;
  unidad_medida: string;
  costo_unitario: number;
  precio_lista: number;
  proveedor_principal: string;
  activo: boolean;
}

/** Definición interna de una plantilla de producto por categoría */
interface PlantillaCategoria {
  subcategorias: Array<{
    nombre: string;
    plantillas: string[];
    unidad: string;
    costoMin: number;
    costoMax: number;
    marcas?: string[];
  }>;
  proveedores: string[];
}

// ─── Plantillas de productos por categoría ──────────────────────────────────

const PLANTILLAS: Record<string, PlantillaCategoria> = {
  'Tornillería y sujeción': {
    subcategorias: [
      {
        nombre: 'Tornillos',
        plantillas: [
          'Tornillo hexagonal galvanizado {med}',
          'Tornillo cabeza plana Phillips {med}',
          'Tornillo autorroscante punta broca {med}',
          'Tornillo para madera cabeza oval {med}',
          'Tornillo de máquina cuerda fina {med}',
          'Tornillo Allen acero inoxidable {med}',
          'Tornillo para lámina punta de broca {med}',
          'Tornillo estufa galvanizado {med}',
        ],
        unidad: 'caja',
        costoMin: 15,
        costoMax: 85,
      },
      {
        nombre: 'Tuercas y rondanas',
        plantillas: [
          'Tuerca hexagonal galvanizada {med}',
          'Tuerca de seguridad nylon {med}',
          'Rondana plana galvanizada {med}',
          'Rondana de presión {med}',
          'Tuerca mariposa {med}',
          'Tuerca ciega galvanizada {med}',
        ],
        unidad: 'caja',
        costoMin: 10,
        costoMax: 55,
      },
      {
        nombre: 'Anclas y taquetes',
        plantillas: [
          'Taquete plástico con tornillo {med}',
          'Ancla de expansión acero {med}',
          'Taquete de plomo {med}',
          'Ancla tipo cuña {med}',
          'Taquete Fischer universal {med}',
        ],
        unidad: 'caja',
        costoMin: 20,
        costoMax: 120,
      },
      {
        nombre: 'Clavos',
        plantillas: [
          'Clavo de acero con cabeza {med}',
          'Clavo sin cabeza {med}',
          'Clavo para concreto {med}',
          'Clavo galvanizado para techo {med}',
          'Clavo negro estándar {med}',
        ],
        unidad: 'kilo',
        costoMin: 25,
        costoMax: 65,
      },
      {
        nombre: 'Abrazaderas y grapas',
        plantillas: [
          'Abrazadera de acero inoxidable {med}',
          'Grapa industrial galvanizada {med}',
          'Abrazadera tipo U {med}',
          'Abrazadera de presión {med}',
        ],
        unidad: 'pieza',
        costoMin: 5,
        costoMax: 45,
      },
    ],
    proveedores: ['Tornillos Monterrey S.A.', 'Fijaciones del Bajío', 'Nacional de Tornillos', 'Grupo Tornillero MX'],
  },

  'Herramientas manuales': {
    subcategorias: [
      {
        nombre: 'Llaves',
        plantillas: [
          'Llave combinada {med}',
          'Juego de llaves Allen {med}',
          'Llave Stillson {med}',
          'Llave española {med}',
          'Llave ajustable cromada {med}',
          'Juego de llaves de vaso {med}',
        ],
        unidad: 'pieza',
        costoMin: 35,
        costoMax: 450,
        marcas: ['Truper', 'Pretul', 'Stanley', 'Urrea'],
      },
      {
        nombre: 'Desarmadores',
        plantillas: [
          'Desarmador plano {med}',
          'Desarmador Phillips {med}',
          'Juego de desarmadores de precisión',
          'Desarmador de golpe {med}',
          'Desarmador Torx {med}',
          'Juego de desarmadores {cant} pzas',
        ],
        unidad: 'pieza',
        costoMin: 25,
        costoMax: 280,
        marcas: ['Truper', 'Pretul', 'Stanley', 'Urrea'],
      },
      {
        nombre: 'Pinzas y alicates',
        plantillas: [
          'Pinza de electricista {med}',
          'Pinza de presión {med}',
          'Alicate de corte diagonal {med}',
          'Pinza de punta larga {med}',
          'Pinza pela cables automática',
          'Pinza mecánica {med}',
        ],
        unidad: 'pieza',
        costoMin: 40,
        costoMax: 350,
        marcas: ['Truper', 'Pretul', 'Stanley', 'Urrea'],
      },
      {
        nombre: 'Martillos y mazos',
        plantillas: [
          'Martillo de bola {med}',
          'Martillo de uña {med}',
          'Mazo de hule {med}',
          'Marro de acero {med}',
          'Martillo de carpintero mango fibra',
        ],
        unidad: 'pieza',
        costoMin: 55,
        costoMax: 380,
        marcas: ['Truper', 'Pretul', 'Stanley', 'Urrea'],
      },
      {
        nombre: 'Herramientas de corte',
        plantillas: [
          'Segueta con arco {med}',
          'Cúter profesional hoja retráctil',
          'Tijera para lámina {med}',
          'Navaja multiusos',
          'Sierra de costilla {med}',
          'Cortavarilla {med}',
        ],
        unidad: 'pieza',
        costoMin: 30,
        costoMax: 420,
        marcas: ['Truper', 'Stanley', 'Urrea'],
      },
      {
        nombre: 'Herramientas de medición',
        plantillas: [
          'Flexómetro {med}',
          'Nivel de aluminio {med}',
          'Escuadra de combinación {med}',
          'Plomada de centro',
          'Cinta métrica fibra de vidrio {med}',
        ],
        unidad: 'pieza',
        costoMin: 25,
        costoMax: 280,
        marcas: ['Truper', 'Pretul', 'Stanley'],
      },
    ],
    proveedores: ['Truper S.A. de C.V.', 'Stanley Black & Decker México', 'Herramientas Urrea', 'Pretul (Grupo Truper)'],
  },

  'Herramientas eléctricas': {
    subcategorias: [
      {
        nombre: 'Taladros',
        plantillas: [
          'Taladro percutor {pot}',
          'Taladro inalámbrico {vol}',
          'Rotomartillo SDS Plus {pot}',
          'Taladro de banco {vel}',
          'Atornillador inalámbrico {vol}',
        ],
        unidad: 'pieza',
        costoMin: 450,
        costoMax: 4500,
        marcas: ['Truper', 'DeWalt', 'Makita', 'Black+Decker'],
      },
      {
        nombre: 'Esmeriladoras',
        plantillas: [
          'Esmeriladora angular {med}',
          'Esmeriladora de banco {med}',
          'Pulidora {med}',
          'Miniamoladora {med}',
        ],
        unidad: 'pieza',
        costoMin: 550,
        costoMax: 3800,
        marcas: ['Truper', 'DeWalt', 'Makita', 'Black+Decker'],
      },
      {
        nombre: 'Sierras eléctricas',
        plantillas: [
          'Sierra circular {med}',
          'Sierra caladora {pot}',
          'Sierra de inglete compuesta {med}',
          'Sierra reciprocante {pot}',
          'Sierra de banda portátil',
        ],
        unidad: 'pieza',
        costoMin: 800,
        costoMax: 6500,
        marcas: ['DeWalt', 'Makita', 'Black+Decker'],
      },
      {
        nombre: 'Lijadoras y fresadoras',
        plantillas: [
          'Lijadora orbital {med}',
          'Lijadora de banda {med}',
          'Router/Fresadora {pot}',
          'Cepillo eléctrico {med}',
        ],
        unidad: 'pieza',
        costoMin: 600,
        costoMax: 5000,
        marcas: ['Truper', 'DeWalt', 'Makita'],
      },
      {
        nombre: 'Accesorios eléctricos',
        plantillas: [
          'Juego de brocas HSS {cant} pzas',
          'Disco de corte para metal {med}',
          'Disco de desbaste {med}',
          'Disco diamantado {med}',
          'Juego de puntas atornillador {cant} pzas',
          'Broca para concreto SDS {med}',
          'Hoja de sierra circular {med}',
        ],
        unidad: 'pieza',
        costoMin: 25,
        costoMax: 450,
        marcas: ['Truper', 'DeWalt', 'Makita'],
      },
    ],
    proveedores: ['DeWalt México', 'Makita México S.A.', 'Truper S.A. de C.V.', 'Black+Decker México'],
  },

  'Plomería': {
    subcategorias: [
      {
        nombre: 'Tubería PVC',
        plantillas: [
          'Tubo PVC hidráulico {med}',
          'Tubo PVC sanitario {med}',
          'Tubo CPVC agua caliente {med}',
          'Tubo PVC eléctrico {med}',
        ],
        unidad: 'pieza',
        costoMin: 15,
        costoMax: 180,
      },
      {
        nombre: 'Conexiones PVC',
        plantillas: [
          'Codo PVC 90° {med}',
          'Codo PVC 45° {med}',
          'Tee PVC {med}',
          'Reducción PVC {med}',
          'Coople PVC {med}',
          'Cruz PVC {med}',
          'Tapón PVC {med}',
          'Adaptador macho PVC {med}',
        ],
        unidad: 'pieza',
        costoMin: 3,
        costoMax: 65,
      },
      {
        nombre: 'Tubería cobre',
        plantillas: [
          'Tubo cobre tipo M {med}',
          'Tubo cobre tipo L {med}',
          'Codo cobre 90° {med}',
          'Tee cobre {med}',
          'Coople cobre {med}',
        ],
        unidad: 'pieza',
        costoMin: 35,
        costoMax: 480,
      },
      {
        nombre: 'Válvulas y llaves',
        plantillas: [
          'Válvula de esfera {med}',
          'Llave de paso {med}',
          'Válvula check {med}',
          'Válvula de compuerta {med}',
          'Llave de nariz {med}',
          'Válvula reductora de presión {med}',
        ],
        unidad: 'pieza',
        costoMin: 25,
        costoMax: 380,
      },
      {
        nombre: 'Accesorios de plomería',
        plantillas: [
          'Cinta teflón {med}',
          'Pegamento PVC {med}',
          'Soldadura para cobre {med}',
          'Empaque de hule {med}',
          'Sellador de roscas {med}',
          'Fluxómetro {med}',
          'Trampa para lavabo {med}',
        ],
        unidad: 'pieza',
        costoMin: 8,
        costoMax: 250,
      },
    ],
    proveedores: ['Tubería Nacional (Tuna)', 'Amanco Wavin', 'Rotoplas Conexiones', 'Nacobre S.A.', 'IUSA Plomería'],
  },

  'Electricidad': {
    subcategorias: [
      {
        nombre: 'Cable y alambre',
        plantillas: [
          'Cable THW calibre {cal}',
          'Cable uso rudo {cal}',
          'Cable coaxial RG-6',
          'Cable UTP Cat 6',
          'Alambre galvanizado calibre {cal}',
          'Cable thhw-ls calibre {cal}',
        ],
        unidad: 'metro',
        costoMin: 5,
        costoMax: 65,
      },
      {
        nombre: 'Contactos y apagadores',
        plantillas: [
          'Apagador sencillo línea económica',
          'Apagador de tres vías',
          'Contacto dúplex polarizado',
          'Contacto con tierra aislada',
          'Placa para apagador {col}',
          'Dimmer para iluminación',
          'Contacto GFCI',
        ],
        unidad: 'pieza',
        costoMin: 8,
        costoMax: 180,
      },
      {
        nombre: 'Centros de carga',
        plantillas: [
          'Centro de carga {circ} circuitos',
          'Interruptor termomagnético {amp}A',
          'Pastilla de seguridad {amp}A',
          'Barra de tierra',
          'Base para medidor CFE',
          'Gabinete eléctrico {med}',
        ],
        unidad: 'pieza',
        costoMin: 35,
        costoMax: 850,
      },
      {
        nombre: 'Iluminación',
        plantillas: [
          'Foco LED {wat}W luz blanca',
          'Foco LED {wat}W luz cálida',
          'Tubo LED T8 {med}',
          'Reflector LED {wat}W',
          'Lámpara de emergencia LED',
          'Fotocelda para exterior',
          'Tira LED {med}',
        ],
        unidad: 'pieza',
        costoMin: 12,
        costoMax: 350,
      },
      {
        nombre: 'Canalización eléctrica',
        plantillas: [
          'Tubo conduit galvanizado {med}',
          'Canaleta plástica {med}',
          'Tubo corrugado flexible {med}',
          'Conector para tubo conduit {med}',
          'Caja chalupa galvanizada',
          'Caja cuadrada galvanizada',
        ],
        unidad: 'pieza',
        costoMin: 5,
        costoMax: 120,
      },
    ],
    proveedores: ['Condumex (Grupo Carso)', 'IUSA S.A. de C.V.', 'Volteck (Grupo Truper)', 'Leviton México', 'Philips Iluminación'],
  },

  'Pintura y accesorios': {
    subcategorias: [
      {
        nombre: 'Pintura vinílica',
        plantillas: [
          'Pintura vinílica {col} {tam}',
          'Pintura vinílica lavable {col} {tam}',
          'Pintura vinílica premium {col} {tam}',
          'Pintura vinílica antibacterial {col} {tam}',
        ],
        unidad: 'litro',
        costoMin: 35,
        costoMax: 250,
        marcas: ['Comex', 'Sherwin Williams', 'Berel'],
      },
      {
        nombre: 'Pintura esmalte',
        plantillas: [
          'Esmalte alquidálico {col} {tam}',
          'Esmalte anticorrosivo {col} {tam}',
          'Esmalte secado rápido {col} {tam}',
          'Primer anticorrosivo {col}',
        ],
        unidad: 'litro',
        costoMin: 55,
        costoMax: 380,
        marcas: ['Comex', 'Sherwin Williams', 'Berel'],
      },
      {
        nombre: 'Impermeabilizantes',
        plantillas: [
          'Impermeabilizante acrílico {col} {tam}',
          'Impermeabilizante fibratado {col} {tam}',
          'Sellador para impermeabilizante {tam}',
          'Impermeabilizante prefabricado rollo',
        ],
        unidad: 'litro',
        costoMin: 80,
        costoMax: 550,
        marcas: ['Comex', 'Sherwin Williams', 'Berel'],
      },
      {
        nombre: 'Accesorios de pintura',
        plantillas: [
          'Rodillo para pintar {med}',
          'Brocha {med}',
          'Charola para pintura',
          'Extensión telescópica para rodillo {med}',
          'Espátula para masillar {med}',
          'Cinta masking tape {med}',
          'Lija para pared grano {grano}',
          'Masilla para resanar {tam}',
        ],
        unidad: 'pieza',
        costoMin: 8,
        costoMax: 120,
        marcas: ['Comex', 'Sherwin Williams', 'Berel'],
      },
    ],
    proveedores: ['Comex (PPG Industries)', 'Sherwin Williams México', 'Berel S.A. de C.V.', 'Pinturas Osel'],
  },

  'Materiales de construcción': {
    subcategorias: [
      {
        nombre: 'Cemento y mortero',
        plantillas: [
          'Cemento gris CPC 30R 50kg',
          'Cemento blanco 20kg',
          'Mortero premezclado 50kg',
          'Pegazulejo gris 20kg',
          'Pegazulejo blanco 20kg',
          'Yeso para construcción 40kg',
          'Cal hidratada 25kg',
        ],
        unidad: 'saco',
        costoMin: 55,
        costoMax: 220,
      },
      {
        nombre: 'Varilla y acero',
        plantillas: [
          'Varilla corrugada {med}',
          'Alambre recocido calibre 18',
          'Malla electrosoldada {med}',
          'Alambrón {med}',
          'Castillo armado {med}',
          'Perfil PTR {med}',
        ],
        unidad: 'pieza',
        costoMin: 25,
        costoMax: 650,
      },
      {
        nombre: 'Blocks y tabiques',
        plantillas: [
          'Block de concreto {med}',
          'Tabique rojo recocido',
          'Tabicón de concreto',
          'Adocreto {med}',
          'Fachaleta de barro {col}',
        ],
        unidad: 'pieza',
        costoMin: 3,
        costoMax: 18,
      },
      {
        nombre: 'Agregados y mezclas',
        plantillas: [
          'Grava {med}',
          'Arena de río',
          'Tepetate cribado',
          'Piedra braza',
          'Concreto premezclado {med}',
        ],
        unidad: 'kilo',
        costoMin: 0.5,
        costoMax: 5,
      },
    ],
    proveedores: ['CEMEX S.A.B.', 'Holcim México', 'Cruz Azul', 'Aceros Turia', 'Deacero S.A.'],
  },

  'Jardinería': {
    subcategorias: [
      {
        nombre: 'Herramientas de jardín',
        plantillas: [
          'Pala de punta cuadrada',
          'Pala de punta redonda',
          'Rastrillo metálico {med}',
          'Azadón forjado',
          'Tijera de podar {med}',
          'Machete {med}',
          'Pico de acero',
          'Carretilla de construcción {med}',
        ],
        unidad: 'pieza',
        costoMin: 45,
        costoMax: 850,
      },
      {
        nombre: 'Riego',
        plantillas: [
          'Manguera para jardín {med}',
          'Aspersor giratorio',
          'Pistola de riego ajustable',
          'Conector rápido para manguera',
          'Timer de riego programable',
          'Manguera de goteo {med}',
        ],
        unidad: 'pieza',
        costoMin: 15,
        costoMax: 350,
      },
      {
        nombre: 'Macetas y jardineras',
        plantillas: [
          'Maceta de plástico {med}',
          'Maceta de barro {med}',
          'Jardinera rectangular {med}',
          'Tierra preparada para macetas {tam}',
          'Sustrato orgánico {tam}',
        ],
        unidad: 'pieza',
        costoMin: 12,
        costoMax: 180,
      },
    ],
    proveedores: ['Truper S.A. de C.V.', 'Surtek (Grupo Urrea)', 'Riego y Jardín MX', 'Pavaplás México'],
  },

  'Seguridad industrial': {
    subcategorias: [
      {
        nombre: 'Protección personal',
        plantillas: [
          'Casco de seguridad {col}',
          'Lentes de seguridad transparentes',
          'Lentes de seguridad oscuros',
          'Careta para soldar electrónica',
          'Tapones auditivos desechables par',
          'Orejeras de seguridad',
          'Mascarilla desechable N95',
          'Respirador media cara con filtros',
        ],
        unidad: 'pieza',
        costoMin: 8,
        costoMax: 450,
      },
      {
        nombre: 'Guantes',
        plantillas: [
          'Guantes de carnaza par',
          'Guantes de nitrilo desechables caja',
          'Guantes anticorte nivel 5 par',
          'Guantes de neopreno par',
          'Guantes para soldador par',
          'Guantes de látex caja',
        ],
        unidad: 'pieza',
        costoMin: 12,
        costoMax: 280,
      },
      {
        nombre: 'Calzado y arneses',
        plantillas: [
          'Bota de seguridad dieléctrica',
          'Bota de hule industrial',
          'Zapato de seguridad casquillo',
          'Arnés de seguridad 3 argollas',
          'Línea de vida 1.8m',
          'Chaleco de seguridad reflejante {col}',
        ],
        unidad: 'pieza',
        costoMin: 45,
        costoMax: 1200,
      },
    ],
    proveedores: ['3M México', 'Honeywell Safety', 'Truper Seguridad', 'Productos de Seguridad Industrial MX'],
  },
};

// ─── Variables de sustitución para nombres más variados ─────────────────────

const MEDIDAS_TORNILLO = ['1/4" x 1"', '1/4" x 2"', '5/16" x 1-1/2"', '5/16" x 2"', '3/8" x 1"', '3/8" x 2"', '3/8" x 3"', '1/2" x 2"', '1/2" x 3"', '5/8" x 3"', 'M4 x 20mm', 'M5 x 30mm', 'M6 x 25mm', 'M8 x 40mm', 'M10 x 50mm'];
const MEDIDAS_TUBO = ['1/2"', '3/4"', '1"', '1-1/2"', '2"', '3"', '4"', '6"'];
const MEDIDAS_CABLE_CAL = ['8', '10', '12', '14', '16', '18', '2x12', '2x14', '3x12', '3x14'];
const MEDIDAS_GENERICAS = ['chico', 'mediano', 'grande', '6"', '8"', '10"', '12"', '14"', '18"', '24"'];
const MEDIDAS_VARILLA = ['3/8" (No. 3)', '1/2" (No. 4)', '5/8" (No. 5)', '3/4" (No. 6)', '1" (No. 8)'];
const MEDIDAS_BLOCK = ['10x20x40cm', '12x20x40cm', '15x20x40cm', '20x20x40cm'];
const POTENCIAS = ['500W', '650W', '750W', '850W', '1050W', '1200W', '1500W'];
const VOLTAJES = ['12V', '18V', '20V'];
const VELOCIDADES = ['5 velocidades', '12 velocidades', '16 velocidades'];
const COLORES = ['blanco', 'beige', 'gris', 'azul', 'verde', 'rojo', 'negro', 'terracota', 'amarillo'];
const COLORES_PINTURA = ['blanco', 'hueso', 'beige', 'gris claro', 'gris perla', 'arena', 'verde menta', 'azul cielo', 'rosa pálido', 'durazno', 'rojo colonial', 'azul rey'];
const TAMAÑOS_PINTURA = ['1L', '4L', '19L'];
const CANTIDADES = ['6', '8', '10', '12', '15', '20', '24', '30'];
const WATTAJES = ['7', '9', '12', '15', '18', '20', '50', '100', '150', '200'];
const AMPERAJES = ['15', '20', '30', '40', '50', '60', '100'];
const CIRCUITOS = ['2', '4', '6', '8', '12', '16', '20'];
const GRANOS = ['80', '100', '120', '150', '180', '220'];
const TAMAÑOS_MASILLA = ['250g', '500g', '1kg', '4kg'];
const MEDIDAS_MANGUERA = ['1/2" x 15m', '1/2" x 30m', '3/4" x 15m', '3/4" x 30m'];
const MEDIDAS_MALLA = ['6x6-10/10', '6x6-8/8', '6x6-6/6'];
const MEDIDAS_PTR = ['1" x 1"', '1-1/2" x 1-1/2"', '2" x 2"', '3" x 3"'];

/**
 * Reemplaza placeholders en una plantilla con valores aleatorios del set apropiado.
 * Los placeholders son: {med}, {cal}, {pot}, {vol}, {vel}, {col}, {tam}, {cant}, {wat}, {amp}, {circ}, {grano}
 */
function sustituirPlaceholders(plantilla: string): string {
  return plantilla
    .replace('{med}', faker.helpers.arrayElement(MEDIDAS_GENERICAS))
    .replace('{cal}', faker.helpers.arrayElement(MEDIDAS_CABLE_CAL))
    .replace('{pot}', faker.helpers.arrayElement(POTENCIAS))
    .replace('{vol}', faker.helpers.arrayElement(VOLTAJES))
    .replace('{vel}', faker.helpers.arrayElement(VELOCIDADES))
    .replace('{col}', faker.helpers.arrayElement(COLORES))
    .replace('{tam}', faker.helpers.arrayElement(TAMAÑOS_PINTURA))
    .replace('{cant}', faker.helpers.arrayElement(CANTIDADES))
    .replace('{wat}', faker.helpers.arrayElement(WATTAJES))
    .replace('{amp}', faker.helpers.arrayElement(AMPERAJES))
    .replace('{circ}', faker.helpers.arrayElement(CIRCUITOS))
    .replace('{grano}', faker.helpers.arrayElement(GRANOS));
}

/**
 * Genera un nombre de producto sustituyendo placeholders con medidas
 * específicas según la subcategoría para mayor realismo.
 */
function generarNombreProducto(plantilla: string, subcategoria: string): string {
  let nombre = plantilla;

  // Sustituciones específicas por tipo de producto
  if (subcategoria.includes('Tornill') || subcategoria.includes('Tuerca') || subcategoria.includes('Clav') || subcategoria.includes('Ancla')) {
    nombre = nombre.replace('{med}', faker.helpers.arrayElement(MEDIDAS_TORNILLO));
  } else if (subcategoria.includes('Tubería') || subcategoria.includes('Conexion') || subcategoria.includes('Válvula') || subcategoria.includes('Canaliz')) {
    nombre = nombre.replace('{med}', faker.helpers.arrayElement(MEDIDAS_TUBO));
  } else if (subcategoria.includes('Varilla') || subcategoria.includes('acero')) {
    nombre = nombre.replace('{med}', faker.helpers.arrayElement(MEDIDAS_VARILLA));
  } else if (subcategoria.includes('Block')) {
    nombre = nombre.replace('{med}', faker.helpers.arrayElement(MEDIDAS_BLOCK));
  } else if (subcategoria.includes('Pintura') || subcategoria.includes('Esmalte') || subcategoria.includes('Impermeab')) {
    nombre = nombre.replace('{col}', faker.helpers.arrayElement(COLORES_PINTURA));
    nombre = nombre.replace('{tam}', faker.helpers.arrayElement(TAMAÑOS_PINTURA));
  } else if (subcategoria.includes('Riego') || subcategoria.includes('Manguera')) {
    nombre = nombre.replace('{med}', faker.helpers.arrayElement(MEDIDAS_MANGUERA));
  }

  // Sustituciones genéricas restantes
  nombre = sustituirPlaceholders(nombre);

  return nombre;
}

// ─── Generador principal ────────────────────────────────────────────────────

/**
 * Genera el catálogo completo de 750 productos.
 * Distribuye los SKUs proporcionalmente entre las subcategorías de cada categoría.
 */
export function generarCatalogo(): Producto[] {
  const productos: Producto[] = [];
  const nombresUsados = new Set<string>();

  for (const [categoria, cantidadTotal] of Object.entries(SKUS_POR_CATEGORIA)) {
    const prefijo = PREFIJO_SKU[categoria];
    const plantilla = PLANTILLAS[categoria];
    const margenes = MARGENES_POR_CATEGORIA[categoria];
    const marcasCategoria = MARCAS_POR_CATEGORIA[categoria] || null;

    // Distribuir SKUs proporcionalmente entre subcategorías
    const numSubcategorias = plantilla.subcategorias.length;
    const skusPorSubcat = Math.floor(cantidadTotal / numSubcategorias);
    let sobrante = cantidadTotal - skusPorSubcat * numSubcategorias;

    let contadorSku = 1;

    for (const subcat of plantilla.subcategorias) {
      // Algunas subcategorías reciben un SKU extra para cubrir el sobrante
      const cantidadSubcat = skusPorSubcat + (sobrante > 0 ? 1 : 0);
      if (sobrante > 0) sobrante--;

      for (let j = 0; j < cantidadSubcat; j++) {
        // Elegir plantilla y generar nombre único
        const plantillaNombre = faker.helpers.arrayElement(subcat.plantillas);
        let nombre: string;
        let intentos = 0;

        do {
          nombre = generarNombreProducto(plantillaNombre, subcat.nombre);
          intentos++;
          // Si agotamos intentos con esta plantilla, añadir un sufijo numérico
          if (intentos > 20) {
            nombre = `${nombre} #${contadorSku}`;
            break;
          }
        } while (nombresUsados.has(nombre));

        nombresUsados.add(nombre);

        // Generar costo y calcular precio basado en margen objetivo
        const costo = parseFloat(
          faker.number.float({ min: subcat.costoMin, max: subcat.costoMax, fractionDigits: 2 }).toFixed(2)
        );
        const margenObjetivo = faker.number.float({ min: margenes.min, max: margenes.max, fractionDigits: 4 });
        // precio = costo / (1 - margen) → asegura que margen = (precio - costo) / precio
        const precio = parseFloat((costo / (1 - margenObjetivo)).toFixed(2));

        // Seleccionar marca (subcategoría puede tener marcas específicas, o usamos las de categoría)
        const marcasDisponibles = subcat.marcas || marcasCategoria;
        const marca = marcasDisponibles ? faker.helpers.arrayElement(marcasDisponibles) : null;

        const sku = `${prefijo}-${String(contadorSku).padStart(4, '0')}`;

        productos.push({
          sku,
          nombre,
          categoria,
          subcategoria: subcat.nombre,
          marca,
          unidad_medida: subcat.unidad,
          costo_unitario: costo,
          precio_lista: precio,
          proveedor_principal: faker.helpers.arrayElement(plantilla.proveedores),
          activo: true,
        });

        contadorSku++;
      }
    }
  }

  return productos;
}
