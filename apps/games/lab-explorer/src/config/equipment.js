/**
 * Equipment catalog for every tool available in Lab Explorer.
 * Each entry: { id, name, category, iconDesc }
 * Categories: measuring, heating, electrical, safety, materials
 */
export const EQUIPMENT = {
    beaker: {
        id: "beaker",
        name: "Beaker",
        category: "measuring",
        iconDesc: "Glass beaker with measurement lines",
    },
    graduated_cylinder: {
        id: "graduated_cylinder",
        name: "Graduated Cylinder",
        category: "measuring",
        iconDesc: "Tall narrow cylinder with fine markings",
    },
    ph_meter: {
        id: "ph_meter",
        name: "pH Meter",
        category: "measuring",
        iconDesc: "Digital meter with probe tip",
    },
    thermometer: {
        id: "thermometer",
        name: "Thermometer",
        category: "measuring",
        iconDesc: "Mercury thermometer with red bulb",
    },
    scale: {
        id: "scale",
        name: "Digital Scale",
        category: "measuring",
        iconDesc: "Flat digital scale with LCD display",
    },
    bunsen_burner: {
        id: "bunsen_burner",
        name: "Bunsen Burner",
        category: "heating",
        iconDesc: "Gas burner with blue flame",
    },
    litmus_paper: {
        id: "litmus_paper",
        name: "Litmus Paper",
        category: "measuring",
        iconDesc: "Small paper strip that changes color",
    },
    safety_goggles: {
        id: "safety_goggles",
        name: "Safety Goggles",
        category: "safety",
        iconDesc: "Clear protective goggles",
    },
    ammeter: {
        id: "ammeter",
        name: "Ammeter",
        category: "electrical",
        iconDesc: "Dial meter marked in Amps",
    },
    voltmeter: {
        id: "voltmeter",
        name: "Voltmeter",
        category: "electrical",
        iconDesc: "Dial meter marked in Volts",
    },
    wires: {
        id: "wires",
        name: "Connecting Wires",
        category: "electrical",
        iconDesc: "Bundle of colored insulated wires",
    },
    battery: {
        id: "battery",
        name: "Battery Pack",
        category: "electrical",
        iconDesc: "1.5V battery holder",
    },
    resistor: {
        id: "resistor",
        name: "Resistor",
        category: "electrical",
        iconDesc: "Small component with colored bands",
    },
    switch: {
        id: "switch",
        name: "Switch",
        category: "electrical",
        iconDesc: "Toggle switch on small board",
    },
    bulb: {
        id: "bulb",
        name: "Light Bulb",
        category: "electrical",
        iconDesc: "Small incandescent bulb in socket",
    },
    string: {
        id: "string",
        name: "String",
        category: "materials",
        iconDesc: "Spool of nylon string",
    },
    weights: {
        id: "weights",
        name: "Weight Set",
        category: "materials",
        iconDesc: "Brass calibration weights in case",
    },
    ruler: {
        id: "ruler",
        name: "Ruler",
        category: "measuring",
        iconDesc: "30cm ruler with mm markings",
    },
    stopwatch: {
        id: "stopwatch",
        name: "Stopwatch",
        category: "measuring",
        iconDesc: "Digital stopwatch with lap button",
    },
    insulation_materials: {
        id: "insulation_materials",
        name: "Insulation Kit",
        category: "materials",
        iconDesc: "Box with foam, cloth, metal, wood samples",
    },
};

/** Helper: return array of equipment objects by id list */
export function getEquipmentList(ids) {
    return ids.map((id) => EQUIPMENT[id]).filter(Boolean);
}

/** Category colors for drawing equipment icons */
export const CATEGORY_COLORS = {
    measuring:   [80, 180, 255],
    heating:     [255, 140, 50],
    electrical:  [255, 220, 60],
    safety:      [60, 220, 100],
    materials:   [180, 140, 220],
};
