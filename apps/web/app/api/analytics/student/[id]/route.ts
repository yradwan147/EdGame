import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@edgame/shared";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    const studentId = `users:${params.id}`;

    // Get latest computed metrics
    const metrics = await db.query(
      `SELECT * FROM computed_metrics
       WHERE student = $studentId
       ORDER BY computed_at DESC
       LIMIT 10`,
      { studentId }
    );

    // Get session history
    const sessions = await db.query(
      `SELECT * FROM game_sessions
       WHERE student = $studentId
       ORDER BY started_at DESC
       LIMIT 20`,
      { studentId }
    );

    // Get daily rollups
    const daily = await db.query(
      `SELECT * FROM student_metrics_daily
       WHERE student = $studentId
       ORDER BY date DESC
       LIMIT 7`,
      { studentId }
    );

    const metricsList = (metrics[0] as any[]) ?? [];
    const avg = (arr: any[], field: string) => {
      const vals = arr.map((m) => m[field]).filter((v) => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    return NextResponse.json({
      studentId: params.id,
      dimensions: {
        d1_cognitive: {
          overallAccuracy: avg(metricsList, "correctness_rate"),
          avgResponseTimeMs: avg(metricsList, "avg_response_time_ms"),
          questionsAttempted: metricsList.reduce((s, m) => s + (m.questions_attempted ?? 0), 0),
        },
        d2_engagement: {
          totalTimeSecs: metricsList.reduce((s, m) => s + (m.total_time_seconds ?? 0), 0),
          sessionCount: (sessions[0] as any[])?.length ?? 0,
          completionRate: avg(metricsList, "completion_rate"),
        },
        d3_strategic: {
          actionVariation: avg(metricsList, "action_variation_index"),
          preferredRole: metricsList[0]?.role_chosen ?? "unknown",
        },
        d4_social: {
          teammateInteractions: metricsList.reduce((s, m) => s + (m.teammate_interactions ?? 0), 0),
          healActions: metricsList.reduce((s, m) => s + (m.heal_actions ?? 0), 0),
          shieldActions: metricsList.reduce((s, m) => s + (m.shield_actions ?? 0), 0),
        },
        d5_sel: {
          persistence: avg(metricsList, "persistence_after_failure"),
          frustration: avg(metricsList, "frustration_score"),
        },
        d6_temporal: {
          learningVelocity: avg(metricsList, "learning_velocity"),
          responseConsistency: avg(metricsList, "response_consistency"),
          dailyAccuracy: ((daily[0] as any[]) ?? []).map((d: any) => ({
            date: d.date,
            accuracy: d.accuracy,
          })),
        },
      },
      recentSessions: (sessions[0] as any[]) ?? [],
    });
  } catch (err) {
    console.error("GET /api/analytics/student/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
