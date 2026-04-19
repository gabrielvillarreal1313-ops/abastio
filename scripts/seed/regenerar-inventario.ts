/**
 * regenerar-inventario.ts — Regenera cantidad_actual de inventario con
 * distribución realista para demos (Fase 14-2).
 *
 * El seed original crea ~97% de pares SKU-bodega con stock 0 porque el
 * generador no simula reposición: stock_inicial + devoluciones - ventas
 * termina en cero para la mayoría de SKUs después de 18 meses. Esto
 * distorsiona el tablero del comprador (1,500+ ítems en desabasto crítico).
 *
 * Este script NO toca transacciones, clientes, ni productos. Solo hace
 * UPDATE a la tabla `inventario` con una distribución objetivo:
 *   - ~70% saludable (stock entre cantidad_minima y cantidad_maxima)
 *   - ~15% sobrestock (stock > cantidad_maxima × 1.5)
 *   - ~10% próximo a desabasto (stock > 0 pero < cantidad_minima)
 *   - ~5% desabasto crítico (stock = 0)
 *
 * Conserva cantidad_minima y cantidad_maxima existentes — el comprador
 * puede haberlos modificado vía overrides, no deben sobreescribirse.
 *
 * Ejecutar con: npx tsx scripts/seed/regenerar-inventario.ts
 */

import { faker } from '@faker-js/faker';
import { supabase, projectUrl } from './db';
import { FAKER_SEED } from './config';

// Usamos un offset distinto al del seed original para no interferir con él
faker.seed(FAKER_SEED + 900);

// ─── Distribución objetivo ──────────────────────────────────────────────────

type Estado = 'saludable' | 'sobrestock' | 'proximo_desabasto' | 'desabasto_critico';

const DISTRIBUCION: { estado: Estado; pct: number }[] = [
  { estado: 'saludable', pct: 0.70 },
  { estado: 'sobrestock', pct: 0.15 },
  { estado: 'proximo_desabasto', pct: 0.10 },
  { estado: 'desabasto_critico', pct: 0.05 },
];

/**
 * Muestrea un estado según las probabilidades objetivo.
 */
function muestrearEstado(): Estado {
  const roll = faker.number.float({ min: 0, max: 1 });
  let acumulado = 0;
  for (const { estado, pct } of DISTRIBUCION) {
    acumulado += pct;
    if (roll < acumulado) return estado;
  }
  return 'saludable';
}

/**
 * Construye una fecha ISO de hace N días atrás desde la fecha actual.
 * Usa la fecha actual del sistema — el seed de datos sintéticos termina en
 * abril 2026 pero las fechas de última entrada/salida en inventario no
 * afectan métricas transaccionales, solo son display.
 */
function hace(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha.toISOString();
}

// ─── Generador por fila ─────────────────────────────────────────────────────

interface FilaInventario {
  sku: string;
  bodega_id: number;
  cantidad_minima: number;
  cantidad_maxima: number;
}

interface UpdatePayload {
  sku: string;
  bodega_id: number;
  cantidad_actual: number;
  ultima_entrada: string | null;
  ultima_salida: string | null;
}

