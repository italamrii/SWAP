import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL ?? "postgres://swap:swap@127.0.0.1:5432/swap";
const client = postgres(url, { max: 1, onnotice: () => {} });

await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
console.log("✓ migrations applied");
await client.end();
