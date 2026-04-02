/**
 * Story data for Chapter 3 — The Dragon's Equation.
 */

export const CHAPTER_3_STORY = {
    introText: [
        "The final Knowledge Stone lies at the summit of Numeron Mountain, guarded by the last of the ancient dragons -- a creature of pure intellect that speaks only in equations.",
        "The path upward is treacherous. Lava streams cross the trail. The air itself crackles with unsolved problems that manifest as hostile creatures.",
        "Everything you've learned in the Verdantwood and the Frozen Archives has led to this moment. The dragon will test not just your knowledge, but your character.",
        "You begin the ascent. Above the clouds, a pair of golden eyes watches your every step.",
    ],

    dialogues: {
        /* ------------------------------------------------------------ */
        /*  Dilemma 1 — The Dragon's Offer                              */
        /* ------------------------------------------------------------ */
        dragon_offer: {
            id: "dragon_offer",
            npcName: "Numeron",
            npcDescription:
                "A colossal dragon with scales that shimmer like a heat map -- cool blue at the tail, blazing gold at the head. Equations scroll across its wings like living tattoos. Its voice resonates with the certainty of a proven theorem.",
            stages: [
                {
                    text: "So, the little scholar reaches my doorstep. Impressive. I have watched your journey -- every choice, every answer, every hesitation. I will make you an offer: sacrifice one of your Knowledge Companions to me, and I will join your side. My power would make the final battle trivial.",
                    choices: [
                        {
                            id: "sacrifice_companion",
                            text: "If it means saving the world... I'll give up one of my companions.",
                            category: "self_interest",
                            consequence:
                                "You choose a companion to release. It dissolves into golden light that the dragon absorbs. Numeron stretches its wings. 'A pragmatic choice. Power often demands sacrifice.' The dragon becomes your ally, but the lost companion is gone forever.",
                            trustChange: -20,
                            worldEffect: {
                                type: "companion_sacrifice",
                                detail: "lose_one_gain_dragon",
                                description:
                                    "You permanently lose one companion of your choice. Numeron joins as a legendary companion with +30% all damage. Trust drops significantly -- your remaining companions are uneasy.",
                            },
                        },
                        {
                            id: "refuse_offer",
                            text: "No deal. My companions are my friends, not bargaining chips.",
                            category: "prosocial",
                            consequence:
                                "Numeron's eyes narrow, then widen with what might be respect. 'Loyalty. Rare. Very well -- you will face me at full strength. Prepare yourself.' The final boss will be harder, but your companions rally around you with renewed determination.",
                            trustChange: 25,
                            worldEffect: {
                                type: "boss_modifier",
                                detail: "harder_boss_companion_boost",
                                description:
                                    "The final boss has +25% HP and ATK. However, all companion buffs are doubled for the boss fight due to their gratitude.",
                            },
                        },
                        {
                            id: "negotiate_dragon",
                            text: "What if I prove my worth through knowledge instead? Test me with your hardest question.",
                            category: "transactional",
                            consequence:
                                "Numeron laughs -- a sound like thunder rolling through a canyon of crystals. 'Bold! Very well. One question. The hardest I have. Answer correctly and I stand aside without a fight. Answer wrong, and you face me with a handicap.'",
                            trustChange: 10,
                            worldEffect: {
                                type: "ultimate_challenge",
                                detail: "difficulty_5_question",
                                description:
                                    "You face a single difficulty-5 question. Correct: the boss fight is skipped and Numeron gifts you the Knowledge Stone willingly. Wrong: the boss has +50% ATK and you start combat with half MP.",
                            },
                        },
                    ],
                },
                {
                    text: "Tell me, scholar -- what have you truly learned on this journey? Not the formulas and facts. The deeper lesson.",
                    choices: [
                        {
                            id: "lesson_sharing",
                            text: "That knowledge means nothing if you keep it to yourself. It has to be shared to matter.",
                            category: "prosocial",
                            consequence:
                                "Numeron closes its eyes. 'That is why I guard this stone. Not to hoard it, but to ensure it reaches one who will share it.' A single golden tear falls, crystallizing into a charm.",
                            trustChange: 15,
                            worldEffect: {
                                type: "immediate_item",
                                detail: "dragons_tear",
                                description:
                                    "You receive Dragon's Tear -- once per combat, fully restores MP.",
                            },
                        },
                        {
                            id: "lesson_perseverance",
                            text: "That the hardest problems are worth solving, even when you fail the first time.",
                            category: "prosocial",
                            consequence:
                                "Numeron nods slowly. 'Failure is the first draft of understanding. I have failed a thousand equations before solving them.' The dragon's scales pulse with warm light.",
                            trustChange: 10,
                            worldEffect: {
                                type: "combat_buff",
                                detail: "second_chance",
                                description:
                                    "In the final boss fight, wrong answers give you one free retry instead of dealing damage.",
                            },
                        },
                        {
                            id: "lesson_power",
                            text: "That power comes from understanding the world around you.",
                            category: "transactional",
                            consequence:
                                "Numeron tilts its great head. 'True, but incomplete. Power without purpose is just noise.' The dragon offers no gift, but acknowledges your honesty.",
                            trustChange: 0,
                            worldEffect: {
                                type: "none",
                                detail: null,
                                description:
                                    "A neutral response. No buff or penalty.",
                            },
                        },
                    ],
                },
            ],
        },

        /* ------------------------------------------------------------ */
        /*  Dilemma 2 — The Final Choice                                */
        /* ------------------------------------------------------------ */
        final_choice: {
            id: "final_choice",
            npcName: "The Knowledge Stones",
            npcDescription:
                "Three luminous stones float before you at the Summit Shrine -- one green (from the forest), one blue (from the archive), and one gold (from the mountain). Together they pulse in harmony, offering two very different futures.",
            stages: [
                {
                    text: "The three Knowledge Stones resonate with everything you've learned. You feel their power coursing through you. An ancient inscription on the shrine reads: 'The bearer may choose -- restore the world's knowledge to all, or absorb the stones' power to become the greatest scholar who ever lived. Choose wisely, for this choice cannot be undone.'",
                    choices: [
                        {
                            id: "restore_world",
                            text: "I use the stones to restore knowledge to the world. Everyone deserves to learn.",
                            category: "prosocial",
                            consequence:
                                "The stones rise into the air and shatter into millions of glowing motes that drift across the land. The Verdantwood blooms. The Archive thaws. Schools and libraries spring to life in every village. You feel your own power diminish, but the world is brighter for it. Every companion you've collected cheers.",
                            trustChange: 30,
                            worldEffect: {
                                type: "ending_prosocial",
                                detail: "world_restored",
                                description:
                                    "The 'true' ending. Maximum trust bonus. All companions evolve one level. Final score multiplier x1.5. The world is saved through selflessness.",
                            },
                        },
                        {
                            id: "absorb_power",
                            text: "I absorb the stones' power. With this knowledge, I can protect everyone myself.",
                            category: "self_interest",
                            consequence:
                                "The stones dissolve into your body. You feel omniscient -- every formula, every law of nature, every equation solved in an instant. But the world remains dark. The Verdantwood stays withered. The Archive stays frozen. You are the most powerful scholar alive, but you are alone with your knowledge.",
                            trustChange: -30,
                            worldEffect: {
                                type: "ending_selfish",
                                detail: "power_absorbed",
                                description:
                                    "The 'dark' ending. All spells deal double damage in the final fight but all companions leave you. Final score multiplier x0.5. Knowledge without sharing is hollow.",
                            },
                        },
                        {
                            id: "share_power",
                            text: "I absorb one stone to stay strong, and release the other two for the world.",
                            category: "transactional",
                            consequence:
                                "A compromise. You keep the golden stone's power while releasing the green and blue. The forest heals. The Archive thaws. But Numeron Mountain remains a place of challenge, its knowledge not yet fully freed. Your companions accept the choice, though some look conflicted.",
                            trustChange: 5,
                            worldEffect: {
                                type: "ending_compromise",
                                detail: "partial_restore",
                                description:
                                    "The 'compromise' ending. +15% spell damage permanently. Two of three regions heal. Final score multiplier x1.0. A pragmatic but imperfect solution.",
                            },
                        },
                    ],
                },
                {
                    text: "As the light fades and the consequences of your choice settle over the land, you look back at the path you've walked -- from the Forest Gate to the Dragon's peak. Every question answered, every creature befriended, every dilemma faced has led to this moment.",
                    choices: [
                        {
                            id: "reflect_journey",
                            text: "It was worth every step.",
                            category: "prosocial",
                            consequence:
                                "A warm light envelops you as the credits begin. Your companions gather close, and for a moment, everything is peaceful.",
                            trustChange: 5,
                            worldEffect: {
                                type: "epilogue",
                                detail: "peaceful_ending",
                                description:
                                    "The journey ends. Your final trust score and choices determine the epilogue narration.",
                            },
                        },
                        {
                            id: "look_forward",
                            text: "This is only the beginning. There's so much more to learn.",
                            category: "prosocial",
                            consequence:
                                "You turn your gaze to the horizon. Somewhere beyond the mountains, new mysteries await. The screen fades to the chapter select, hinting at future adventures.",
                            trustChange: 5,
                            worldEffect: {
                                type: "epilogue",
                                detail: "hopeful_ending",
                                description:
                                    "A hopeful conclusion. Unlocks a 'New Game+' mode with harder questions and new companion evolutions.",
                            },
                        },
                    ],
                },
            ],
        },
    },
};
