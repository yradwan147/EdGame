import { COLORS } from "../config/constants.js";

/**
 * Resource allocation panel: shows shared pool + drag sliders for distribution.
 * Used during the allocation phase and trade negotiation puzzles.
 */
export function createResourcePanel(k) {
    let root = null;
    let refs = {};
    let onAllocationChange = null;

    function init({ resources, onAllocate }) {
        onAllocationChange = onAllocate;

        root = k.add([k.pos(0, 0), k.fixed(), k.z(1300)]);

        // Backdrop
        root.add([
            k.rect(k.width(), k.height()),
            k.color(0, 0, 0),
            k.opacity(0.6),
        ]);

        // Panel
        const pw = 600;
        const ph = 380;
        const px = (k.width() - pw) / 2;
        const py = (k.height() - ph) / 2;

        root.add([
            k.rect(pw, ph),
            k.pos(px, py),
            k.color(...COLORS.bgPanel),
            k.outline(2, k.rgb(...COLORS.earth)),
        ]);

        root.add([
            k.text("Resource Allocation", { size: 28 }),
            k.pos(k.width() / 2, py + 25),
            k.anchor("center"),
            k.color(...COLORS.xpGold),
        ]);

        root.add([
            k.text("Distribute today's resources among priorities", { size: 15 }),
            k.pos(k.width() / 2, py + 58),
            k.anchor("center"),
            k.color(...COLORS.textSecondary),
        ]);

        // Resource sliders
        const resTypes = [
            { key: "food", label: "Food", color: COLORS.resourceFood, icon: "food" },
            { key: "water", label: "Water", color: COLORS.resourceWater, icon: "water" },
            { key: "materials", label: "Materials", color: COLORS.resourceMaterials, icon: "gear" },
        ];

        refs.sliders = {};
        let sy = py + 100;
        for (const rt of resTypes) {
            const current = resources[rt.key] || 0;
            root.add([
                k.text(`${rt.label}: ${current}`, { size: 18 }),
                k.pos(px + 30, sy),
                k.color(...rt.color),
            ]);

            // Bar background
            root.add([
                k.rect(360, 20),
                k.pos(px + 140, sy + 3),
                k.color(30, 30, 40),
            ]);

            // Bar fill
            const fill = root.add([
                k.rect(360 * Math.min(1, current / 100), 20),
                k.pos(px + 140, sy + 3),
                k.color(...rt.color),
            ]);

            // Value text
            const valText = root.add([
                k.text(String(current), { size: 16 }),
                k.pos(px + 510, sy + 2),
                k.color(...COLORS.textPrimary),
            ]);

            refs.sliders[rt.key] = { fill, valText, value: current };
            sy += 55;
        }

        // Equity indicator
        refs.equityText = root.add([
            k.text("Balance: Fair", { size: 16 }),
            k.pos(k.width() / 2, sy + 10),
            k.anchor("center"),
            k.color(...COLORS.safeGreen),
        ]);

        // Confirm button
        const confirmBtn = root.add([
            k.rect(200, 50),
            k.pos(k.width() / 2 - 100, py + ph - 70),
            k.color(...COLORS.earth),
            k.area(),
            k.outline(2, k.rgb(...COLORS.xpGold)),
        ]);
        confirmBtn.add([
            k.text("CONFIRM", { size: 22 }),
            k.pos(100, 25),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        confirmBtn.onClick(() => {
            if (onAllocationChange) {
                const allocation = {};
                for (const [key, slider] of Object.entries(refs.sliders)) {
                    allocation[key] = slider.value;
                }
                onAllocationChange(allocation);
            }
            destroy();
        });
    }

    function updateResource(key, newValue) {
        if (!refs.sliders || !refs.sliders[key]) return;
        const slider = refs.sliders[key];
        slider.value = newValue;
        slider.fill.width = 360 * Math.min(1, newValue / 100);
        slider.valText.text = String(Math.round(newValue));

        // Update equity indicator
        const values = Object.values(refs.sliders).map((s) => s.value);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const dev = values.reduce((s, v) => s + Math.abs(v - avg), 0) / values.length;
        const equity = avg > 0 ? 1 - dev / avg : 0;

        if (refs.equityText) {
            if (equity > 0.8) {
                refs.equityText.text = "Balance: Excellent";
                refs.equityText.color = k.rgb(...COLORS.safeGreen);
            } else if (equity > 0.5) {
                refs.equityText.text = "Balance: Fair";
                refs.equityText.color = k.rgb(...COLORS.xpGold);
            } else {
                refs.equityText.text = "Balance: Uneven";
                refs.equityText.color = k.rgb(...COLORS.dangerOrange);
            }
        }
    }

    function destroy() {
        if (root && root.exists()) {
            k.destroy(root);
        }
        root = null;
        refs = {};
    }

    return {
        init,
        updateResource,
        destroy,
        isActive() {
            return root !== null;
        },
    };
}
