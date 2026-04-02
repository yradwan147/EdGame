import { COLORS } from "../config/constants.js";
import { getNode } from "../config/chapters.js";
import { createDialogueSystem } from "../systems/dialogueSystem.js";
import { CHAPTER_1_STORY } from "../data/story/chapter1.js";
import { CHAPTER_2_STORY } from "../data/story/chapter2.js";
import { CHAPTER_3_STORY } from "../data/story/chapter3.js";

/**
 * dialogue.js -- Dialogue encounter scene with typewriter text and choices.
 */
export function registerDialogueScene({ k, gameStateStore, telemetry, progression }) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);

    const STORY_DATA = {
        1: CHAPTER_1_STORY,
        2: CHAPTER_2_STORY,
        3: CHAPTER_3_STORY,
    };

    k.scene("dialogue", ({ nodeId, dialogueData }) => {
        const W = k.width();
        const H = k.height();
        const state = gameStateStore.getState();

        /* ---- background ---- */
        k.add([k.rect(W, H), k.pos(0, 0), k.color(...COLORS.bg)]);

        /* ---- ambient particles ---- */
        for (let i = 0; i < 15; i++) {
            const p = k.add([
                k.rect(k.rand(2, 4), k.rand(2, 4)),
                k.pos(k.rand(0, W), k.rand(0, H)),
                k.color(...COLORS.primary),
                k.opacity(k.rand(0.1, 0.3)),
                k.z(-1),
            ]);
            p.onUpdate(() => {
                p.pos.y -= k.dt() * k.rand(5, 15);
                if (p.pos.y < -10) {
                    p.pos.y = H + 10;
                    p.pos.x = k.rand(0, W);
                }
            });
        }

        /* ---- resolve the actual dialogue data from story ---- */
        let resolvedData = dialogueData;
        if (!resolvedData && nodeId) {
            const chapterStory = STORY_DATA[state.chapter];
            if (chapterStory) {
                /* Look up storyRef from node config */
                const nodeConfig = getNode(state.chapter, nodeId);
                if (nodeConfig && nodeConfig.storyRef && chapterStory.dialogues[nodeConfig.storyRef]) {
                    resolvedData = chapterStory.dialogues[nodeConfig.storyRef];
                }
                /* Fallback: search dialogues by matching nodeId */
                if (!resolvedData) {
                    for (const [key, val] of Object.entries(chapterStory.dialogues)) {
                        if (nodeId.includes(key) || val.id === nodeId) {
                            resolvedData = val;
                            break;
                        }
                    }
                }
                /* Last resort: first available dialogue */
                if (!resolvedData) {
                    resolvedData = Object.values(chapterStory.dialogues)[0];
                }
            }
        }

        if (!resolvedData) {
            /* nothing to show -- return to map */
            k.go("chapterMap", { chapterId: state.chapter });
            return;
        }

        /* ---- convert story dialogue format to dialogueSystem format ---- */
        const dialogueForSystem = {
            id: resolvedData.id,
            npcName: resolvedData.npcName,
            stages: [],
        };

        if (resolvedData.stages) {
            for (let si = 0; si < resolvedData.stages.length; si++) {
                const stageData = resolvedData.stages[si];
                const stageId = resolvedData.id + "_stage_" + si;
                const nextStageId = si < resolvedData.stages.length - 1
                    ? resolvedData.id + "_stage_" + (si + 1)
                    : null;

                const stage = {
                    id: stageId,
                    text: stageData.text,
                    speaker: "npc",
                };

                if (stageData.choices && stageData.choices.length > 0) {
                    stage.choices = stageData.choices.map((c) => ({
                        id: c.id,
                        text: c.text,
                        category: c.category,
                        trustChange: c.trustChange || 0,
                        worldEffect: c.worldEffect
                            ? { key: c.worldEffect.type + "_" + (c.worldEffect.detail || ""), value: c.worldEffect }
                            : undefined,
                        giveItem: c.worldEffect && c.worldEffect.type === "immediate_item"
                            ? { id: c.worldEffect.detail, name: c.worldEffect.detail, type: "quest_item", quantity: 1 }
                            : undefined,
                        nextStageId,
                    }));
                } else {
                    stage.nextStageId = nextStageId;
                }

                dialogueForSystem.stages.push(stage);
            }
        }

        /* ---- NPC description header ---- */
        if (resolvedData.npcDescription) {
            k.add([
                k.rect(W - 80, 70),
                k.pos(40, 20),
                k.color(COLORS.panelBg[0] + 5, COLORS.panelBg[1] + 4, COLORS.panelBg[2] + 10),
                k.outline(1, rgb(COLORS.panelBorder)),
                k.opacity(0.9),
            ]);
            k.add([
                k.text(resolvedData.npcDescription, { size: 13, width: W - 120 }),
                k.pos(60, 32),
                k.color(...COLORS.textSecondary),
            ]);
        }

        /* ---- NPC name plate ---- */
        k.add([
            k.rect(200, 32),
            k.pos(W / 2 - 100, 95),
            k.color(...COLORS.panelBg),
            k.outline(1, rgb(COLORS.secondary)),
        ]);
        k.add([
            k.text(resolvedData.npcName, { size: 20 }),
            k.pos(W / 2, 111),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);

        /* ---- NPC visual (simple geometric representation) ---- */
        const npcX = W / 2;
        const npcY = 200;
        k.add([
            k.circle(50),
            k.pos(npcX, npcY),
            k.anchor("center"),
            k.color(...COLORS.primary),
            k.opacity(0.4),
        ]);
        k.add([
            k.circle(35),
            k.pos(npcX, npcY),
            k.anchor("center"),
            k.color(...COLORS.secondary),
            k.opacity(0.6),
        ]);

        /* ---- dialogue box area ---- */
        const boxY = 310;
        const boxH = 180;
        const boxW = W - 100;
        const boxX = 50;

        k.add([
            k.rect(boxW, boxH),
            k.pos(boxX, boxY),
            k.color(...COLORS.panelBg),
            k.outline(2, rgb(COLORS.panelBorder)),
        ]);

        /* decorative corners */
        const cornerSz = 10;
        const cornerPositions = [
            [boxX, boxY],
            [boxX + boxW - cornerSz, boxY],
            [boxX, boxY + boxH - cornerSz],
            [boxX + boxW - cornerSz, boxY + boxH - cornerSz],
        ];
        for (const [cx, cy] of cornerPositions) {
            k.add([
                k.rect(cornerSz, cornerSz),
                k.pos(cx, cy),
                k.color(...COLORS.secondary),
            ]);
        }

        /* ---- run the dialogue system ---- */
        const dialogueSystem = createDialogueSystem({ k, gameStateStore, telemetry, progression });

        let displayRoot = null;

        async function displayStage(stage) {
            if (displayRoot) k.destroy(displayRoot);
            displayRoot = k.add([k.pos(0, 0), k.z(100)]);

            return new Promise((resolve) => {
                /* speaker name */
                const speakerName = stage.speaker === "npc"
                    ? resolvedData.npcName
                    : "You";

                displayRoot.add([
                    k.text(speakerName, { size: 20 }),
                    k.pos(boxX + 18, boxY + 12),
                    k.color(...COLORS.secondary),
                ]);

                /* typewriter text */
                const fullText = stage.text;
                let charIndex = 0;
                const textObj = displayRoot.add([
                    k.text("", { size: 17, width: boxW - 50 }),
                    k.pos(boxX + 18, boxY + 40),
                    k.color(...COLORS.textPrimary),
                ]);

                let typewriterDone = false;
                const typeInterval = 0.018;
                let typeTimer = 0;

                const typeUpdate = k.onUpdate(() => {
                    if (typewriterDone) return;
                    typeTimer += k.dt();
                    while (typeTimer >= typeInterval && charIndex < fullText.length) {
                        charIndex++;
                        typeTimer -= typeInterval;
                    }
                    textObj.text = fullText.substring(0, charIndex);
                    if (charIndex >= fullText.length) {
                        typewriterDone = true;
                    }
                });

                /* click to skip typewriter */
                const skipClick = k.onClick(() => {
                    if (!typewriterDone) {
                        charIndex = fullText.length;
                        textObj.text = fullText;
                        typewriterDone = true;
                    }
                });

                if (stage.choices && stage.choices.length > 0) {
                    /* wait for typewriter to finish, then present choices */
                    const choiceCheck = k.onUpdate(() => {
                        if (!typewriterDone) return;
                        choiceCheck.cancel();

                        const choiceStartY = boxY + boxH + 12;
                        const choiceBtnH = 42;
                        const choiceGap = 6;

                        for (let ci = 0; ci < stage.choices.length; ci++) {
                            const choice = stage.choices[ci];
                            const cy = choiceStartY + ci * (choiceBtnH + choiceGap);

                            let borderCol = COLORS.primary;
                            if (choice.category === "prosocial") borderCol = COLORS.heal;
                            else if (choice.category === "self_interest") borderCol = COLORS.danger;
                            else if (choice.category === "transactional") borderCol = COLORS.secondary;

                            const choiceBtn = displayRoot.add([
                                k.rect(boxW, choiceBtnH),
                                k.pos(boxX, cy),
                                k.color(COLORS.panelBg[0] + 8, COLORS.panelBg[1] + 6, COLORS.panelBg[2] + 16),
                                k.outline(2, rgb(borderCol)),
                                k.area(),
                            ]);

                            choiceBtn.add([
                                k.text(choice.text, { size: 15, width: boxW - 30 }),
                                k.pos(15, choiceBtnH / 2),
                                k.anchor("left"),
                                k.color(...COLORS.textPrimary),
                            ]);

                            choiceBtn.onHover(() => {
                                choiceBtn.color = k.rgb(
                                    COLORS.panelBg[0] + 20,
                                    COLORS.panelBg[1] + 16,
                                    COLORS.panelBg[2] + 32,
                                );
                            });
                            choiceBtn.onHoverEnd(() => {
                                choiceBtn.color = k.rgb(
                                    COLORS.panelBg[0] + 8,
                                    COLORS.panelBg[1] + 6,
                                    COLORS.panelBg[2] + 16,
                                );
                            });

                            choiceBtn.onClick(() => {
                                typeUpdate.cancel();
                                skipClick.cancel();
                                resolve(ci);
                            });
                        }
                    });
                } else {
                    /* no choices -- tap to continue */
                    const contCheck = k.onUpdate(() => {
                        if (!typewriterDone) return;
                        contCheck.cancel();

                        const contLabel = displayRoot.add([
                            k.text("(Click to continue)", { size: 14 }),
                            k.pos(boxX + boxW / 2, boxY + boxH - 18),
                            k.anchor("center"),
                            k.color(...COLORS.textSecondary),
                        ]);
                        contLabel.onUpdate(() => {
                            contLabel.opacity = 0.5 + Math.sin(k.time() * 3) * 0.3;
                        });

                        const contClick = k.onClick(() => {
                            typeUpdate.cancel();
                            skipClick.cancel();
                            contClick.cancel();
                            resolve(null);
                        });
                    });
                }
            });
        }

        /* ---- consequence summary screen ---- */
        async function showConsequence(summary) {
            if (displayRoot) k.destroy(displayRoot);
            displayRoot = k.add([k.pos(0, 0), k.z(100)]);

            if (summary.choicesMade.length > 0) {
                const trustText = summary.totalTrustChange >= 0
                    ? "+" + summary.totalTrustChange + " Trust"
                    : summary.totalTrustChange + " Trust";

                displayRoot.add([
                    k.text("Dialogue Complete", { size: 26 }),
                    k.pos(W / 2, boxY + 20),
                    k.anchor("center"),
                    k.color(...COLORS.secondary),
                ]);

                displayRoot.add([
                    k.text("Trust Change: " + trustText, { size: 20 }),
                    k.pos(W / 2, boxY + 60),
                    k.anchor("center"),
                    k.color(...(summary.totalTrustChange >= 0 ? COLORS.heal : COLORS.danger)),
                ]);

                displayRoot.add([
                    k.text("Choices Made: " + summary.choicesMade.length, { size: 16 }),
                    k.pos(W / 2, boxY + 90),
                    k.anchor("center"),
                    k.color(...COLORS.textSecondary),
                ]);

                /* show consequence text from last stage's chosen option */
                const lastStage = resolvedData.stages[resolvedData.stages.length - 1];
                if (lastStage && summary.choicesMade.length > 0) {
                    const lastChoiceId = summary.choicesMade[summary.choicesMade.length - 1].choiceId;
                    const choiceDef = lastStage.choices
                        ? lastStage.choices.find((c) => c.id === lastChoiceId)
                        : null;
                    if (choiceDef && choiceDef.consequence) {
                        displayRoot.add([
                            k.text(choiceDef.consequence, { size: 14, width: boxW - 40 }),
                            k.pos(W / 2, boxY + 120),
                            k.anchor("center"),
                            k.color(...COLORS.textPrimary),
                        ]);
                    }
                }
            }

            /* continue button */
            await new Promise((resolve) => {
                const contBtn = displayRoot.add([
                    k.rect(200, 50),
                    k.pos(W / 2, boxY + boxH - 30),
                    k.anchor("center"),
                    k.color(Math.floor(COLORS.primary[0] * 0.25),
                            Math.floor(COLORS.primary[1] * 0.25),
                            Math.floor(COLORS.primary[2] * 0.25)),
                    k.outline(2, rgb(COLORS.primary)),
                    k.area(),
                ]);
                contBtn.add([
                    k.text("Continue", { size: 20 }),
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
                contBtn.onClick(() => resolve());
            });
        }

        /* ---- run the dialogue ---- */
        (async () => {
            const summary = await dialogueSystem.startDialogue(dialogueForSystem, displayStage);
            await showConsequence(summary);
            k.go("chapterMap", { chapterId: state.chapter });
        })();
    });
}
