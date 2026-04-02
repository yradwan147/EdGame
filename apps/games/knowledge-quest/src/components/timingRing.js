import { COLORS } from "../config/constants.js";

/**
 * Paper-Mario-style timed-cast minigame.
 *
 * Patterns: single_ring, double_ring, moving_target, pulse, rapid_shrink, triple_ring.
 * Returns promise: { quality, multiplier }
 */

const ELEMENT_COLORS = {
    fire: [255, 120, 60],
    ice: COLORS.frost,
    light: [255, 255, 200],
    nature: COLORS.nature,
    lightning: COLORS.lightning,
    arcane: COLORS.primary,
    dark: COLORS.dark,
};

const QUALITY = {
    perfect: { quality: "perfect", multiplier: 2.0 },
    good: { quality: "good", multiplier: 1.5 },
    ok: { quality: "ok", multiplier: 1.0 },
    miss: { quality: "miss", multiplier: 0.7 },
};

function elementColor(element) {
    return ELEMENT_COLORS[element] || COLORS.primary;
}

/* ------------------------------------------------------------------ */
/*  Main export                                                       */
/* ------------------------------------------------------------------ */

export function createTimingRing(k, { pattern, spellElement }) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);
    const eCol = elementColor(spellElement);
    const W = k.width();
    const H = k.height();
    const cx = W / 2;
    const cy = H / 2;

    return new Promise((resolve) => {
        const root = k.add([k.pos(0, 0), k.fixed(), k.z(11000), "timing-ring"]);
        const cancelFns = [];

        /* dim */
        root.add([k.rect(W, H), k.color(0, 0, 0), k.opacity(0.6)]);

        /* center target circle (static bullseye) */
        root.add([
            k.circle(18),
            k.pos(cx, cy),
            k.anchor("center"),
            k.color(...eCol),
            k.opacity(0.4),
        ]);
        root.add([
            k.circle(6),
            k.pos(cx, cy),
            k.anchor("center"),
            k.color(...eCol),
        ]);

        /* instruction text */
        const instrObj = root.add([
            k.text("Press SPACE!", { size: 22 }),
            k.pos(cx, cy + 90),
            k.anchor("center"),
            k.color(...COLORS.textSecondary),
        ]);

        /* ---- result helpers ---- */
        let resolved = false;

        function finish(result) {
            if (resolved) return;
            resolved = true;
            showResultFeedback(result);
            k.wait(0.8, () => {
                for (const c of cancelFns) {
                    if (typeof c === "function") c();
                    if (c && typeof c.cancel === "function") c.cancel();
                }
                k.destroy(root);
                resolve(result);
            });
        }

        function showResultFeedback(result) {
            const labelMap = {
                perfect: "PERFECT!",
                good: "GOOD!",
                ok: "OK",
                miss: "MISS",
            };
            const colorMap = {
                perfect: [255, 215, 0],
                good: [100, 255, 160],
                ok: [180, 180, 180],
                miss: [255, 80, 80],
            };
            const col = colorMap[result.quality];
            const label = root.add([
                k.text(labelMap[result.quality], { size: 48 }),
                k.pos(cx, cy - 70),
                k.anchor("center"),
                k.color(...col),
                k.opacity(1),
                k.scale(0.5),
            ]);
            label.onUpdate(() => {
                if (label.scale.x < 1.2) {
                    label.scale = label.scale.add(k.dt() * 3);
                }
                label.opacity = Math.max(0, label.opacity - k.dt() * 0.8);
            });

            /* screen flash on PERFECT */
            if (result.quality === "perfect") {
                const flash = root.add([
                    k.rect(W, H),
                    k.color(255, 255, 200),
                    k.opacity(0.5),
                ]);
                flash.onUpdate(() => {
                    flash.opacity -= k.dt() * 2;
                    if (flash.opacity <= 0) k.destroy(flash);
                });
                /* sparkle burst */
                for (let i = 0; i < 20; i++) {
                    const angle = k.rand(0, Math.PI * 2);
                    const speed = k.rand(80, 220);
                    const sp = root.add([
                        k.rect(4, 4),
                        k.pos(cx, cy),
                        k.anchor("center"),
                        k.color(255, 220, 80),
                        k.opacity(1),
                    ]);
                    sp.onUpdate(() => {
                        sp.pos.x += Math.cos(angle) * speed * k.dt();
                        sp.pos.y += Math.sin(angle) * speed * k.dt();
                        sp.opacity -= k.dt() * 1.5;
                        if (sp.opacity <= 0) k.destroy(sp);
                    });
                }
            }
        }

        /* ---- pattern implementations ---- */

        if (pattern === "single_ring" || pattern === "rapid_shrink") {
            const duration = pattern === "rapid_shrink" ? 1.5 : 2.5;
            const maxR = 120;
            let t = 0;

            const ring = root.add([
                k.circle(maxR),
                k.pos(cx, cy),
                k.anchor("center"),
                k.color(0, 0, 0),
                k.opacity(0),
                k.outline(4, rgb(eCol)),
            ]);

            const upd = k.onUpdate(() => {
                t += k.dt();
                const frac = Math.min(t / duration, 1);
                const r = maxR * (1 - frac);
                ring.radius = Math.max(r, 1);
                ring.outline.width = 4;
                ring.outline.color = rgb(eCol);
                if (frac >= 1 && !resolved) {
                    finish(QUALITY.miss);
                }
            });
            cancelFns.push(upd);

            const kp = k.onKeyPress("space", () => {
                const frac = Math.min(t / duration, 1);
                const r = maxR * (1 - frac);
                if (r <= 15) finish(QUALITY.perfect);
                else if (r <= 35) finish(QUALITY.good);
                else if (r <= 60) finish(QUALITY.ok);
                else finish(QUALITY.miss);
            });
            cancelFns.push(kp);
        } else if (pattern === "double_ring") {
            const duration = 2.5;
            let t = 0;
            const outerMax = 120;
            const innerMin = 10;

            const outer = root.add([
                k.circle(outerMax),
                k.pos(cx, cy),
                k.anchor("center"),
                k.color(0, 0, 0),
                k.opacity(0),
                k.outline(3, rgb(eCol)),
            ]);
            const inner = root.add([
                k.circle(innerMin),
                k.pos(cx, cy),
                k.anchor("center"),
                k.color(0, 0, 0),
                k.opacity(0),
                k.outline(3, k.rgb(255, 255, 255)),
            ]);

            const upd = k.onUpdate(() => {
                t += k.dt();
                const frac = Math.min(t / duration, 1);
                outer.radius = Math.max(outerMax * (1 - frac), 1);
                inner.radius = innerMin + (outerMax - innerMin) * frac;
                if (frac >= 1 && !resolved) finish(QUALITY.miss);
            });
            cancelFns.push(upd);

            const kp = k.onKeyPress("space", () => {
                const diff = Math.abs(outer.radius - inner.radius);
                if (diff <= 8) finish(QUALITY.perfect);
                else if (diff <= 20) finish(QUALITY.good);
                else if (diff <= 40) finish(QUALITY.ok);
                else finish(QUALITY.miss);
            });
            cancelFns.push(kp);
        } else if (pattern === "moving_target") {
            const duration = 2.5;
            let t = 0;

            /* bullseye at center */
            root.add([
                k.circle(24),
                k.pos(cx, cy),
                k.anchor("center"),
                k.color(...eCol),
                k.opacity(0.25),
            ]);

            /* crosshair that moves */
            const cross = root.add([
                k.rect(20, 20),
                k.pos(cx - 200, cy),
                k.anchor("center"),
                k.color(255, 255, 255),
                k.outline(2, rgb(eCol)),
            ]);

            const upd = k.onUpdate(() => {
                t += k.dt();
                const frac = Math.min(t / duration, 1);
                /* move from left to right through center */
                cross.pos.x = (cx - 200) + 400 * frac;
                cross.pos.y = cy + Math.sin(frac * Math.PI * 3) * 30;
                if (frac >= 1 && !resolved) finish(QUALITY.miss);
            });
            cancelFns.push(upd);

            const kp = k.onKeyPress("space", () => {
                const dist = Math.sqrt(
                    (cross.pos.x - cx) ** 2 + (cross.pos.y - cy) ** 2,
                );
                if (dist <= 15) finish(QUALITY.perfect);
                else if (dist <= 35) finish(QUALITY.good);
                else if (dist <= 60) finish(QUALITY.ok);
                else finish(QUALITY.miss);
            });
            cancelFns.push(kp);
        } else if (pattern === "pulse") {
            const duration = 3.0;
            const pulseSpeed = 4.0;
            let t = 0;

            const ring = root.add([
                k.circle(60),
                k.pos(cx, cy),
                k.anchor("center"),
                k.color(0, 0, 0),
                k.opacity(0),
                k.outline(4, rgb(eCol)),
            ]);

            const upd = k.onUpdate(() => {
                t += k.dt();
                const pulse = Math.abs(Math.sin(t * pulseSpeed));
                ring.radius = 10 + pulse * 110;
                if (t >= duration && !resolved) finish(QUALITY.miss);
            });
            cancelFns.push(upd);

            const kp = k.onKeyPress("space", () => {
                const r = ring.radius;
                if (r <= 25) finish(QUALITY.perfect);
                else if (r <= 45) finish(QUALITY.good);
                else if (r <= 70) finish(QUALITY.ok);
                else finish(QUALITY.miss);
            });
            cancelFns.push(kp);
        } else if (pattern === "triple_ring") {
            /* Three sequential rings -- only the first press matters for damage */
            const duration = 3.0;
            const maxR = 120;
            let phase = 0;
            let phaseT = 0;
            const phaseDur = duration / 3;
            let firstResult = null;

            const ring = root.add([
                k.circle(maxR),
                k.pos(cx, cy),
                k.anchor("center"),
                k.color(0, 0, 0),
                k.opacity(0),
                k.outline(4, rgb(eCol)),
            ]);

            const phaseLabel = root.add([
                k.text("1 / 3", { size: 18 }),
                k.pos(cx, cy + 65),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
            ]);

            const upd = k.onUpdate(() => {
                phaseT += k.dt();
                const frac = Math.min(phaseT / phaseDur, 1);
                ring.radius = Math.max(maxR * (1 - frac), 1);
                phaseLabel.text = (phase + 1) + " / 3";

                if (frac >= 1) {
                    if (phase === 0 && firstResult === null) firstResult = QUALITY.miss;
                    phase++;
                    phaseT = 0;
                    if (phase >= 3 && !resolved) {
                        finish(firstResult || QUALITY.miss);
                    }
                }
            });
            cancelFns.push(upd);

            const kp = k.onKeyPress("space", () => {
                const frac = Math.min(phaseT / phaseDur, 1);
                const r = maxR * (1 - frac);
                let res;
                if (r <= 15) res = QUALITY.perfect;
                else if (r <= 35) res = QUALITY.good;
                else if (r <= 60) res = QUALITY.ok;
                else res = QUALITY.miss;

                if (phase === 0 && firstResult === null) {
                    firstResult = res;
                }
                /* advance to next phase on press */
                phase++;
                phaseT = 0;
                if (phase >= 3 && !resolved) {
                    finish(firstResult || QUALITY.miss);
                }
            });
            cancelFns.push(kp);
        } else {
            /* fallback: immediate ok */
            finish(QUALITY.ok);
        }
    });
}
