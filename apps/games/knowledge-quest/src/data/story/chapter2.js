/**
 * Story data for Chapter 2 — The Frozen Archives.
 */

export const CHAPTER_2_STORY = {
    introText: [
        "Beyond the restored Verdantwood lies a mountain range veiled in perpetual frost. Nestled in its heart is the Grand Archive -- a library that once held every theorem, formula, and discovery ever recorded.",
        "A jealous sorcerer called the Forgetter cursed it centuries ago, sealing the building in magical ice. The scholars within were frozen mid-sentence, their knowledge locked away.",
        "Two Knowledge Stones are said to rest in the Archive's deepest vaults. Without them, the world will continue to forget what it once knew.",
        "You pull your cloak tight against the howling wind and push through the frozen doors. Somewhere inside, the truth is waiting to thaw.",
    ],

    dialogues: {
        /* ------------------------------------------------------------ */
        /*  Dilemma 1 — The Frozen Guardian                             */
        /* ------------------------------------------------------------ */
        frozen_guardian: {
            id: "frozen_guardian",
            npcName: "Glacius",
            npcDescription:
                "An enormous ice golem standing before a shortcut passage. Its eyes glow faintly blue, and frost crackles with every slow movement. Despite its fearsome appearance, it does not attack first -- it waits, watching.",
            stages: [
                {
                    text: "HALT. I am Glacius, bound to guard this passage since the Freezing. Only those who prove their understanding may pass. You may reason with me, challenge me, or seek another path. Choose.",
                    choices: [
                        {
                            id: "reason_glacius",
                            text: "I'd like to answer your questions and prove I'm worthy.",
                            category: "prosocial",
                            consequence:
                                "Glacius nods, impressed by your willingness to learn rather than fight. It poses a series of science questions. Answer correctly and the shortcut opens; the golem even shares a secret about the Archive.",
                            trustChange: 15,
                            worldEffect: {
                                type: "science_challenge",
                                detail: "difficulty_3_science_x3",
                                description:
                                    "You must answer 3 difficulty-3 science questions. Success opens the shortcut and reveals a hidden vault location. Failure redirects you to the longer path.",
                            },
                        },
                        {
                            id: "fight_glacius",
                            text: "Step aside or I'll make you. [Fight]",
                            category: "self_interest",
                            consequence:
                                "Glacius sighs -- a gust of icy wind -- and raises its fists. You enter combat with a powerful ice golem. Winning opens the path but the golem shatters, and with it, some ancient knowledge is lost.",
                            trustChange: -10,
                            worldEffect: {
                                type: "combat_encounter",
                                detail: "glacius_fight",
                                description:
                                    "A special combat against Glacius (150 HP, 20 ATK, ice element). Victory opens the shortcut but costs -10 trust.",
                            },
                        },
                        {
                            id: "detour_glacius",
                            text: "I'll find another way. I don't want to risk failing or fighting.",
                            category: "transactional",
                            consequence:
                                "You take the longer route through the Frozen Stacks. It's safer but you face more encounters along the way. Glacius watches you go without judgment.",
                            trustChange: 0,
                            worldEffect: {
                                type: "path_change",
                                detail: "longer_route",
                                description:
                                    "You bypass the shortcut. The longer route adds one extra combat node but is guaranteed passable.",
                            },
                        },
                    ],
                },
                {
                    text: "Few travellers choose wisdom over force. The Forgetter relied on brute power too, and look what became of this place. Remember: knowledge is not a weapon -- it is a bridge.",
                    choices: [
                        {
                            id: "ask_forgetter",
                            text: "Who was the Forgetter? Why did they curse the Archive?",
                            category: "prosocial",
                            consequence:
                                "Glacius tells you the Forgetter was once the Archive's greatest student, consumed by jealousy when others surpassed them. The curse was born of the belief that if they couldn't know everything, no one should.",
                            trustChange: 5,
                            worldEffect: {
                                type: "lore_unlock",
                                detail: "forgetter_backstory",
                                description:
                                    "You learn the Forgetter's origin, which weakens the boss's opening attack in this chapter.",
                            },
                        },
                        {
                            id: "thank_glacius",
                            text: "Thank you, Glacius. I'll carry that lesson with me.",
                            category: "prosocial",
                            consequence:
                                "The golem's eyes brighten for a moment. A small shard of ice falls from its chest -- a Frost Crystal that permanently boosts ice spell damage by 10%.",
                            trustChange: 5,
                            worldEffect: {
                                type: "immediate_item",
                                detail: "frost_crystal",
                                description:
                                    "You receive a Frost Crystal (+10% ice spell damage).",
                            },
                        },
                    ],
                },
            ],
        },

        /* ------------------------------------------------------------ */
        /*  Dilemma 2 — The Librarian's Dilemma                         */
        /* ------------------------------------------------------------ */
        librarian_dilemma: {
            id: "librarian_dilemma",
            npcName: "Inkwell",
            npcDescription:
                "A spectral owl librarian, half-frozen but still animate, perched on a towering desk. Stacks of overdue books surround it, and in your pack you carry a tome you found earlier -- the 'Codex of Infinite Formulas,' pulsing with power.",
            stages: [
                {
                    text: "Ah, a living visitor! How wonderful. I've been cataloguing these returns for... well, I've lost count of the centuries. I see you carry the Codex of Infinite Formulas. That book is 847 years overdue. The fine is... astronomical. But more importantly, it belongs here -- its knowledge was meant to be shared, not hoarded.",
                    choices: [
                        {
                            id: "return_codex",
                            text: "You're right. Knowledge should be shared. Here, take it back.",
                            category: "prosocial",
                            consequence:
                                "Inkwell's ghostly feathers ruffle with joy. As the Codex slides back into its shelf, the ice around the Librarian's Desk melts entirely. Inkwell can now move freely and offers to be your guide through the Archive.",
                            trustChange: 20,
                            worldEffect: {
                                type: "permanent_ally",
                                detail: "inkwell_guide",
                                description:
                                    "Inkwell becomes a temporary companion for the rest of Chapter 2, providing hints during combat and revealing hidden nodes.",
                            },
                        },
                        {
                            id: "keep_codex",
                            text: "This Codex is incredibly powerful. I need it for the battles ahead.",
                            category: "self_interest",
                            consequence:
                                "Inkwell's glow dims. 'I cannot force you,' the owl whispers. 'But a book kept from the shelf is a thought kept from the world.' You keep the Codex's power boost, but the Archive remains partly frozen.",
                            trustChange: -15,
                            worldEffect: {
                                type: "permanent_buff",
                                detail: "codex_equipped",
                                description:
                                    "The Codex grants +20% to all spell damage for the rest of the game, but Inkwell will not help you and the Archive stays frozen.",
                            },
                        },
                        {
                            id: "copy_codex",
                            text: "What if I copy the most important formulas and then return the original?",
                            category: "transactional",
                            consequence:
                                "Inkwell tilts its head. 'A pragmatic compromise. The Codex returns home, and you retain some of its wisdom. Not ideal, but... acceptable.' You spend time carefully transcribing key pages.",
                            trustChange: 8,
                            worldEffect: {
                                type: "partial_buff",
                                detail: "codex_notes",
                                description:
                                    "You gain +10% spell damage (half the Codex's power). Inkwell thaws partially and reveals one hidden node.",
                            },
                        },
                    ],
                },
                {
                    text: "Before you go deeper, a word of advice. The Forgetter's curse is weakest where knowledge flows freely. Share what you learn with others, and the ice will crack. Hoard it, and you'll find the cold only grows.",
                    choices: [
                        {
                            id: "heed_advice",
                            text: "I'll remember that. Thank you, Inkwell.",
                            category: "prosocial",
                            consequence:
                                "Inkwell nods sagely and hands you a small scroll -- a Thaw Charm that can break one ice barrier in the Archive.",
                            trustChange: 5,
                            worldEffect: {
                                type: "immediate_item",
                                detail: "thaw_charm",
                                description:
                                    "You receive a Thaw Charm (single use: break one ice barrier to reveal a chest).",
                            },
                        },
                        {
                            id: "press_on",
                            text: "Understood. I should keep moving before the cold gets worse.",
                            category: "self_interest",
                            consequence:
                                "You press on without the charm. Practical, if unromantic.",
                            trustChange: 0,
                            worldEffect: {
                                type: "none",
                                detail: null,
                                description: "No additional effect.",
                            },
                        },
                    ],
                },
            ],
        },
    },
};
