/**
 * Space Station scenario: 5 days of orbital emergency puzzles.
 */

const OXYGEN_RECYCLING = {
    id: "oxygen_recycling",
    name: "Oxygen Recycler Repair",
    type: "multi_step",
    description: "Repair the damaged CO2 scrubber before oxygen runs out.",
    difficulty: 2,
    timeBonus: 50,
    resourceReward: { food: 0, water: 5, materials: 10 },
    failurePenalty: { food: 0, water: 0, materials: -10 },
    briefing: "CO2 levels are rising fast. The scrubber took a direct hit from debris. You have 3 hours of breathable air left. No pressure.",
    roleInfo: {
        engineer: {
            label: "Scrubber Schematic (Raza's Blueprint)",
            style: "blueprint",
            lines: [
                "The CO2 scrubber uses lithium hydroxide (LiOH) canisters",
                "Impact cracked the airflow manifold -- needs sealing with epoxy resin",
                "Backup canisters are in Storage Bay C (2 spares)",
                "Fan motor drawing 12V DC at 2 amps -- check fuse rated at 3 amps",
                "Air duct diameter: 15cm -- must not be obstructed for proper airflow",
            ],
        },
        scientist: {
            label: "Chemistry Data (Juno's Calculations)",
            style: "lab_report",
            lines: [
                "CO2 + 2LiOH -> Li2CO3 + H2O (scrubbing reaction)",
                "Each canister absorbs ~1 kg of CO2 before saturation",
                "4 people produce ~4 kg CO2 per day (1 kg per person)",
                "Current CO2 level: 2.5% (danger above 4%, lethal above 8%)",
                "At current rate, lethal threshold reached in ~3 hours",
                "Reaction rate increases with airflow -- fan speed matters",
            ],
        },
        medic: {
            label: "Oxygen Exposure Limits (Kit's Medical Data)",
            style: "medical_chart",
            lines: [
                "CO2 above 3%: headaches, dizziness, impaired judgment",
                "CO2 above 5%: rapid breathing, confusion, risk of unconsciousness",
                "Symptoms reduce work capacity by 40% above 3%",
                "Everyone should minimize physical exertion to reduce CO2 output",
                "Emergency oxygen masks provide 15 minutes each (4 available)",
                "Hyperventilation is a risk -- keep the team calm",
            ],
        },
        navigator: {
            label: "Station Layout (Navi's Station Map)",
            style: "field_map",
            lines: [
                "Scrubber unit is in Module A, port side",
                "Storage Bay C (spare canisters) is 2 modules aft -- 5 min transit",
                "Emergency oxygen masks stored at each module junction",
                "Ventilation ducting runs along ceiling -- accessible via panel 7B",
                "Module B is sealed due to minor hull damage -- avoid that route",
                "Quickest path to Storage C: Module A -> D corridor -> Bay C",
            ],
        },
    },
    steps: [
        {
            id: "canister_calc",
            type: "calculation",
            instruction: "Each person produces 1 kg CO2/day. 4 people over 2 days = how many kg of CO2 must the scrubber handle? If each canister absorbs 1 kg, how many canisters needed?",
            correctAnswer: 8,
            tolerance: 0,
            unit: "canisters",
            hint: "4 people x 1 kg/day x 2 days = total CO2. One canister per kg.",
            feedbackCorrect: "8 canisters for 2 days. You have 2 spares plus the current one -- rationing is key.",
            feedbackWrong: "4 people x 1 kg CO2/day x 2 days = 8 kg total. At 1 kg per canister, you need 8 canisters.",
        },
        {
            id: "repair_sequence",
            type: "drag_order",
            instruction: "Arrange the scrubber repair steps in the correct order.",
            items: [
                { id: "masks", label: "Don emergency oxygen masks", correctPosition: 0 },
                { id: "seal", label: "Seal cracked manifold with epoxy", correctPosition: 1 },
                { id: "canister", label: "Replace saturated LiOH canister", correctPosition: 2 },
                { id: "fan", label: "Check and restart fan motor", correctPosition: 3 },
                { id: "test", label: "Monitor CO2 levels for 15 min", correctPosition: 4 },
            ],
            partialCreditPerCorrect: 0.2,
            feedbackCorrect: "Perfect sequence! Safety first (masks), then structural repair, then chemical replacement, then airflow, then verify.",
            feedbackWrong: "Always start with safety equipment (masks). Then seal the crack, replace the chemical canister, restart airflow, and verify it works.",
        },
        {
            id: "fan_power",
            type: "multiple_choice",
            instruction: "The fan motor draws 12V at 2 amps. The fuse is rated at 3 amps. What happens if you run the fan at 150% speed for faster scrubbing?",
            options: [
                "Works fine -- the fuse can handle it",
                "Fuse blows at 3A -- the fan draws 3A at 150% speed, right at the limit",
                "Nothing happens -- fan speed does not affect power draw",
                "Fan draws 4.5A at 150% speed -- fuse definitely blows",
            ],
            correctIndex: 1,
            feedbackCorrect: "At 150% speed, current draw rises proportionally to about 3A -- right at the fuse limit. Risky but survivable. Do not go higher.",
            feedbackWrong: "Motor current scales roughly with speed. 2A x 1.5 = 3A, which is exactly the fuse rating. Risky but technically within limits.",
        },
    ],
    completionMessage: "The scrubber hums back to life. CO2 readings slowly drop: 2.4%... 2.1%... 1.8%. Everyone exhales -- literally and figuratively.",
    failureMessage: "The scrubber sputters. CO2 continues to climb. The team rations emergency masks and moves to the smallest module to conserve air.",
};

