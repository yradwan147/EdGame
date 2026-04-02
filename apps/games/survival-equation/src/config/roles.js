import { ROLE_IDS, COLORS } from "./constants.js";

export const ROLE_CONFIG = {
    [ROLE_IDS.ENGINEER]: {
        id: ROLE_IDS.ENGINEER,
        name: "Raza",
        title: "Structural Engineer",
        expertise: "Materials & Structures",
        color: COLORS.teamEngineer,
        portrait: "wrench",
        description: "Knows material stress limits, structural designs, and construction techniques. Can identify which salvaged materials are load-bearing and which are decorative.",
        exclusiveInfoKey: "engineer_data",
        infoStyle: "blueprint",
    },
    [ROLE_IDS.SCIENTIST]: {
        id: ROLE_IDS.SCIENTIST,
        name: "Juno",
        title: "Field Scientist",
        expertise: "Formulas & Chemistry",
        color: COLORS.teamScientist,
        portrait: "flask",
        description: "Understands chemical reactions, physics formulas, and natural phenomena. Can calculate energy requirements and predict environmental changes.",
        exclusiveInfoKey: "scientist_data",
        infoStyle: "lab_report",
    },
    [ROLE_IDS.MEDIC]: {
        id: ROLE_IDS.MEDIC,
        name: "Kit",
        title: "Field Medic",
        expertise: "Health & Safety",
        color: COLORS.teamMedic,
        portrait: "cross",
        description: "Knows caloric needs, hydration requirements, injury treatment, and toxicity levels. Can assess whether a plan is safe for the team.",
        exclusiveInfoKey: "medic_data",
        infoStyle: "medical_chart",
    },
    [ROLE_IDS.NAVIGATOR]: {
        id: ROLE_IDS.NAVIGATOR,
        name: "Navi",
        title: "Scout Navigator",
        expertise: "Terrain & Weather",
        color: COLORS.teamNavigator,
        portrait: "compass",
        description: "Reads terrain, predicts weather patterns, and knows local geography. Can find resources and identify safe routes.",
        exclusiveInfoKey: "navigator_data",
        infoStyle: "field_map",
    },
};

export function getRole(roleId) {
    return ROLE_CONFIG[roleId];
}

export function getRoleList() {
    return Object.values(ROLE_CONFIG);
}

export function getOtherRoles(playerRoleId) {
    return Object.values(ROLE_CONFIG).filter((r) => r.id !== playerRoleId);
}
