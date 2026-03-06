import { getRoleList } from "../config/roles.js";
import { SUBJECT_IDS } from "../config/constants.js";

export function registerRoleSelectScene({ k }) {
    k.scene("roleSelect", () => {
        let selectedRole = "attacker";
        let selectedSubject = SUBJECT_IDS.GENERAL;

        k.add([k.rect(k.width(), k.height()), k.color(8, 11, 23)]);
        k.add([
            k.text("Select Cadet Role", { size: 50 }),
            k.pos(k.width() / 2, 72),
            k.anchor("center"),
            k.color(100, 230, 255),
        ]);

        const roleInfoText = k.add([
            k.text("", { size: 22, width: 900 }),
            k.pos(k.width() / 2, 540),
            k.anchor("center"),
            k.color(180, 190, 220),
        ]);

        function updateInfo() {
            const role = getRoleList().find((r) => r.id === selectedRole);
            roleInfoText.text = `${role.name}: ${role.description}\nSubject Track: ${selectedSubject.toUpperCase()}`;
        }

        getRoleList().forEach((role, idx) => {
            const x = 180 + idx * 360;
            const y = 220;
            const card = k.add([
                k.rect(280, 200),
                k.pos(x, y),
                k.color(34, 41, 71),
                k.area(),
                k.outline(3, k.rgb(90, 108, 150)),
                "role-card",
                { roleId: role.id },
            ]);
            card.add([
                k.text(role.name, { size: 30 }),
                k.pos(140, 48),
                k.anchor("center"),
            ]);
            card.add([
                k.text(`(Press ${idx + 1})`, { size: 18 }),
                k.pos(140, 84),
                k.anchor("center"),
                k.color(160, 170, 210),
            ]);
            card.add([
                k.text(role.actions.map((a) => `${a.key}: ${a.label}`).join("\n"), { size: 16, width: 240 }),
                k.pos(20, 118),
            ]);
            card.onClick(() => {
                selectedRole = role.id;
                updateCardVisuals();
                updateInfo();
            });
        });

        const subjectOptions = [SUBJECT_IDS.GENERAL, SUBJECT_IDS.MATH, SUBJECT_IDS.SCIENCE];
        subjectOptions.forEach((subjectId, idx) => {
            const btn = k.add([
                k.rect(220, 54),
                k.pos(190 + idx * 300, 450),
                k.color(52, 60, 92),
                k.area(),
                k.outline(2, k.rgb(100, 110, 140)),
                "subject-btn",
                { subjectId },
            ]);
            btn.add([
                k.text(subjectId.toUpperCase(), { size: 22 }),
                k.pos(110, 27),
                k.anchor("center"),
            ]);
            btn.onClick(() => {
                selectedSubject = subjectId;
                updateCardVisuals();
                updateInfo();
            });
        });

        function updateCardVisuals() {
            for (const card of k.get("role-card")) {
                card.outline.color = card.roleId === selectedRole ? k.rgb(95, 230, 255) : k.rgb(90, 108, 150);
            }
            for (const btn of k.get("subject-btn")) {
                btn.outline.color = btn.subjectId === selectedSubject ? k.rgb(255, 176, 96) : k.rgb(100, 110, 140);
            }
        }

        updateCardVisuals();
        updateInfo();

        const startBtn = k.add([
            k.rect(340, 70),
            k.pos(k.width() / 2 - 170, 620),
            k.color(30, 110, 150),
            k.area(),
            k.outline(3, k.rgb(90, 235, 255)),
        ]);
        startBtn.add([
            k.text("BEGIN ARENA TRIAL", { size: 26 }),
            k.pos(170, 35),
            k.anchor("center"),
        ]);
        startBtn.onClick(() => k.go("arenaBriefing", { roleId: selectedRole, subjectId: selectedSubject }));

        k.onKeyPress("1", () => {
            selectedRole = "attacker";
            updateCardVisuals();
            updateInfo();
        });
        k.onKeyPress("2", () => {
            selectedRole = "healer";
            updateCardVisuals();
            updateInfo();
        });
        k.onKeyPress("3", () => {
            selectedRole = "builder";
            updateCardVisuals();
            updateInfo();
        });
        k.onKeyPress("enter", () => k.go("arenaBriefing", { roleId: selectedRole, subjectId: selectedSubject }));
        k.onKeyPress("escape", () => k.go("menu"));
    });
}
