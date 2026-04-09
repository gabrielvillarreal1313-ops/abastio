/**
 * db.ts — Cliente Supabase para el seed y helpers de inserción por batches.
 *
 * Usa la service role key para bypassear RLS.
 * Incluye:
 * - Manejo de errores por batch con retry idempotente
 * - Verificación pre-inserción para tablas pequeñas
 * - DELETE en orden correcto de FK para limpieza
 */

// Cargar .env.local ANTES de cualquier acceso a process.env.
// Se importa aquí (no en index.ts) porque los imports estáticos de ESM
// se resuelven antes de ejecutar código del módulo que los importa.
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as readline from 'readline';

// ─── Cliente Supabase con service role key ──────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '\n❌ Faltan variables de entorno requeridas:\n' +
    '   - NEXT_PUBLIC_SUPABASE_URL\n' +
    '   - SUPABASE_SERVICE_ROLE_KEY\n' +
    '\n   Asegúrate de que estén en .env.local\n'
  );
  process.exit(1);
}

export const supabase: SupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/** URL del proyecto para mostrar al usuario antes de confirmar */
export const projectUrl = supabaseUrl;

// ─── Helper para leer input del usuario en consola ──────────────────────────

function preguntarUsuario(pregunta: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(pregunta, (respuesta) => {
      rl.close();
      resolve(respuesta.trim());
    });
  });
}

// ─── Resultado acumulado de inserción por batches ───────────────────────────

export interface BatchResult {
  tabla: string;
  totalFilas: number;
  batchesExitosos: number;
  batchesFallidos: number;
  filasInsertadas: number;
  errores: Array<{
    batchNumero: number;
    rangoFilas: string;
    error: string;
  }>;
}

// ─── Verificación pre-inserción para tablas pequeñas ────────────────────────

/**
 * Verifica que una tabla esté vacía antes de insertar.
 * Si tiene filas, aborta con error claro.
 * Usar para bodegas, clientes, vendedores — tablas donde insertar
 * dos veces causa duplicados silenciosos.
 */
export async function verificarTablaVacia(tabla: string): Promise<void> {
  const { count, error } = await supabase
    .from(tabla)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`No se pudo verificar tabla ${tabla}: ${error.message}`);
  }

  if (count && count > 0) {
    throw new Error(
      `⛔ La tabla "${tabla}" ya tiene ${count} filas. ` +
      `Esto indica datos residuales de una ejecución anterior. ` +
      `Borra todos los datos (TRUNCATE) antes de ejecutar el seed.`
    );
  }
}

// ─── Inserción directa (sin batches) para tablas pequeñas ───────────────────

/**
 * Inserta datos en una tabla pequeña (bodegas, clientes, vendedores).
 * NO usa retry — si falla, aborta inmediatamente.
 * Previamente se debe llamar verificarTablaVacia().
 */
export async function insertDirecto<T extends Record<string, unknown>>(
  tabla: string,
  datos: T[]
): Promise<{ data: any[]; }> {
  const { data, error } = await supabase
    .from(tabla)
    .insert(datos as any[])
    .select();

  if (error) {
    throw new Error(`Error insertando en ${tabla}: ${error.message}`);
  }

  console.log(`   ✓ ${data.length} filas insertadas en [${tabla}]`);
  return { data };
}

// ─── Inserción por batches con retry idempotente ────────────────────────────

/**
 * Inserta datos en una tabla grande (productos, transacciones, inventario)
 * en lotes secuenciales con retry idempotente.
 *
 * Antes de reintentar un batch fallido por error de red, verifica si las
 * filas ya existen en la DB para evitar duplicados.
 *
 * @param tabla - Nombre de la tabla en Supabase
 * @param datos - Array completo de filas a insertar
 * @param tamañoBatch - Cantidad de filas por batch (default: 1000)
 * @param campoUnico - Campo para verificar existencia antes de retry (ej: 'sku', 'folio')
 * @returns Resumen de la operación
 */
