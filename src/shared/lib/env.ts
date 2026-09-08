import { z } from "zod";

/**
 * Centralised environment-variable validation.
 *
 * Every `process.env.*` read for a required variable goes through here so a
 * missing or malformed value fails loudly at boot (or build) with a readable
 * message, instead of silently becoming `""` and surfacing later as an opaque
 * "URL and Key are required" error at request time.
 *
 * - `publicEnv` — the `NEXT_PUBLIC_*` vars the app cannot run without. Required
 *   and validated at module load, on both server and client.
 * - `serverEnv` — server-only secrets. Format-checked when present; a missing
 *   value is surfaced by the consumer that needs it (`requireServerEnv`), not
 *   at boot, because a read-only deployment can run without the service role.
 *
 * Validation is skipped under Vitest and when `SKIP_ENV_VALIDATION=1`
 * (lint / typecheck in CI without real secrets).
 */

const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "1" ||
  process.env.NODE_ENV === "test" ||
  process.env.VITEST !== undefined;

/**
 * Env values pasted through hosting dashboards or shell pipelines sometimes
 * arrive with surrounding quotes, leading/trailing whitespace, or a stray line
 * break — real (`\r`, `\n`, `\t`) or written literally as the characters `\` + `r`.
 * Any of those silently corrupts a URL or JWT: e.g. a trailing break on
 * `NEXT_PUBLIC_SUPABASE_URL` turns every auth call into a request to
 * `https://<ref>.supabase.co\r\n/auth/v1/token`, which the API routes as
 * `/r/n/auth/v1/token` and answers with 401. Strip that before validating.
 */
function cleanEnvString(value: string): string {
  return value
    .replace(/\\[rnt]/g, "")
    .replace(/[\r\n\t]/g, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

export function sanitizeEnv(value: unknown): unknown {
  return typeof value === "string" ? cleanEnvString(value) : value;
}

/** Exported for unit tests; the app uses `publicEnv` / `serverEnv`. */
export const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    sanitizeEnv,
    z.string().url("NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida")
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    sanitizeEnv,
    z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY es obligatoria")
  ),
  NEXT_PUBLIC_APP_URL: z.preprocess(
    sanitizeEnv,
    z.string().url("NEXT_PUBLIC_APP_URL debe ser una URL válida (ej. https://tu-dominio.com)")
  ),
});

const serverSchema = z.object({
  DATABASE_URL: z
    .preprocess(sanitizeEnv, z.string().min(1).optional())
    .describe("Connection string de Supabase (Session mode). Necesaria para pnpm db:* y migraciones."),
  SUPABASE_SERVICE_ROLE_KEY: z
    .preprocess(sanitizeEnv, z.string().min(1).optional())
    .describe("Service role de Supabase. Necesaria para alta de usuarios y recuperación de contraseña."),
});

// NEXT_PUBLIC_* vars must be referenced literally so Next.js can inline them
// into the client bundle at build time — a dynamic `process.env[key]` is not
// replaced.
const rawPublic = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

function formatIssues(issues: z.ZodIssue[]): string {
  return issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
}

type PublicEnv = z.infer<typeof publicSchema>;
type ServerEnv = z.infer<typeof serverSchema>;

function loadPublic(): PublicEnv {
  if (skipValidation) return rawPublic as PublicEnv;
  const parsed = publicSchema.safeParse(rawPublic);
  if (!parsed.success) {
    throw new Error(
      `Variables de entorno públicas inválidas o ausentes:\n${formatIssues(parsed.error.issues)}\n` +
        `Configúralas en .env.local o en tu hosting. Ver .env.example.`
    );
  }
  return parsed.data;
}

function loadServer(): ServerEnv {
  const raw: ServerEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  if (skipValidation) return raw;
  const parsed = serverSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Variables de entorno de servidor con formato inválido:\n${formatIssues(parsed.error.issues)}`
    );
  }
  return parsed.data;
}

export const publicEnv: PublicEnv = loadPublic();

const clientServerGuard = new Proxy<ServerEnv>(
  {},
  {
    get() {
      throw new Error("`serverEnv` no está disponible en el cliente. Usa `publicEnv`.");
    },
  }
);

export const serverEnv: ServerEnv =
  typeof window === "undefined" ? loadServer() : clientServerGuard;

/**
 * Reads a required server secret from the live environment, throwing a clear
 * error if it is absent. Use at the point of consumption so a read-only
 * deployment can still boot without it.
 */
export function requireServerEnv(key: keyof ServerEnv): string {
  const raw = process.env[key];
  const value = raw === undefined ? undefined : cleanEnvString(raw);
  if (value === undefined || value === "") {
    throw new Error(
      `Falta la variable de entorno ${key}. Configúrala en .env.local o en tu hosting (ver .env.example).`
    );
  }
  return value;
}
