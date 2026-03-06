import { NextRequest, NextResponse } from "next/server";
import { getDb, CreateAssignmentSchema } from "@edgame/shared";

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const classId = req.nextUrl.searchParams.get("classId");

    let query = "SELECT * FROM assignments ORDER BY created_at DESC";
    if (classId) {
      query = `SELECT * FROM assignments WHERE class = classes:${classId} ORDER BY created_at DESC`;
    }
    const results = await db.query(query);
    return NextResponse.json({ assignments: results[0] ?? [] });
  } catch (err) {
    console.error("GET /api/assignments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = await getDb();
    const { title, environmentId, classId, instructions, dueAt, config } = parsed.data;

    const [assignment] = await db.create("assignments", {
      teacher: "users:teacher_01", // TODO: replace with auth user
      environment: `game_environments:${environmentId.replace(/-/g, "_")}`,
      class: classId ? `classes:${classId}` : undefined,
      title,
      instructions,
      due_at: dueAt,
      config: config ?? {},
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (err) {
    console.error("POST /api/assignments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