export async function insertBatch<T extends Record<string, unknown>>(
  tabla: string,
  datos: T[],
  tamañoBatch: number = 1000,
  campoUnico?: string
): Promise<BatchResult> {
  const totalBatches = Math.ceil(datos.length / tamañoBatch);
  const resultado: BatchResult = {
    tabla,
    totalFilas: datos.length,
    batchesExitosos: 0,
    batchesFallidos: 0,
    filasInsertadas: 0,
    errores: [],
  };

  console.log(`\n📦 Insertando ${datos.length.toLocaleString()} filas en [${tabla}] (${totalBatches} batches de ${tamañoBatch})...`);

  for (let i = 0; i < totalBatches; i++) {
    const inicio = i * tamañoBatch;
    const fin = Math.min(inicio + tamañoBatch, datos.length);
    const batch = datos.slice(inicio, fin);
    const batchNumero = i + 1;

    // Progreso visual cada 10 batches o en el último
    if (batchNumero % 10 === 0 || batchNumero === totalBatches || batchNumero === 1) {
      process.stdout.write(`   Batch ${batchNumero}/${totalBatches} (filas ${inicio + 1}-${fin})...\r`);
    }

    const MAX_REINTENTOS = 3;

    for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
      const { error } = await supabase.from(tabla).insert(batch as any[]);

      if (!error) {
        resultado.batchesExitosos++;
        resultado.filasInsertadas += batch.length;
        break;
      }

      const esErrorRed = error.message.includes('fetch failed') ||
        error.message.includes('socket') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('timeout');

      if (esErrorRed && intento < MAX_REINTENTOS) {
        const espera = 2000 * intento;
        console.warn(`\n   ⚠️  Error de red en batch ${batchNumero} (intento ${intento}/${MAX_REINTENTOS})...`);

        // ─── Verificación idempotente antes de reintentar ────────
        // Checa si las filas del batch ya llegaron a la DB
        if (campoUnico) {
          const valoresMuestra = batch.slice(0, 5).map((f) => f[campoUnico] as string);
          const { count } = await supabase
            .from(tabla)
            .select('*', { count: 'exact', head: true })
            .in(campoUnico, valoresMuestra);

          if (count && count >= valoresMuestra.length) {
            // Las filas ya existen — el insert original sí llegó, solo se perdió la respuesta
            console.log(`   ✓ Batch ${batchNumero} ya existe en DB (respuesta perdida). Saltando.`);
            resultado.batchesExitosos++;
            resultado.filasInsertadas += batch.length;
            break;
          }
        }

        console.log(`   Reintentando en ${espera / 1000}s...`);
        await new Promise((r) => setTimeout(r, espera));
        continue;
      }

      // Error no recuperable o agotamos reintentos
      resultado.batchesFallidos++;
      const rangoFilas = `${inicio + 1}-${fin}`;
      resultado.errores.push({
        batchNumero,
        rangoFilas,
        error: error.message,
      });

      console.error(
        `\n\n❌ ERROR en batch ${batchNumero}/${totalBatches} (filas ${rangoFilas}):\n` +
        `   Tabla: ${tabla}\n` +
        `   Error: ${error.message}\n` +
        `   Código: ${error.code || 'N/A'}\n` +
        `   Detalles: ${error.details || 'N/A'}\n`
      );

      // Si stdin no es interactivo (pipe mode), auto-continuar
      if (!process.stdin.isTTY) {
        console.log('   (Modo no-interactivo: continuando automáticamente)\n');
        break;
      }

      const respuesta = await preguntarUsuario(
        '   ¿Deseas continuar con el siguiente batch? (s/n): '
      );

      if (respuesta.toLowerCase() !== 's') {
        console.log('\n⛔ Abortando inserción por decisión del usuario.');
        console.log(`   Batches completados: ${resultado.batchesExitosos}/${totalBatches}`);
        console.log(`   Filas insertadas antes del abort: ${resultado.filasInsertadas}`);
        return resultado;
      }

      console.log('   Continuando con el siguiente batch...\n');
      break;
    }
  }

  console.log(
    `   ✓ [${tabla}] completado: ${resultado.filasInsertadas.toLocaleString()} filas insertadas` +
    (resultado.batchesFallidos > 0
      ? ` (${resultado.batchesFallidos} batches fallidos)`
      : '')
  );

  return resultado;
}

