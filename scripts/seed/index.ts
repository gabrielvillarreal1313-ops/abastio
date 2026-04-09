/**
 * index.ts — Script orquestador del seed de datos sintéticos.
 *
 * Ejecutar con: npx tsx scripts/seed/index.ts
 *
 * Flujo:
 * 1. Mostrar URL del proyecto Supabase
 * 2. Pedir confirmación "BORRAR" antes de borrar datos
 * 3. DELETE en orden FK + advertencia sobre seriales
 * 4. Verificar tablas vacías antes de insertar (idempotencia)
 * 5. Generar e insertar datos en orden FK
 * 6. Aplicar anomalías
 * 7. Insertar transacciones en batches de 1000 (retry idempotente)
 * 8. Calcular e insertar inventario
 * 9. Verificar conteos finales contra DB
 */

// db.ts carga dotenv internamente antes de inicializar el cliente Supabase
import {
  supabase,
  confirmarBorrado,
  borrarTodo,
  verificarTablaVacia,
  insertDirecto,
  insertBatch,
  type BatchResult,
} from './db';
import { BODEGAS, ANOMALIAS, BATCH_SIZE, PERFILES_VENDEDORES } from './config';
import { generarCatalogo } from './catalogo';
import { generarClientes } from './clientes';
import { generarVendedores, asignarClientesAVendedores } from './vendedores';
import { generarTransacciones } from './transacciones';
import {
  generarProductosDuplicados,
  generarClientesDuplicados,
  inyectarCostosNull,
  inyectarCantidadesOutlier,
  procesarSkusDescontinuados,
  verificarEscenarioPlomeria,
} from './anomalias';
import { generarInventario } from './inventario';
import { faker } from '@faker-js/faker';
import { FAKER_SEED } from './config';

faker.seed(FAKER_SEED + 500);

// ─── Utilidades ─────────────────────────────────────────────────────────────

