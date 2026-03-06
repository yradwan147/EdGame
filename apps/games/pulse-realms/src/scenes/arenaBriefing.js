import { getRole } from "../config/roles.js";

export function registerArenaBriefingScene({ k }) {
    k.scene("arenaBriefing", ({ roleId, subjectId }) => {
        const role = getRole(roleId);
        k.add([k.rect(k.width(), k.height()), k.color(9, 12, 26)]);

        k.add([
            k.text("Arena Briefing", { size: 56 }),
            k.pos(k.width() / 2, 62),
            k.anchor("center"),
            k.color(102, 233, 255),
        ]);

        k.add([
            k.rect(1120, 480),
            k.pos(80, 120),
            k.color(20, 24, 42),
            k.outline(2, k.rgb(85, 105, 150)),
        ]);

        const briefing = [
            `Role: ${role.name} | Subject Track: ${subjectId.toUpperCase()}`,
            "",
            "Your goal:",
            "- Win by eliminating all enemies OR by reaching objective score 100 first.",
            "- Stand near the center objective to earn points over time.",
            "",
            "How attacking works:",
            "- Yes, you must be close enough for your ability range.",
            "- Press ability key, answer MCQ, then effect resolves.",
            "- Faster correct answers increase action power.",
            "",
            "How AI teammates work:",
            "- Ally healer prioritizes low-HP allies.",
            "- Ally attacker pressures nearest threats.",
            "- Ally builder uses control abilities and supports engagements.",
            "",
            "Controls:",
            "- Move with WASD or Arrow keys.",
            "- Use ability 1 and 2 keys to cast your role skills.",
            "- Hover ability cards in arena HUD for tooltips.",
            "- Press H for tactical hints during match.",
        ].join("\n");

        k.add([
            k.text(briefing, { size: 24, width: 1060 }),
            k.pos(110, 152),
            k.color(215, 225, 255),
        ]);

        const startBtn = k.add([
            k.rect(320, 72),
            k.pos(k.width() / 2 - 160, 625),
            k.color(35, 116, 150),
            k.area(),
            k.outline(3, k.rgb(90, 235, 255)),
        ]);
        startBtn.add([
            k.text("START ARENA", { size: 34 }),
            k.pos(160, 36),
            k.anchor("center"),
        ]);
        startBtn.onClick(() => k.go("arena", { roleId, subjectId }));

        k.onKeyPress("enter", () => k.go("arena", { roleId, subjectId }));
        k.onKeyPress("escape", () => k.go("roleSelect"));
    });
}
