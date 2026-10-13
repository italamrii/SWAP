// Plain-JS migrator for production images (no tsx). Usage: DATABASE_URL=... node scripts/migrate.mjs
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const client = postgres(url, { max: 1, onnotice: () => {} });
await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
console.log("✓ migrations applied");
await client.end();
