import { NextRequest, NextResponse } from "next/server";
import { getDb, CreateSessionSchema } from "@edgame/shared";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = await getDb();
    const { environmentId, assignmentId } = parsed.data;

    const [session] = await db.create("game_sessions", {
      student: "users:student_01", // TODO: replace with auth user
      environment: `game_environments:${environmentId.replace(/-/g, "_")}`,
      assignment: assignmentId ? `assignments:${assignmentId}` : undefined,
      started_at: new Date().toISOString(),
      completed: false,
    });

    return NextResponse.json({ sessionId: session.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/sessions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
