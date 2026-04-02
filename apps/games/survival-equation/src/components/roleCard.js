import { COLORS } from "../config/constants.js";
import { ROLE_CONFIG } from "../config/roles.js";

/**
 * Role-specific info card showing the player's exclusive information.
 * Styled as in-world documents: blueprint, lab report, medical chart, or field map.
 */
export function createRoleCard(k) {
    let root = null;

    const STYLE_THEMES = {
        blueprint: {
            bg: [15, 25, 50],
            border: [60, 120, 200],
            accent: [100, 180, 255],
            headerText: "ENGINEERING BLUEPRINT",
            icon: "[BP]",
        },
        lab_report: {
            bg: [15, 20, 40],
            border: [80, 130, 200],
            accent: [120, 200, 255],
            headerText: "FIELD LAB REPORT",
            icon: "[LR]",
        },
        medical_chart: {
            bg: [15, 30, 20],
            border: [60, 180, 100],
            accent: [80, 220, 120],
            headerText: "MEDICAL ASSESSMENT",
            icon: "[MC]",
        },
        field_map: {
            bg: [25, 15, 35],
            border: [160, 80, 200],
            accent: [200, 100, 255],
            headerText: "SCOUT FIELD REPORT",
            icon: "[FM]",
        },
    };

    function show({ roleId, roleInfo, x = 790, y = 60 }) {
        destroy();

        const role = ROLE_CONFIG[roleId];
        if (!role || !roleInfo) return;

        const style = STYLE_THEMES[roleInfo.style || role.infoStyle] || STYLE_THEMES.blueprint;
        const cardW = 475;
        const lineH = 17;
        const cardH = 60 + roleInfo.lines.length * lineH + 20;

        root = k.add([k.pos(0, 0), k.fixed(), k.z(1150)]);

        // Card background
        root.add([
            k.rect(cardW, cardH),
            k.pos(x, y),
            k.color(...style.bg),
            k.opacity(0.95),
            k.outline(2, k.rgb(...style.border)),
        ]);

        // Header bar
        root.add([
            k.rect(cardW, 24),
            k.pos(x, y),
            k.color(...style.border),
            k.opacity(0.3),
        ]);

        // Header text
        root.add([
            k.text(`${style.icon} ${style.headerText}`, { size: 12 }),
            k.pos(x + 8, y + 5),
            k.color(...style.accent),
        ]);

        // Role label
        root.add([
            k.text(roleInfo.label || `${role.name}'s Data`, { size: 14 }),
            k.pos(x + 8, y + 30),
            k.color(...role.color),
        ]);

        // Divider
        root.add([
            k.rect(cardW - 16, 1),
            k.pos(x + 8, y + 50),
            k.color(...style.border),
            k.opacity(0.5),
        ]);

        // Info lines with bullet points
        for (let i = 0; i < roleInfo.lines.length; i++) {
            const ly = y + 58 + i * lineH;
            root.add([
                k.text(`> ${roleInfo.lines[i]}`, { size: 11, width: cardW - 24 }),
                k.pos(x + 12, ly),
                k.color(...COLORS.textPrimary),
            ]);
        }

        // Classification stamp
        root.add([
            k.text("EYES ONLY -- YOUR ROLE EXCLUSIVE", { size: 9 }),
            k.pos(x + cardW - 8, y + cardH - 14),
            k.anchor("right"),
            k.color(...style.accent),
            k.opacity(0.6),
        ]);
    }

    function destroy() {
        if (root && root.exists()) {
            k.destroy(root);
        }
        root = null;
    }

    return {
        show,
        destroy,
        isVisible() {
            return root !== null;
        },
    };
}
