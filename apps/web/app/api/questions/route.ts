import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@edgame/shared";

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const subject = req.nextUrl.searchParams.get("subject") || "general";

    const results = await db.query(
      "SELECT * FROM questions WHERE subject = $subject ORDER BY difficulty",
      { subject }
    );
    return NextResponse.json({ questions: results[0] ?? [] });
  } catch (err) {
    console.error("GET /api/questions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
