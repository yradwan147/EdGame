/**
 * Underwater Base scenario: 5 days of deep sea crisis puzzles.
 */

const PRESSURE_SEAL = {
    id: "pressure_seal",
    name: "Emergency Pressure Seal",
    type: "multi_step",
    description: "Seal a cracked pressure hull before the ocean floods Lab C.",
    difficulty: 2,
    timeBonus: 50,
    resourceReward: { food: 5, water: 0, materials: 10 },
    failurePenalty: { food: 0, water: 0, materials: -15 },
    briefing: "The earthquake cracked the viewport in Lab C. Water is trickling in. At this depth, once the crack widens, there is no stopping it. Seal it now.",
    roleInfo: {
        engineer: { label: "Hull Specs (Raza)", style: "blueprint", lines: ["Viewport is acrylic, 8cm thick, rated for 200 atm", "Crack length: 15cm along the lower edge", "Emergency sealant rated for 150 atm -- apply in 2cm bead", "Backing plate from decommissioned viewport in Storage A-3 can reinforce", "Hydraulic press available to seat the backing plate -- rated 5 tons"] },
        scientist: { label: "Pressure Physics (Juno)", style: "lab_report", lines: ["Current depth: 1500 meters", "Pressure at depth: 1 atm + (depth/10) = 151 atm", "Force on viewport (area 0.5 m^2): P x A = 151 x 101325 x 0.5 = ~7.6 MN", "Sealant bond strength: 200 MPa -- sufficient if applied to full crack length", "Water inflow rate at crack: ~2 liters/minute (increasing as crack widens)"] },
        medic: { label: "Pressure Safety (Kit)", style: "medical_chart", lines: ["Water ingress brings temperature drop -- hypothermia risk in 30 min", "If Lab C floods, seal the bulkhead doors to contain it", "Nitrogen narcosis at this depth if backup air is compromised", "Everyone should stay back 3m from viewport during repair (implosion risk)", "Emergency pressure suits in Locker 7 -- 2 hours of protection each"] },
        navigator: { label: "Base Layout (Navi)", style: "field_map", lines: ["Lab C is on the lowest deck, portside", "Emergency bulkhead doors at both ends of the corridor", "Storage A-3 (spare viewport) is one level up via ladder", "The crack is along the 6 o'clock position of the viewport", "External cameras show no further structural damage nearby"] },
    },
    steps: [
        { id: "pressure_calc", type: "calculation", instruction: "At 1500m depth, water pressure = 1 + (depth / 10) atmospheres. What is the pressure in atmospheres?", correctAnswer: 151, tolerance: 0, unit: "atm", hint: "1 + (1500 / 10) = ?", feedbackCorrect: "151 atmospheres! That is 151 times the pressure at the surface. Every seal must be perfect.", feedbackWrong: "Formula: 1 + (depth / 10) = 1 + (1500 / 10) = 1 + 150 = 151 atm." },
        { id: "seal_order", type: "drag_order", instruction: "Arrange the seal repair steps in order.", items: [
            { id: "suits", label: "Don pressure suits for safety", correctPosition: 0 },
            { id: "dry", label: "Dry the crack area with compressed air", correctPosition: 1 },
            { id: "sealant", label: "Apply 2cm sealant bead along crack", correctPosition: 2 },
            { id: "plate", label: "Position backing plate over crack", correctPosition: 3 },
            { id: "press", label: "Hydraulic press to seat the plate", correctPosition: 4 },
        ], partialCreditPerCorrect: 0.2, feedbackCorrect: "Textbook repair! Suit up, dry surface for adhesion, sealant, backing plate, and press it home.", feedbackWrong: "Protective gear first. Then dry the surface (sealant won't bond to wet acrylic), apply sealant, place plate, press it firm." },
        { id: "safety_distance", type: "multiple_choice", instruction: "What is the minimum safe distance from the viewport during repair?", options: ["1 meter", "2 meters", "3 meters", "5 meters"], correctIndex: 2, feedbackCorrect: "3 meters. If the viewport fails catastrophically, the implosion force at close range is lethal. Only approach with pressure suits.", feedbackWrong: "Kit's safety protocol: 3 meters minimum from a compromised viewport. Implosion at 151 atm is not survivable at close range." },
    ],
    completionMessage: "The backing plate seats with a satisfying thunk. Water stops. Pressure readings stabilize. Raza wipes sweat from his brow: 'That viewport is now stronger than the original.'",
    failureMessage: "The sealant does not hold under full pressure. Lab C is sealed off behind bulkhead doors. You lose access to valuable equipment but the base survives.",
};

