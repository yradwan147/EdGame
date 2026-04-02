import { COLORS, SUBJECT_IDS } from "./constants.js";

export const TOWER_TYPES = {
    numberBastion: {
        id: "numberBastion",
        name: "Number Bastion",
        description: "Reliable bolt tower. Cheap and consistent.",
        cost: 40,
        range: 160,
        damage: 14,
        fireRate: 1.0,
        projectileSpeed: 420,
        color: COLORS.numberBastion,
        subject: SUBJECT_IDS.NUMBER_SENSE,
        upgrades: [
            { cost: 25, damageBonus: 6, rangeBonus: 15, label: "Sharpened Bolts" },
            { cost: 45, damageBonus: 10, rangeBonus: 20, label: "Rapid Fire", fireRateBonus: 0.4 },
            // Level 3: branching (chosen at upgrade time)
            {
                a: { cost: 60, label: "Chain Lightning", damageBonus: 8, special: "chain", chainTargets: 2, chainDamageFalloff: 0.5 },
                b: { cost: 60, label: "Precision Focus", damageBonus: 20, rangeBonus: 40, special: "crit", critChance: 0.25, critMultiplier: 3 },
            },
        ],
    },
    operationCannon: {
        id: "operationCannon",
        name: "Operation Cannon",
        description: "Splash damage. Great against groups.",
        cost: 70,
        range: 180,
        damage: 22,
        fireRate: 0.7,
        projectileSpeed: 350,
        color: COLORS.operationCannon,
        subject: SUBJECT_IDS.OPERATIONS,
        splashRadius: 45,
        upgrades: [
            { cost: 40, damageBonus: 8, splashBonus: 10, label: "Wider Blast" },
            { cost: 60, damageBonus: 12, splashBonus: 15, label: "Shockwave", fireRateBonus: 0.2 },
            {
                a: { cost: 80, label: "Cluster Bomb", special: "cluster", clusterCount: 3, clusterDamage: 10 },
                b: { cost: 80, label: "Napalm Shot", special: "dot", dotDamage: 5, dotDuration: 3, dotTicks: 6 },
            },
        ],
    },
    fractionFreezer: {
        id: "fractionFreezer",
        name: "Fraction Freezer",
        description: "Slows enemies. Essential vs fast foes.",
        cost: 55,
        range: 190,
        damage: 8,
        fireRate: 1.4,
        projectileSpeed: 380,
        color: COLORS.fractionFreezer,
        subject: SUBJECT_IDS.FRACTIONS,
        slowFactor: 0.4,
        slowDuration: 2.0,
        upgrades: [
            { cost: 30, slowBonus: 0.1, rangeBonus: 20, label: "Deeper Freeze" },
            { cost: 50, slowBonus: 0.1, damageBonus: 6, label: "Frostbite", slowDuration: 2.5 },
            {
                a: { cost: 70, label: "Freeze Aura", special: "aura", auraRadius: 80, auraSlowFactor: 0.3 },
                b: { cost: 70, label: "Shatter", special: "shatter", shatterBonusDmg: 3.0 },
            },
        ],
    },
    geometryGuard: {
        id: "geometryGuard",
        name: "Geometry Guard",
        description: "Long-range sniper. Devastating single shots.",
        cost: 100,
        range: 280,
        damage: 45,
        fireRate: 0.35,
        projectileSpeed: 600,
        color: COLORS.geometryGuard,
        subject: SUBJECT_IDS.GEOMETRY,
        upgrades: [
            { cost: 55, damageBonus: 20, rangeBonus: 30, label: "Scope Upgrade" },
            { cost: 75, damageBonus: 30, label: "Armor Piercing", fireRateBonus: 0.1 },
            {
                a: { cost: 100, label: "Railgun", special: "pierce", pierceTargets: 3 },
                b: { cost: 100, label: "Mortar Mode", special: "mortar", mortarSplash: 60, mortarDamage: 60, mortarRate: 0.2 },
            },
        ],
    },
};

export function getTowerStats(towerType, level) {
    const base = TOWER_TYPES[towerType];
    if (!base) return null;
    let damage = base.damage;
    let range = base.range;
    let fireRate = base.fireRate;
    let splashRadius = base.splashRadius || 0;
    let slowFactor = base.slowFactor || 0;
    let slowDuration = base.slowDuration || 0;
    let special = null;

    for (let i = 0; i < Math.min(level, base.upgrades.length); i++) {
        const upg = base.upgrades[i];
        // Level 3 is branching — handled by chosenBranch param externally
        if (upg.a) break; // branching level, skip in generic calc
        damage += upg.damageBonus || 0;
        range += upg.rangeBonus || 0;
        fireRate += upg.fireRateBonus || 0;
        splashRadius += upg.splashBonus || 0;
        slowFactor += upg.slowBonus || 0;
        if (upg.slowDuration) slowDuration = upg.slowDuration;
    }

    return { damage, range, fireRate, splashRadius, slowFactor, slowDuration, special };
}
