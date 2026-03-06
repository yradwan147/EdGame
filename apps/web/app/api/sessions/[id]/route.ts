import { NextRequest, NextResponse } from "next/server";
import { getDb, UpdateSessionSchema } from "@edgame/shared";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    const [session] = await db.select(`game_sessions:${params.id}`);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (err) {
    console.error("GET /api/sessions/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = UpdateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = await getDb();
    const updates: Record<string, unknown> = {};
    if (parsed.data.completed !== undefined) updates.completed = parsed.data.completed;
    if (parsed.data.score !== undefined) updates.score = parsed.data.score;
    if (parsed.data.durationSeconds !== undefined) {
      updates.duration_seconds = parsed.data.durationSeconds;
      updates.ended_at = new Date().toISOString();
    }

    const [updated] = await db.merge(`game_sessions:${params.id}`, updates);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/sessions/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
