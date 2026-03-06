export function registerPostGameScene({ k, telemetry }) {
    k.scene("postGame", ({ summary }) => {
        const sessions = telemetry.getAllSessions();
        const recent = sessions.slice(0, 5);

        k.add([k.rect(k.width(), k.height()), k.color(10, 12, 24)]);
        k.add([
            k.text("After-Action Review", { size: 60 }),
            k.pos(k.width() / 2, 80),
            k.anchor("center"),
            k.color(102, 233, 255),
        ]);

        const winLine = summary?.winnerTeamId === "ally" ? "MISSION SUCCESS" : "MISSION FAILED";
        k.add([
            k.text(winLine, { size: 38 }),
            k.pos(k.width() / 2, 145),
            k.anchor("center"),
            k.color(summary?.winnerTeamId === "ally" ? 100 : 255, summary?.winnerTeamId === "ally" ? 235 : 90, 130),
        ]);

        const dataText = [
            `Duration: ${Math.round((summary?.durationMs ?? 0) / 1000)}s`,
            `Questions Answered: ${summary?.questionsAnswered ?? 0}`,
            `Correctness: ${Math.round((summary?.correctRate ?? 0) * 100)}%`,
            `Average Response: ${Math.round(summary?.avgResponseMs ?? 0)}ms`,
            `Pulse Profile: ${summary?.pulseLabel ?? "N/A"}`,
            `Final HP: ${Math.round(summary?.playerFinalHp ?? 0)}`,
            `Level: ${summary?.profile?.level ?? 1}`,
            `Badges: ${(summary?.profile?.badges ?? []).join(", ") || "None"}`,
        ].join("\n");

        k.add([
            k.rect(560, 380),
            k.pos(70, 210),
            k.color(24, 28, 47),
            k.outline(2, k.rgb(90, 104, 144)),
        ]);
        k.add([
            k.text(dataText, { size: 22, width: 520 }),
            k.pos(92, 238),
        ]);

        k.add([
            k.rect(560, 380),
            k.pos(650, 210),
            k.color(24, 28, 47),
            k.outline(2, k.rgb(90, 104, 144)),
        ]);
        k.add([
            k.text("Recent Sessions", { size: 28 }),
            k.pos(670, 240),
            k.color(255, 190, 110),
        ]);
        k.add([
            k.text(
                recent
                    .map((s, idx) => {
                        const correctRate = Math.round((s.summary?.correctRate ?? 0) * 100);
                        const durationSec = Math.round((s.summary?.durationMs ?? 0) / 1000);
                        return `${idx + 1}. ${new Date(s.startedAt).toLocaleString()}\n   ${s.summary?.winnerTeamId} | ${correctRate}% | ${durationSec}s`;
                    })
                    .join("\n\n") || "No previous sessions",
                { size: 16, width: 520 },
            ),
            k.pos(670, 280),
        ]);

        const exportBtn = k.add([
            k.rect(290, 62),
            k.pos(70, 630),
            k.color(45, 93, 130),
            k.area(),
            k.outline(2, k.rgb(104, 224, 255)),
        ]);
        exportBtn.add([k.text("Export Sessions JSON", { size: 24 }), k.pos(145, 31), k.anchor("center")]);
        exportBtn.onClick(() => {
            const blob = new Blob([telemetry.exportSessions()], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "pulse-realms-sessions.json";
            link.click();
            URL.revokeObjectURL(link.href);
        });

        const replayBtn = k.add([
            k.rect(280, 62),
            k.pos(940, 630),
            k.color(32, 120, 146),
            k.area(),
            k.outline(2, k.rgb(102, 233, 255)),
        ]);
        replayBtn.add([k.text("Play Again", { size: 28 }), k.pos(140, 31), k.anchor("center")]);
        replayBtn.onClick(() => k.go("roleSelect"));

        k.onKeyPress("enter", () => k.go("roleSelect"));
        k.onKeyPress("escape", () => k.go("menu"));
    });
}
