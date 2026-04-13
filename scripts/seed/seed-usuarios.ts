/**
 * seed-usuarios.ts — Crea 9 usuarios de prueba en Supabase Auth + tablas usuarios/usuario_roles.
 *
 * Idempotente: si los usuarios ya existen, limpia todo y vuelve a crear.
 * Ejecutar con: npm run seed:usuarios
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { createClient } from '@supabase/supabase-js';

// ─── Cliente admin con service role key ──────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '\n❌ Faltan variables de entorno:\n' +
    '   - NEXT_PUBLIC_SUPABASE_URL\n' +
    '   - SUPABASE_SERVICE_ROLE_KEY\n' +
    '\n   Asegúrate de que estén en .env.local\n'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ─── Definición de usuarios de prueba ────────────────────────────────────────

const PASSWORD = '123456789';

interface UsuarioDef {
  email: string;
  nombre: string;
  vendedorNombre: string | null; // buscar por nombre en tabla vendedores
  roles: string[];
}

const USUARIOS: UsuarioDef[] = [
  { email: 'dueno@bajio.mx', nombre: 'Roberto Gómez', vendedorNombre: null, roles: ['dueno'] },
  { email: 'comprador@bajio.mx', nombre: 'María Hernández', vendedorNombre: null, roles: ['comprador'] },
  { email: 'patricia.lopez@bajio.mx', nombre: 'Patricia López', vendedorNombre: 'Patricia López', roles: ['rep'] },
  { email: 'ana.martinez@bajio.mx', nombre: 'Ana Martínez', vendedorNombre: 'Ana Martínez', roles: ['rep'] },
  { email: 'laura.sanchez@bajio.mx', nombre: 'Laura Sánchez', vendedorNombre: 'Laura Sánchez', roles: ['rep'] },
  { email: 'ricardo.mendoza@bajio.mx', nombre: 'Ricardo Mendoza', vendedorNombre: 'Ricardo Mendoza', roles: ['rep'] },
  { email: 'jorge.ramirez@bajio.mx', nombre: 'Jorge Ramírez', vendedorNombre: 'Jorge Ramírez', roles: ['rep'] },
  { email: 'carlos.herrera@bajio.mx', nombre: 'Carlos Herrera', vendedorNombre: 'Carlos Herrera', roles: ['dueno', 'comprador', 'rep'] },
  { email: 'fernando.torres@bajio.mx', nombre: 'Fernando Torres', vendedorNombre: 'Fernando Torres', roles: ['rep', 'comprador'] },
];

// ─── Seed principal ──────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔑 Seed de usuarios de prueba');
  console.log(`   Proyecto: ${supabaseUrl}\n`);

  // 1. Buscar IDs de vendedores por nombre
  console.log('1. Buscando vendedores por nombre...');
  const { data: vendedores, error: errVend } = await supabase
    .from('vendedores')
    .select('id, nombre');

  if (errVend) throw new Error(`Error leyendo vendedores: ${errVend.message}`);

  const vendedorPorNombre = new Map<string, number>();
  for (const v of vendedores ?? []) {
    vendedorPorNombre.set(v.nombre, v.id);
  }

  // Validar que todos los vendedores referenciados existen
  for (const u of USUARIOS) {
    if (u.vendedorNombre && !vendedorPorNombre.has(u.vendedorNombre)) {
      console.error(`\n❌ Vendedor "${u.vendedorNombre}" no existe en la tabla vendedores.`);
      console.error(`   Vendedores disponibles: ${[...vendedorPorNombre.keys()].join(', ')}`);
      process.exit(1);
    }
  }
  console.log(`   ✓ ${vendedorPorNombre.size} vendedores encontrados\n`);

  // 2. Limpiar datos existentes (idempotencia)
  console.log('2. Limpiando datos existentes...');

  // Leer usuarios existentes para obtener auth_user_ids
  const { data: existentes } = await supabase
    .from('usuarios')
    .select('id, auth_user_id, email');

  if (existentes && existentes.length > 0) {
    // Borrar roles
    const ids = existentes.map((u) => u.id);
    await supabase.from('usuario_roles').delete().in('usuario_id', ids);
    console.log(`   ✓ Roles eliminados`);

    // Borrar de tabla usuarios
    await supabase.from('usuarios').delete().in('id', ids);
    console.log(`   ✓ Usuarios eliminados de tabla usuarios`);

    // Borrar de auth.users vía admin API
    for (const u of existentes) {
      if (u.auth_user_id) {
        const { error: errAuth } = await supabase.auth.admin.deleteUser(u.auth_user_id);
        if (errAuth) {
          console.warn(`   ⚠️  No se pudo eliminar auth user ${u.email}: ${errAuth.message}`);
        }
      }
    }
    console.log(`   ✓ ${existentes.length} cuentas de Auth eliminadas`);
  } else {
    // Verificar si hay cuentas de Auth huérfanas con estos emails
    for (const u of USUARIOS) {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const authUser = users?.find((au) => au.email === u.email);
      if (authUser) {
        await supabase.auth.admin.deleteUser(authUser.id);
        console.log(`   ✓ Auth user huérfano eliminado: ${u.email}`);
      }
    }
    console.log('   ✓ No había datos previos en tabla usuarios');
  }

  // 3. Crear usuarios
  console.log('\n3. Creando usuarios...');
  const resumen: string[] = [];

  for (const u of USUARIOS) {
    // 3a. Crear cuenta en Supabase Auth
    const { data: authData, error: errAuth } = await supabase.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
    });

    if (errAuth) {
      throw new Error(`Error creando auth user ${u.email}: ${errAuth.message}`);
    }

    const authUserId = authData.user.id;

    // 3b. Insertar en tabla usuarios
    const vendedorId = u.vendedorNombre ? vendedorPorNombre.get(u.vendedorNombre) ?? null : null;

    const { data: inserted, error: errInsert } = await supabase
      .from('usuarios')
      .insert({
        auth_user_id: authUserId,
        email: u.email,
        nombre: u.nombre,
        vendedor_id: vendedorId,
      })
      .select('id')
      .single();

    if (errInsert) {
      throw new Error(`Error insertando usuario ${u.email}: ${errInsert.message}`);
    }

    // 3c. Insertar roles
    const rolesInsert = u.roles.map((rol) => ({
      usuario_id: inserted.id,
      rol,
    }));

    const { error: errRoles } = await supabase
      .from('usuario_roles')
      .insert(rolesInsert);

    if (errRoles) {
      throw new Error(`Error insertando roles para ${u.email}: ${errRoles.message}`);
    }

    const rolesStr = u.roles.join(', ');
    console.log(`   ✓ ${u.nombre} (${rolesStr})`);
    resumen.push(`${u.nombre} (${rolesStr})`);
  }

  // 4. Resumen
  console.log(`\n✅ ${resumen.length} usuarios creados: ${resumen.join(', ')}`);
  console.log(`   Password para todos: ${PASSWORD}\n`);
}

main().catch((err) => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});