const HULL_REPAIR = {
    id: "hull_repair",
    name: "Hull Breach Patch",
    type: "multi_step",
    description: "Seal a micro-fracture in the station hull before pressure loss becomes critical.",
    difficulty: 2,
    timeBonus: 45,
    resourceReward: { food: 0, water: 0, materials: 15 },
    failurePenalty: { food: -5, water: -5, materials: -15 },
    briefing: "Module B has a hairline crack. Air is leaking at 0.5% per hour. You need to mix the right sealant, apply it precisely, and reinforce the patch.",
    roleInfo: {
        engineer: { label: "Hull Specs (Raza)", style: "blueprint", lines: ["Crack length: 12cm, width: 0.3mm", "Hull material: aluminum alloy 6061, 4mm thick", "Epoxy resin + aluminum powder creates thermal-matched sealant", "Apply sealant in 3 layers, 5 min cure between each", "Reinforce with adhesive patch from repair kit over cured sealant"] },
        scientist: { label: "Sealant Chemistry (Juno)", style: "lab_report", lines: ["Epoxy mix ratio: 2 parts resin to 1 part hardener (by volume)", "Add 10% aluminum powder for thermal expansion matching", "Cure time at 20C: 5 minutes per layer (faster if warmed)", "Full strength reached after 30 minutes total cure time", "Bond strength: 35 MPa -- exceeds hull stress requirements"] },
        medic: { label: "EVA Safety (Kit)", style: "medical_chart", lines: ["Module B pressure: 85% and dropping", "Below 70%, cognitive impairment begins", "Work in pairs -- one holds, one applies sealant", "Maximum 20 minutes in low-pressure zone without supplemental O2", "Watch for ear pain, dizziness, or tingling -- signs of decompression"] },
        navigator: { label: "Crack Location (Navi)", style: "field_map", lines: ["Crack is on portside hull panel B-7, section 3", "Accessible from inside via maintenance hatch B-3", "External camera confirms no additional damage nearby", "Nearest structural support beam: 15cm to the left of crack", "Debris field has cleared -- no further impact risk for now"] },
    },
    steps: [
        { id: "sealant_mix", type: "calculation", instruction: "Mix sealant: 2 parts resin to 1 part hardener. You have 60 mL of resin. How many mL of hardener do you need?", correctAnswer: 30, tolerance: 0, unit: "mL", hint: "2:1 ratio. If resin is 60mL (2 parts), hardener is half.", feedbackCorrect: "30 mL hardener. 60:30 = 2:1 ratio. Now add 10% aluminum powder (9 mL) for thermal matching.", feedbackWrong: "2:1 ratio means hardener = resin / 2 = 60 / 2 = 30 mL." },
        { id: "pressure_time", type: "calculation", instruction: "Pressure drops 0.5% per hour. Current: 85%. How many hours until it hits the danger threshold of 70%?", correctAnswer: 30, tolerance: 0, unit: "hours", hint: "85% - 70% = 15%. At 0.5% per hour...", feedbackCorrect: "30 hours. Enough time if you work efficiently, but do not dawdle.", feedbackWrong: "Difference: 85% - 70% = 15%. At 0.5%/hour: 15 / 0.5 = 30 hours." },
        { id: "layer_technique", type: "multiple_choice", instruction: "How should you apply the 3-layer sealant patch for maximum strength?", options: ["All 3 layers at once for speed", "Each layer cured 5 min before the next", "Only 1 thick layer -- less is more", "Random application, sealant finds its own level"], correctIndex: 1, feedbackCorrect: "Layer-by-layer with 5 min cure between each. This prevents air bubbles and ensures molecular cross-linking between layers.", feedbackWrong: "Proper technique is sequential: apply, cure 5 min, apply next layer. This eliminates air pockets and ensures maximum bond strength." },
    ],
    completionMessage: "The sealant cures to a solid patch. Pressure readings stabilize. Raza pats the hull: 'That will hold until we get home.'",
    failureMessage: "The patch is not fully sealed. Pressure continues to drop slowly. The team must seal Module B and work in tighter quarters.",
};

