import { COLORS } from "../config/constants.js";

/**
 * RPG HUD overlay -- shown during map / exploration, hidden during combat.
 *
 * Top bar:
 *   Left:  Chapter name + node progress
 *   Right: Level + XP bar + companion icons
 */
export function createHudRenderer(k, { progression }) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);
    const W = k.width();

    let root = null;
    let chapterLabel = null;
    let nodeLabel = null;
    let levelLabel = null;
    let xpBar = null;
    let xpText = null;
    let companionSlots = [];
    let chapterTitleObj = null;

    /* ---- domain color for companion icon ---- */
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

    /* ---- init ---- */
    function init() {
        destroy();

        root = k.add([k.pos(0, 0), k.fixed(), k.z(7000), "hud-renderer"]);

        /* top bar background */
        const barH = 44;
        root.add([
            k.rect(W, barH),
            k.pos(0, 0),
            k.color(...COLORS.hudBg),
            k.opacity(0.9),
            k.outline(1, rgb(COLORS.panelBorder)),
        ]);

        /* ---- left: chapter + node ---- */
        chapterLabel = root.add([
            k.text("Chapter 1", { size: 16 }),
            k.pos(12, 8),
            k.color(...COLORS.secondary),
        ]);

        nodeLabel = root.add([
            k.text("Node 1/6", { size: 13 }),
            k.pos(12, 28),
            k.color(...COLORS.textSecondary),
        ]);

        /* ---- right: level + xp ---- */
        const xpBarW = 120;
        const rightX = W - xpBarW - 80;

        levelLabel = root.add([
            k.text("Lv 1", { size: 16 }),
            k.pos(rightX - 50, 8),
            k.color(...COLORS.secondary),
        ]);

        /* XP bar bg */
        root.add([
            k.rect(xpBarW, 10),
            k.pos(rightX, 12),
            k.color(30, 24, 50),
        ]);

        xpBar = root.add([
            k.rect(0, 10),
            k.pos(rightX, 12),
            k.color(...COLORS.primary),
        ]);

        xpText = root.add([
            k.text("0 XP", { size: 11 }),
            k.pos(rightX, 26),
            k.color(...COLORS.textSecondary),
        ]);

        /* companion icon slots -- rendered on update */
        companionSlots = [];
    }

    /* ---- update(state) ---- */
    function update(state) {
        if (!root) return;

        if (state.chapterName && chapterLabel) {
            chapterLabel.text = state.chapterName;
        }
        if (state.nodeProgress && nodeLabel) {
            nodeLabel.text = "Node " + state.nodeProgress;
        }
        if (state.level !== undefined && levelLabel) {
            levelLabel.text = "Lv " + state.level;
        }
        if (state.xp !== undefined && state.xpToNext !== undefined && xpBar) {
            const xpBarW = 120;
            const frac = state.xpToNext > 0 ? Math.min(state.xp / state.xpToNext, 1) : 0;
            xpBar.width = frac * xpBarW;
            if (xpText) xpText.text = state.xp + " / " + state.xpToNext + " XP";
        }

        /* companion icons */
        if (state.companions) {
            /* clear old */
            for (const s of companionSlots) k.destroy(s);
            companionSlots = [];

            const iconSize = 24;
            const gap = 6;
            const startX = W - 60;

            state.companions.forEach((comp, i) => {
                const sx = startX - i * (iconSize + gap);
                const dCol = domainColor(comp.domain);

                const slot = root.add([k.pos(sx, 30)]);
                slot.add([
                    k.circle(iconSize / 2),
                    k.pos(iconSize / 2, iconSize / 2 - 6),
                    k.anchor("center"),
                    k.color(...dCol),
                    k.opacity(0.8),
                ]);
                slot.add([
                    k.text(comp.name.charAt(0), { size: 12 }),
                    k.pos(iconSize / 2, iconSize / 2 - 6),
                    k.anchor("center"),
                    k.color(255, 255, 255),
                ]);
                companionSlots.push(slot);
            });
        }
    }

    /* ---- showChapterTitle(name) ---- */
    function showChapterTitle(name) {
        if (chapterTitleObj) k.destroy(chapterTitleObj);

        chapterTitleObj = k.add([
            k.text(name, { size: 40 }),
            k.pos(W / 2, 120),
            k.anchor("center"),
            k.color(...COLORS.secondary),
            k.opacity(1),
            k.fixed(),
            k.z(7500),
        ]);

        let t = 0;
        const upd = chapterTitleObj.onUpdate(() => {
            t += k.dt();
            if (t > 2) {
                chapterTitleObj.opacity = Math.max(0, 1 - (t - 2) / 1.0);
            }
            if (t >= 3) {
                upd.cancel();
                k.destroy(chapterTitleObj);
                chapterTitleObj = null;
            }
        });
    }

    /* ---- destroy ---- */
    function destroy() {
        for (const s of companionSlots) k.destroy(s);
        companionSlots = [];
        if (chapterTitleObj) {
            k.destroy(chapterTitleObj);
            chapterTitleObj = null;
        }
        if (root) {
            k.destroy(root);
            root = null;
        }
    }

    return { init, update, showChapterTitle, destroy };
}
