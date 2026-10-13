import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build" &&
    // A Vercel deployment without a database serves only clearly labeled visual
    // preview routes. Those routes never query Postgres; we must still allow
    // module imports of the shared DB client to complete.
    !(process.env.VERCEL === "1" && !process.env.DATABASE_URL)
    ? (() => { throw new Error("DATABASE_URL must be set in production"); })()
    : "postgres://swap:swap@127.0.0.1:5432/swap");

// Reuse one pool across hot reloads in dev.
const globalForDb = globalThis as unknown as { __swapSql?: ReturnType<typeof postgres> };
const client = globalForDb.__swapSql ?? postgres(url, { max: 10, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.__swapSql = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export type DB = typeof db;
export { schema };