const SOLAR_PANEL_FIX = {
    id: "solar_panel_fix",
    name: "Solar Flare Defense",
    type: "multi_step",
    description: "Reconfigure solar arrays to absorb and redirect a solar flare's energy.",
    difficulty: 3,
    timeBonus: 40,
    resourceReward: { food: 0, water: 0, materials: 10 },
    failurePenalty: { food: 0, water: 0, materials: -10 },
    briefing: "A coronal mass ejection will hit in 45 minutes. If unshielded, it fries all electronics. But if you reconfigure the solar panels, you can actually ABSORB the energy.",
    roleInfo: {
        engineer: { label: "Solar Array Specs (Raza)", style: "blueprint", lines: ["8 solar panels, each rated 200W at standard illumination", "Panels can be angled 0-90 degrees from station hull", "Surge protector rated at 2000W total -- panels must not exceed this", "Disconnect panels 1 and 5 (damaged) from the grid to prevent shorts", "Redirect surplus power to battery bank via bypass relay"] },
        scientist: { label: "Flare Physics (Juno)", style: "lab_report", lines: ["CME impact: ~10x normal solar intensity for 8 minutes", "Each panel at 10x produces 2000W -- total system overload if all active", "Solution: angle panels to reduce effective area", "At 30 degree tilt, effective power = rated x cos(30) = 0.866 x rated", "Maximum safe: 3 panels at 30 degrees = 3 x 173W = 519W -- well under 2000W limit"] },
        medic: { label: "Radiation Safety (Kit)", style: "medical_chart", lines: ["Solar flare radiation: dangerous above 100 mSv exposure", "Station hull blocks 95% of radiation -- stay inside", "Module D has thickest shielding (water storage acts as barrier)", "Exposure time limit: 8 minutes at hull-shielded levels = safe", "Move all personnel to Module D during the flare passage"] },
        navigator: { label: "Flare Vector (Navi)", style: "field_map", lines: ["CME approaching from solar bearing 045 degrees", "Station must orient port side toward the flare for optimal panel alignment", "Impact window: 45 minutes from now, duration 8 minutes", "Post-flare: solar intensity returns to normal within 2 minutes", "Battery bank is at 40% -- a successful charge could boost it to 80%"] },
    },
    steps: [
        { id: "panel_count", type: "calculation", instruction: "You have 8 panels but 2 are damaged. During the 10x flare, each active panel at 0 degrees produces 2000W. Surge protector limits total to 2000W. How many panels can run at full angle (0 degrees)?", correctAnswer: 1, tolerance: 0, unit: "panels", hint: "Each panel at 10x produces 2000W. Surge protector max is 2000W total.", feedbackCorrect: "Just 1 panel at full exposure! Each generates 2000W in the flare. More would blow the surge protector.", feedbackWrong: "10x intensity means each panel produces 10 x 200W = 2000W. Surge protector max is 2000W. So only 1 panel can run at full exposure." },
        { id: "tilt_calc", type: "calculation", instruction: "At 30 degree tilt, effective power = rated x cos(30) = 0.866 factor. Each panel produces 200 x 10 x 0.866 = 1732W during flare. Can you safely run 1 tilted panel under the 2000W limit? (Enter 1 for yes, 0 for no)", correctAnswer: 1, tolerance: 0, unit: "", hint: "1732W < 2000W limit. Is it under the threshold?", feedbackCorrect: "Yes! 1732W is under the 2000W surge limit. One tilted panel safely harvests the flare energy.", feedbackWrong: "1732W is less than 2000W limit, so yes (1) -- it is safe to run one tilted panel." },
        { id: "shelter_location", type: "multiple_choice", instruction: "Where should the crew shelter during the 8-minute flare passage?", options: ["Module A (scrubber room)", "Module B (patched hull)", "Module C (observation deck)", "Module D (water storage shielding)"], correctIndex: 3, feedbackCorrect: "Module D! The water storage tanks provide additional radiation shielding on top of the hull. Kit is right -- water blocks radiation effectively.", feedbackWrong: "Module D has water storage tanks that act as radiation shields. Water is one of the best radiation blockers available." },
    ],
    completionMessage: "The flare passes in a brilliant cascade across the hull cameras. Battery bank surges from 40% to 78%. 'Free energy!' Juno exclaims. The station hums with renewed power.",
    failureMessage: "Several non-critical systems overload. Navigation displays flicker and die. Raza begins manual repairs on fried circuits.",
};

