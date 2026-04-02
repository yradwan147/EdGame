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

export function createHudRenderer(k, { progression }) {
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
    //  Public interface
    // =========================================================================
    return {
        init,
        update,
        showWaveBanner,
        showSynergyDiscovery,

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
