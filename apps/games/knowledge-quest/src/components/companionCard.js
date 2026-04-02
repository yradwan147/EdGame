import { COLORS } from "../config/constants.js";

/**
 * Companion display card -- collection popup, evolution popup,
 * and small HUD slot renderer.
 */
export function createCompanionCard(k) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);
    const W = k.width();
    const H = k.height();

    let popupRoot = null;
    let cancelFns = [];

    /* ---- rarity colors ---- */
    const RARITY_COLORS = {
        common: [200, 200, 200],
        uncommon: [80, 220, 100],
        rare: [80, 140, 255],
        legendary: [255, 200, 50],
    };

    const RARITY_GLOW_OPACITY = {
        common: 0.15,
        uncommon: 0.25,
        rare: 0.35,
        legendary: 0.5,
    };

    /* ---- domain colors for small slots ---- */
    const DOMAIN_COLORS = {
        geometry: [120, 200, 255],
        chemistry: [80, 255, 140],
        algebra: [200, 160, 255],
        number_sense: [255, 200, 80],
        physics: [255, 230, 50],
        time: [180, 220, 255],
        mixed: [200, 180, 255],
        all: [255, 200, 180],
    };

    function domainColor(domain) {
        return DOMAIN_COLORS[domain] || COLORS.primary;
    }

    /* ---- cleanup ---- */
    function cleanup() {
        for (const c of cancelFns) {
            if (typeof c === "function") c();
            if (c && typeof c.cancel === "function") c.cancel();
        }
        cancelFns = [];
        if (popupRoot) {
            k.destroy(popupRoot);
            popupRoot = null;
        }
    }

    /* ---- public ---- */

    /**
     * showCompanionCollected(companion)
     * Big celebration popup when a new companion is found.
     * Auto-dismisses after 3s or on click.
     */
    function showCompanionCollected(companion) {
        cleanup();

        popupRoot = k.add([k.pos(0, 0), k.fixed(), k.z(9800), "companion-popup"]);

        /* dim */
        popupRoot.add([k.rect(W, H), k.color(0, 0, 0), k.opacity(0.6)]);

        const cardW = 340;
        const cardH = 320;
        const cx = W / 2;
        const cy = H / 2;
        const cardX = cx - cardW / 2;
        const cardY = cy - cardH / 2;
        const rCol = RARITY_COLORS[companion.rarity] || RARITY_COLORS.common;
        const glowOp = RARITY_GLOW_OPACITY[companion.rarity] || 0.15;

        /* rarity glow */
        popupRoot.add([
            k.rect(cardW + 20, cardH + 20),
            k.pos(cardX - 10, cardY - 10),
            k.color(...rCol),
            k.opacity(glowOp),
            k.outline(4, rgb(rCol)),
        ]);

        /* card bg */
        popupRoot.add([
            k.rect(cardW, cardH),
            k.pos(cardX, cardY),
            k.color(...COLORS.panelBg),
            k.outline(2, rgb(rCol)),
        ]);

        /* "NEW COMPANION!" banner */
        const bannerLabel = popupRoot.add([
            k.text("NEW COMPANION!", { size: 28 }),
            k.pos(cx, cardY + 30),
            k.anchor("center"),
            k.color(...COLORS.secondary),
            k.scale(0.5),
        ]);
        let bannerT = 0;
        const bannerUpd = k.onUpdate(() => {
            bannerT += k.dt();
            const s = Math.min(1.1, 0.5 + bannerT * 2);
            bannerLabel.scale = k.vec2(s, s);
        });
        cancelFns.push(bannerUpd);

        /* companion icon (colored circle with initial) */
        const dCol = domainColor(companion.domain);
        popupRoot.add([
            k.circle(32),
            k.pos(cx, cardY + 100),
            k.anchor("center"),
            k.color(...dCol),
            k.outline(3, rgb(rCol)),
        ]);
        popupRoot.add([
            k.text(companion.name.charAt(0), { size: 28 }),
            k.pos(cx, cardY + 100),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        /* name */
        popupRoot.add([
            k.text(companion.name, { size: 22 }),
            k.pos(cx, cardY + 150),
            k.anchor("center"),
            k.color(...rCol),
        ]);

        /* rarity tag */
        popupRoot.add([
            k.text(companion.rarity.toUpperCase(), { size: 14 }),
            k.pos(cx, cardY + 175),
            k.anchor("center"),
            k.color(...rCol),
            k.opacity(0.8),
        ]);

        /* description */
        popupRoot.add([
            k.text(companion.description, { size: 14, width: cardW - 40 }),
            k.pos(cx, cardY + 210),
            k.anchor("center"),
            k.color(...COLORS.textPrimary),
        ]);

        /* buff info */
        popupRoot.add([
            k.text(companion.buff.label, { size: 13, width: cardW - 40 }),
            k.pos(cx, cardY + 260),
            k.anchor("center"),
            k.color(...COLORS.heal),
        ]);

        /* sparkle particles */
        let sparkTimer = 0;
        const sparkUpd = k.onUpdate(() => {
            sparkTimer += k.dt();
            if (sparkTimer > 0.12) {
                sparkTimer = 0;
                const sp = popupRoot.add([
                    k.rect(3, 3),
                    k.pos(cx + k.rand(-cardW / 2, cardW / 2), cardY + k.rand(0, cardH)),
                    k.anchor("center"),
                    k.color(...rCol),
                    k.opacity(1),
                ]);
                let lt = 0;
                sp.onUpdate(() => {
                    lt += k.dt();
                    sp.pos.y -= 30 * k.dt();
                    sp.opacity = 1 - lt / 0.8;
                    if (lt >= 0.8) k.destroy(sp);
                });
            }
        });
        cancelFns.push(sparkUpd);

        /* click to dismiss */
        const clickArea = popupRoot.add([
            k.rect(W, H),
            k.pos(0, 0),
            k.area(),
            k.opacity(0),
        ]);
        clickArea.onClick(() => cleanup());

        /* auto dismiss */
        const timer = k.wait(3, () => cleanup());
        cancelFns.push(() => k.cancel(timer));
    }

    /**
     * showCompanionEvolved(companion, newLevel)
     * Evolution celebration popup.
     */
    function showCompanionEvolved(companion, newLevel) {
        cleanup();

        const evoData = companion.evolutionLevels.find((e) => e.level === newLevel);
        const evoName = evoData ? evoData.name : companion.name;
        const evoDesc = evoData ? evoData.description : "";

        popupRoot = k.add([k.pos(0, 0), k.fixed(), k.z(9800), "companion-evo-popup"]);

        popupRoot.add([k.rect(W, H), k.color(0, 0, 0), k.opacity(0.6)]);

        const cardW = 320;
        const cardH = 260;
        const cx = W / 2;
        const cy = H / 2;
        const cardX = cx - cardW / 2;
        const cardY = cy - cardH / 2;
        const rCol = RARITY_COLORS[companion.rarity] || RARITY_COLORS.common;

        /* glow */
        popupRoot.add([
            k.rect(cardW + 20, cardH + 20),
            k.pos(cardX - 10, cardY - 10),
            k.color(...COLORS.secondary),
            k.opacity(0.4),
            k.outline(4, rgb(COLORS.secondary)),
        ]);

        /* card bg */
        popupRoot.add([
            k.rect(cardW, cardH),
            k.pos(cardX, cardY),
            k.color(...COLORS.panelBg),
            k.outline(2, rgb(COLORS.secondary)),
        ]);

        /* "EVOLVED!" banner */
        popupRoot.add([
            k.text("EVOLVED!", { size: 30 }),
            k.pos(cx, cardY + 30),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);

        /* new name */
        popupRoot.add([
            k.text(evoName, { size: 24 }),
            k.pos(cx, cardY + 80),
            k.anchor("center"),
            k.color(...rCol),
        ]);

        /* level */
        popupRoot.add([
            k.text("Level " + newLevel, { size: 16 }),
            k.pos(cx, cardY + 110),
            k.anchor("center"),
            k.color(...COLORS.textSecondary),
        ]);

        /* description */
        popupRoot.add([
            k.text(evoDesc, { size: 14, width: cardW - 40 }),
            k.pos(cx, cardY + 150),
            k.anchor("center"),
            k.color(...COLORS.textPrimary),
        ]);

        /* golden ring burst */
        const ring = popupRoot.add([
            k.circle(10),
            k.pos(cx, cy),
            k.anchor("center"),
            k.color(0, 0, 0),
            k.opacity(0),
            k.outline(4, rgb(COLORS.secondary)),
        ]);
        let rt = 0;
        const ringUpd = k.onUpdate(() => {
            rt += k.dt();
            ring.radius = rt * 120;
            ring.outline.color = rgb(COLORS.secondary);
            ring.outline.width = Math.max(1, 4 * (1 - rt));
            if (rt >= 1) {
                ringUpd.cancel();
                k.destroy(ring);
            }
        });
        cancelFns.push(ringUpd);

        /* click to dismiss */
        const clickArea = popupRoot.add([
            k.rect(W, H),
            k.pos(0, 0),
            k.area(),
            k.opacity(0),
        ]);
        clickArea.onClick(() => cleanup());

        const timer = k.wait(3, () => cleanup());
        cancelFns.push(() => k.cancel(timer));
    }

    /**
     * renderCompanionSlot(companion, pos, size)
     * Renders a small companion card for HUD / party display.
     * Returns the KAPLAY game object (caller owns its lifecycle).
     */
    function renderCompanionSlot(companion, pos, size) {
        const dCol = domainColor(companion.domain);
        const rCol = RARITY_COLORS[companion.rarity] || RARITY_COLORS.common;
        const half = size / 2;

        const slot = k.add([
            k.pos(pos.x, pos.y),
            k.fixed(),
            k.z(8500),
            "companion-slot",
        ]);

        /* background circle */
        slot.add([
            k.circle(half),
            k.pos(half, half),
            k.anchor("center"),
            k.color(...dCol),
            k.opacity(0.6),
            k.outline(2, rgb(rCol)),
        ]);

        /* initial */
        slot.add([
            k.text(companion.name.charAt(0), { size: Math.floor(size * 0.5) }),
            k.pos(half, half),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        return slot;
    }

    return {
        showCompanionCollected,
        showCompanionEvolved,
        renderCompanionSlot,
        destroy: cleanup,
    };
}
