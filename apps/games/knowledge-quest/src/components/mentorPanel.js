import { COLORS } from "../config/constants.js";

/**
 * Professor Sage's hint / commentary panel.
 *
 * Owl icon in corner, speech bubble with hint text, token counter.
 * Slides in, auto-dismisses after 4s or on click.
 */
export function createMentorPanel(k) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);
    const W = k.width();

    let root = null;
    let cancelFns = [];
    let autoDismissTimer = null;

    /* ---- cleanup ---- */
    function cleanup() {
        for (const c of cancelFns) {
            if (typeof c === "function") c();
            if (c && typeof c.cancel === "function") c.cancel();
        }
        cancelFns = [];
        if (autoDismissTimer !== null) {
            k.cancel(autoDismissTimer);
            autoDismissTimer = null;
        }
        if (root) {
            k.destroy(root);
            root = null;
        }
    }

    /* ---- slide-in animation helper ---- */
    function slideIn(obj, targetX, duration) {
        const startX = targetX + 320; // off-screen right
        obj.pos.x = startX;
        let t = 0;
        const upd = k.onUpdate(() => {
            t += k.dt();
            const frac = Math.min(t / duration, 1);
            /* ease-out */
            const ease = 1 - Math.pow(1 - frac, 3);
            obj.pos.x = startX + (targetX - startX) * ease;
            if (frac >= 1) upd.cancel();
        });
        cancelFns.push(upd);
    }

    /* ---- public ---- */

    /**
     * showHint(hintText, tokensRemaining)
     * Shows a hint bubble during combat questions.
     */
    function showHint(hintText, tokensRemaining) {
        cleanup();

        root = k.add([k.pos(0, 0), k.fixed(), k.z(10500), "mentor-panel"]);

        const panelW = 300;
        const panelH = 120;
        const panelX = W - panelW - 16;
        const panelY = 16;

        const panel = root.add([k.pos(panelX, panelY)]);

        /* background */
        panel.add([
            k.rect(panelW, panelH),
            k.pos(0, 0),
            k.color(...COLORS.panelBg),
            k.outline(2, rgb(COLORS.secondary)),
            k.opacity(0.95),
        ]);

        /* owl icon (circle with "O") */
        panel.add([
            k.circle(20),
            k.pos(26, 30),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);
        panel.add([
            k.text("O", { size: 18 }),
            k.pos(26, 30),
            k.anchor("center"),
            k.color(...COLORS.panelBg),
        ]);

        /* "Professor Sage" label */
        panel.add([
            k.text("Professor Sage", { size: 13 }),
            k.pos(54, 14),
            k.color(...COLORS.secondary),
        ]);

        /* hint text */
        panel.add([
            k.text(hintText, { size: 14, width: panelW - 64 }),
            k.pos(54, 34),
            k.color(...COLORS.textPrimary),
        ]);

        /* token counter */
        panel.add([
            k.text("(" + tokensRemaining + " remaining)", { size: 12 }),
            k.pos(54, panelH - 24),
            k.color(...COLORS.textSecondary),
        ]);

        /* slide in */
        slideIn(panel, panelX, 0.35);

        /* click to dismiss */
        const clickArea = panel.add([
            k.rect(panelW, panelH),
            k.pos(0, 0),
            k.area(),
            k.opacity(0),
        ]);
        clickArea.onClick(() => dismiss());

        /* auto dismiss after 4s */
        autoDismissTimer = k.wait(4, () => dismiss());
    }

    /**
     * showCommentary(text)
     * Shows a brief Sage comment (no token cost).
     */
    function showCommentary(text) {
        cleanup();

        root = k.add([k.pos(0, 0), k.fixed(), k.z(10500), "mentor-panel"]);

        const panelW = 280;
        const panelH = 80;
        const panelX = W - panelW - 16;
        const panelY = 16;

        const panel = root.add([k.pos(panelX, panelY)]);

        panel.add([
            k.rect(panelW, panelH),
            k.pos(0, 0),
            k.color(...COLORS.panelBg),
            k.outline(2, rgb(COLORS.panelBorder)),
            k.opacity(0.9),
        ]);

        /* owl icon */
        panel.add([
            k.circle(16),
            k.pos(22, 24),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);
        panel.add([
            k.text("O", { size: 14 }),
            k.pos(22, 24),
            k.anchor("center"),
            k.color(...COLORS.panelBg),
        ]);

        /* comment text */
        panel.add([
            k.text(text, { size: 13, width: panelW - 56 }),
            k.pos(46, 14),
            k.color(...COLORS.textPrimary),
        ]);

        slideIn(panel, panelX, 0.3);

        const clickArea = panel.add([
            k.rect(panelW, panelH),
            k.pos(0, 0),
            k.area(),
            k.opacity(0),
        ]);
        clickArea.onClick(() => dismiss());

        autoDismissTimer = k.wait(4, () => dismiss());
    }

    /**
     * dismiss()
     */
    function dismiss() {
        cleanup();
    }

    return { showHint, showCommentary, dismiss, isActive: () => Boolean(root) };
}
