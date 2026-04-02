import { COLORS } from "../config/constants.js";
import { getChapter, getNode } from "../config/chapters.js";
import { COMPANIONS } from "../config/companions.js";
import { CHAPTER_1_STORY } from "../data/story/chapter1.js";
import { CHAPTER_2_STORY } from "../data/story/chapter2.js";
import { CHAPTER_3_STORY } from "../data/story/chapter3.js";
import { spawnEnemy } from "../config/enemies.js";

/**
 * chapterMap.js -- Slay-the-Spire-style branching node map.
 */
export function registerChapterMapScene({ k, settings, gameStateStore, telemetry, progression }) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);

    const STORY_DATA = {
        1: CHAPTER_1_STORY,
        2: CHAPTER_2_STORY,
        3: CHAPTER_3_STORY,
    };

    /* ---- node type styling ---- */
    const NODE_STYLES = {
        combat:   { color: COLORS.danger,    radius: 22, label: "Combat" },
        dialogue: { color: [80, 140, 255],   radius: 22, label: "Story" },
        shop:     { color: COLORS.secondary, radius: 22, label: "Shop" },
        mystery:  { color: COLORS.dark,      radius: 22, label: "Mystery" },
        rest:     { color: COLORS.heal,      radius: 22, label: "Rest" },
        boss:     { color: COLORS.danger,    radius: 28, label: "BOSS" },
    };

    k.scene("chapterMap", ({ chapterId }) => {
        const W = k.width();
        const H = k.height();
        const chapter = getChapter(chapterId);
        if (!chapter) {
            k.go("chapterSelect");
            return;
        }

        /* ---- initialize chapter if fresh ---- */
        const state = gameStateStore.getState();
        if (state.chapter !== chapterId) {
            gameStateStore.startChapter(chapterId);
        }

        const visited = gameStateStore.getState().visitedNodes;
        const currentNodeId = gameStateStore.getState().currentNodeId;

        /* ---- determine starting reachable nodes ---- */
        function getReachableNodes() {
            const st = gameStateStore.getState();
            if (st.visitedNodes.length === 0) {
                /* first node(s) of the chapter -- nodes with no inbound connections */
                const allTargets = new Set();
                for (const n of chapter.nodes) {
                    for (const c of n.connections) allTargets.add(c);
                }
                return chapter.nodes
                    .filter((n) => !allTargets.has(n.id))
                    .map((n) => n.id);
            }
            /* nodes reachable from visited nodes that haven't been visited */
            const reachable = new Set();
            for (const vid of st.visitedNodes) {
                const vnode = chapter.nodes.find((n) => n.id === vid);
                if (vnode) {
                    for (const c of vnode.connections) {
                        if (!st.visitedNodes.includes(c)) {
                            reachable.add(c);
                        }
                    }
                }
            }
            return [...reachable];
        }

        const reachable = getReachableNodes();

        /* ---- background ---- */
        k.add([k.rect(W, H), k.pos(0, 0), k.color(...COLORS.bg)]);

        /* subtle fog background */
        for (let i = 0; i < 8; i++) {
            const fogCol = chapter.themeColors.fog;
            const fog = k.add([
                k.rect(k.rand(100, 300), k.rand(40, 100)),
                k.pos(k.rand(0, W), k.rand(0, H)),
                k.color(...fogCol),
                k.opacity(k.rand(0.05, 0.15)),
                k.z(-2),
            ]);
            const drift = k.rand(-8, 8);
            fog.onUpdate(() => {
                fog.pos.x += drift * k.dt();
                if (fog.pos.x > W + 300) fog.pos.x = -300;
                if (fog.pos.x < -300) fog.pos.x = W + 300;
            });
        }

        /* ---- HUD: player stats at top ---- */
        const hudH = 50;
        k.add([
            k.rect(W, hudH),
            k.pos(0, 0),
            k.color(...COLORS.hudBg),
            k.opacity(0.9),
            k.z(10),
        ]);

        const playerState = gameStateStore.getState().player;
        const profile = progression.getProfile();

        /* HP bar */
        const hpBarX = 20;
        const hpBarW = 160;
        k.add([
            k.text("HP", { size: 14 }),
            k.pos(hpBarX, 8),
            k.color(...COLORS.danger),
            k.z(11),
        ]);
        k.add([k.rect(hpBarW, 12), k.pos(hpBarX + 30, 10), k.color(40, 20, 20), k.z(11)]);
        k.add([
            k.rect(Math.floor(hpBarW * (playerState.hp / playerState.maxHp)), 12),
            k.pos(hpBarX + 30, 10),
            k.color(...COLORS.danger),
            k.z(11),
        ]);
        k.add([
            k.text(playerState.hp + "/" + playerState.maxHp, { size: 12 }),
            k.pos(hpBarX + 30 + hpBarW + 8, 11),
            k.color(...COLORS.textPrimary),
            k.z(11),
        ]);

        /* MP bar */
        const mpBarX = 20;
        k.add([
            k.text("MP", { size: 14 }),
            k.pos(mpBarX, 28),
            k.color(...COLORS.frost),
            k.z(11),
        ]);
        k.add([k.rect(hpBarW, 12), k.pos(mpBarX + 30, 30), k.color(20, 20, 40), k.z(11)]);
        k.add([
            k.rect(Math.floor(hpBarW * (playerState.mp / playerState.maxMp)), 12),
            k.pos(mpBarX + 30, 30),
            k.color(...COLORS.frost),
            k.z(11),
        ]);
        k.add([
            k.text(playerState.mp + "/" + playerState.maxMp, { size: 12 }),
            k.pos(mpBarX + 30 + hpBarW + 8, 31),
            k.color(...COLORS.textPrimary),
            k.z(11),
        ]);

        /* level + gold */
        k.add([
            k.text("Lv." + profile.level, { size: 16 }),
            k.pos(300, 10),
            k.color(...COLORS.secondary),
            k.z(11),
        ]);

        const goldItems = gameStateStore.getState().inventory.filter((i) => i.id === "gold");
        const gold = goldItems.length > 0 ? goldItems[0].quantity : 0;
        k.add([
            k.text("Gold: " + gold, { size: 14 }),
            k.pos(300, 30),
            k.color(...COLORS.secondary),
            k.z(11),
        ]);

        /* mentor tokens */
        k.add([
            k.text("Hints: " + gameStateStore.getState().mentorTokens, { size: 14 }),
            k.pos(400, 10),
            k.color(...COLORS.primary),
            k.z(11),
        ]);

        /* chapter name */
        k.add([
            k.text("Chapter " + chapterId + ": " + chapter.name, { size: 18 }),
            k.pos(W / 2 + 80, 15),
            k.anchor("center"),
            k.color(...chapter.themeColors.primary),
            k.z(11),
        ]);

        /* back button */
        const backBtn = k.add([
            k.rect(90, 30),
            k.pos(W - 105, 10),
            k.color(...COLORS.panelBg),
            k.outline(1, rgb(COLORS.panelBorder)),
            k.area(),
            k.z(12),
        ]);
        backBtn.add([
            k.text("Menu", { size: 14 }),
            k.pos(45, 15),
            k.anchor("center"),
            k.color(...COLORS.textPrimary),
        ]);
        backBtn.onClick(() => k.go("menu"));

        /* ---- draw connections (lines between nodes) ---- */
        for (const node of chapter.nodes) {
            for (const connId of node.connections) {
                const target = chapter.nodes.find((n) => n.id === connId);
                if (!target) continue;

                const fromX = node.position.x;
                const fromY = node.position.y;
                const toX = target.position.x;
                const toY = target.position.y;

                /* draw line using small rects */
                const dx = toX - fromX;
                const dy = toY - fromY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const steps = Math.floor(dist / 6);

                for (let s = 0; s <= steps; s++) {
                    const t = s / steps;
                    const px = fromX + dx * t;
                    const py = fromY + dy * t;

                    const isConnected = visited.includes(node.id) && visited.includes(connId);
                    const isReachablePath = visited.includes(node.id) && reachable.includes(connId);

                    k.add([
                        k.rect(3, 3),
                        k.pos(px, py),
                        k.anchor("center"),
                        k.color(...(isConnected ? COLORS.textSecondary : isReachablePath ? chapter.themeColors.primary : [40, 35, 60])),
                        k.opacity(isConnected ? 0.6 : isReachablePath ? 0.8 : 0.25),
                        k.z(0),
                    ]);
                }
            }
        }

        /* ---- draw nodes ---- */
        for (const node of chapter.nodes) {
            const style = NODE_STYLES[node.type] || NODE_STYLES.combat;
            const isVisited = visited.includes(node.id);
            const isReachable = reachable.includes(node.id);
            const isCurrent = node.id === currentNodeId;

            const nx = node.position.x;
            const ny = node.position.y;

            /* outer glow for reachable nodes */
            if (isReachable && !isVisited) {
                const glow = k.add([
                    k.circle(style.radius + 8),
                    k.pos(nx, ny),
                    k.anchor("center"),
                    k.color(...style.color),
                    k.opacity(0.2),
                    k.z(1),
                ]);
                glow.onUpdate(() => {
                    glow.opacity = 0.1 + Math.sin(k.time() * 3) * 0.15;
                });
            }

            /* node circle */
            const nodeObj = k.add([
                k.circle(style.radius),
                k.pos(nx, ny),
                k.anchor("center"),
                k.color(...style.color),
                k.opacity(isVisited ? 0.35 : isReachable ? 1.0 : 0.2),
                k.area({ shape: new k.Rect(k.vec2(-style.radius, -style.radius), style.radius * 2, style.radius * 2) }),
                k.z(2),
            ]);

            /* inner detail */
            k.add([
                k.circle(style.radius - 6),
                k.pos(nx, ny),
                k.anchor("center"),
                k.color(...COLORS.panelBg),
                k.opacity(isVisited ? 0.3 : 0.7),
                k.z(3),
            ]);

            /* icon/label inside node */
            let iconText = "";
            if (node.type === "combat") iconText = "!";
            else if (node.type === "dialogue") iconText = "?";
            else if (node.type === "shop") iconText = "$";
            else if (node.type === "mystery") iconText = "*";
            else if (node.type === "rest") iconText = "+";
            else if (node.type === "boss") iconText = "X";

            k.add([
                k.text(iconText, { size: 18 }),
                k.pos(nx, ny),
                k.anchor("center"),
                k.color(...(isVisited ? COLORS.textSecondary : COLORS.textPrimary)),
                k.opacity(isVisited ? 0.5 : 1),
                k.z(4),
            ]);

            /* boss crown */
            if (node.type === "boss") {
                k.add([
                    k.text("W", { size: 14 }),
                    k.pos(nx, ny - style.radius - 8),
                    k.anchor("center"),
                    k.color(...COLORS.secondary),
                    k.opacity(isVisited ? 0.4 : 1),
                    k.z(4),
                ]);
            }

            /* visited checkmark */
            if (isVisited) {
                k.add([
                    k.text("v", { size: 12 }),
                    k.pos(nx + style.radius - 4, ny - style.radius + 4),
                    k.anchor("center"),
                    k.color(...COLORS.heal),
                    k.z(5),
                ]);
            }

            /* node label below */
            k.add([
                k.text(node.label, { size: 12, width: 100 }),
                k.pos(nx, ny + style.radius + 10),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
                k.opacity(isVisited ? 0.4 : 0.8),
                k.z(2),
            ]);

            /* ---- click handler for reachable nodes ---- */
            if (isReachable && !isVisited) {
                nodeObj.onHover(() => {
                    nodeObj.opacity = 0.8;
                });
                nodeObj.onHoverEnd(() => {
                    nodeObj.opacity = 1.0;
                });

                nodeObj.onClick(() => {
                    handleNodeClick(node);
                });
            }
        }

        /* ---- chapter intro text on first visit ---- */
        if (visited.length === 0) {
            showChapterIntro(chapterId);
        }

        /* ---- check if chapter is complete (boss defeated) ---- */
        const bossNode = chapter.nodes.find((n) => n.type === "boss");
        if (bossNode && visited.includes(bossNode.id)) {
            /* brief delay then go to postChapter */
            let timer = 0;
            const check = k.onUpdate(() => {
                timer += k.dt();
                if (timer > 0.5) {
                    check.cancel();
                    k.go("postChapter", {
                        chapterResult: {
                            chapterId,
                            enemiesDefeated: progression.getProfile().totalEnemiesDefeated,
                            enemiesSpared: progression.getProfile().totalEnemiesSpared,
                        },
                    });
                }
            });
        }

        /* ================================================================ */
        /*  Node click handlers                                             */
        /* ================================================================ */

        function handleNodeClick(node) {
            gameStateStore.visitNode(node.id);
            telemetry.event("node_visited", {
                nodeId: node.id,
                nodeType: node.type,
                chapter: chapterId,
            });

            switch (node.type) {
                case "combat":
                    handleCombatNode(node);
                    break;
                case "dialogue":
                    handleDialogueNode(node);
                    break;
                case "shop":
                    k.go("shop", { nodeId: node.id });
                    break;
                case "mystery":
                    handleMysteryNode(node);
                    break;
                case "rest":
                    handleRestNode(node);
                    break;
                case "boss":
                    handleBossNode(node);
                    break;
                default:
                    k.go("chapterMap", { chapterId });
                    break;
            }
        }

        function handleCombatNode(node) {
            const enemyList = (node.enemies || ["ignorance_imp"]).map((id) => spawnEnemy(id, 1));
            k.go("combat", {
                nodeId: node.id,
                enemies: enemyList,
                isBoss: false,
            });
        }

        function handleBossNode(node) {
            const scale = 1.0 + (chapterId - 1) * 0.25;
            const enemyList = (node.enemies || ["riddler_boss"]).map((id) => spawnEnemy(id, scale));
            k.go("combat", {
                nodeId: node.id,
                enemies: enemyList,
                isBoss: true,
            });
        }

        function handleDialogueNode(node) {
            /* look up story dialogue data by storyRef */
            const storyChapter = STORY_DATA[chapterId];
            let dialogueData = null;
            if (storyChapter && node.storyRef) {
                dialogueData = storyChapter.dialogues[node.storyRef] || null;
            }
            k.go("dialogue", { nodeId: node.id, dialogueData });
        }

        function handleMysteryNode(node) {
            /* resolve mystery inline -- random outcome */
            const roll = Math.random();
            let outcomeText = "";
            let outcomeColor = COLORS.textPrimary;

            if (roll < 0.25) {
                /* companion spark */
                const possibleCompanions = ["algebrix", "reactia", "voltaire", "florae", "chronox", "luminos", "gravitas", "ember"];
                const companionId = possibleCompanions[Math.floor(Math.random() * possibleCompanions.length)];
                const collected = gameStateStore.getState().companions;
                const alreadyHas = collected.some((c) => c.id === companionId);
                if (!alreadyHas && collected.length < 3) {
                    gameStateStore.addCompanion(companionId, 1);
                    progression.recordCompanionCollected(companionId);
                    outcomeText = "A companion spark appears! " + companionId.charAt(0).toUpperCase() + companionId.slice(1) + " joins you!";
                    outcomeColor = COLORS.primary;
                } else {
                    outcomeText = "A faint shimmer... but nothing appears.";
                    outcomeColor = COLORS.textSecondary;
                }
            } else if (roll < 0.5) {
                /* gold reward */
                const goldAmount = 15 + Math.floor(Math.random() * 20);
                gameStateStore.addItem({ id: "gold", name: "Gold", type: "currency", quantity: goldAmount });
                outcomeText = "You found " + goldAmount + " gold hidden in the shadows!";
                outcomeColor = COLORS.secondary;
            } else if (roll < 0.7) {
                /* curse -- minor damage */
                const curseDmg = 10 + Math.floor(Math.random() * 10);
                gameStateStore.damagePlayer(curseDmg);
                outcomeText = "A trap! You take " + curseDmg + " damage from a hidden curse.";
                outcomeColor = COLORS.danger;
            } else {
                /* bonus healing potion */
                gameStateStore.addItem({ id: "potion_small", name: "Healing Potion", type: "heal_potion", quantity: 1 });
                outcomeText = "You found a Healing Potion tucked away in the hollow!";
                outcomeColor = COLORS.heal;
            }

            telemetry.event("mystery_resolved", {
                nodeId: node.id,
                chapter: chapterId,
                outcome: outcomeText,
            });

            /* show outcome overlay */
            showInlineOverlay("Mystery Event", outcomeText, outcomeColor);
        }

        function handleRestNode(node) {
            const playerSt = gameStateStore.getState().player;
            const healAmount = Math.floor(playerSt.maxHp * 0.3);
            const healed = gameStateStore.healPlayer(healAmount);
            const regenMp = Math.floor(playerSt.maxMp * 0.2);
            gameStateStore.regenMp(regenMp);

            telemetry.event("rest_used", {
                nodeId: node.id,
                chapter: chapterId,
                hpHealed: healed,
                mpRegened: regenMp,
            });

            const resultText = "You rest by the " + node.label + ".\nHealed " + healed + " HP and recovered " + regenMp + " MP.";
            showInlineOverlay("Rest", resultText, COLORS.heal);
        }

        /* ================================================================ */
        /*  Overlay helpers                                                 */
        /* ================================================================ */

        function showInlineOverlay(title, message, messageColor) {
            const overlay = k.add([k.pos(0, 0), k.z(200)]);

            /* dim background */
            overlay.add([k.rect(W, H), k.color(0, 0, 0), k.opacity(0.6)]);

            /* panel */
            const pW = 500;
            const pH = 250;
            const px = (W - pW) / 2;
            const py = (H - pH) / 2;

            overlay.add([
                k.rect(pW, pH),
                k.pos(px, py),
                k.color(...COLORS.panelBg),
                k.outline(2, rgb(COLORS.panelBorder)),
            ]);

            overlay.add([
                k.text(title, { size: 28 }),
                k.pos(W / 2, py + 35),
                k.anchor("center"),
                k.color(...COLORS.secondary),
            ]);

            overlay.add([
                k.text(message, { size: 18, width: pW - 40 }),
                k.pos(W / 2, py + 90),
                k.anchor("center"),
                k.color(...messageColor),
            ]);

            /* continue button */
            const contBtn = overlay.add([
                k.rect(180, 44),
                k.pos(W / 2, py + pH - 45),
                k.anchor("center"),
                k.color(Math.floor(COLORS.primary[0] * 0.25),
                        Math.floor(COLORS.primary[1] * 0.25),
                        Math.floor(COLORS.primary[2] * 0.25)),
                k.outline(2, rgb(COLORS.primary)),
                k.area(),
            ]);
            contBtn.add([
                k.text("Continue", { size: 18 }),
                k.anchor("center"),
                k.color(...COLORS.textPrimary),
            ]);

            contBtn.onHover(() => {
                contBtn.color = k.rgb(
                    Math.floor(COLORS.primary[0] * 0.4),
                    Math.floor(COLORS.primary[1] * 0.4),
                    Math.floor(COLORS.primary[2] * 0.4),
                );
            });
            contBtn.onHoverEnd(() => {
                contBtn.color = k.rgb(
                    Math.floor(COLORS.primary[0] * 0.25),
                    Math.floor(COLORS.primary[1] * 0.25),
                    Math.floor(COLORS.primary[2] * 0.25),
                );
            });

            contBtn.onClick(() => {
                k.destroy(overlay);
                /* refresh the map with updated state */
                k.go("chapterMap", { chapterId });
            });
        }

        function showChapterIntro(chapId) {
            const storyData = STORY_DATA[chapId];
            if (!storyData || !storyData.introText) return;

            const overlay = k.add([k.pos(0, 0), k.z(300)]);
            overlay.add([k.rect(W, H), k.color(0, 0, 0), k.opacity(0.8)]);

            const pW = 700;
            const pH = 420;
            const px = (W - pW) / 2;
            const py = (H - pH) / 2;

            overlay.add([
                k.rect(pW, pH),
                k.pos(px, py),
                k.color(...COLORS.panelBg),
                k.outline(2, rgb(chapter.themeColors.primary)),
            ]);

            /* decorative corners */
            const cSz = 12;
            const cPositions = [
                [px, py], [px + pW - cSz, py],
                [px, py + pH - cSz], [px + pW - cSz, py + pH - cSz],
            ];
            for (const [cx, cy] of cPositions) {
                overlay.add([
                    k.rect(cSz, cSz),
                    k.pos(cx, cy),
                    k.color(...chapter.themeColors.primary),
                ]);
            }

            overlay.add([
                k.text("Chapter " + chapId, { size: 18 }),
                k.pos(W / 2, py + 25),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
            ]);

            overlay.add([
                k.text(chapter.name, { size: 32 }),
                k.pos(W / 2, py + 55),
                k.anchor("center"),
                k.color(...chapter.themeColors.primary),
            ]);

            /* typewriter intro text */
            const fullIntro = storyData.introText.join("\n\n");
            let charIdx = 0;
            const introText = overlay.add([
                k.text("", { size: 17, width: pW - 60 }),
                k.pos(px + 30, py + 95),
                k.color(...COLORS.textPrimary),
            ]);

            let done = false;
            const typeUpdate = k.onUpdate(() => {
                if (done) return;
                charIdx += 2;
                if (charIdx >= fullIntro.length) {
                    charIdx = fullIntro.length;
                    done = true;
                }
                introText.text = fullIntro.substring(0, charIdx);
            });

            /* skip on click */
            const skipClick = k.onClick(() => {
                if (!done) {
                    charIdx = fullIntro.length;
                    introText.text = fullIntro;
                    done = true;
                }
            });

            /* continue button (appears after done) */
            const waitForDone = k.onUpdate(() => {
                if (!done) return;
                waitForDone.cancel();

                const contBtn = overlay.add([
                    k.rect(180, 44),
                    k.pos(W / 2, py + pH - 40),
                    k.anchor("center"),
                    k.color(Math.floor(chapter.themeColors.primary[0] * 0.3),
                            Math.floor(chapter.themeColors.primary[1] * 0.3),
                            Math.floor(chapter.themeColors.primary[2] * 0.3)),
                    k.outline(2, rgb(chapter.themeColors.primary)),
                    k.area(),
                ]);
                contBtn.add([
                    k.text("Begin", { size: 20 }),
                    k.anchor("center"),
                    k.color(...COLORS.textPrimary),
                ]);
                contBtn.onClick(() => {
                    typeUpdate.cancel();
                    skipClick.cancel();
                    k.destroy(overlay);
                });
            });
        }
    });
}
