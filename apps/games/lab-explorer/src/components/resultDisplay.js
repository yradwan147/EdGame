import { COLORS } from "../config/constants.js";

/**
 * Animated experiment visualization panel.
 * Shows real-time visual feedback: pH liquid colors, pendulum swinging,
 * circuit bulb glowing, density sinking/floating, heat thermometer.
 * Each failure state has its own dramatic animation.
 */
export function createResultDisplay(k) {
    const DISPLAY_X = 640;
    const DISPLAY_Y = 110;
    const DISPLAY_W = 580;
    const DISPLAY_H = 480;

    let displayRoot = null;
    let animCancels = [];

    function cleanup() {
        for (const c of animCancels) {
            if (typeof c === "function") c();
            if (c && typeof c.cancel === "function") c.cancel();
        }
        animCancels = [];
        if (displayRoot) {
            k.destroy(displayRoot);
            displayRoot = null;
        }
    }

    function createBase() {
        cleanup();
        displayRoot = k.add([k.pos(0, 0), k.z(400), "result-display"]);

        // Background panel
        displayRoot.add([
            k.rect(DISPLAY_W, DISPLAY_H),
            k.pos(DISPLAY_X, DISPLAY_Y),
            k.color(14, 24, 42),
            k.opacity(0.95),
            k.outline(2, k.rgb(40, 70, 110)),
        ]);

        displayRoot.add([
            k.text("Lab Bench", { size: 18 }),
            k.pos(DISPLAY_X + 15, DISPLAY_Y + 8),
            k.color(...COLORS.accent),
        ]);

        return displayRoot;
    }

    // ---------- pH / Acid-Base visualization ----------
    function showAcidBase(result, vars) {
        const root = createBase();
        const cx = DISPLAY_X + DISPLAY_W / 2;
        const cy = DISPLAY_Y + DISPLAY_H / 2 + 30;
        const color = result.resultColor;

        // Beaker outline
        root.add([
            k.rect(120, 180),
            k.pos(cx - 60, cy - 90),
            k.color(30, 40, 60),
            k.outline(3, k.rgb(140, 180, 220)),
        ]);

        // Liquid fill
        const liquidH = Math.min(160, 40 + (vars.acidDrops + vars.baseDrops) * 4);
        const liquid = root.add([
            k.rect(112, liquidH),
            k.pos(cx - 56, cy + 86 - liquidH),
            k.color(color[0], color[1], color[2]),
            k.opacity(0.85),
        ]);

        // pH readout
        root.add([
            k.text(`pH: ${result.numericResult}`, { size: 32 }),
            k.pos(cx, cy - 120),
            k.anchor("center"),
            k.color(color[0], color[1], color[2]),
        ]);

        // Description
        root.add([
            k.text(result.visualDescription, { size: 16, width: DISPLAY_W - 60 }),
            k.pos(DISPLAY_X + 30, DISPLAY_Y + DISPLAY_H - 60),
            k.color(200, 215, 240),
        ]);

        // Bubbles animation
        const cancel = k.onUpdate(() => {
            if (Math.random() < 0.08) {
                const bx = cx - 40 + Math.random() * 80;
                const by = cy + 80;
                const bubble = k.add([
                    k.circle(2 + Math.random() * 4),
                    k.pos(bx, by),
                    k.anchor("center"),
                    k.color(color[0], color[1], color[2]),
                    k.opacity(0.6),
                    k.lifespan(1.5, { fade: 0.8 }),
                    k.z(401),
                ]);
                bubble.onUpdate(() => {
                    bubble.pos.y -= 40 * k.dt();
                    bubble.pos.x += (Math.random() - 0.5) * 20 * k.dt();
                });
            }
        });
        animCancels.push(cancel);
    }

    // ---------- Density visualization ----------
    function showDensity(result, vars) {
        const root = createBase();
        const cx = DISPLAY_X + DISPLAY_W / 2;
        const cy = DISPLAY_Y + DISPLAY_H / 2;
        const density = result.numericResult;

        // Graduated cylinder
        root.add([
            k.rect(80, 250),
            k.pos(cx - 40, cy - 100),
            k.color(30, 40, 60),
            k.outline(3, k.rgb(120, 160, 200)),
        ]);

        // Water level
        root.add([
            k.rect(72, 180),
            k.pos(cx - 36, cy - 30),
            k.color(60, 130, 200),
            k.opacity(0.5),
        ]);

        // Object (sinks or floats based on density)
        const objY = density >= 1.0
            ? cy + 100   // sinks to bottom
            : cy - 30 + (1.0 - density) * 40;  // floats higher

        const obj = root.add([
            k.rect(40, 40),
            k.pos(cx - 20, objY),
            k.color(...result.resultColor),
            k.outline(2, k.rgb(200, 210, 220)),
        ]);
        obj.add([
            k.text("?", { size: 20 }),
            k.pos(20, 20),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        // Bob animation (gentle floating)
        const baseY = objY;
        const cancel = k.onUpdate(() => {
            obj.pos.y = baseY + Math.sin(k.time() * 2) * 4;
        });
        animCancels.push(cancel);

        // Readout
        root.add([
            k.text(`Density: ${density} ${result.unit}`, { size: 28 }),
            k.pos(cx, cy - 130),
            k.anchor("center"),
            k.color(...result.resultColor),
        ]);

        root.add([
            k.text(result.visualDescription, { size: 16, width: DISPLAY_W - 60 }),
            k.pos(DISPLAY_X + 30, DISPLAY_Y + DISPLAY_H - 60),
            k.color(200, 215, 240),
        ]);
    }

    // ---------- Circuits visualization ----------
    function showCircuit(result, vars) {
        const root = createBase();
        const cx = DISPLAY_X + DISPLAY_W / 2;
        const cy = DISPLAY_Y + DISPLAY_H / 2 + 20;
        const current = result.numericResult;

        // Battery
        for (let i = 0; i < vars.batteries; i++) {
            root.add([
                k.rect(50, 30),
                k.pos(cx - 180 + i * 60, cy - 60),
                k.color(80, 80, 40),
                k.outline(2, k.rgb(200, 200, 100)),
            ]);
            root.add([
                k.text(`${1.5}V`, { size: 11 }),
                k.pos(cx - 165 + i * 60, cy - 52),
                k.color(255, 255, 180),
            ]);
        }

        // Wires (simple lines as rects)
        root.add([k.rect(200, 4), k.pos(cx - 180, cy - 30), k.color(150, 150, 160)]);
        root.add([k.rect(4, 100), k.pos(cx + 20, cy - 30), k.color(150, 150, 160)]);
        root.add([k.rect(200, 4), k.pos(cx - 180, cy + 70), k.color(150, 150, 160)]);
        root.add([k.rect(4, 100), k.pos(cx - 180, cy - 30), k.color(150, 150, 160)]);

        // Resistor
        root.add([
            k.rect(60, 20),
            k.pos(cx - 70, cy + 62),
            k.color(100, 60, 40),
            k.outline(2, k.rgb(180, 120, 80)),
        ]);
        root.add([
            k.text(`${vars.resistor_value}R`, { size: 11 }),
            k.pos(cx - 55, cy + 66),
            k.color(255, 220, 180),
        ]);

        // Bulb
        const brightness = Math.min(1.0, current / 0.5);
        const bulbColor = [
            Math.floor(255 * brightness),
            Math.floor(255 * brightness * 0.9),
            Math.floor(180 * brightness),
        ];

        const bulb = root.add([
            k.circle(30),
            k.pos(cx + 80, cy),
            k.anchor("center"),
            k.color(bulbColor[0], bulbColor[1], bulbColor[2]),
            k.opacity(0.3 + brightness * 0.7),
        ]);

        // Glow effect
        if (brightness > 0.3) {
            const glow = root.add([
                k.circle(45),
                k.pos(cx + 80, cy),
                k.anchor("center"),
                k.color(bulbColor[0], bulbColor[1], bulbColor[2]),
                k.opacity(brightness * 0.3),
                k.z(399),
            ]);
            const cancel = k.onUpdate(() => {
                glow.opacity = brightness * 0.15 + Math.sin(k.time() * 6) * 0.1;
            });
            animCancels.push(cancel);
        }

        // Readout
        root.add([
            k.text(`Current: ${current} ${result.unit}`, { size: 28 }),
            k.pos(cx, cy - 120),
            k.anchor("center"),
            k.color(...result.resultColor),
        ]);

        root.add([
            k.text(result.visualDescription, { size: 16, width: DISPLAY_W - 60 }),
            k.pos(DISPLAY_X + 30, DISPLAY_Y + DISPLAY_H - 60),
            k.color(200, 215, 240),
        ]);
    }

    // ---------- Pendulum visualization ----------
    function showPendulum(result, vars) {
        const root = createBase();
        const pivotX = DISPLAY_X + DISPLAY_W / 2;
        const pivotY = DISPLAY_Y + 80;
        const stringLen = 80 + vars.string_length * 1.5;
        const period = result.numericResult;

        // Pivot mount
        root.add([
            k.rect(60, 10),
            k.pos(pivotX - 30, pivotY - 5),
            k.color(120, 100, 80),
        ]);

        // String and bob — animated swing
        const stringObj = root.add([
            k.rect(3, stringLen),
            k.pos(pivotX, pivotY),
            k.anchor("top"),
            k.color(180, 160, 130),
            k.z(402),
        ]);

        const bobSize = 10 + vars.mass / 30;
        const bob = root.add([
            k.circle(bobSize),
            k.pos(pivotX, pivotY + stringLen),
            k.anchor("center"),
            k.color(...COLORS.pendulumBrown),
            k.z(403),
        ]);
        bob.add([
            k.text(`${vars.mass}g`, { size: 11 }),
            k.pos(0, 0),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        const angleMax = (vars.release_angle * Math.PI) / 180 * 0.5;
        const omega = (2 * Math.PI) / Math.max(0.3, period);

        const cancel = k.onUpdate(() => {
            const angle = angleMax * Math.sin(k.time() * omega);
            const bx = pivotX + Math.sin(angle) * stringLen;
            const by = pivotY + Math.cos(angle) * stringLen;
            bob.pos.x = bx;
            bob.pos.y = by;

            // Rotate string to follow bob
            stringObj.angle = (angle * 180) / Math.PI;
        });
        animCancels.push(cancel);

        // Readout
        root.add([
            k.text(`Period: ${period} ${result.unit}`, { size: 28 }),
            k.pos(DISPLAY_X + 30, DISPLAY_Y + DISPLAY_H - 90),
            k.color(...result.resultColor),
        ]);

        root.add([
            k.text(result.visualDescription, { size: 16, width: DISPLAY_W - 60 }),
            k.pos(DISPLAY_X + 30, DISPLAY_Y + DISPLAY_H - 55),
            k.color(200, 215, 240),
        ]);
    }

    // ---------- Heat Transfer visualization ----------
    function showHeatTransfer(result, vars) {
        const root = createBase();
        const cx = DISPLAY_X + DISPLAY_W / 2;
        const cy = DISPLAY_Y + DISPLAY_H / 2 + 20;
        const temp = result.numericResult;
        const materials = ["Metal", "Wood", "Cloth", "Foam"];
        const matColors = [[180, 180, 190], [140, 100, 60], [200, 170, 140], [220, 220, 230]];

        // Beaker with insulation wrap
        const matIdx = vars.material;
        const matColor = matColors[matIdx] || matColors[0];

        // Insulation wrap
        root.add([
            k.rect(140, 180),
            k.pos(cx - 70, cy - 80),
            k.color(matColor[0], matColor[1], matColor[2]),
            k.outline(3, k.rgb(matColor[0] + 20, matColor[1] + 20, matColor[2] + 20)),
        ]);

        // Inner beaker
        root.add([
            k.rect(100, 160),
            k.pos(cx - 50, cy - 70),
            k.color(30, 40, 60),
            k.outline(2, k.rgb(120, 160, 200)),
        ]);

        // Water color based on temperature
        const heatRatio = Math.max(0, Math.min(1, (temp - 22) / 78));
        const waterColor = [
            60 + Math.floor(heatRatio * 195),
            130 - Math.floor(heatRatio * 80),
            200 - Math.floor(heatRatio * 160),
        ];

        root.add([
            k.rect(92, 140),
            k.pos(cx - 46, cy - 60),
            k.color(waterColor[0], waterColor[1], waterColor[2]),
            k.opacity(0.7),
        ]);

        // Thermometer
        root.add([
            k.rect(12, 120),
            k.pos(cx + 80, cy - 50),
            k.color(40, 40, 50),
            k.outline(1, k.rgb(150, 150, 160)),
        ]);
        const mercuryH = Math.floor(heatRatio * 100);
        root.add([
            k.rect(8, mercuryH),
            k.pos(cx + 82, cy + 68 - mercuryH),
            k.color(255, 50, 50),
        ]);
        root.add([
            k.circle(8),
            k.pos(cx + 86, cy + 72),
            k.anchor("center"),
            k.color(255, 50, 50),
        ]);

        // Steam particles for hot liquids
        if (temp > 70) {
            const cancel = k.onUpdate(() => {
                if (Math.random() < 0.1) {
                    const sx = cx - 30 + Math.random() * 60;
                    const steam = k.add([
                        k.circle(3 + Math.random() * 4),
                        k.pos(sx, cy - 70),
                        k.anchor("center"),
                        k.color(200, 210, 230),
                        k.opacity(0.4),
                        k.lifespan(1.2, { fade: 0.8 }),
                        k.z(405),
                    ]);
                    steam.onUpdate(() => {
                        steam.pos.y -= 30 * k.dt();
                        steam.pos.x += (Math.random() - 0.5) * 15 * k.dt();
                    });
                }
            });
            animCancels.push(cancel);
        }

        // Readout
        root.add([
            k.text(`${materials[matIdx]} wrap | ${temp}C`, { size: 26 }),
            k.pos(cx, cy - 110),
            k.anchor("center"),
            k.color(...result.resultColor),
        ]);

        root.add([
            k.text(result.visualDescription, { size: 16, width: DISPLAY_W - 60 }),
            k.pos(DISPLAY_X + 30, DISPLAY_Y + DISPLAY_H - 55),
            k.color(200, 215, 240),
        ]);
    }

    // ---------- Show method dispatcher ----------
    function show(experimentId, result, vars) {
        const renderers = {
            acid_base: showAcidBase,
            density: showDensity,
            circuits: showCircuit,
            pendulum: showPendulum,
            heat_transfer: showHeatTransfer,
        };

        const renderer = renderers[experimentId];
        if (renderer) {
            renderer(result, vars);
        } else {
            // Generic fallback
            const root = createBase();
            root.add([
                k.text(`${result.label}: ${result.numericResult} ${result.unit}`, { size: 32 }),
                k.pos(DISPLAY_X + DISPLAY_W / 2, DISPLAY_Y + DISPLAY_H / 2),
                k.anchor("center"),
                k.color(...result.resultColor),
            ]);
            root.add([
                k.text(result.visualDescription, { size: 18, width: DISPLAY_W - 60 }),
                k.pos(DISPLAY_X + 30, DISPLAY_Y + DISPLAY_H / 2 + 50),
                k.color(200, 215, 240),
            ]);
        }
    }

    /**
     * Show idle workbench (before experiment run).
     */
    function showIdle(experimentId) {
        const root = createBase();
        const cx = DISPLAY_X + DISPLAY_W / 2;
        const cy = DISPLAY_Y + DISPLAY_H / 2;

        root.add([
            k.text("Adjust variables and click RUN", { size: 22 }),
            k.pos(cx, cy - 10),
            k.anchor("center"),
            k.color(120, 150, 200),
        ]);

        root.add([
            k.text("Your experiment will appear here", { size: 16 }),
            k.pos(cx, cy + 25),
            k.anchor("center"),
            k.color(90, 110, 150),
        ]);
    }

    return {
        show,
        showIdle,
        cleanup,
    };
}
