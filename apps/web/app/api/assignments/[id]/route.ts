import { NextRequest, NextResponse } from "next/server";
import { getDb, UpdateAssignmentSchema } from "@edgame/shared";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    const [assignment] = await db.select(`assignments:${params.id}`);
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    return NextResponse.json(assignment);
  } catch (err) {
    console.error("GET /api/assignments/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = UpdateAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = await getDb();
    const updates: Record<string, unknown> = {};
    if (parsed.data.title) updates.title = parsed.data.title;
    if (parsed.data.instructions !== undefined) updates.instructions = parsed.data.instructions;
    if (parsed.data.dueAt !== undefined) updates.due_at = parsed.data.dueAt;
    if (parsed.data.config) updates.config = parsed.data.config;

    const [updated] = await db.merge(`assignments:${params.id}`, updates);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/assignments/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    await db.delete(`assignments:${params.id}`);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /api/assignments/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