const DEEP_WATER_FILTRATION = {
    id: "deep_water_filtration",
    name: "Desalination Repair",
    type: "multi_step",
    description: "Fix the desalination unit to produce drinking water from seawater.",
    difficulty: 2,
    timeBonus: 45,
    resourceReward: { food: 0, water: 20, materials: 5 },
    failurePenalty: { food: 0, water: -15, materials: 0 },
    briefing: "The desalination membrane is clogged. Surrounded by ocean but dying of thirst -- the irony is not lost on anyone. Recalibrate the system.",
    roleInfo: {
        engineer: { label: "System Design (Raza)", style: "blueprint", lines: ["Reverse osmosis membrane rated for 35,000 ppm saltwater", "Operating pressure: 60 atm (uses ambient ocean pressure at depth!)", "Membrane needs backflushing with 5L of clean water to unclog", "Pre-filter screen should be cleaned -- probably full of sediment", "Output rate when functional: 8 L/hour of fresh water"] },
        scientist: { label: "Water Chemistry (Juno)", style: "lab_report", lines: ["Seawater: ~35,000 ppm salt (3.5% salinity)", "Safe drinking water: below 500 ppm", "RO membrane removes 99.5% of dissolved salts", "Output salinity: 35000 x 0.005 = 175 ppm (safe!)", "pH adjustment needed post-filtration: add calcium carbonate for taste"] },
        medic: { label: "Hydration Status (Kit)", style: "medical_chart", lines: ["Team water reserves: 12 liters (3L per person = 1.5 days)", "Minimum need: 2L per person per day = 8L total daily", "Dehydration impairs cognitive function at just 1% body mass water loss", "IV saline available for emergency but limited to 2 bags", "Seawater ingestion worsens dehydration -- do NOT drink it unfiltered"] },
        navigator: { label: "Intake Assessment (Navi)", style: "field_map", lines: ["Water intake port is on the hull underside, section 12", "Sediment levels near the seafloor are high post-earthquake", "Pre-filter screen accessible from Engineering Bay", "Recommend switching to intake port B (higher on hull, cleaner water)", "External camera shows murky water clearing gradually over 6 hours"] },
    },
    steps: [
        { id: "output_calc", type: "calculation", instruction: "The RO unit produces 8 L/hour. The team needs 8L per day. How many hours per day must the unit run?", correctAnswer: 1, tolerance: 0, unit: "hours", hint: "8L needed / 8L per hour = ?", feedbackCorrect: "Just 1 hour! That is efficient. But the machine needs to be working first.", feedbackWrong: "8L daily need / 8L per hour = 1 hour of operation per day." },
        { id: "salt_removal", type: "calculation", instruction: "Seawater has 35,000 ppm salt. The membrane removes 99.5%. What is the output water salinity in ppm?", correctAnswer: 175, tolerance: 5, unit: "ppm", hint: "Remaining = 35000 x (1 - 0.995) = 35000 x 0.005", feedbackCorrect: "175 ppm -- well below the 500 ppm safe drinking limit. The science works!", feedbackWrong: "35000 x 0.005 = 175 ppm. The membrane lets through only 0.5% of the salt." },
        { id: "intake_choice", type: "multiple_choice", instruction: "Which water intake should you use after the earthquake stirred up seafloor sediment?", options: ["Intake A (hull bottom, near sediment)", "Intake B (higher on hull, cleaner water)", "Both intakes for maximum flow", "Neither -- use stored water only"], correctIndex: 1, feedbackCorrect: "Intake B! Higher position means cleaner water with less sediment. Navi spotted this -- good team communication.", feedbackWrong: "Post-earthquake, seafloor sediment is swirling. Intake B is higher on the hull and draws cleaner water. Navi's observation is key." },
    ],
    completionMessage: "Fresh water flows from the tap. Kit immediately fills everyone's bottles. 'Drink. All of it. Doctor's orders.' The desalination hum becomes the most comforting sound on the base.",
    failureMessage: "The membrane is still partially clogged. Output is only 3L/hour. The team must ration carefully while the system slowly clears.",
};

