import { COLORS } from "../config/constants.js";

/**
 * shop.js -- Simple item shop scene.
 */
export function registerShopScene({ k, gameStateStore }) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);

    k.scene("shop", ({ nodeId }) => {
        const W = k.width();
        const H = k.height();
        const state = gameStateStore.getState();

        /* ---- determine if player helped the merchant (better prices) ---- */
        const helpedMerchant = gameStateStore.getWorldState("help_barley") ||
            gameStateStore.getWorldState("free_potions_at_rest_nodes");
        const priceMultiplier = helpedMerchant ? 0.8 : 1.0;

        /* ---- shop inventory ---- */
        const shopItems = [
            {
                id: "potion_small",
                name: "Healing Potion",
                desc: "Restores 30 HP",
                type: "heal_potion",
                cost: Math.floor(20 * priceMultiplier),
                icon: "+30 HP",
            },
            {
                id: "mana_potion",
                name: "Mana Potion",
                desc: "Restores 10 MP",
                type: "mana_potion",
                cost: Math.floor(15 * priceMultiplier),
                icon: "+10 MP",
            },
            {
                id: "scroll_hint",
                name: "Scroll of Insight",
                desc: "+1 Mentor Token",
                type: "mentor_scroll",
                cost: Math.floor(30 * priceMultiplier),
                icon: "+1 Hint",
            },
            {
                id: "shield_charm",
                name: "Shield Charm",
                desc: "50% damage reduction for 1 combat",
                type: "defense_scroll",
                cost: Math.floor(25 * priceMultiplier),
                icon: "Shield",
            },
        ];

        /* ---- background ---- */
        k.add([k.rect(W, H), k.pos(0, 0), k.color(...COLORS.bg)]);

        /* ---- title ---- */
        k.add([
            k.text("Wandering Peddler's Shop", { size: 34 }),
            k.pos(W / 2, 40),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);

        /* ---- shopkeeper greeting ---- */
        let greeting = "Welcome, traveller! Take a look at my wares.";
        if (helpedMerchant) {
            greeting = "Ah, my friend! You helped me on the road. Enjoy my best prices!";
        }

        const greetingBox = k.add([
            k.rect(700, 60),
            k.pos(W / 2 - 350, 75),
            k.color(...COLORS.panelBg),
            k.outline(1, rgb(COLORS.panelBorder)),
        ]);
        greetingBox.add([
            k.text(greeting, { size: 18, width: 660 }),
            k.pos(20, 18),
            k.color(...COLORS.textPrimary),
        ]);

        /* ---- gold display ---- */
        let playerGold = 0;
        const goldItems = state.inventory.filter((i) => i.id === "gold");
        if (goldItems.length > 0) playerGold = goldItems[0].quantity;

        const goldLabel = k.add([
            k.text("Gold: " + playerGold, { size: 22 }),
            k.pos(W / 2, 155),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);

        if (helpedMerchant) {
            k.add([
                k.text("(20% Discount Applied!)", { size: 14 }),
                k.pos(W / 2, 178),
                k.anchor("center"),
                k.color(...COLORS.heal),
            ]);
        }

        /* ---- item cards ---- */
        const cardW = 260;
        const cardH = 220;
        const gapX = 24;
        const totalW = shopItems.length * cardW + (shopItems.length - 1) * gapX;
        const startX = (W - totalW) / 2;
        const cardY = 200;

        const buyButtons = [];

        for (let i = 0; i < shopItems.length; i++) {
            const item = shopItems[i];
            const cx = startX + i * (cardW + gapX);

            /* card bg */
            k.add([
                k.rect(cardW, cardH),
                k.pos(cx, cardY),
                k.color(...COLORS.panelBg),
                k.outline(2, rgb(COLORS.panelBorder)),
            ]);

            /* icon area */
            k.add([
                k.rect(60, 60),
                k.pos(cx + cardW / 2 - 30, cardY + 15),
                k.color(COLORS.panelBg[0] + 15, COLORS.panelBg[1] + 12, COLORS.panelBg[2] + 25),
                k.outline(1, rgb(COLORS.secondary)),
            ]);
            k.add([
                k.text(item.icon, { size: 16 }),
                k.pos(cx + cardW / 2, cardY + 45),
                k.anchor("center"),
                k.color(...COLORS.secondary),
            ]);

            /* name */
            k.add([
                k.text(item.name, { size: 18 }),
                k.pos(cx + cardW / 2, cardY + 95),
                k.anchor("center"),
                k.color(...COLORS.textPrimary),
            ]);

            /* description */
            k.add([
                k.text(item.desc, { size: 14, width: cardW - 20 }),
                k.pos(cx + cardW / 2, cardY + 120),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
            ]);

            /* cost */
            k.add([
                k.text("Cost: " + item.cost + " Gold", { size: 15 }),
                k.pos(cx + cardW / 2, cardY + 150),
                k.anchor("center"),
                k.color(...COLORS.secondary),
            ]);

            /* buy button */
            const canAfford = playerGold >= item.cost;
            const buyBtn = k.add([
                k.rect(120, 38),
                k.pos(cx + cardW / 2, cardY + 185),
                k.anchor("center"),
                k.color(...(canAfford ? [40, 100, 40] : [60, 40, 40])),
                k.outline(2, rgb(canAfford ? COLORS.heal : COLORS.danger)),
                k.area(),
                k.opacity(canAfford ? 1 : 0.5),
            ]);
            buyBtn.add([
                k.text(canAfford ? "BUY" : "Can't Afford", { size: 14 }),
                k.anchor("center"),
                k.color(...COLORS.textPrimary),
            ]);

            if (canAfford) {
                buyBtn.onClick(() => {
                    /* deduct gold */
                    const goldInv = gameStateStore.getState().inventory.find((it) => it.id === "gold");
                    if (goldInv) {
                        goldInv.quantity -= item.cost;
                        playerGold -= item.cost;
                    }

                    /* add item */
                    if (item.id === "scroll_hint") {
                        /* mentor scroll gives a token */
                        const st = gameStateStore.getState();
                        st.mentorTokens += 1;
                    } else {
                        gameStateStore.addItem({
                            id: item.id,
                            name: item.name,
                            type: item.type,
                            quantity: 1,
                        });
                    }

                    /* refresh scene */
                    k.go("shop", { nodeId });
                });

                buyBtn.onHover(() => {
                    buyBtn.color = k.rgb(50, 130, 50);
                });
                buyBtn.onHoverEnd(() => {
                    buyBtn.color = k.rgb(40, 100, 40);
                });
            }

            buyButtons.push(buyBtn);
        }

        /* ---- leave button ---- */
        const leaveBtn = k.add([
            k.rect(200, 50),
            k.pos(W / 2, H - 60),
            k.anchor("center"),
            k.color(Math.floor(COLORS.primary[0] * 0.25),
                    Math.floor(COLORS.primary[1] * 0.25),
                    Math.floor(COLORS.primary[2] * 0.25)),
            k.outline(2, rgb(COLORS.primary)),
            k.area(),
        ]);

        leaveBtn.add([
            k.text("Leave Shop", { size: 20 }),
            k.anchor("center"),
            k.color(...COLORS.textPrimary),
        ]);

        leaveBtn.onHover(() => {
            leaveBtn.color = k.rgb(
                Math.floor(COLORS.primary[0] * 0.4),
                Math.floor(COLORS.primary[1] * 0.4),
                Math.floor(COLORS.primary[2] * 0.4),
            );
        });
        leaveBtn.onHoverEnd(() => {
            leaveBtn.color = k.rgb(
                Math.floor(COLORS.primary[0] * 0.25),
                Math.floor(COLORS.primary[1] * 0.25),
                Math.floor(COLORS.primary[2] * 0.25),
            );
        });
        leaveBtn.onClick(() => {
            const st = gameStateStore.getState();
            k.go("chapterMap", { chapterId: st.chapter });
        });
    });
}
