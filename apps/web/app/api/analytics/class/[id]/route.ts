import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@edgame/shared";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    const classId = `classes:${params.id}`;
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");

    // Get class members
    const members = await db.query(
      "SELECT student FROM class_members WHERE class = $classId",
      { classId }
    );
    const studentIds = (members[0] as any[])?.map((m: any) => m.student) ?? [];

    // Get session stats for those students
    const sessions = await db.query(
      `SELECT
        count() AS total_sessions,
        math::mean(duration_seconds) AS avg_duration,
        count(DISTINCT student) AS active_students
      FROM game_sessions
      WHERE student INSIDE $studentIds
      GROUP ALL`,
      { studentIds }
    );

    // Get accuracy from computed metrics
    const metrics = await db.query(
      `SELECT
        math::mean(correctness_rate) AS avg_accuracy,
        math::mean(avg_response_time_ms) AS avg_response_time
      FROM computed_metrics
      WHERE student INSIDE $studentIds
      GROUP ALL`,
      { studentIds }
    );

    const sessionStats = (sessions[0] as any[])?.[0] ?? {};
    const metricStats = (metrics[0] as any[])?.[0] ?? {};

    return NextResponse.json({
      classId: params.id,
      period: { from: from ?? "all", to: to ?? "now" },
      summary: {
        totalSessions: sessionStats.total_sessions ?? 0,
        avgAccuracy: metricStats.avg_accuracy ?? 0,
        avgResponseTimeMs: metricStats.avg_response_time ?? 0,
        activeStudents: sessionStats.active_students ?? 0,
        totalStudents: studentIds.length,
      },
    });
  } catch (err) {
    console.error("GET /api/analytics/class/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
