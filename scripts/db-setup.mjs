/**
 * Pone la base de datos en el estado que la app espera, en un solo comando.
 *
 *   pnpm db:setup            # aplica todo lo pendiente (idempotente)
 *   pnpm db:setup -- --seed  # + usuario admin y categorías semilla
 *
 * Cada paso es idempotente: se puede correr las veces que haga falta.
 * Requiere DATABASE_URL en .env.local (Supabase, Session mode).
 *
 * Orden:
 *   1. drizzle-kit migrate            (esquema base; puede fallar si el journal
 *                                      está desincronizado — se avisa y se sigue)
 *   2. apply-preserve-documents       (uploaded_by nullable + ON DELETE SET NULL)
 *   3. apply-rbac-migration           (tablas RBAC, has_permission, role_id)
 *   4. apply-rbac-granular            (permisos CRUD por módulo + políticas)
 *   5. apply-storage-policies         (bucket privado + RLS de storage)
 *   6. apply-audit-log                (bitácora de auditoría + RPC + audit.read)
 *   7. seeds  (solo con --seed)       (admin@sistema-documental.local + categorías)
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import pkg from "@next/env";

pkg.loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("✗ DATABASE_URL no está definida. Configúrala en .env.local (ver .env.example).");
  process.exit(1);
}

const withSeed = process.argv.includes("--seed");
const node = process.execPath;

function run(label, args, { allowFailure = false } = {}) {
  console.log(`\n▶ ${label}`);
  const res = spawnSync(node, args, { stdio: "inherit", shell: false });
  if (res.status !== 0) {
    if (allowFailure) {
      console.warn(
        `  ⚠ ${label} terminó con código ${String(res.status)} — se continúa ` +
          `(los pasos siguientes reconcilian el estado).`
      );
      return;
    }
    console.error(`\n✗ Falló: ${label}`);
    process.exit(res.status ?? 1);
  }
}

async function seedFile(label, relPath) {
  console.log(`\n▶ seed: ${label}`);
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await sql.unsafe(readFileSync(join(process.cwd(), relPath), "utf8"));
    console.log(`  ✓ ${label}`);
  } catch (err) {
    console.error(`  ✗ ${label}: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

// 1. Esquema base
const drizzleBin = join(process.cwd(), "node_modules/drizzle-kit/bin.cjs");
if (existsSync(drizzleBin)) {
  run("drizzle-kit migrate", [drizzleBin, "migrate"], { allowFailure: true });
} else {
  console.warn("\n⚠ drizzle-kit no encontrado — se omite el paso de migraciones base.");
}

// 2-5. Migraciones de respaldo (idempotentes, detectan su propio estado)
run("preserve-documents", ["scripts/apply-preserve-documents-migration.mjs"]);
run("rbac base", ["scripts/apply-rbac-migration.mjs"]);
run("rbac granular", ["scripts/apply-rbac-granular.mjs"]);
run("storage policies", ["scripts/apply-storage-policies.mjs"]);
run("audit log", ["scripts/apply-audit-log.mjs"]);

// 6. Seeds (opcional)
if (withSeed) {
  await seedFile("usuario admin", "docs/sql/seed-generic-admin.sql");
  await seedFile("categorías", "docs/sql/seed-categories.sql");
}

console.log("\n✓ Base de datos lista.");
if (!withSeed) {
  console.log("  Para crear el admin semilla y las categorías: pnpm db:setup -- --seed");
} else {
  console.log("  Admin semilla: admin@sistema-documental.local / Admin12345");
  console.log("  ⚠ Cambia esa contraseña en el primer inicio de sesión.");
}