const COMMUNICATION_RELAY = {
    id: "communication_relay",
    name: "Ground Control Contact",
    type: "multi_step",
    description: "Repair and align the communication relay during a brief ground station pass.",
    difficulty: 3,
    timeBonus: 35,
    resourceReward: { food: 5, water: 5, materials: 5 },
    failurePenalty: { food: 0, water: 0, materials: -5 },
    briefing: "Houston will be in communication range for exactly 4 minutes. The relay dish is misaligned and the amplifier is damaged. Fix both or miss the window.",
    roleInfo: {
        engineer: { label: "Relay Hardware (Raza)", style: "blueprint", lines: ["Dish alignment servo is jammed -- manual override available", "Amplifier transistor blew -- bypass with spare from radio kit", "Signal cable has a damaged connector at junction 4", "Total repair: 3 independent tasks, can be done in parallel with 2 people"] },
        scientist: { label: "Signal Math (Juno)", style: "lab_report", lines: ["Required signal strength: -90 dBm minimum for ground to receive", "Current output: -110 dBm (too weak by 20 dB)", "Amplifier adds +15 dB, dish alignment adds +8 dB = +23 dB total", "Corrected signal: -110 + 23 = -87 dBm (above -90 threshold!)", "Frequency: 2.2 GHz -- standard S-band communication"] },
        medic: { label: "Crew Readiness (Kit)", style: "medical_chart", lines: ["Raza's hand injury limits grip strength -- assign Navi to dish alignment", "Everyone's stress levels are elevated -- this is a high-pressure moment", "Post-contact morale boost could improve team efficiency by 30%", "Assign tasks based on physical capability, not just expertise"] },
        navigator: { label: "Pass Geometry (Navi)", style: "field_map", lines: ["Ground station location: 35.4 N, -116.9 W (Goldstone, California)", "Pass begins at mission time 72:14:00, duration 4 minutes", "Dish must point at bearing 220 degrees, elevation 15 degrees", "Station orbital speed: 7.66 km/s -- dish must track slowly during pass", "Best signal at T+2 minutes when station is directly overhead Goldstone"] },
    },
    steps: [
        { id: "signal_check", type: "calculation", instruction: "Current signal: -110 dBm. Amplifier adds +15 dB, dish alignment adds +8 dB. What is the corrected signal strength in dBm?", correctAnswer: -87, tolerance: 0, unit: "dBm", hint: "-110 + 15 + 8 = ?", feedbackCorrect: "-87 dBm! Above the -90 threshold. Houston will hear you.", feedbackWrong: "Add the gains: -110 + 15 + 8 = -87 dBm. In decibels, you add gains (they are logarithmic)." },
        { id: "dish_aim", type: "slider", instruction: "Set the dish bearing angle to point at Goldstone ground station.", min: 0, max: 360, correctValue: 220, tolerance: 10, unit: "degrees", labels: { 0: "N", 90: "E", 180: "S", 270: "W", 360: "N" }, feedbackCorrect: "Dish locked at 220 degrees. Signal acquired! Houston, this is Station Alpha...", feedbackWrong: "Navi's data says bearing 220 degrees. Point the dish southwest toward Goldstone." },
        { id: "task_assignment", type: "multiple_choice", instruction: "Kit says Raza's hand is injured. Who should handle the physical dish alignment (requires strong grip)?", options: ["Raza (engineer, but injured hand)", "Juno (scientist, average strength)", "Kit (medic, steady hands)", "Navi (navigator, physically fit)"], correctIndex: 3, feedbackCorrect: "Navi! Physical fitness for the dish, while Raza talks through the amplifier repair with Juno doing the soldering. Kit monitors everyone.", feedbackWrong: "Raza is injured -- Navi is the most physically capable. Assign the dish work to Navi and let Raza supervise the electronics repair." },
    ],
    completionMessage: "'Station Alpha, this is Houston. We read you loud and clear. Rescue shuttle is on standby. Transmitting rendezvous coordinates now.' The crew floats in stunned silence, then erupts in cheers.",
    failureMessage: "Static. The window passes. But hope remains -- the orbit will align again in 18 hours. Back to repairs.",
};

