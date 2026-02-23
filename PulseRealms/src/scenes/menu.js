export function registerMenuScene({ k, progression }) {
    k.scene("menu", () => {
        const profile = progression.getProfile();

        k.add([k.rect(k.width(), k.height()), k.color(10, 14, 30)]);
        k.add([
            k.text("PULSE REALMS", { size: 72 }),
            k.pos(k.width() / 2, 160),
            k.anchor("center"),
            k.color(90, 235, 255),
        ]);
        k.add([
            k.text("The Omniverse Trials", { size: 34 }),
            k.pos(k.width() / 2, 222),
            k.anchor("center"),
            k.color(255, 120, 185),
        ]);
        k.add([
            k.text("Action Challenge -> Question -> Skill Application -> Reward", { size: 20 }),
            k.pos(k.width() / 2, 275),
            k.anchor("center"),
            k.color(160, 170, 220),
        ]);

        k.add([
            k.text(`Cadet Level ${profile.level} | Badges ${profile.badges.length}`, { size: 22 }),
            k.pos(k.width() / 2, 342),
            k.anchor("center"),
            k.color(120, 230, 140),
        ]);

        const startBtn = k.add([
            k.rect(380, 78),
            k.pos(k.width() / 2 - 190, 420),
            k.color(20, 100, 145),
            k.area(),
            k.outline(3, k.rgb(90, 235, 255)),
        ]);
        startBtn.add([
            k.text("ENTER TRIAL", { size: 36 }),
            k.pos(190, 39),
            k.anchor("center"),
        ]);
        startBtn.onClick(() => k.go("roleSelect"));

        k.add([
            k.text("Press ENTER to continue", { size: 18 }),
            k.pos(k.width() / 2, 530),
            k.anchor("center"),
            k.color(170, 170, 195),
        ]);
        k.onKeyPress("enter", () => k.go("roleSelect"));
    });
}
