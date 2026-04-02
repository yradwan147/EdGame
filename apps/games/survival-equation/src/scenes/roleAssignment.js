import { COLORS, ROLE_IDS } from "../config/constants.js";
import { ROLE_CONFIG, getRoleList, getOtherRoles } from "../config/roles.js";
import { getScenario } from "../config/scenarios.js";

export function registerRoleAssignmentScene({ k, gameStateStore, telemetry, progression }) {
    k.scene("roleAssignment", () => {
        const state = gameStateStore.getState();
        const scenarioId = state.scenarioId;
        const scenario = getScenario(scenarioId);

        k.add([k.rect(k.width(), k.height()), k.color(...COLORS.bgDark)]);

        k.add([
            k.text("CHOOSE YOUR ROLE", { size: 38 }),
            k.pos(k.width() / 2, 40),
            k.anchor("center"),
            k.color(...COLORS.xpGold),
        ]);

        k.add([
            k.text(`${scenario.name}: ${scenario.subtitle}`, { size: 18 }),
            k.pos(k.width() / 2, 80),
            k.anchor("center"),
            k.color(...COLORS.textSecondary),
        ]);

        k.add([
            k.text("You pick one role. AI fills the other three. Each has unique expertise only they can see.", { size: 15 }),
            k.pos(k.width() / 2, 110),
            k.anchor("center"),
            k.color(...COLORS.textMuted),
        ]);

        const roles = getRoleList();
        const CARD_W = 280;
        const CARD_H = 420;
        const GAP = 20;
        const startX = (k.width() - (roles.length * CARD_W + (roles.length - 1) * GAP)) / 2;

        for (let i = 0; i < roles.length; i++) {
            const role = roles[i];
            const cx = startX + i * (CARD_W + GAP);
            const cy = 140;

            const card = k.add([
                k.rect(CARD_W, CARD_H),
                k.pos(cx, cy),
                k.color(...COLORS.bgCard),
                k.area(),
                k.outline(3, k.rgb(...role.color)),
            ]);

            // Portrait icon placeholder
            card.add([
                k.circle(35),
                k.pos(CARD_W / 2, 50),
                k.anchor("center"),
                k.color(...role.color),
                k.opacity(0.3),
            ]);
            card.add([
                k.text(role.name[0], { size: 36 }),
                k.pos(CARD_W / 2, 50),
                k.anchor("center"),
                k.color(...role.color),
            ]);

            // Name and title
            card.add([
                k.text(role.name, { size: 24 }),
                k.pos(CARD_W / 2, 100),
                k.anchor("center"),
                k.color(...role.color),
            ]);
            card.add([
                k.text(role.title, { size: 14 }),
                k.pos(CARD_W / 2, 126),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
            ]);

            // Expertise
            card.add([
                k.rect(CARD_W - 20, 2),
                k.pos(10, 148),
                k.color(...role.color),
                k.opacity(0.3),
            ]);
            card.add([
                k.text(`Expertise: ${role.expertise}`, { size: 14 }),
                k.pos(CARD_W / 2, 162),
                k.anchor("center"),
                k.color(...COLORS.xpGold),
            ]);

            // Description
            card.add([
                k.text(role.description, { size: 12, width: CARD_W - 24 }),
                k.pos(12, 190),
                k.color(...COLORS.textPrimary),
            ]);

            // Info style hint
            card.add([
                k.text(`Sees: ${role.infoStyle.replace("_", " ")} documents`, { size: 12 }),
                k.pos(CARD_W / 2, CARD_H - 70),
                k.anchor("center"),
                k.color(...COLORS.textMuted),
            ]);

            // Select button
            const selectBtn = card.add([
                k.rect(CARD_W - 30, 42),
                k.pos(15, CARD_H - 55),
                k.color(...role.color),
                k.area(),
                k.opacity(0.7),
            ]);
            selectBtn.add([
                k.text(`PLAY AS ${role.name.toUpperCase()}`, { size: 16 }),
                k.pos((CARD_W - 30) / 2, 21),
                k.anchor("center"),
                k.color(255, 255, 255),
            ]);

            card.onClick(() => selectRole(role.id));

            card.onHover(() => {
                card.outline.width = 4;
            });
            card.onHoverEnd(() => {
                card.outline.width = 3;
            });
        }

        // Keyboard shortcuts
        k.add([
            k.text("Press 1-4 to select: 1=Raza  2=Juno  3=Kit  4=Navi", { size: 14 }),
            k.pos(k.width() / 2, k.height() - 40),
            k.anchor("center"),
            k.color(...COLORS.textMuted),
        ]);
        const roleIds = [ROLE_IDS.ENGINEER, ROLE_IDS.SCIENTIST, ROLE_IDS.MEDIC, ROLE_IDS.NAVIGATOR];
        ["1", "2", "3", "4"].forEach((key, idx) => {
            k.onKeyPress(key, () => selectRole(roleIds[idx]));
        });

        async function selectRole(roleId) {
            const otherRoles = getOtherRoles(roleId).map((r) => r.id);
            const allRoles = [ROLE_IDS.ENGINEER, ROLE_IDS.SCIENTIST, ROLE_IDS.MEDIC, ROLE_IDS.NAVIGATOR];

            const sessionId = await telemetry.beginSession({
                environmentId: "survival-equation",
                scenarioId,
                playerRole: roleId,
            });

            gameStateStore.startScenario({
                sessionId,
                scenarioId,
                scenarioData: scenario,
                playerRole: roleId,
                aiPartners: allRoles,
            });

            telemetry.event("role_selected", { roleId, scenarioId });
            k.go("survivalHub");
        }

        // Back
        k.onKeyPress("escape", () => k.go("scenarioSelect"));
    });
}
