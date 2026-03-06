import { NextRequest, NextResponse } from "next/server";
import { getDb, BatchEventsSchema } from "@edgame/shared";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = BatchEventsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = await getDb();
    const sessionId = `game_sessions:${params.id}`;

    let count = 0;
    for (const evt of parsed.data.events) {
      await db.create("game_events", {
        session: sessionId,
        event_type: evt.type,
        payload: evt.payload,
        ts: new Date(evt.ts).toISOString(),
      });
      count++;
    }

    return NextResponse.json({ inserted: count }, { status: 202 });
  } catch (err) {
    console.error("POST /api/sessions/[id]/events error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