function tiempoTranscurrido(inicio: number): string {
  const ms = Date.now() - inicio;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const inicioTotal = Date.now();
  const resultadosBatch: BatchResult[] = [];

  console.log('\n' + '═'.repeat(70));
  console.log('🏗️  SEED DE DATOS — Ferretera del Bajío, S.A. de C.V.');
  console.log('═'.repeat(70));
  console.log(`   Fecha de ejecución: ${new Date().toLocaleString('es-MX')}`);

  // ─── Paso 1: Confirmar borrado ──────────────────────────────────

  const confirmado = await confirmarBorrado();
  if (!confirmado) {
    process.exit(0);
  }

  // ─── Paso 2: Borrar datos existentes ────────────────────────────

  await borrarTodo();

  // ─── Paso 3: Verificar tablas vacías (prevenir duplicados) ──────

  console.log('\n   Verificando que todas las tablas estén vacías...');
  for (const tabla of ['bodegas', 'productos', 'clientes', 'vendedores', 'transacciones', 'inventario']) {
    await verificarTablaVacia(tabla);
  }
  console.log('   ✓ Todas las tablas están vacías.');

  // ─── Paso 4: Insertar bodegas ───────────────────────────────────

  console.log('\n' + '─'.repeat(70));
  console.log('📍 Insertando bodegas...');

  const { data: bodegasInsertadas } = await insertDirecto('bodegas', BODEGAS);

  const bodegaIds: [number, number] = [
    bodegasInsertadas[0].id,
    bodegasInsertadas[1].id,
  ];
  console.log(`     León: id=${bodegaIds[0]}, Querétaro: id=${bodegaIds[1]}`);

  // ─── Paso 5: Generar e insertar catálogo ────────────────────────

  console.log('\n' + '─'.repeat(70));
  console.log('📦 Generando catálogo de productos...');
  let inicio = Date.now();

  const productosBase = generarCatalogo();
  console.log(`   ✓ ${productosBase.length} SKUs base generados (${tiempoTranscurrido(inicio)})`);

  const productosDuplicados = generarProductosDuplicados(productosBase);
  console.log(`   + ${productosDuplicados.length} productos duplicados (anomalía)`);

  const todosProductos = [...productosBase, ...productosDuplicados];

  // Productos usan insertBatch con campo único 'sku' para retry idempotente
  const resultProductos = await insertBatch('productos', todosProductos, BATCH_SIZE, 'sku');
  resultadosBatch.push(resultProductos);

  // ─── Paso 6: Generar e insertar clientes ────────────────────────

  console.log('\n' + '─'.repeat(70));
  console.log('👥 Generando clientes...');
  inicio = Date.now();

  const clientesBase = generarClientes();

  // Asegurar que el cliente en declive existe
  const idxConstructor = clientesBase.findIndex((c) => c.tipo_cliente === 'constructor');
  if (idxConstructor >= 0) {
    clientesBase[idxConstructor].razon_social = ANOMALIAS.clienteEnDeclive.nombre;
    clientesBase[idxConstructor].ciudad = 'León';
    clientesBase[idxConstructor].estado = 'Guanajuato';
    clientesBase[idxConstructor].lista_precios = 'B';
    clientesBase[idxConstructor].limite_credito = 500_000;
    clientesBase[idxConstructor].dias_credito = 30;
  }

  const clientesDuplicados = generarClientesDuplicados(clientesBase);
  console.log(`   ✓ ${clientesBase.length} clientes base + ${clientesDuplicados.length} duplicados (${tiempoTranscurrido(inicio)})`);

  const todosClientes = [...clientesBase, ...clientesDuplicados];

  // Clientes: inserción directa (tabla pequeña, sin retry)
  const { data: clientesInsertados } = await insertDirecto('clientes', todosClientes);

  // ─── Paso 7: Generar e insertar vendedores ──────────────────────

  console.log('\n' + '─'.repeat(70));
  console.log('🧑‍💼 Insertando vendedores...');

  const vendedoresData = generarVendedores();
  const { data: vendedoresInsertados } = await insertDirecto('vendedores', vendedoresData);

  vendedoresInsertados.forEach((v: any, i: number) => {
    const perfil = PERFILES_VENDEDORES[i];
    console.log(`     ${v.id}. ${v.nombre} (${v.tipo}, ${v.zona}) — ${perfil.perfil}`);
  });

  // ─── Paso 8: Asignar clientes a vendedores ─────────────────────

  const asignacionIndices = asignarClientesAVendedores(clientesBase);

  console.log('\n   Asignación vendedor → clientes:');
  for (const [vIdx, cIndices] of asignacionIndices) {
    console.log(`     ${PERFILES_VENDEDORES[vIdx].nombre}: ${cIndices.length} clientes`);
  }

  // ─── Paso 9: Generar transacciones ──────────────────────────────

  console.log('\n' + '─'.repeat(70));
  console.log('💰 Generando transacciones (esto puede tardar un momento)...');
  inicio = Date.now();

  const clientesConId = clientesBase.map((c, idx) => ({
    ...c,
    id: clientesInsertados[idx].id,
  }));

  const vendedorIdsReales = vendedoresInsertados.map((v: any) => v.id);

  const transacciones = generarTransacciones(
    todosProductos,
    clientesConId,
    asignacionIndices,
    bodegaIds,
    vendedorIdsReales
  );

  console.log(`   ✓ ${transacciones.length.toLocaleString()} líneas generadas (${tiempoTranscurrido(inicio)})`);

  // ─── Paso 10: Aplicar anomalías ─────────────────────────────────

  console.log('\n   Aplicando anomalías...');

  const skusDescontinuados = procesarSkusDescontinuados(todosProductos, transacciones);

  const costosNull = inyectarCostosNull(transacciones);
  console.log(`   ✓ ${costosNull.toLocaleString()} con costo_unitario = NULL (~3%)`);

  const cantidadesOutlier = inyectarCantidadesOutlier(transacciones);
  console.log(`   ✓ ${cantidadesOutlier.toLocaleString()} con cantidades outlier (~1.5%)`);

  const productosPlomeria = todosProductos.filter((p) => p.categoria === 'Plomería');
  const skusPlomeriaAfectados = new Set(
    faker.helpers.arrayElements(productosPlomeria, Math.min(ANOMALIAS.plomeria.skusAfectados, productosPlomeria.length))
      .map((p) => p.sku)
  );
  const escenarioPlomeria = verificarEscenarioPlomeria(todosProductos, skusPlomeriaAfectados);
  console.log(
    `   ✓ Plomería: ${escenarioPlomeria.skusAfectados} SKUs, ` +
    `margen ${(escenarioPlomeria.margenAntes * 100).toFixed(1)}% → ${(escenarioPlomeria.margenDespues * 100).toFixed(1)}%`
  );

  // ─── Paso 11: Insertar transacciones ────────────────────────────

  console.log('\n' + '─'.repeat(70));
  console.log('📤 Insertando transacciones en Supabase...');

  // Retry idempotente usando 'folio' como campo de verificación
  const resultTransacciones = await insertBatch('transacciones', transacciones, BATCH_SIZE, 'folio');
  resultadosBatch.push(resultTransacciones);

  // ─── Paso 12: Inventario ────────────────────────────────────────

  console.log('\n' + '─'.repeat(70));
  console.log('📊 Calculando inventario...');
  inicio = Date.now();

  const inventario = generarInventario(todosProductos, transacciones, bodegaIds, skusDescontinuados);
  console.log(`   ✓ ${inventario.length.toLocaleString()} filas calculadas (${tiempoTranscurrido(inicio)})`);

  const resultInventario = await insertBatch('inventario', inventario, BATCH_SIZE, 'sku');
  resultadosBatch.push(resultInventario);

  // ─── Paso 13: Verificar conteos en DB ───────────────────────────

  console.log('\n' + '─'.repeat(70));
  console.log('🔍 Verificando conteos en Supabase...');

  const conteos: Record<string, number> = {};
  for (const tabla of ['bodegas', 'productos', 'clientes', 'vendedores', 'transacciones', 'inventario']) {
    const { count } = await supabase.from(tabla).select('*', { count: 'exact', head: true });
    conteos[tabla] = count ?? 0;
  }

  const esperados: Record<string, number> = {
    bodegas: 2,
    productos: todosProductos.length,
    clientes: todosClientes.length,
    vendedores: vendedoresData.length,
    transacciones: resultTransacciones.filasInsertadas,
    inventario: resultInventario.filasInsertadas,
  };

  let todoCorrecto = true;
  for (const [tabla, esperado] of Object.entries(esperados)) {
    const real = conteos[tabla];
    const ok = real === esperado;
    if (!ok) todoCorrecto = false;
    console.log(`   ${ok ? '✓' : '❌'} ${tabla}: ${real} filas (esperado: ${esperado})`);
  }

  // ─── Reporte final ──────────────────────────────────────────────

  console.log('\n' + '═'.repeat(70));
  console.log('📋 REPORTE FINAL');
  console.log('═'.repeat(70));

  console.log('\n   Totales por tabla:');
  console.log(`     Bodegas:        ${conteos.bodegas}`);
  console.log(`     Productos:      ${conteos.productos} (${productosBase.length} base + ${productosDuplicados.length} duplicados)`);
  console.log(`     Clientes:       ${conteos.clientes} (${clientesBase.length} base + ${clientesDuplicados.length} duplicados)`);
  console.log(`     Vendedores:     ${conteos.vendedores}`);
  console.log(`     Transacciones:  ${conteos.transacciones.toLocaleString()}`);
  console.log(`     Inventario:     ${conteos.inventario.toLocaleString()}`);

  const ventas = transacciones.filter((t) => t.tipo === 'venta');
  const devoluciones = transacciones.filter((t) => t.tipo === 'devolucion');
  const notasCredito = transacciones.filter((t) => t.tipo === 'nota_credito');

  const ingresosTotales = ventas.reduce((sum, t) => sum + t.subtotal, 0);
  const costoTotal = ventas
    .filter((t) => t.costo_unitario !== null)
    .reduce((sum, t) => sum + (t.costo_unitario! * Math.abs(t.cantidad)), 0);
  const margenPromedio = ingresosTotales > 0
    ? ((ingresosTotales - costoTotal) / ingresosTotales * 100)
    : 0;

  console.log('\n   Estadísticas de transacciones:');
  console.log(`     Ventas:         ${ventas.length.toLocaleString()} líneas`);
  console.log(`     Devoluciones:   ${devoluciones.length.toLocaleString()} líneas`);
  console.log(`     Notas crédito:  ${notasCredito.length.toLocaleString()} líneas`);
  console.log(`     Ingresos:       $${(ingresosTotales / 1_000_000).toFixed(1)}M MXN`);
  console.log(`     Margen bruto:   ${margenPromedio.toFixed(1)}%`);

  const foliosUnicos = new Set(transacciones.map((t) => t.folio));
  console.log(`     Folios únicos:  ${foliosUnicos.size.toLocaleString()}`);

  console.log('\n   Anomalías:');
  console.log(`     Productos duplicados:     ${productosDuplicados.length}`);
  console.log(`     Clientes duplicados:      ${clientesDuplicados.length}`);
  console.log(`     Costos NULL:              ${costosNull.toLocaleString()}`);
  console.log(`     Cantidades outlier:       ${cantidadesOutlier.toLocaleString()}`);
  console.log(`     SKUs descontinuados:      ${skusDescontinuados.length}`);
  console.log(`     Plomería erosionada:      ${escenarioPlomeria.skusAfectados} SKUs`);

  const batchesFallidos = resultadosBatch.reduce((sum, r) => sum + r.batchesFallidos, 0);
  if (batchesFallidos > 0) {
    console.log('\n   ⚠️  Batches con errores:');
    for (const r of resultadosBatch) {
      for (const err of r.errores) {
        console.log(`     [${r.tabla}] Batch ${err.batchNumero} (filas ${err.rangoFilas}): ${err.error}`);
      }
    }
  } else {
    console.log('\n   ✅ Todos los batches insertados correctamente.');
  }

  if (todoCorrecto) {
    console.log('\n   ✅ Conteos verificados: DB coincide con datos generados.');
  } else {
    console.log('\n   ❌ DISCREPANCIA: algunos conteos no coinciden. Revisar arriba.');
  }

  console.log(`\n   Tiempo total: ${tiempoTranscurrido(inicioTotal)}`);
  console.log('\n' + '═'.repeat(70));
  console.log(todoCorrecto ? '✅ Seed completado exitosamente.' : '⚠️  Seed completado con discrepancias.');
  console.log('═'.repeat(70) + '\n');
}

// ─── Ejecutar ───────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('\n❌ Error fatal durante el seed:', err.message || err);
  process.exit(1);
});
