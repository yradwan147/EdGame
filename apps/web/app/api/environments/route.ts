import { NextResponse } from "next/server";
import { getDb } from "@edgame/shared";

export async function GET() {
  try {
    const db = await getDb();
    const results = await db.query(
      "SELECT * FROM game_environments WHERE is_active = true ORDER BY name"
    );
    return NextResponse.json({ environments: results[0] ?? [] });
  } catch (err) {
    console.error("GET /api/environments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