// ─── DELETE en orden correcto de FK ─────────────────────────────────────────

/**
 * Borra todos los datos de las tablas del seed en el orden correcto
 * para respetar foreign keys.
 *
 * Usa DELETE (no TRUNCATE) porque no tenemos exec_sql RPC.
 * Los seriales NO se reinician — el usuario debe hacerlo manualmente
 * en el SQL Editor de Supabase.
 */
export async function borrarTodo(): Promise<void> {
  console.log('\n🗑️  Borrando todos los datos...');

  // Orden: hijos primero (los que tienen FK apuntando a otras tablas)
  // transacciones → inventario → productos → clientes → vendedores → bodegas
  //
  // DELETE con filtro: para columnas integer usamos .gte(col, 0) que matchea todo.
  // Para columnas text usamos .neq(col, '') que matchea todo (nunca hay SKU vacío).
  const pasos: Array<{ tabla: string; filtro: () => any }> = [
    { tabla: 'transacciones', filtro: () => supabase.from('transacciones').delete().gt('id', 0) },
    { tabla: 'inventario', filtro: () => supabase.from('inventario').delete().gt('bodega_id', 0) },
    { tabla: 'productos', filtro: () => supabase.from('productos').delete().neq('sku', '') },
    { tabla: 'clientes', filtro: () => supabase.from('clientes').delete().gt('id', 0) },
    { tabla: 'vendedores', filtro: () => supabase.from('vendedores').delete().gt('id', 0) },
    { tabla: 'bodegas', filtro: () => supabase.from('bodegas').delete().gt('id', 0) },
  ];

  for (const { tabla, filtro } of pasos) {
    const { error } = await filtro();
    if (error) {
      console.error(`   ❌ Error borrando ${tabla}: ${error.message}`);
      throw new Error(`No se pudo vaciar la tabla ${tabla}. Abortando.`);
    }

    // Verificar que quedó vacía
    const { count } = await supabase.from(tabla).select('*', { count: 'exact', head: true });
    console.log(`   ✓ ${tabla}: vaciada (${count ?? 0} filas restantes)`);
  }

  console.log('\n   ⚠️  Los seriales (auto-increment) NO se reiniciaron.');
  console.log('   Los IDs no empezarán en 1 a menos que ejecutes ALTER SEQUENCE manualmente.');
}

// ─── Confirmación de seguridad antes de borrar datos ────────────────────────

/**
 * Muestra el URL del proyecto y pide al usuario que escriba "BORRAR"
 * para confirmar la destrucción de datos existentes.
 */
export async function confirmarBorrado(): Promise<boolean> {
  console.log('\n' + '═'.repeat(70));
  console.log('⚠️  ADVERTENCIA: BORRADO DE DATOS');
  console.log('═'.repeat(70));
  console.log(`\n   Proyecto Supabase: ${projectUrl}`);
  console.log('\n   Esta operación va a BORRAR TODOS los datos existentes');
  console.log('   en las tablas: bodegas, productos, clientes, vendedores,');
  console.log('   transacciones, inventario.');
  console.log('\n   Esta acción NO se puede deshacer.\n');

  // Si stdin es un pipe (no-interactivo), leer de pipe; si es TTY, preguntar
  let respuesta: string;
  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(Buffer.from(chunk));
      break;
    }
    respuesta = Buffer.concat(chunks).toString().trim();
  } else {
    respuesta = await preguntarUsuario(
      '   Escribe BORRAR en mayúsculas para confirmar: '
    );
  }

  if (respuesta !== 'BORRAR') {
    console.log('\n   ❌ Confirmación incorrecta. Operación cancelada.');
    return false;
  }

  console.log('   ✓ Confirmación recibida.');
  return true;
}
