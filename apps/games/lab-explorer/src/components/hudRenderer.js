import { COLORS, PHASE_ORDER, PHASE_LABELS } from "../config/constants.js";

/**
 * HUD for the experiment scene.
 * Top: experiment name + phase indicator + score
 * Bottom: equipment shelf area hint
 * Right: lab notebook icon + discovery count
 */
export function createHudRenderer(k) {
    const refs = {
        phaseIndicators: [],
        scoreText: null,
        discoveryText: null,
        experimentNameText: null,
        runCountText: null,
        statusText: null,
    };

    function init({ experimentName }) {
        // Top bar background
        k.add([k.rect(k.width(), 56), k.pos(0, 0), k.color(12, 22, 40), k.opacity(0.92), k.fixed(), k.z(1200)]);

        // Experiment name
        refs.experimentNameText = k.add([
            k.text(experimentName, { size: 22 }),
            k.pos(20, 16),
            k.fixed(),
            k.z(1202),
            k.color(...COLORS.accentBright),
        ]);

        // Phase indicators (dots/labels across the top)
        const phaseStartX = 380;
        const phaseSpacing = 120;
        for (let i = 0; i < PHASE_ORDER.length; i++) {
            const px = phaseStartX + i * phaseSpacing;

            // Connector line to next phase
            if (i < PHASE_ORDER.length - 1) {
                k.add([
                    k.rect(phaseSpacing - 30, 3),
                    k.pos(px + 20, 26),
                    k.color(40, 60, 90),
                    k.fixed(),
                    k.z(1201),
                ]);
            }

            // Phase dot
            const dot = k.add([
                k.circle(10),
                k.pos(px, 28),
                k.anchor("center"),
                k.color(40, 60, 90),
                k.fixed(),
                k.z(1202),
            ]);

            // Phase label below
            const label = k.add([
                k.text(PHASE_LABELS[PHASE_ORDER[i]], { size: 11 }),
                k.pos(px, 46),
                k.anchor("center"),
                k.color(100, 120, 160),
                k.fixed(),
                k.z(1202),
            ]);

            refs.phaseIndicators.push({ dot, label, phase: PHASE_ORDER[i] });
        }

        // Score display (top right)
        refs.scoreText = k.add([
            k.text("Score: 0", { size: 20 }),
            k.pos(k.width() - 170, 16),
            k.fixed(),
            k.z(1202),
            k.color(...COLORS.beakerGreen),
        ]);

        // Discovery counter (right side below top bar)
        k.add([k.rect(170, 40), k.pos(k.width() - 180, 64), k.color(18, 30, 52), k.opacity(0.85), k.fixed(), k.z(1200)]);
        refs.discoveryText = k.add([
            k.text("Discoveries: 0", { size: 16 }),
            k.pos(k.width() - 170, 74),
            k.fixed(),
            k.z(1202),
            k.color(...COLORS.discoveryGold),
        ]);

        // Run counter
        refs.runCountText = k.add([
            k.text("Runs: 0", { size: 16 }),
            k.pos(k.width() - 170, 112),
            k.fixed(),
            k.z(1202),
            k.color(160, 180, 220),
        ]);

        // Status text (bottom center)
        refs.statusText = k.add([
            k.text("", { size: 16, width: 600 }),
            k.pos(k.width() / 2, k.height() - 20),
            k.anchor("center"),
            k.fixed(),
            k.z(1202),
            k.color(160, 180, 220),
        ]);
    }

    function update({ phase, totalScore, discoveryCount, runCount, statusMessage }) {
        // Highlight current phase
        for (const pi of refs.phaseIndicators) {
            const isCurrent = pi.phase === phase;
            const isCompleted = PHASE_ORDER.indexOf(pi.phase) < PHASE_ORDER.indexOf(phase);

            if (isCurrent) {
                pi.dot.color = k.rgb(...COLORS.accentBright);
                pi.label.color = k.rgb(...COLORS.accentBright);
            } else if (isCompleted) {
                pi.dot.color = k.rgb(...COLORS.beakerGreen);
                pi.label.color = k.rgb(...COLORS.beakerGreen);
            } else {
                pi.dot.color = k.rgb(40, 60, 90);
                pi.label.color = k.rgb(100, 120, 160);
            }
        }

        if (refs.scoreText) {
            refs.scoreText.text = `Score: ${totalScore}`;
        }
        if (refs.discoveryText) {
            refs.discoveryText.text = `Discoveries: ${discoveryCount}`;
        }
        if (refs.runCountText) {
            refs.runCountText.text = `Runs: ${runCount}`;
        }
        if (refs.statusText && statusMessage !== undefined) {
            refs.statusText.text = statusMessage;
        }
    }

    return { init, update };
}
