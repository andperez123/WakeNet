import { NextResponse } from "next/server";
import { db, feeds } from "@/lib/db";

export async function GET() {
  let dbStatus: "ok" | "not_configured" | "error" = "not_configured";
  if (db) {
    try {
      await db.select().from(feeds).limit(1);
      dbStatus = "ok";
    } catch {
      dbStatus = "error";
    }
  }
  const ok = dbStatus === "ok" || dbStatus === "not_configured";
  return NextResponse.json(
    {
      ok,
      db: dbStatus,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