const ESCAPE_POD_LAUNCH = {
    id: "escape_pod_launch",
    name: "Escape Pod Launch",
    type: "multi_step",
    description: "Prepare and launch the escape pod for atmospheric re-entry.",
    difficulty: 3,
    timeBonus: 25,
    resourceReward: { food: 0, water: 0, materials: 0 },
    failurePenalty: { food: 0, water: 0, materials: 0 },
    briefing: "This is it. The escape pod is your ride home. Navigation, heat shielding, life support, parachute deployment -- every system must be calibrated. One mistake and re-entry becomes a fireball.",
    roleInfo: {
        engineer: { label: "Pod Systems (Raza)", style: "blueprint", lines: ["Heat shield integrity: 87% -- sufficient for re-entry if angle is correct", "Parachute deploys at 3000m altitude via barometric trigger", "Pod battery: 45 minutes of life support, 20 min of thruster fuel", "Retro-rocket provides 2 minutes of deceleration burn", "Hatch seal must be pressure-tested before separation"] },
        scientist: { label: "Re-Entry Physics (Juno)", style: "lab_report", lines: ["Re-entry angle must be between 5.5 and 7.5 degrees", "Below 5.5: skip off atmosphere back into space", "Above 7.5: too steep, heat shield cannot handle the thermal load", "Optimal angle: 6.5 degrees for maximum heat shield margin", "Re-entry speed: approximately 7.8 km/s (Mach 23)", "Total re-entry heating duration: 8 minutes"] },
        medic: { label: "G-Force Prep (Kit)", style: "medical_chart", lines: ["Re-entry G-forces peak at 4G for approximately 3 minutes", "All crew must be reclined at 70 degrees and strapped in", "Anti-G breathing technique: clench legs, breathe in short bursts", "Remove all loose objects -- they become projectiles at 4G", "Hydrate well before launch -- dehydration worsens G-force tolerance"] },
        navigator: { label: "Landing Zone (Navi)", style: "field_map", lines: ["Target landing zone: Pacific Ocean, 30N 160W", "Rescue ships positioned at these coordinates awaiting your arrival", "De-orbit burn must happen at orbit position 180 degrees from target", "Current orbit period: 92 minutes -- window in 38 minutes", "Wind at landing zone: 15 km/h from west -- parachute drift 2km east"] },
    },
    steps: [
        { id: "reentry_angle", type: "slider", instruction: "Set the re-entry angle. Too shallow and you bounce off the atmosphere. Too steep and you burn up. Juno says the optimal angle is 6.5 degrees.", min: 0, max: 15, correctValue: 6.5, tolerance: 1, unit: "degrees", labels: { 0: "0 (flat)", 5.5: "Skip", 6.5: "Optimal", 7.5: "Max heat", 15: "Fatal" }, feedbackCorrect: "Re-entry angle locked at the sweet spot. The heat shield can handle this. You are going home.", feedbackWrong: "Juno's data is clear: 6.5 degrees is optimal. Between 5.5 and 7.5 is survivable, outside that range is catastrophic." },
        { id: "chute_altitude", type: "calculation", instruction: "Parachute deploys at 3000m. Wind drifts the pod 2km east. If the rescue ship is directly below at deployment, what is the approximate landing distance from the ship in km? (Use Pythagorean theorem with 3km descent and 2km drift.)", correctAnswer: 2, tolerance: 0.5, unit: "km", hint: "The horizontal drift is 2km. That is the distance from the ship.", feedbackCorrect: "About 2km east of the ship. Well within rescue boat range!", feedbackWrong: "The wind drifts you 2km east during descent. The rescue ship sees you on radar and adjusts. Landing distance is approximately 2km." },
        { id: "launch_checklist", type: "drag_order", instruction: "Arrange the launch sequence in correct order.", items: [
            { id: "strap", label: "All crew strapped in, reclined 70 degrees", correctPosition: 0 },
            { id: "seal", label: "Pressure-test hatch seal", correctPosition: 1 },
            { id: "separate", label: "Separate pod from station", correctPosition: 2 },
            { id: "retro", label: "Fire retro-rocket (de-orbit burn)", correctPosition: 3 },
            { id: "reentry", label: "Maintain angle during re-entry heating", correctPosition: 4 },
        ], partialCreditPerCorrect: 0.2, feedbackCorrect: "Perfect launch sequence! Strap in, seal, separate, burn, and hold steady through re-entry. Textbook.", feedbackWrong: "Safety first: everyone secure, verify seal, THEN separate, THEN burn retro-rockets, THEN manage re-entry angle." },
    ],
    completionMessage: "The pod shudders through re-entry. Flames lick past the window. Then silence. The parachute blooms white against blue sky. Splashdown. You made it. All of you.",
    failureMessage: "The pod launches but a miscalculation makes re-entry rough. Everyone survives but the landing is miles off target. Rescue takes an extra 6 hours.",
};

export const SPACE_STATION_PUZZLES = {
    oxygen_recycling: OXYGEN_RECYCLING,
    hull_repair: HULL_REPAIR,
    solar_panel_fix: SOLAR_PANEL_FIX,
    communication_relay: COMMUNICATION_RELAY,
    escape_pod_launch: ESCAPE_POD_LAUNCH,
};
