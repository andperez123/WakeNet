import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(connectionString);

async function runMigration(name: string, content: string) {
  // Strip full-line comments before splitting so they don't hide real statements
  const cleaned = content
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
  const statements = cleaned
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const statement of statements) {
    await sql(statement + ";");
  }
  console.log(`Migration ${name} applied.`);
}

async function migrate() {
  const drizzleDir = join(process.cwd(), "drizzle");
  const migrations = ["0000_init.sql", "0001_promoter_delivery.sql"];
  for (const file of migrations) {
    const path = join(drizzleDir, file);
    try {
      const content = readFileSync(path, "utf-8");
      await runMigration(file.replace(".sql", ""), content);
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw e;
    }
  }
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
