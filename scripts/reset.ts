import postgres from "postgres";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset in production");
const url = process.env.DATABASE_URL ?? "postgres://swap:swap@127.0.0.1:5432/swap";
const sql = postgres(url, { max: 1, onnotice: () => {} });
await sql`DROP SCHEMA IF EXISTS public CASCADE`;
await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
await sql`CREATE SCHEMA public`;
console.log("✓ database reset");
await sql.end();
