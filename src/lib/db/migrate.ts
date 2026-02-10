import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(connectionString);

async function migrate() {
  const migration = readFileSync(
    join(process.cwd(), "drizzle", "0000_init.sql"),
    "utf-8"
  );
  const statements = migration
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
  for (const statement of statements) {
    await sql(statement + ";");
  }
  console.log("Migration 0000_init applied.");
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
