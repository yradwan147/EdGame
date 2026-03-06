import { COLORS } from "../config/constants.js";

function toRgbArray(k, colorArr) {
    return k.rgb(colorArr[0], colorArr[1], colorArr[2]);
}

export function createHudRenderer(k, deps) {
    const refs = {
        playerHpFill: null,
        playerHpText: null,
        pulseText: null,
        pulseBar: null,
        roleText: null,
        xpText: null,
        logText: null,
        timerText: null,
        allyStatusText: null,
        objectiveText: null,
        abilityRows: [],
        abilityTooltipText: null,
    };

    function init({ abilities = [] } = {}) {
        k.add([k.rect(500, 138), k.pos(16, 14), k.color(15, 20, 35), k.opacity(0.9), k.fixed(), k.z(1200)]);
        refs.playerHpFill = k.add([k.rect(320, 18), k.pos(30, 40), k.color(90, 220, 140), k.fixed(), k.z(1201)]);
        k.add([k.text("HP", { size: 14 }), k.pos(30, 22), k.fixed(), k.z(1202)]);
        refs.playerHpText = k.add([k.text("120/120", { size: 14 }), k.pos(360, 39), k.fixed(), k.z(1202)]);

        k.add([k.text("Pulse", { size: 14 }), k.pos(30, 67), k.fixed(), k.z(1202)]);
        k.add([k.rect(320, 14), k.pos(30, 86), k.color(40, 45, 60), k.fixed(), k.z(1201)]);
        refs.pulseBar = k.add([k.rect(160, 14), k.pos(30, 86), k.color(255, 205, 90), k.fixed(), k.z(1202)]);
        refs.pulseText = k.add([k.text("Pulse: 50%", { size: 14 }), k.pos(360, 84), k.fixed(), k.z(1202)]);

        refs.roleText = k.add([k.text("Role: -", { size: 16 }), k.pos(30, 110), k.fixed(), k.z(1202)]);
        refs.xpText = k.add([k.text("Level 1 | XP 0", { size: 16 }), k.pos(240, 110), k.fixed(), k.z(1202)]);

        refs.timerText = k.add([k.text("Time: 05:00", { size: 18 }), k.pos(1090, 20), k.fixed(), k.z(1202)]);
        refs.objectiveText = k.add([k.text("Objective A: 0 | Objective B: 0", { size: 15 }), k.pos(830, 48), k.fixed(), k.z(1202)]);

        k.add([k.rect(580, 136), k.pos(530, 14), k.color(15, 20, 35), k.opacity(0.9), k.fixed(), k.z(1200)]);
        k.add([k.text("Abilities", { size: 16 }), k.pos(548, 22), k.fixed(), k.z(1202), k.color(255, 205, 90)]);

        refs.abilityTooltipText = k.add([
            k.text("Hover over an ability to view details", { size: 14, width: 320 }),
            k.pos(840, 22),
            k.fixed(),
            k.z(1202),
            k.color(180, 190, 220),
        ]);

        abilities.forEach((ability, idx) => {
            const y = 48 + idx * 40;
            const box = k.add([
                k.rect(280, 34),
                k.pos(548, y),
                k.color(40, 46, 68),
                k.area(),
                k.fixed(),
                k.z(1201),
            ]);
            const textObj = box.add([
                k.text(`${ability.key}: ${ability.label} (ready)`, { size: 14, width: 260 }),
                k.pos(10, 9),
            ]);

            box.onHover(() => {
                refs.abilityTooltipText.text = `${ability.label}: ${ability.description}\nBase cooldown ${ability.cooldownSec.toFixed(1)}s`;
            });
            box.onHoverEnd(() => {
                refs.abilityTooltipText.text = "Hover over an ability to view details";
            });

            refs.abilityRows.push({
                id: ability.id,
                key: ability.key,
                label: ability.label,
                textObj,
            });
        });

        k.add([k.rect(430, 150), k.pos(834, 78), k.color(15, 20, 35), k.opacity(0.88), k.fixed(), k.z(1200)]);
        refs.allyStatusText = k.add([k.text("Allies", { size: 14, width: 410 }), k.pos(846, 88), k.fixed(), k.z(1202)]);
        refs.logText = k.add([k.text("Events", { size: 14, width: 1220 }), k.pos(20, 678), k.fixed(), k.z(1202)]);
    }

    function pulseColor(score) {
        if (score >= 0.75) return toRgbArray(k, COLORS.pulseGood);
        if (score >= 0.45) return toRgbArray(k, COLORS.pulseMid);
        return toRgbArray(k, COLORS.pulseBad);
    }

    function update({
        playerObj,
        profile,
        roleName,
        pulseScore,
        elapsedMs,
        durationSec,
        logLines,
        allies,
        objective,
        abilityCooldowns = {},
    }) {
        if (!playerObj || !refs.playerHpFill) return;
        const hpRatio = Math.max(0, playerObj.hp / playerObj.maxHp);
        refs.playerHpFill.width = 320 * hpRatio;
        refs.playerHpFill.color = hpRatio > 0.5 ? k.rgb(90, 220, 140) : hpRatio > 0.25 ? k.rgb(255, 205, 90) : k.rgb(255, 95, 95);
        refs.playerHpText.text = `${Math.round(playerObj.hp)}/${playerObj.maxHp}`;

        refs.pulseBar.width = 320 * pulseScore;
        refs.pulseBar.color = pulseColor(pulseScore);
        refs.pulseText.text = `Pulse: ${Math.round(pulseScore * 100)}%`;
        refs.roleText.text = `Role: ${roleName}`;
        refs.xpText.text = `Level ${profile.level} | XP ${profile.xp}`;

        const remainingSec = Math.max(0, durationSec - Math.floor(elapsedMs / 1000));
        const m = Math.floor(remainingSec / 60).toString().padStart(2, "0");
        const s = (remainingSec % 60).toString().padStart(2, "0");
        refs.timerText.text = `Time: ${m}:${s}`;
        refs.objectiveText.text = `Objective A: ${objective.allyPoints} | Objective B: ${objective.enemyPoints}`;

        refs.allyStatusText.text = `Team Status\n${allies
            .map((a) => `${a.displayName} (${a.roleId}) - ${Math.max(0, Math.round(a.hp))} HP`)
            .join("\n")}`;
        refs.logText.text = logLines.slice(-4).join(" | ");

        refs.abilityRows.forEach((row) => {
            const readyAt = abilityCooldowns[row.id] ?? 0;
            const remaining = Math.max(0, (readyAt - Date.now()) / 1000);
            row.textObj.text = `${row.key}: ${row.label} (${remaining <= 0 ? "ready" : `${remaining.toFixed(1)}s`})`;
        });
    }

    return { init, update };
}
