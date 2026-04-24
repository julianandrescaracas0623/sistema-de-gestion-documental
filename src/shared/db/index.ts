import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as profiles from "./profiles.schema";

const schema = { ...profiles };

const client = postgres(process.env.DATABASE_URL ?? "");

export const db = drizzle(client, { schema });
