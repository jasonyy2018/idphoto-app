import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// ─── Connection ───────────────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

/**
 * Use a single connection pool throughout the app.
 * In Next.js, module-level singletons persist across hot reloads in dev.
 */
const globalForDb = globalThis as unknown as {
  dbClient: postgres.Sql | undefined;
};

const client = globalForDb.dbClient ?? postgres(connectionString, { max: 10 });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.dbClient = client;
}

export const db = drizzle(client, { schema });