const SPECIMEN_CONTAINMENT = {
    id: "specimen_containment",
    name: "Deep Sea Creature Defense",
    type: "multi_step",
    description: "Deter an aggressive deep-sea creature from ramming the observation deck.",
    difficulty: 3,
    timeBonus: 40,
    resourceReward: { food: 10, water: 0, materials: 5 },
    failurePenalty: { food: -5, water: 0, materials: -10 },
    briefing: "Something massive and bioluminescent is slamming into the observation deck glass. It is not stopping. Figure out what it is, why it is angry, and how to make it leave.",
    roleInfo: {
        engineer: { label: "Defensive Systems (Raza)", style: "blueprint", lines: ["External floodlights: 4 units, adjustable frequency 380-700nm", "Sonic emitter on hull: frequency range 20Hz-200kHz", "Observation deck glass: rated for 50 impacts at 200 atm", "After 12 impacts, structural integrity drops to 70%", "Emergency shutter available but takes 90 seconds to close"] },
        scientist: { label: "Marine Biology (Juno)", style: "lab_report", lines: ["Creature appears to be a giant isopod variant, ~3m length", "Bioluminescent organs suggest deep-sea origin (below 2000m)", "Behavior matches territorial aggression -- our lights may be provoking it", "Deep sea creatures are sensitive to specific light frequencies", "Red light (620-700nm) is invisible to most deep-sea species", "High-frequency sonar (above 100kHz) causes discomfort to large marine life"] },
        medic: { label: "Impact Assessment (Kit)", style: "medical_chart", lines: ["Glass flex during impacts causes vibration stress -- headache risk", "If glass fails, implosion force is lethal within 5m", "Evacuation route from observation deck: 15 seconds to sealed corridor", "Stress levels rising -- the ramming sounds are psychologically damaging", "Consider ear protection for crew during the encounter"] },
        navigator: { label: "Creature Tracking (Navi)", style: "field_map", lines: ["Creature approaches from the south trench, 200m below base", "It circles at 50m radius before each charge", "Impact pattern: every 3-4 minutes, getting faster", "A cave opening 100m northeast could be its home -- our base may be in its territory", "The creature avoids the area near the thermal vent (100m west)"] },
    },
    steps: [
        { id: "light_freq", type: "multiple_choice", instruction: "Our floodlights may be provoking the creature. What light frequency should you switch to?", options: ["Blue (450nm) -- brightest underwater", "Green (520nm) -- matches bioluminescence", "Red (650nm) -- invisible to deep-sea eyes", "UV (380nm) -- might scare it away"], correctIndex: 2, feedbackCorrect: "Red light! Deep-sea creatures cannot see red wavelengths. Switch all floodlights to 650nm and the creature loses its target.", feedbackWrong: "Juno's biology data: deep-sea species cannot see red light (620-700nm). Switch to red and the creature cannot perceive the base's lights." },
        { id: "sonar_freq", type: "slider", instruction: "Set the sonic emitter frequency to deter the creature. Deep-sea creatures are bothered by frequencies above 100 kHz.", min: 20, max: 200, correctValue: 120, tolerance: 30, unit: "kHz", labels: { 20: "Low", 100: "Deterrent", 200: "Max" }, feedbackCorrect: "The sonar pulse reverberates through the water. The creature recoils, circles once, and retreats toward its cave. It does not return.", feedbackWrong: "Frequency needs to be above 100 kHz to deter large marine life. Set it in the 100-150 kHz range." },
        { id: "impact_remaining", type: "calculation", instruction: "Glass is rated for 50 impacts. 12 have occurred, dropping integrity to 70%. If each additional impact reduces integrity by 2%, how many more impacts before integrity hits 30% (critical failure)?", correctAnswer: 20, tolerance: 0, unit: "impacts", hint: "From 70% to 30% = 40% to lose. At 2% per impact...", feedbackCorrect: "20 more impacts. At one every 3-4 minutes, that is about 60-80 minutes. Enough time to implement the deterrent -- if you hurry.", feedbackWrong: "70% - 30% = 40% buffer. At 2% per impact: 40 / 2 = 20 impacts remaining before critical failure." },
    ],
    completionMessage: "Red lights bathe the base in an eerie glow. The sonar pulse thrums. The creature circles one final time, its bioluminescence fading into the dark trench. Peace returns to the deep.",
    failureMessage: "The creature continues ramming. Emergency shutters seal the observation deck. The team loses their best window to the outside -- and their morale takes a hit.",
};

