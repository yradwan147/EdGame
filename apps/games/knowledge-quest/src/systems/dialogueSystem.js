/**
 * dialogueSystem.js -- Branching dialogue encounter manager for Knowledge Quest.
 *
 * Manages NPC conversations with branching choices. Each choice may carry
 * consequences: trust changes, world-state flags, inventory rewards, and
 * prosocial/self-interest categorisation for assessment.
 *
 * dialogueData schema:
 * {
 *   id: string,
 *   npcName: string,
 *   stages: [
 *     {
 *       id: string,
 *       text: string,
 *       speaker: "npc" | "player",
 *       choices?: [
 *         {
 *           id: string,
 *           text: string,
 *           category: "prosocial" | "self_interest" | "neutral",
 *           trustChange: number,
 *           worldEffect?: { key: string, value: any },
 *           giveItem?: { id, name, type, quantity },
 *           removeItem?: string,
 *           nextStageId?: string,   // if omitted, dialogue ends
 *         }
 *       ],
 *       nextStageId?: string,  // auto-advance if no choices
 *     }
 *   ]
 * }
 */

export function createDialogueSystem({ k, gameStateStore, telemetry, progression }) {

    /**
     * Run a dialogue encounter to completion.
     * Returns a promise that resolves with a summary when the dialogue ends.
     *
     * The `displayStage` callback is provided by the scene and must:
     *   - Show the stage text and speaker
     *   - If choices are present, show buttons and return the chosen index
     *   - If no choices, wait for player tap/click and return null
     *   - Returns Promise<number | null>
     */
    async function startDialogue(dialogueData, displayStage) {
        const summary = {
            dialogueId: dialogueData.id,
            npcName: dialogueData.npcName,
            choicesMade: [],
            totalTrustChange: 0,
        };

        const stageMap = new Map();
        for (const stage of dialogueData.stages) {
            stageMap.set(stage.id, stage);
        }

        let currentStageId = dialogueData.stages[0]?.id ?? null;

        gameStateStore.setPhase("dialogue");

        telemetry.event("dialogue_started", {
            dialogueId: dialogueData.id,
            npcName: dialogueData.npcName,
            chapter: gameStateStore.getState().chapter,
        });

        while (currentStageId) {
            const stage = stageMap.get(currentStageId);
            if (!stage) break;

            if (stage.choices && stage.choices.length > 0) {
                // Present choices and wait for selection
                const chosenIndex = await displayStage(stage);

                if (chosenIndex == null || chosenIndex < 0 || chosenIndex >= stage.choices.length) {
                    // Invalid or cancelled -- end dialogue
                    break;
                }

                const choice = stage.choices[chosenIndex];
                applyChoice(choice, dialogueData.id, summary);
                currentStageId = choice.nextStageId ?? null;
            } else {
                // Narration / NPC line -- auto-advance
                await displayStage(stage);
                currentStageId = stage.nextStageId ?? null;
            }
        }

        gameStateStore.setPhase("map");

        telemetry.event("dialogue_ended", {
            dialogueId: dialogueData.id,
            choicesMade: summary.choicesMade.length,
            totalTrustChange: summary.totalTrustChange,
        });

        return summary;
    }

    function applyChoice(choice, dilemmaId, summary) {
        // Record trust change
        const trustChange = choice.trustChange || 0;
        summary.totalTrustChange += trustChange;

        // Record in progression
        if (choice.category === "prosocial" || choice.category === "self_interest") {
            progression.recordDialogueChoice(choice.category);
        }

        // Apply world effect
        if (choice.worldEffect) {
            gameStateStore.setWorldState(choice.worldEffect.key, choice.worldEffect.value);
        }

        // Give item
        if (choice.giveItem) {
            gameStateStore.addItem(choice.giveItem);
        }

        // Remove item
        if (choice.removeItem) {
            gameStateStore.useItem(choice.removeItem);
        }

        // Track in summary
        summary.choicesMade.push({
            choiceId: choice.id,
            category: choice.category,
            trustChange,
        });

        // Telemetry
        telemetry.event("dialogue_choice", {
            dilemmaId,
            choiceId: choice.id,
            choiceCategory: choice.category,
            worldEffect: choice.worldEffect || null,
            trustChange,
        });
    }

    return {
        startDialogue,
    };
}
