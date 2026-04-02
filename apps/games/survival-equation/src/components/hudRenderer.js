import { COLORS } from "../config/constants.js";
import { ROLE_CONFIG } from "../config/roles.js";

/**
 * HUD for survival scenario.
 * Top: day counter + timer (sky darkens as time low) + scenario name
 * Left: resource bars (food/water/materials)
 * Right: team health indicators
 */
export function createHudRenderer(k) {
    const refs = {};

    function init({ scenarioName, totalDays }) {
        // Top bar background
        k.add([k.rect(k.width(), 52), k.pos(0, 0), k.color(...COLORS.bgPanel), k.opacity(0.92), k.fixed(), k.z(1200)]);

        // Day counter
        refs.dayText = k.add([
            k.text("Day 1", { size: 22 }),
            k.pos(20, 15),
            k.fixed(),
            k.z(1201),
            k.color(...COLORS.xpGold),
        ]);

        // Scenario name
        k.add([
            k.text(scenarioName || "Survival Scenario", { size: 16 }),
            k.pos(k.width() / 2, 15),
            k.anchor("top"),
            k.fixed(),
            k.z(1201),
            k.color(...COLORS.textSecondary),
        ]);

        // Timer
        refs.timerText = k.add([
            k.text("3:30", { size: 22 }),
            k.pos(k.width() - 20, 15),
            k.anchor("topright"),
            k.fixed(),
            k.z(1201),
            k.color(...COLORS.textPrimary),
        ]);

        // Sky overlay (darkens as timer runs low)
        refs.skyOverlay = k.add([
            k.rect(k.width(), k.height()),
            k.pos(0, 0),
            k.color(0, 0, 0),
            k.opacity(0),
            k.fixed(),
            k.z(50),
        ]);

        // Resource bars (left side)
        k.add([k.rect(160, 120), k.pos(8, 62), k.color(...COLORS.bgPanel), k.opacity(0.88), k.fixed(), k.z(1200)]);
        const resourceY = 70;
        const barW = 100;

        // Food bar
        k.add([k.text("Food", { size: 12 }), k.pos(14, resourceY), k.fixed(), k.z(1202), k.color(...COLORS.resourceFood)]);
        k.add([k.rect(barW, 12), k.pos(58, resourceY + 2), k.color(40, 40, 40), k.fixed(), k.z(1201)]);
        refs.foodBar = k.add([k.rect(barW, 12), k.pos(58, resourceY + 2), k.color(...COLORS.resourceFood), k.fixed(), k.z(1202)]);
        refs.foodText = k.add([k.text("50", { size: 11 }), k.pos(barW + 62, resourceY + 2), k.fixed(), k.z(1202), k.color(...COLORS.textPrimary)]);

        // Water bar
        k.add([k.text("Water", { size: 12 }), k.pos(14, resourceY + 28), k.fixed(), k.z(1202), k.color(...COLORS.resourceWater)]);
        k.add([k.rect(barW, 12), k.pos(58, resourceY + 30), k.color(40, 40, 40), k.fixed(), k.z(1201)]);
        refs.waterBar = k.add([k.rect(barW, 12), k.pos(58, resourceY + 30), k.color(...COLORS.resourceWater), k.fixed(), k.z(1202)]);
        refs.waterText = k.add([k.text("50", { size: 11 }), k.pos(barW + 62, resourceY + 30), k.fixed(), k.z(1202), k.color(...COLORS.textPrimary)]);

        // Materials bar
        k.add([k.text("Matrl", { size: 12 }), k.pos(14, resourceY + 56), k.fixed(), k.z(1202), k.color(...COLORS.resourceMaterials)]);
        k.add([k.rect(barW, 12), k.pos(58, resourceY + 58), k.color(40, 40, 40), k.fixed(), k.z(1201)]);
        refs.materialsBar = k.add([k.rect(barW, 12), k.pos(58, resourceY + 58), k.color(...COLORS.resourceMaterials), k.fixed(), k.z(1202)]);
        refs.materialsText = k.add([k.text("50", { size: 11 }), k.pos(barW + 62, resourceY + 58), k.fixed(), k.z(1202), k.color(...COLORS.textPrimary)]);

        // Team health (right side)
        k.add([k.rect(165, 120), k.pos(k.width() - 173, 62), k.color(...COLORS.bgPanel), k.opacity(0.88), k.fixed(), k.z(1200)]);
        refs.teamHealthTexts = {};
        let hIdx = 0;
        for (const [roleId, config] of Object.entries(ROLE_CONFIG)) {
            const hy = 70 + hIdx * 26;
            k.add([
                k.text(config.name, { size: 13 }),
                k.pos(k.width() - 165, hy),
                k.fixed(),
                k.z(1202),
                k.color(...config.color),
            ]);
            refs.teamHealthTexts[roleId] = k.add([
                k.text("100%", { size: 13 }),
                k.pos(k.width() - 20, hy),
                k.anchor("topright"),
                k.fixed(),
                k.z(1202),
                k.color(...COLORS.textPrimary),
            ]);
            hIdx += 1;
        }

        // Warning text
        refs.warningText = k.add([
            k.text("", { size: 14, width: 500 }),
            k.pos(k.width() / 2, 48),
            k.anchor("top"),
            k.fixed(),
            k.z(1203),
            k.color(...COLORS.dangerOrange),
        ]);
    }

    function update({ day, timerSec, resources, teamHealth, maxResource = 100, warning = "" }) {
        if (refs.dayText) refs.dayText.text = `Day ${day}`;

        if (refs.timerText) {
            const m = Math.floor(timerSec / 60);
            const s = Math.floor(timerSec % 60).toString().padStart(2, "0");
            refs.timerText.text = `${m}:${s}`;
            if (timerSec < 30) {
                refs.timerText.color = k.rgb(...COLORS.dangerRed);
            } else if (timerSec < 60) {
                refs.timerText.color = k.rgb(...COLORS.dangerOrange);
            } else {
                refs.timerText.color = k.rgb(...COLORS.textPrimary);
            }
        }

        // Sky darkening effect
        if (refs.skyOverlay) {
            const urgency = Math.max(0, 1 - timerSec / 210);
            refs.skyOverlay.opacity = urgency * 0.25;
        }

        // Resources
        const barW = 100;
        if (refs.foodBar) {
            refs.foodBar.width = barW * Math.min(1, (resources.food || 0) / maxResource);
            refs.foodText.text = String(Math.round(resources.food || 0));
        }
        if (refs.waterBar) {
            refs.waterBar.width = barW * Math.min(1, (resources.water || 0) / maxResource);
            refs.waterText.text = String(Math.round(resources.water || 0));
        }
        if (refs.materialsBar) {
            refs.materialsBar.width = barW * Math.min(1, (resources.materials || 0) / maxResource);
            refs.materialsText.text = String(Math.round(resources.materials || 0));
        }

        // Team health
        if (refs.teamHealthTexts && teamHealth) {
            for (const [roleId, textObj] of Object.entries(refs.teamHealthTexts)) {
                const hp = teamHealth[roleId] ?? 0;
                textObj.text = `${Math.round(hp)}%`;
                if (hp < 30) textObj.color = k.rgb(...COLORS.dangerRed);
                else if (hp < 60) textObj.color = k.rgb(...COLORS.dangerOrange);
                else textObj.color = k.rgb(...COLORS.safeGreen);
            }
        }

        // Warning
        if (refs.warningText) {
            refs.warningText.text = warning;
        }
    }

    return { init, update };
}
