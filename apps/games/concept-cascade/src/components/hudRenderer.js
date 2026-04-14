// ---------------------------------------------------------------------------
//  hudRenderer.js  --  HUD overlay for Concept Cascade tower defense
// ---------------------------------------------------------------------------
//  Usage:
//    const hud = createHudRenderer(k, { progression });
//    hud.init();
//    // each frame during onUpdate:
//    hud.update(gameState);
// ---------------------------------------------------------------------------

import { GAME_CONFIG, COLORS } from "../config/constants.js";
import { TOWER_TYPES } from "../config/towers.js";
import { SYNERGIES } from "../config/synergies.js";

export function createHudRenderer(k, { progression }) {
    // Tower tooltip state — shown on hover over a tower button
    let tooltipObjs = [];
    let tooltipFor = null; // towerType currently showing tooltip
    let discoveredSynergyIds = new Set();
    // References to KAPLAY objects (created in init)
    let topBar = null;
    let bottomBar = null;
    let goldLabel = null;
    let goldIcon = null;
    let waveLabel = null;
    let waveTitleLabel = null;
    let livesLabel = null;
    let livesIcons = [];
    let levelLabel = null;
    let xpBarBg = null;
    let xpBarFill = null;
    let towerButtons = [];
    let earlyCallBtn = null;
    let earlyCallLabel = null;
    let studyBtn = null;
    let studyLabel = null;
    let pauseBtn = null;
    let pauseLabel = null;
    let combatLog = null;
    let combatLogLines = [];
    let bannerText = null;
    let bannerSubtext = null;
    let synergyBanner = null;

    // State tracking for animations
    let prevGold = -1;
    let goldFlashTimer = 0;
    let selectedTower = null;

    const Z_HUD = 1000;
    const TOP_H = 40;
    const BOT_H = 60;
    const W = GAME_CONFIG.width;
    const H = GAME_CONFIG.height;

    function init() {
        // =====================================================================
        //  TOP BAR
        // =====================================================================
        topBar = k.add([
            k.rect(W, TOP_H),
            k.pos(0, 0),
            k.color(...COLORS.hud),
            k.fixed(),
            k.z(Z_HUD),
            "hud-top",
        ]);

        // Gold icon (yellow circle)
        goldIcon = k.add([
            k.circle(8),
            k.pos(14, TOP_H / 2),
            k.anchor("center"),
            k.color(...COLORS.gold),
            k.fixed(),
            k.z(Z_HUD + 1),
        ]);

        // Gold text
        goldLabel = k.add([
            k.text("100 KC", { size: 18 }),
            k.pos(28, TOP_H / 2),
            k.anchor("left"),
            k.color(...COLORS.gold),
            k.fixed(),
            k.z(Z_HUD + 1),
        ]);

        // Wave indicator (center)
        waveLabel = k.add([
            k.text("Wave 0/8", { size: 18 }),
            k.pos(W / 2, TOP_H / 2 - 2),
            k.anchor("center"),
            k.color(...COLORS.waveText),
            k.fixed(),
            k.z(Z_HUD + 1),
        ]);

        waveTitleLabel = k.add([
            k.text("", { size: 12 }),
            k.pos(W / 2, TOP_H / 2 + 12),
            k.anchor("center"),
            k.color(...COLORS.hudText),
            k.fixed(),
            k.z(Z_HUD + 1),
            k.opacity(0.7),
        ]);

        // Lives (right side of top bar)
        livesLabel = k.add([
            k.text("20", { size: 18 }),
            k.pos(W - 90, TOP_H / 2),
            k.anchor("center"),
            k.color(...COLORS.lives),
            k.fixed(),
            k.z(Z_HUD + 1),
        ]);

        // Heart icons (3 small red circles beside lives count)
        for (let i = 0; i < 3; i++) {
            const heart = k.add([
                k.circle(5),
                k.pos(W - 70 + i * 14, TOP_H / 2),
                k.anchor("center"),
                k.color(...COLORS.lives),
                k.fixed(),
                k.z(Z_HUD + 1),
                k.opacity(1),
            ]);
            livesIcons.push(heart);
        }

        // Level + XP bar (far right)
        levelLabel = k.add([
            k.text("Lv 1", { size: 14 }),
            k.pos(W - 28, TOP_H / 2 - 8),
            k.anchor("center"),
            k.color(...COLORS.hudText),
            k.fixed(),
            k.z(Z_HUD + 1),
        ]);

        xpBarBg = k.add([
            k.rect(44, 5),
            k.pos(W - 50, TOP_H / 2 + 6),
            k.color(40, 40, 55),
            k.fixed(),
            k.z(Z_HUD + 1),
        ]);

        xpBarFill = k.add([
            k.rect(0, 5),
            k.pos(W - 50, TOP_H / 2 + 6),
            k.color(80, 220, 140),
            k.fixed(),
            k.z(Z_HUD + 1),
        ]);

        // =====================================================================
        //  BOTTOM BAR
        // =====================================================================
        bottomBar = k.add([
            k.rect(W, BOT_H),
            k.pos(0, H - BOT_H),
            k.color(...COLORS.hud),
            k.fixed(),
            k.z(Z_HUD),
            "hud-bottom",
        ]);

        // Tower selection buttons (4 towers)
        const towerKeys = Object.keys(TOWER_TYPES);
        const btnW = 160;
        const btnH = 44;
        const btnGap = 8;
        const totalBtnsW = towerKeys.length * btnW + (towerKeys.length - 1) * btnGap;
        const btnsStartX = 20;

        towerButtons = [];
        for (let i = 0; i < towerKeys.length; i++) {
            const tKey = towerKeys[i];
            const tDef = TOWER_TYPES[tKey];
            const bx = btnsStartX + i * (btnW + btnGap);
            const by = H - BOT_H + (BOT_H - btnH) / 2;

            const btnBg = k.add([
                k.rect(btnW, btnH),
                k.pos(bx, by),
                k.color(30, 38, 55),
                k.outline(2, k.rgb(...tDef.color)),
                k.area(),
                k.fixed(),
                k.z(Z_HUD + 1),
                k.opacity(1),
            ]);

            // Tower color circle icon
            k.add([
                k.circle(8),
                k.pos(bx + 16, by + btnH / 2),
                k.anchor("center"),
                k.color(...tDef.color),
                k.fixed(),
                k.z(Z_HUD + 2),
            ]);

            // Tower name
            const nameLabel = k.add([
                k.text(tDef.name, { size: 12 }),
                k.pos(bx + 30, by + 10),
                k.anchor("left"),
                k.color(220, 220, 235),
                k.fixed(),
                k.z(Z_HUD + 2),
            ]);

            // Cost label
            const costLabel = k.add([
                k.text(`${tDef.cost} KC`, { size: 11 }),
                k.pos(bx + 30, by + 28),
                k.anchor("left"),
                k.color(...COLORS.gold),
                k.fixed(),
                k.z(Z_HUD + 2),
            ]);

            // Keyboard hint
            k.add([
                k.text(`(${i + 1})`, { size: 10 }),
                k.pos(bx + btnW - 10, by + 6),
                k.anchor("right"),
                k.color(120, 130, 160),
                k.fixed(),
                k.z(Z_HUD + 2),
            ]);

            btnBg.onClick(() => {
                selectedTower = tKey;
                btnBg.trigger("tower_selected", { towerType: tKey });
            });

            // Tooltip on hover
            btnBg.onHover(() => showTowerTooltip(tKey, bx, by));
            btnBg.onHoverEnd(() => {
                if (tooltipFor === tKey) hideTowerTooltip();
            });

            towerButtons.push({
                key: tKey,
                bg: btnBg,
                nameLabel,
                costLabel,
                def: tDef,
            });
        }

        // -- Right-side action buttons ----------------------------------------
        const actBtnW = 95;
        const actBtnH = 34;
        const actY = H - BOT_H + (BOT_H - actBtnH) / 2;

        // Early Call button
        earlyCallBtn = k.add([
            k.rect(actBtnW, actBtnH),
            k.pos(W - 310, actY),
            k.color(60, 80, 50),
            k.outline(1, k.rgb(120, 200, 90)),
            k.area(),
            k.fixed(),
            k.z(Z_HUD + 1),
        ]);
        earlyCallLabel = k.add([
            k.text("Early Call", { size: 13 }),
            k.pos(W - 310 + actBtnW / 2, actY + actBtnH / 2),
            k.anchor("center"),
            k.color(160, 230, 130),
            k.fixed(),
            k.z(Z_HUD + 2),
        ]);

        // Study button
        studyBtn = k.add([
            k.rect(actBtnW, actBtnH),
            k.pos(W - 205, actY),
            k.color(50, 50, 80),
            k.outline(1, k.rgb(100, 130, 220)),
            k.area(),
            k.fixed(),
            k.z(Z_HUD + 1),
        ]);
        studyLabel = k.add([
            k.text("Study (Q)", { size: 13 }),
            k.pos(W - 205 + actBtnW / 2, actY + actBtnH / 2),
            k.anchor("center"),
            k.color(140, 170, 255),
            k.fixed(),
            k.z(Z_HUD + 2),
        ]);

        // Pause button
        pauseBtn = k.add([
            k.rect(actBtnW, actBtnH),
            k.pos(W - 100, actY),
            k.color(50, 45, 55),
            k.outline(1, k.rgb(160, 160, 180)),
            k.area(),
            k.fixed(),
            k.z(Z_HUD + 1),
        ]);
        pauseLabel = k.add([
            k.text("Pause (P)", { size: 13 }),
            k.pos(W - 100 + actBtnW / 2, actY + actBtnH / 2),
            k.anchor("center"),
            k.color(180, 180, 200),
            k.fixed(),
            k.z(Z_HUD + 2),
        ]);

        // =====================================================================
        //  COMBAT LOG (top-right, small text)
        // =====================================================================
        combatLogLines = [];
        for (let i = 0; i < 3; i++) {
            const line = k.add([
                k.text("", { size: 11 }),
                k.pos(W - 10, TOP_H + 8 + i * 16),
                k.anchor("topright"),
                k.color(...COLORS.hudText),
                k.opacity(0.65),
                k.fixed(),
                k.z(Z_HUD + 1),
            ]);
            combatLogLines.push(line);
        }
    }

    // =========================================================================
    //  update()  --  called each frame with current game state
    // =========================================================================
    function update(state) {
        if (!goldLabel) return; // not initialized

        // --- Gold (animated flash on change) ----------------------------------
        const gold = state.gold;
        if (prevGold >= 0 && gold !== prevGold) {
            goldFlashTimer = 0.3;
        }
        prevGold = gold;

        if (goldFlashTimer > 0) {
            goldFlashTimer -= k.dt();
            goldLabel.color = k.rgb(255, 255, 200);
            goldIcon.radius = 8 + 3 * Math.sin(goldFlashTimer * 20);
        } else {
            goldLabel.color = k.rgb(...COLORS.gold);
        }
        goldLabel.text = `${gold} KC`;

        // --- Wave indicator ---------------------------------------------------
        const totalWaves = 8; // from WAVES config
        waveLabel.text = `Wave ${state.wave}/${totalWaves}`;

        // --- Lives ------------------------------------------------------------
        livesLabel.text = `${state.lives}`;
        // Fade heart icons based on lives remaining
        for (let i = 0; i < livesIcons.length; i++) {
            const threshold = Math.ceil(
                (GAME_CONFIG.startingLives / livesIcons.length) * (livesIcons.length - i),
            );
            livesIcons[i].opacity = state.lives >= threshold ? 1 : 0.2;
        }
        // Flash lives red when low
        if (state.lives <= 5) {
            livesLabel.color = k.rgb(
                255,
                90 + 40 * Math.sin(k.time() * 6),
                90,
            );
        } else {
            livesLabel.color = k.rgb(...COLORS.lives);
        }

        // --- Level + XP -------------------------------------------------------
        const profile = progression.getProfile();
        levelLabel.text = `Lv ${profile.level}`;
        const nextXp = progression.requiredXpForLevel(profile.level + 1);
        const xpRatio = nextXp > 0 ? Math.min(1, profile.xp / nextXp) : 0;
        xpBarFill.width = 44 * xpRatio;

        // --- Tower buttons affordability --------------------------------------
        for (const tb of towerButtons) {
            const canAfford = state.gold >= tb.def.cost;
            const isSelected = selectedTower === tb.key;

            tb.bg.opacity = canAfford ? 1 : 0.4;
            tb.costLabel.color = canAfford
                ? k.rgb(...COLORS.gold)
                : k.rgb(120, 100, 100);

            // Highlight selected
            if (isSelected) {
                tb.bg.color = k.rgb(50, 60, 80);
                tb.bg.outline.color = k.rgb(255, 255, 200);
            } else {
                tb.bg.color = k.rgb(30, 38, 55);
                tb.bg.outline.color = k.rgb(...tb.def.color);
            }
        }

        // --- Action button visibility based on phase -------------------------
        const isPrep = state.phase === "prep";
        const isCombat = state.phase === "combat";

        // Early Call: glow during prep
        if (isPrep) {
            const pulse = 0.6 + 0.4 * Math.sin(k.time() * 4);
            earlyCallBtn.color = k.rgb(
                Math.floor(60 + 40 * pulse),
                Math.floor(80 + 40 * pulse),
                50,
            );
            earlyCallBtn.opacity = 1;
            earlyCallLabel.opacity = 1;
        } else {
            earlyCallBtn.opacity = 0.3;
            earlyCallLabel.opacity = 0.3;
        }

        // Study: visible during prep
        studyBtn.opacity = isPrep ? 1 : 0.3;
        studyLabel.opacity = isPrep ? 1 : 0.3;

        // --- Combat log -------------------------------------------------------
        const events = state.events || [];
        const recent = events.slice(-3);
        for (let i = 0; i < 3; i++) {
            if (i < recent.length) {
                combatLogLines[i].text = recent[i].msg;
                combatLogLines[i].opacity = 0.5 + 0.2 * (i === recent.length - 1 ? 1 : 0);
            } else {
                combatLogLines[i].text = "";
            }
        }
    }

    // =========================================================================
    //  Banner effects
    // =========================================================================
    function showWaveBanner(title, subtitle) {
        // Centered large text that scales up then fades
        if (bannerText) k.destroy(bannerText);
        if (bannerSubtext) k.destroy(bannerSubtext);

        bannerText = k.add([
            k.text(title, { size: 48 }),
            k.pos(W / 2, H / 2 - 30),
            k.anchor("center"),
            k.color(...COLORS.waveText),
            k.opacity(1),
            k.scale(0.5),
            k.fixed(),
            k.z(Z_HUD + 50),
            k.lifespan(2.5, { fade: 1.0 }),
        ]);

        // Scale-up animation
        let bannerAge = 0;
        bannerText.onUpdate(() => {
            bannerAge += k.dt();
            const s = Math.min(1.2, 0.5 + bannerAge * 2);
            bannerText.scale = k.vec2(s, s);
        });

        if (subtitle) {
            bannerSubtext = k.add([
                k.text(subtitle, { size: 20 }),
                k.pos(W / 2, H / 2 + 20),
                k.anchor("center"),
                k.color(...COLORS.hudText),
                k.opacity(0.8),
                k.fixed(),
                k.z(Z_HUD + 50),
                k.lifespan(2.5, { fade: 1.0 }),
            ]);
        }
    }

    function showSynergyDiscovery(synergyName) {
        if (synergyBanner) k.destroy(synergyBanner);

        synergyBanner = k.add([
            k.text(`Synergy Discovered: ${synergyName}`, { size: 24 }),
            k.pos(W / 2, H / 2 + 80),
            k.anchor("center"),
            k.color(...COLORS.synergy),
            k.opacity(1),
            k.fixed(),
            k.z(Z_HUD + 55),
            k.lifespan(3.0, { fade: 1.2 }),
        ]);

        // Float upward
        synergyBanner.onUpdate(() => {
            synergyBanner.pos.y -= 15 * k.dt();
        });
    }

    // =========================================================================
    //  Tower tooltip (hover over tower button)
    // =========================================================================
    function clearTooltip() {
        for (const obj of tooltipObjs) {
            try { k.destroy(obj); } catch { /* ignore */ }
        }
        tooltipObjs = [];
    }

    function hideTowerTooltip() {
        clearTooltip();
        tooltipFor = null;
    }

    /** Returns an array of synergy hint strings for the given tower type. */
    function synergyHintsFor(towerKey) {
        const hints = [];
        for (const syn of SYNERGIES) {
            const req = syn.requires;
            let involvesThisTower = false;
            let partnerLabel = "";

            if (req === "any3") {
                involvesThisTower = true;
                partnerLabel = "with any 2 other towers in a triangle";
            } else if (Array.isArray(req)) {
                if (req.includes(towerKey)) {
                    involvesThisTower = true;
                    if (req[0] === req[1]) {
                        partnerLabel = "with another " + (TOWER_TYPES[req[0]]?.name || req[0]);
                    } else {
                        const partner = req.find((r) => r !== towerKey) ?? req.find((r) => r === towerKey);
                        const partnerName = TOWER_TYPES[partner]?.name || partner;
                        partnerLabel = "with " + partnerName + " nearby";
                    }
                }
            }

            if (!involvesThisTower) continue;

            if (discoveredSynergyIds.has(syn.id)) {
                // Full reveal
                hints.push(`★ ${syn.name}: ${syn.description}`);
            } else {
                // Hint only
                hints.push(`• Combo ${partnerLabel}?`);
            }
        }
        return hints;
    }

    function showTowerTooltip(towerKey, anchorX, anchorY) {
        clearTooltip();
        tooltipFor = towerKey;

        const tDef = TOWER_TYPES[towerKey];
        if (!tDef) return;

        const hints = synergyHintsFor(towerKey);

        const tipW = 320;
        const padding = 12;
        const innerW = tipW - padding * 2;
        const gap = 4;      // extra space between lines
        const spacerH = 6;  // height of empty spacer lines

        // Assemble text line descriptors
        const lines = [];
        lines.push({ text: tDef.name, size: 16, color: tDef.color });
        lines.push({ text: tDef.description || "", size: 12, color: [210, 215, 235] });
        lines.push({ spacer: true });
        lines.push({ text: `Cost: ${tDef.cost} KC`, size: 11, color: COLORS.gold });
        lines.push({ text: `Range: ${tDef.range}  ·  Damage: ${tDef.damage}  ·  Rate: ${tDef.fireRate}/s`, size: 10, color: [160, 170, 200] });
        if (tDef.splashRadius) {
            lines.push({ text: `Splash radius: ${tDef.splashRadius}`, size: 10, color: [160, 170, 200] });
        }
        if (tDef.slowFactor) {
            lines.push({ text: `Slow: ${Math.round(tDef.slowFactor * 100)}% for ${tDef.slowDuration}s`, size: 10, color: [160, 170, 200] });
        }
        lines.push({ spacer: true });
        lines.push({ text: "SYNERGIES", size: 10, color: [120, 130, 160] });
        if (hints.length === 0) {
            lines.push({ text: "(none for this tower)", size: 11, color: [120, 130, 160] });
        } else {
            for (const h of hints) {
                const isRevealed = h.startsWith("★");
                lines.push({
                    text: h,
                    size: 11,
                    color: isRevealed ? COLORS.gold : [180, 190, 220],
                });
            }
        }

        // --- Pass 1: create text objects off-screen so KAPLAY can lay them
        //             out (wrapping long strings inside innerW) and expose
        //             the real `.height` property on each.
        const SANDBOX_X = -5000;
        const SANDBOX_Y = -5000;
        const measured = [];
        let contentH = 0;

        for (const line of lines) {
            if (line.spacer) {
                measured.push({ spacer: true, height: spacerH });
                contentH += spacerH;
                continue;
            }
            const txt = k.add([
                k.text(line.text, { size: line.size, width: innerW }),
                k.pos(SANDBOX_X, SANDBOX_Y),
                k.color(...(line.color || [230, 230, 255])),
                k.fixed(),
                k.z(Z_HUD + 101),
            ]);
            // KAPLAY exposes .height on text objects after being added.
            const h = (typeof txt.height === "number" && txt.height > 0)
                ? txt.height
                : line.size * 1.3;
            measured.push({ obj: txt, height: h });
            contentH += h + gap;
        }

        const tipH = contentH + padding * 2;

        // --- Position tooltip above the hovered button, clamped to screen
        let tipX = anchorX;
        let tipY = anchorY - tipH - 8;
        if (tipX + tipW > W - 10) tipX = W - tipW - 10;
        if (tipX < 10) tipX = 10;
        if (tipY < 10) tipY = 10;

        // --- Backdrop (drawn behind text; lower z than text objects)
        const bg = k.add([
            k.rect(tipW, tipH, { radius: 6 }),
            k.pos(tipX, tipY),
            k.color(14, 18, 32),
            k.outline(2, k.rgb(...tDef.color)),
            k.opacity(0.95),
            k.fixed(),
            k.z(Z_HUD + 100),
        ]);
        tooltipObjs.push(bg);

        // --- Pass 2: reposition the measured text objects into their
        //             final slots using the actual heights.
        let ly = tipY + padding;
        for (const ml of measured) {
            if (ml.spacer) {
                ly += ml.height;
                continue;
            }
            ml.obj.pos = k.vec2(tipX + padding, ly);
            tooltipObjs.push(ml.obj);
            ly += ml.height + gap;
        }
    }

    // =========================================================================
    //  Public interface
    // =========================================================================
    return {
        init,
        update,
        showWaveBanner,
        showSynergyDiscovery,

        /**
         * Called by the scene to pass in the current set of discovered
         * synergy IDs so tooltips reveal full text once a combo is found.
         */
        setDiscoveredSynergies(ids) {
            discoveredSynergyIds = new Set(ids);
        },

        getSelectedTower() {
            return selectedTower;
        },

        setSelectedTower(towerKey) {
            selectedTower = towerKey;
        },

        clearSelectedTower() {
            selectedTower = null;
        },

        setWaveTitle(title) {
            if (waveTitleLabel) waveTitleLabel.text = title || "";
        },

        getEarlyCallBtn() {
            return earlyCallBtn;
        },

        getStudyBtn() {
            return studyBtn;
        },

        getPauseBtn() {
            return pauseBtn;
        },

        getTowerButtons() {
            return towerButtons;
        },
    };
}
