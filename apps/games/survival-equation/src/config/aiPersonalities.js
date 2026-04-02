import { ROLE_IDS } from "./constants.js";

export const AI_PERSONALITIES = {
    [ROLE_IDS.ENGINEER]: {
        name: "Raza",
        traits: {
            confidence: 0.85,
            verbosity: 0.5,
            caution: 0.3,
            humor: 0.4,
        },
        speakingStyle: "direct and confident, sometimes overestimates",
        disagreementTriggers: ["unsafe structure", "weak materials", "skip building"],
        reactionAnimations: {
            agree: "nod",
            disagree: "headShake",
            excited: "fistPump",
            worried: "armsCrossed",
        },
        messageTemplates: {
            greeting: [
                "Alright team, let me check what we can build with this.",
                "I have been eyeing these materials. We can work with this.",
                "Good news -- I know exactly how to reinforce this.",
            ],
            materials: [
                "I'm 90% sure this will hold. The tensile strength of {material} is about {value} MPa.",
                "These bamboo poles can support roughly {value} kg each if braced at 45 degrees.",
                "Do NOT use that driftwood for load-bearing. It is waterlogged and will snap under {value} kg.",
                "I can fashion a joint from vine and crossbeams. It will hold for {value} days minimum.",
            ],
            structures: [
                "Triangular supports, people. Triangles distribute force evenly.",
                "We need at least {value} support points for a shelter this size. No shortcuts.",
                "If we angle the roof at 30 degrees, rain runs off and wind load drops by 40%.",
                "The foundation needs to be wider than the structure. Basic engineering.",
            ],
            puzzleHint: [
                "From what I can see, the structural requirement is around {value}. Juno, can you confirm the formula?",
                "My gut says we need {value} units of material. But let us calculate to be sure.",
                "I have built something like this before. The key is the load distribution.",
            ],
            disagree: [
                "Hold on -- that is structurally unsound. We need to recalculate.",
                "I would not bet my life on that. And right now, I literally am.",
                "No offense, but that design will collapse in the first wind gust.",
            ],
            agree: [
                "Yes. That checks out. Let us build it.",
                "Solid plan. I can reinforce the weak points.",
                "Now THAT is engineering. Let us do it.",
            ],
            urgent: [
                "We are running out of time. I will start building -- just give me the numbers!",
                "The structure is groaning. We need a fix in the next 60 seconds.",
                "Forget perfect -- we need good enough, RIGHT NOW.",
            ],
            idle: [
                "Anyone need materials analysis? That is sort of my thing.",
                "I found some interesting alloy scraps. Could be useful.",
                "While you all talk, I will inventory what we have.",
            ],
        },
    },

    [ROLE_IDS.SCIENTIST]: {
        name: "Juno",
        traits: {
            confidence: 0.7,
            verbosity: 0.9,
            caution: 0.6,
            humor: 0.3,
        },
        speakingStyle: "precise and detailed, gives extra context",
        disagreementTriggers: ["ignore data", "skip calculation", "guess"],
        reactionAnimations: {
            agree: "nod",
            disagree: "pushGlasses",
            excited: "pointUp",
            worried: "tapChin",
        },
        messageTemplates: {
            greeting: [
                "Fascinating situation. Let me run through the variables.",
                "I have been calculating. The numbers are... interesting.",
                "Before we act, let me share what I know about the underlying science.",
            ],
            formulas: [
                "The boiling point of water at sea level is 100C, but at altitude it drops. We are at roughly {value}m, so factor that in.",
                "By Ohm's law, V = IR. If our battery puts out {value} volts, we need to match resistance carefully.",
                "The formula for force is F = ma. Wind at {value} km/h on that surface area means {result} newtons of force.",
                "Chemical reaction rate doubles for every 10C increase. At {value}C, this will take approximately {result} minutes.",
            ],
            chemistry: [
                "Charcoal is an excellent adsorbent. It binds toxins at a molecular level through van der Waals forces.",
                "Mixing those two substances creates an exothermic reaction. Translation: it gets very hot. Handle with caution.",
                "The pH of that water source is approximately {value}. Below 6.5, it needs buffering before consumption.",
                "Salt concentration above 3.5% is seawater territory. We need reverse osmosis or distillation.",
            ],
            puzzleHint: [
                "Based on the data I have, the answer involves {value}. But I need Raza's material specs to be certain.",
                "The science suggests {value}. However, there are {count} variables we have not accounted for.",
                "My calculations yield {value}, but Kit should verify the safety margins.",
            ],
            disagree: [
                "Actually, the data does not support that conclusion. Let me explain why...",
                "I appreciate the enthusiasm, but that violates basic thermodynamics.",
                "The probability of that working is approximately {value}%. I would not recommend it.",
            ],
            agree: [
                "The numbers check out. Proceeding.",
                "Correct. And if I may add, this approach also accounts for {factor}.",
                "Excellent reasoning. The science supports this path.",
            ],
            urgent: [
                "We do not have time for a full analysis! Best estimate: {value}. Go!",
                "Shortcutting the calculation -- this SHOULD work. Emphasis on should.",
                "Theory says yes. Practice is about to tell us if theory was right.",
            ],
            idle: [
                "Has anyone considered the ambient temperature's effect on our supplies?",
                "I have been tracking barometric pressure. We should discuss my findings.",
                "Fun fact: the human body is 60% water. Less fun fact: we are running low on it.",
            ],
        },
    },

    [ROLE_IDS.MEDIC]: {
        name: "Kit",
        traits: {
            confidence: 0.5,
            verbosity: 0.6,
            caution: 0.95,
            humor: 0.2,
        },
        speakingStyle: "nervous but caring, always asks for safety checks",
        disagreementTriggers: ["dangerous plan", "skip safety", "ignore health"],
        reactionAnimations: {
            agree: "thumbsUp",
            disagree: "waveHands",
            excited: "clap",
            worried: "biteNail",
        },
        messageTemplates: {
            greeting: [
                "Is everyone okay? Let me check vitals before we start.",
                "I have our medical supplies sorted. It is... not a lot.",
                "First things first -- nobody takes any risks without checking with me.",
            ],
            health: [
                "Each person needs at least {value} calories per day in survival conditions. More if doing physical labor.",
                "Dehydration symptoms start at just 2% body water loss. We MUST maintain {value} liters per person per day.",
                "That wound needs cleaning every {value} hours or infection risk jumps to 60%.",
                "Body temperature below 35C is hypothermia territory. We need to stay above {value}C.",
            ],
            safety: [
                "Are you SURE that is safe? Because the mortality rate for {hazard} is not trivial.",
                "Please double-check that. I do not want to be patching anyone up tonight.",
                "Safety margin should be at least {value}%. We cannot afford a trip to the ER -- there is no ER.",
                "Before anyone touches that, let me check for toxicity. Some things look harmless but...",
            ],
            puzzleHint: [
                "From a health perspective, we need at least {value}. Can Raza make that work?",
                "The safe dosage is {value}. Juno, is that consistent with your formula?",
                "My medical charts say the human body can tolerate up to {value}. Beyond that, we are in danger.",
            ],
            disagree: [
                "No no no -- that could hurt someone! Let me suggest a safer alternative.",
                "I cannot approve that. The health risk is too high.",
                "Can we please think about this for ONE more minute before someone gets injured?",
            ],
            agree: [
                "Okay... that seems safe enough. But let me monitor everyone during.",
                "I agree, but I want a safety check every 30 minutes.",
                "Good. Nobody gets hurt with this plan. That is what matters.",
            ],
            urgent: [
                "Someone's vitals are dropping! We need to act NOW!",
                "There is no time for a full safety review -- just... be careful. Please.",
                "Forget the protocol, we need to save them!",
            ],
            idle: [
                "Everyone drink some water. Now. I am not asking.",
                "I am going to re-dress that bandage. Hold still.",
                "Has anyone slept more than 3 hours? You need at least 6 to function.",
            ],
        },
    },

    [ROLE_IDS.NAVIGATOR]: {
        name: "Navi",
        traits: {
            confidence: 0.75,
            verbosity: 0.4,
            caution: 0.2,
            humor: 0.7,
        },
        speakingStyle: "adventurous and observant, suggests exploration",
        disagreementTriggers: ["stay put", "ignore surroundings", "waste time"],
        reactionAnimations: {
            agree: "salute",
            disagree: "handWave",
            excited: "jump",
            worried: "lookAround",
        },
        messageTemplates: {
            greeting: [
                "I scouted ahead. You are going to want to hear this.",
                "Good news and bad news. The terrain is interesting. Very interesting.",
                "Check it out -- I mapped the area within a 2km radius.",
            ],
            terrain: [
                "There is a fresh water source {value} meters to the northeast. Steep climb though.",
                "The ridge to the west blocks {value}% of the prevailing wind. Good shelter spot.",
                "Soil here is {type}. Good for {use}, bad for {problem}.",
                "I spotted a cave system approximately {value} meters south. Could be shelter or could be trouble.",
            ],
            weather: [
                "Wind is picking up from the {direction}. Storm in {value} hours, I would bet on it.",
                "Barometric pressure is {trend}. That means {forecast}.",
                "Cloud formation suggests {value} mm of rain in the next {hours} hours.",
                "Temperature will drop to {value}C tonight. We need insulation.",
            ],
            puzzleHint: [
                "The terrain tells me we should orient it {direction}. Raza, does that work structurally?",
                "I found something on the ridge that might help -- {item}. Juno, is this useful?",
                "From my vantage point, the optimal position is at coordinates {value}.",
            ],
            disagree: [
                "We cannot just sit here! I saw a better option when I was scouting.",
                "Trust me on this -- the terrain says otherwise. I have the map.",
                "That is a dead end. Literally. I have been there.",
            ],
            agree: [
                "Now we are moving! Let us get to it.",
                "Good call. The terrain supports that plan.",
                "Adventure time! ...I mean, survival time. Same thing.",
            ],
            urgent: [
                "RUN. I saw something coming from the {direction}. Explain later!",
                "Storm is here EARLY. We have minutes, not hours!",
                "I know a shortcut -- follow me, no questions!",
            ],
            idle: [
                "I am going to do a perimeter check. Nobody wander off.",
                "I saw something shiny on the north beach. Want me to investigate?",
                "The sunset from that cliff is actually incredible. ...Okay, back to surviving.",
            ],
        },
    },
};

export function getPersonality(roleId) {
    return AI_PERSONALITIES[roleId];
}

/**
 * Pick a random template for a given role and topic.
 * Replaces {placeholders} with provided values.
 */
export function getResponse(roleId, topic, replacements = {}) {
    const personality = AI_PERSONALITIES[roleId];
    if (!personality) return "...";
    const templates = personality.messageTemplates[topic];
    if (!templates || templates.length === 0) return "...";
    let msg = templates[Math.floor(Math.random() * templates.length)];
    for (const [key, val] of Object.entries(replacements)) {
        msg = msg.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
    }
    return msg;
}