const VENT_ANALYSIS = {
    id: "vent_analysis",
    name: "Volcanic Vent Power Harvest",
    type: "multi_step",
    description: "Harness a volcanic vent's thermal energy while protecting the base from overheating.",
    difficulty: 3,
    timeBonus: 35,
    resourceReward: { food: 0, water: 0, materials: 20 },
    failurePenalty: { food: 0, water: -5, materials: -10 },
    briefing: "A nearby volcanic vent is surging. The heat threatens external cables, but a thermoelectric generator could convert that heat into desperately needed power. Risk versus reward.",
    roleInfo: {
        engineer: { label: "Generator Specs (Raza)", style: "blueprint", lines: ["Thermoelectric generator (TEG) available in Equipment Bay", "TEG converts heat difference into electricity: hot side vs cold side", "Maximum operating temperature: 300C on hot side", "Output: approximately 50W per 100C temperature difference", "Cable insulation melts above 250C -- route cables through cooled conduit"] },
        scientist: { label: "Thermal Data (Juno)", style: "lab_report", lines: ["Vent temperature: 350C at source, drops to 200C at 10m distance", "Ocean water at this depth: 2C (excellent cold sink!)", "Temperature difference at 10m: 200C - 2C = 198C", "TEG efficiency formula: Power = 50W x (Tdiff / 100)", "At 198C difference: ~99W output -- enough for emergency systems"] },
        medic: { label: "Heat Safety (Kit)", style: "medical_chart", lines: ["Water above 45C causes burns within seconds", "Thermal suits protect to 200C for 15 minutes maximum", "Heat stress symptoms: confusion, nausea, rapid heartbeat", "No crew should approach within 5m of the vent without thermal protection", "Ambient base temperature rising: 24C now, 28C in 2 hours if unshielded"] },
        navigator: { label: "Vent Location (Navi)", style: "field_map", lines: ["Vent is 100m west of base, on a rocky shelf", "ROV (remote submersible) can deploy the TEG without crew EVA", "Cable route: 100m from vent to base external port, along seafloor", "A natural rock channel provides some cable protection from heat", "Vent activity increasing -- peak expected in 8 hours, then decline"] },
    },
    steps: [
        { id: "power_calc", type: "calculation", instruction: "TEG produces 50W per 100C temperature difference. At 10m from the vent (200C) with ocean water at 2C, what power output in watts?", correctAnswer: 99, tolerance: 2, unit: "W", hint: "Temp difference = 200 - 2 = 198C. Power = 50 x (198/100)", feedbackCorrect: "99 watts! Enough to run emergency lighting, communication, and partial life support.", feedbackWrong: "Temperature difference: 200C - 2C = 198C. Power = 50 x (198 / 100) = 50 x 1.98 = 99W." },
        { id: "deployment", type: "multiple_choice", instruction: "How should the TEG be deployed at the vent?", options: ["Crew EVA in thermal suits", "ROV (remote submersible) deployment", "Throw it from the airlock toward the vent", "Wait for the vent to cool down first"], correctIndex: 1, feedbackCorrect: "ROV deployment! No crew risk. Navi can pilot it remotely. The ROV is heat-rated for brief vent proximity.", feedbackWrong: "Use the ROV -- it can handle the heat without risking crew safety. Navi identified this option." },
        { id: "cable_temp", type: "calculation", instruction: "Cable insulation melts at 250C. The vent is 350C at source, dropping 15C per meter. At what minimum distance from the vent is the cable safe?", correctAnswer: 7, tolerance: 1, unit: "meters", hint: "Need temp below 250C. 350 - (distance x 15) < 250. Solve for distance.", feedbackCorrect: "At 7m: 350 - 105 = 245C, just under the 250C limit. Route the cable at 7m+ from the source.", feedbackWrong: "350 - 250 = 100C to lose. At 15C/m: 100/15 = 6.67m. Round up to 7m for safety margin." },
    ],
    completionMessage: "The ROV places the TEG. Power readings climb: 20W... 55W... 97W. Emergency systems flicker back to life. 'Volcanic power,' Juno marvels. 'Earth's own battery.'",
    failureMessage: "The TEG placement is suboptimal. Only 30W generated -- better than nothing, but critical systems remain on rationed power.",
};

