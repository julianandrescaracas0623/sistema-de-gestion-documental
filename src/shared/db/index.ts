import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as categories from "./categories.schema";
import * as documents from "./documents.schema";
import * as profiles from "./profiles.schema";
import * as tags from "./tags.schema";
import * as userRoles from "./user_roles.schema";

const schema = { ...profiles, ...categories, ...documents, ...tags, ...userRoles };

const client = postgres(process.env.DATABASE_URL ?? "");

export const db = drizzle(client, { schema });
