/**
 * Story data for Chapter 1 — The Withering Forest.
 *
 * Each dilemma is a multi-stage dialogue with choices that carry
 * prosocial / self-interest / transactional weight.
 */

export const CHAPTER_1_STORY = {
    introText: [
        "The Verdantwood was once the greenest place in the realm, its canopy so thick that starlight filtered down in emerald ribbons.",
        "But a creeping blight has taken hold. Leaves blacken and fall. Streams run dry. Creatures born of ignorance and doubt prowl the dying trails.",
        "The elders say three Knowledge Stones are hidden deep within the forest. Only by finding them all can the Withering be reversed.",
        "You adjust your pack, grip your spellbook, and step through the Forest Gate. The fate of Verdantwood rests on what you learn -- and who you choose to become.",
    ],

    dialogues: {
        /* ------------------------------------------------------------ */
        /*  Dilemma 1 — The Lost Merchant                               */
        /* ------------------------------------------------------------ */
        lost_merchant: {
            id: "lost_merchant",
            npcName: "Barley",
            npcDescription:
                "A stout hedgehog merchant with a cracked monocle, sitting beside a cart with a broken axle. Crates of rare potions are scattered across the muddy path.",
            stages: [
                {
                    text: "Oh, traveller! Thank the stars. My cart hit a root and the axle snapped clean in two. These potions will spoil if I can't get moving soon. I've been calling for help for hours, but the forest... it doesn't feel safe anymore.",
                    choices: [
                        {
                            id: "help_barley",
                            text: "Let me help you fix the axle. I know a bit about leverage and simple machines.",
                            category: "prosocial",
                            consequence:
                                "You spend time repairing the cart. Barley is deeply grateful and promises to leave supplies at every rest point you find in the forest.",
                            trustChange: 15,
                            worldEffect: {
                                type: "future_reward",
                                detail: "free_potions_at_rest_nodes",
                                description:
                                    "Barley leaves healing potions at all rest nodes in Chapter 1.",
                            },
                        },
                        {
                            id: "ignore_barley",
                            text: "Sorry, I'm on an important quest. I need to keep moving.",
                            category: "self_interest",
                            consequence:
                                "Barley watches you leave with sad eyes. You save time, but the merchant's potions are lost to the blight.",
                            trustChange: -5,
                            worldEffect: {
                                type: "none",
                                detail: null,
                                description:
                                    "No lasting effect, but Barley's goods are destroyed.",
                            },
                        },
                        {
                            id: "trade_barley",
                            text: "I'll help, but I could really use one of those potions for the road.",
                            category: "transactional",
                            consequence:
                                "A fair deal. You fix the cart and Barley hands you a medium healing potion. He appreciates the help but notes you drove a hard bargain.",
                            trustChange: 5,
                            worldEffect: {
                                type: "immediate_item",
                                detail: "potion_medium",
                                description:
                                    "You receive a Medium Healing Potion immediately.",
                            },
                        },
                    ],
                },
                {
                    text: "You know, this forest used to be full of merchants like me. We traded knowledge as much as goods -- recipes, riddles, old songs. Now the blight scares everyone away. Maybe if someone brave enough gathered those Knowledge Stones...",
                    choices: [
                        {
                            id: "ask_stones",
                            text: "Do you know where the Knowledge Stones are hidden?",
                            category: "prosocial",
                            consequence:
                                "Barley shares what he remembers from the old trade routes. You gain a rough idea of where one stone lies.",
                            trustChange: 5,
                            worldEffect: {
                                type: "map_reveal",
                                detail: "c1_mystery2",
                                description:
                                    "The Ancient Tree node is revealed on your map.",
                            },
                        },
                        {
                            id: "move_on",
                            text: "I'll find them. Take care of yourself, Barley.",
                            category: "prosocial",
                            consequence:
                                "Barley waves goodbye and wishes you luck.",
                            trustChange: 3,
                            worldEffect: {
                                type: "none",
                                detail: null,
                                description: "A kind farewell.",
                            },
                        },
                    ],
                },
            ],
        },

        /* ------------------------------------------------------------ */
        /*  Dilemma 2 — The Struggling Student                          */
        /* ------------------------------------------------------------ */
        struggling_student: {
            id: "struggling_student",
            npcName: "Fern",
            npcDescription:
                "A young fox apprentice crouched beside a glowing puzzle-lock on a stone chest. She's scratching equations in the dirt with a stick, clearly stuck.",
            stages: [
                {
                    text: "I've been trying to open this chest for an hour. The lock needs the right answer but I keep getting it wrong. My mentor sent me to retrieve what's inside, and I can't go back empty-handed... she'll think I haven't been studying.",
                    choices: [
                        {
                            id: "teach_fern",
                            text: "Let me walk you through how to solve it. We'll figure it out together.",
                            category: "prosocial",
                            consequence:
                                "You explain the method step by step. Fern's eyes light up with understanding. She solves the lock herself. Inside the chest is a map fragment she insists on sharing with you.",
                            trustChange: 20,
                            worldEffect: {
                                type: "hard_question_challenge",
                                detail: "difficulty_3_math",
                                description:
                                    "You must answer a difficulty-3 math question to teach Fern. Success gives +20 trust and a map fragment. Failure still gives +10 trust (for trying).",
                            },
                        },
                        {
                            id: "ignore_fern",
                            text: "Looks tough. Good luck with it!",
                            category: "self_interest",
                            consequence:
                                "Fern looks crestfallen as you walk away. You hear her still scratching in the dirt long after you leave.",
                            trustChange: -10,
                            worldEffect: {
                                type: "none",
                                detail: null,
                                description:
                                    "Fern remains stuck. No reward.",
                            },
                        },
                        {
                            id: "trade_fern",
                            text: "I'll solve it for you, but I'd like that map your mentor gave you in return.",
                            category: "transactional",
                            consequence:
                                "Fern hesitates but agrees. You solve the lock. She hands over her mentor's annotated map, but she doesn't learn anything and her eyes are downcast.",
                            trustChange: -5,
                            worldEffect: {
                                type: "immediate_item",
                                detail: "mentor_map",
                                description:
                                    "You receive a Mentor Map that reveals all nodes in Chapter 1, but Fern gains no knowledge.",
                            },
                        },
                    ],
                },
                {
                    text: "My mentor always says 'knowledge shared is knowledge doubled.' I think I'm starting to understand what she means.",
                    choices: [
                        {
                            id: "encourage_fern",
                            text: "Your mentor is wise. Keep studying -- you'll get there.",
                            category: "prosocial",
                            consequence:
                                "Fern smiles. She promises that if she finds anything useful deeper in the forest, she'll leave it at the Moonlit Grove for you.",
                            trustChange: 5,
                            worldEffect: {
                                type: "future_reward",
                                detail: "bonus_item_at_rest",
                                description:
                                    "A bonus scroll appears at the Moonlit Grove rest node.",
                            },
                        },
                        {
                            id: "depart_fern",
                            text: "Good luck, Fern. I need to keep going.",
                            category: "self_interest",
                            consequence: "A simple goodbye.",
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