const SURFACE_SIGNAL = {
    id: "surface_signal",
    name: "Emergency Buoy Launch",
    type: "multi_step",
    description: "Deploy an emergency buoy to signal the rescue submersible.",
    difficulty: 3,
    timeBonus: 25,
    resourceReward: { food: 0, water: 0, materials: 0 },
    failurePenalty: { food: 0, water: 0, materials: 0 },
    briefing: "A rescue submersible is searching the area but does not know your exact location. Deploy the emergency buoy with correct ballast, signal frequency, and GPS coordinates. This is your ticket to the surface.",
    roleInfo: {
        engineer: { label: "Buoy Mechanics (Raza)", style: "blueprint", lines: ["Emergency buoy: 2m tall, 30kg dry weight", "Ballast chambers: must be partially flooded for neutral buoyancy until surface", "Release from torpedo tube 3 (functional after Navi's check)", "Buoy antenna deploys automatically on surface contact", "Battery life: 48 hours of continuous signaling once activated"] },
        scientist: { label: "Buoyancy Physics (Juno)", style: "lab_report", lines: ["Buoy volume: 0.08 cubic meters, dry mass: 30 kg", "Seawater density: 1025 kg/m3", "Buoyant force = water_density x volume x g = 1025 x 0.08 x 9.8 = 803 N", "Buoy weight = 30 x 9.8 = 294 N", "Net upward force = 803 - 294 = 509 N (ascent rate ~2 m/s)", "Add 15 kg ballast for controlled ascent (~1 m/s)"] },
        medic: { label: "Team Status (Kit)", style: "medical_chart", lines: ["Team morale: cautiously hopeful", "O2 reserves: 18 hours remaining at current consumption", "Physical condition: fatigued but functional", "This is the last chance -- failure means waiting 72+ hours for another search pass", "Everyone must stay focused -- adrenaline can cause errors"] },
        navigator: { label: "Position & Frequency (Navi)", style: "field_map", lines: ["Base coordinates: 22.3167 N, 159.5000 W", "Rescue sub last known position: 15 km northeast", "Emergency frequency: 406.025 MHz (international distress)", "Buoy must reach surface in under 15 minutes to catch the search window", "Current: slight northward drift at 0.5 km/h -- buoy will surface ~200m north"] },
    },
    steps: [
        { id: "ballast_calc", type: "calculation", instruction: "Buoy net upward force is 509N without ballast (ascent too fast at ~2 m/s). Adding ballast reduces force. To halve the ascent rate to ~1 m/s, add how many kg of ballast? (Force halves when you add ballast weight equal to half the net force; use g=9.8)", correctAnswer: 26, tolerance: 2, unit: "kg", hint: "To halve ascent speed, halve the net force. Remove 509/2 = 254.5 N of buoyancy. Weight = Force/g = 254.5/9.8 ~= 26 kg.", feedbackCorrect: "About 26 kg of ballast for a controlled 1 m/s ascent. The buoy will reach the surface in 25 minutes from 1500m -- cutting it close!", feedbackWrong: "To halve the net force: remove 509/2 = ~255 N. That is 255/9.8 = ~26 kg of ballast added." },
        { id: "frequency_set", type: "slider", instruction: "Set the emergency beacon frequency. Navi says the international distress frequency is 406.025 MHz.", min: 400, max: 420, correctValue: 406, tolerance: 1, unit: "MHz", labels: { 400: "400", 406: "Distress", 410: "410", 420: "420" }, feedbackCorrect: "406 MHz locked! The international COSPAS-SARSAT system will detect this signal and relay your position to the rescue sub.", feedbackWrong: "International distress frequency is 406.025 MHz. This is monitored by rescue satellites worldwide." },
        { id: "launch_sequence", type: "drag_order", instruction: "Arrange the buoy launch sequence.", items: [
            { id: "program", label: "Program GPS coordinates into beacon", correctPosition: 0 },
            { id: "ballast", label: "Add 26 kg ballast to chambers", correctPosition: 1 },
            { id: "freq", label: "Set frequency to 406 MHz", correctPosition: 2 },
            { id: "load", label: "Load buoy into torpedo tube 3", correctPosition: 3 },
            { id: "launch", label: "Open tube and launch buoy", correctPosition: 4 },
        ], partialCreditPerCorrect: 0.2, feedbackCorrect: "Perfect launch sequence! Program, ballast, frequency, load, launch. The buoy rockets upward through dark water toward the light.", feedbackWrong: "Program the beacon first (coordinates + frequency), add ballast, then load into the tube and launch. Programming after loading is difficult." },
    ],
    completionMessage: "Twenty-three minutes later, the radio crackles: 'Deep Station Alpha, rescue sub Poseidon has your buoy signal. Descending to your position. ETA: 90 minutes. Hold tight.' Kit bursts into tears of relief.",
    failureMessage: "The buoy launches but surfaces outside the search area. The rescue sub continues north. The team prepares to wait -- and hope for another chance.",
};

export const UNDERWATER_BASE_PUZZLES = {
    pressure_seal: PRESSURE_SEAL,
    deep_water_filtration: DEEP_WATER_FILTRATION,
    specimen_containment: SPECIMEN_CONTAINMENT,
    vent_analysis: VENT_ANALYSIS,
    surface_signal: SURFACE_SIGNAL,
};