function generarActualizacion(fila: FilaInventario): UpdatePayload {
  const estado = muestrearEstado();
  const min = Math.max(fila.cantidad_minima, 1);
  const max = Math.max(fila.cantidad_maxima, min + 1);

  let cantidadActual: number;
  let ultimaEntrada: string | null = null;
  let ultimaSalida: string | null = null;

  switch (estado) {
    case 'saludable':
      cantidadActual = faker.number.int({ min, max });
      ultimaEntrada = hace(faker.number.int({ min: 1, max: 30 }));
      ultimaSalida = hace(faker.number.int({ min: 1, max: 30 }));
      break;

    case 'sobrestock':
      cantidadActual = faker.number.int({
        min: Math.ceil(max * 1.5),
        max: Math.ceil(max * 3),
      });
      // Hay entrada reciente (se recibió mucho), pero las salidas son lentas
      ultimaEntrada = hace(faker.number.int({ min: 1, max: 30 }));
      ultimaSalida = hace(faker.number.int({ min: 30, max: 90 }));
      break;

    case 'proximo_desabasto':
      cantidadActual = faker.number.int({ min: 1, max: Math.max(min - 1, 1) });
      // Salidas muy recientes (se está vendiendo rápido), entrada vieja
      ultimaEntrada = hace(faker.number.int({ min: 30, max: 90 }));
      ultimaSalida = hace(faker.number.int({ min: 1, max: 7 }));
      break;

    case 'desabasto_critico':
      cantidadActual = 0;
      // Entrada hace tiempo, última salida fue hace 1-14 días (agotó stock)
      ultimaEntrada = hace(faker.number.int({ min: 30, max: 90 }));
      ultimaSalida = hace(faker.number.int({ min: 1, max: 14 }));
      break;
  }

  return {
    sku: fila.sku,
    bodega_id: fila.bodega_id,
    cantidad_actual: cantidadActual,
    ultima_entrada: ultimaEntrada,
    ultima_salida: ultimaSalida,
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('🔄 REGENERAR INVENTARIO — Distribución realista (Fase 14-2)');
  console.log('═'.repeat(70));
  console.log(`\n   Proyecto Supabase: ${projectUrl}`);
  console.log('\n   Distribución objetivo:');
  console.log('   • 70% saludable (stock entre min y max)');
  console.log('   • 15% sobrestock (stock > max × 1.5)');
  console.log('   • 10% próximo a desabasto (stock > 0 pero < min)');
  console.log('   • 5%  desabasto crítico (stock = 0)\n');
  console.log('   Conserva cantidad_minima y cantidad_maxima (overrides del comprador).');
  console.log('═'.repeat(70));

  // ─── 1. Leer inventario actual ─────────────────────────────────────
  console.log('\n📖 Leyendo inventario actual...');

  // Paginar por si excede 1000 filas (la tabla tiene ~1,544)
  let filas: FilaInventario[] = [];
  const PAGE = 1000;
  for (let desde = 0; ; desde += PAGE) {
    const { data, error } = await supabase
      .from('inventario')
      .select('sku, bodega_id, cantidad_minima, cantidad_maxima')
      .range(desde, desde + PAGE - 1);

    if (error) {
      console.error(`\n❌ Error leyendo inventario: ${error.message}`);
      process.exit(1);
    }

    const batch = (data as FilaInventario[]) ?? [];
    filas.push(...batch);
    if (batch.length < PAGE) break;
  }

  console.log(`   ✓ ${filas.length.toLocaleString()} filas de inventario leídas`);

  if (filas.length === 0) {
    console.log('\n   ⚠️  No hay inventario que actualizar. Aborto.');
    process.exit(0);
  }

  // ─── 2. Generar updates ────────────────────────────────────────────
  console.log('\n🎲 Generando nueva distribución...');
  const updates = filas.map(generarActualizacion);

  // Conteo preview por estado
  const contador: Record<Estado, number> = {
    saludable: 0,
    sobrestock: 0,
    proximo_desabasto: 0,
    desabasto_critico: 0,
  };
  for (let i = 0; i < filas.length; i++) {
    const f = filas[i];
    const u = updates[i];
    const min = Math.max(f.cantidad_minima, 1);
    const max = Math.max(f.cantidad_maxima, min + 1);
    if (u.cantidad_actual === 0) contador.desabasto_critico++;
    else if (u.cantidad_actual < min) contador.proximo_desabasto++;
    else if (u.cantidad_actual > max * 1.5) contador.sobrestock++;
    else contador.saludable++;
  }

  console.log('   Previsualización (antes de escribir):');
  for (const estado of ['saludable', 'sobrestock', 'proximo_desabasto', 'desabasto_critico'] as Estado[]) {
    const n = contador[estado];
    const pct = ((n / filas.length) * 100).toFixed(1);
    console.log(`     • ${estado.padEnd(20)} ${String(n).padStart(5)} filas (${pct}%)`);
  }

  // ─── 3. Ejecutar UPDATEs fila por fila ─────────────────────────────
  // No usamos upsert porque no queremos tocar cantidad_minima/maxima.
  // Supabase no tiene bulk UPDATE nativo — hacemos en paralelo por chunks.
  console.log('\n💾 Aplicando actualizaciones...');

  const CHUNK = 50; // UPDATE individual por fila, en chunks paralelos
  let exitosos = 0;
  let fallidos = 0;
  const errores: string[] = [];

  for (let i = 0; i < updates.length; i += CHUNK) {
    const slice = updates.slice(i, i + CHUNK);
    const resultados = await Promise.allSettled(
      slice.map((u) =>
        supabase
          .from('inventario')
          .update({
            cantidad_actual: u.cantidad_actual,
            ultima_entrada: u.ultima_entrada,
            ultima_salida: u.ultima_salida,
          })
          .eq('sku', u.sku)
          .eq('bodega_id', u.bodega_id)
      )
    );

    for (const [idx, r] of resultados.entries()) {
      if (r.status === 'fulfilled' && !r.value.error) {
        exitosos++;
      } else {
        fallidos++;
        const msg =
          r.status === 'rejected'
            ? String(r.reason)
            : r.value.error?.message ?? 'unknown';
        if (errores.length < 5) {
          errores.push(`${slice[idx].sku}/bodega ${slice[idx].bodega_id}: ${msg}`);
        }
      }
    }

    // Progreso cada 200 filas
    if ((i + CHUNK) % 200 === 0 || i + CHUNK >= updates.length) {
      process.stdout.write(
        `   ${Math.min(i + CHUNK, updates.length)}/${updates.length} filas procesadas\r`
      );
    }
  }

  console.log('\n');
  console.log(`   ✓ Actualizaciones exitosas: ${exitosos.toLocaleString()}`);
  if (fallidos > 0) {
    console.log(`   ⚠️  Fallidos: ${fallidos}`);
    console.log('   Primeros errores:');
    errores.forEach((e) => console.log(`     • ${e}`));
  }

  // ─── 4. Refrescar cache de oportunidades ──────────────────────────
  console.log('\n🔁 Refrescando cache de oportunidades...');
  const { error: errRefresh } = await supabase.rpc('refrescar_oportunidades');
  if (errRefresh) {
    console.error(`   ⚠️  Error refrescando oportunidades: ${errRefresh.message}`);
  } else {
    console.log('   ✓ Cache de oportunidades refrescado');
  }

  console.log('\n' + '═'.repeat(70));
  console.log('✅ Inventario regenerado con distribución realista');
  console.log('═'.repeat(70) + '\n');
}

main().catch((err) => {
  console.error('\n❌ Error fatal:', err);
  process.exit(1);
});
