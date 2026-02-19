import "dotenv/config";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import * as schema from "@shared/schema";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Database connection setup.
 *
 * - Production: Uses PostgreSQL via DATABASE_URL (required)
 * - Development: Uses PGlite with file persistence (./data/pglite),
 *   migrations applied automatically at startup via drizzle-orm/pglite/migrator.
 */

let db: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzlePglite>;
let pool: Pool | null = null;

if (isProduction) {
	if (!process.env.DATABASE_URL) {
		throw new Error(
			"DATABASE_URL must be set in production. Did you forget to provision a database?",
		);
	}
	pool = new Pool({ connectionString: process.env.DATABASE_URL });
	db = drizzlePg(process.env.DATABASE_URL, { schema });
	console.log("[DB] Connected to PostgreSQL (production)");
} else {
	const pgliteDataDir = "./data/pglite";
	const client = new PGlite(pgliteDataDir);
	db = drizzlePglite(client, { schema });
	console.log(`[DB] Using PGlite for development (data: ${pgliteDataDir})`);
}

/**
 * Applies migrations to PGlite in development mode.
 * No-op in production (schema managed via `pnpm db:push` with DATABASE_URL).
 */
async function initDevDatabase() {
	if (isProduction) return;

	const { migrate } = await import("drizzle-orm/pglite/migrator");
	await migrate(db as ReturnType<typeof drizzlePglite>, {
		migrationsFolder: "./migrations",
	});
	console.log("[DB] PGlite migrations applied");
}

export { db, pool, initDevDatabase };
