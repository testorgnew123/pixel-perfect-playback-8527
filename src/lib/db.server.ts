import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../drizzle/schema";

function createDb() {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) throw new Error("Missing DATABASE_URL environment variable.");
  // `prepare: false`: Neon's pooled (pgbouncer, transaction-mode) connection
  // string doesn't support prepared statements.
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

let _db: ReturnType<typeof createDb> | undefined;

// Lazy, like the Supabase clients it replaces: importing this module (e.g. via
// routeTree.gen.ts pulling in every route) must not require DATABASE_URL to be set.
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop, receiver) {
    if (!_db) _db = createDb();
    return Reflect.get(_db, prop, receiver);
  },
});
