import { EQUIPMENT, CATEGORY_COLORS } from "../config/equipment.js";
import { COLORS } from "../config/constants.js";

/**
 * Equipment selection panel.
 * Shelf on the left shows available tools; workbench on the right shows selected.
 * Click to move between shelf/workbench. Wrong tools trigger an MCQ callback.
 */
export function createEquipmentPanel(k, {
    availableEquipmentIds,
    requiredEquipmentIds,
    onWrongTool,
    onSelectionChanged,
}) {
    const panelRoot = k.add([k.pos(0, 0), k.z(500), "equipment-panel"]);
    const selected = new Set();
    const shelfItems = [];
    const workbenchItems = [];

    const SHELF_X = 30;
    const BENCH_X = 660;
    const START_Y = 100;
    const ITEM_H = 52;
    const ITEM_W = 260;

    // Panel backgrounds
    panelRoot.add([
        k.rect(300, 500),
        k.pos(SHELF_X - 10, START_Y - 30),
        k.color(18, 30, 52),
        k.opacity(0.9),
        k.outline(2, k.rgb(40, 70, 110)),
    ]);
    panelRoot.add([
        k.text("Equipment Shelf", { size: 18 }),
        k.pos(SHELF_X + 10, START_Y - 22),
        k.color(...COLORS.accent),
    ]);

    panelRoot.add([
        k.rect(300, 500),
        k.pos(BENCH_X - 10, START_Y - 30),
        k.color(18, 30, 52),
        k.opacity(0.9),
        k.outline(2, k.rgb(40, 110, 70)),
    ]);
    panelRoot.add([
        k.text("Workbench", { size: 18 }),
        k.pos(BENCH_X + 10, START_Y - 22),
        k.color(...COLORS.beakerGreen),
    ]);

    // Instructions
    panelRoot.add([
        k.text("Click equipment to add to workbench", { size: 14 }),
        k.pos(SHELF_X + 10, START_Y + availableEquipmentIds.length * ITEM_H + 20),
        k.color(130, 150, 180),
    ]);

    function renderShelf() {
        // Clear old shelf items
        for (const item of shelfItems) k.destroy(item);
        shelfItems.length = 0;

        const unselected = availableEquipmentIds.filter((id) => !selected.has(id));
        for (let i = 0; i < unselected.length; i++) {
            const eqId = unselected[i];
            const eq = EQUIPMENT[eqId];
            if (!eq) continue;

            const catColor = CATEGORY_COLORS[eq.category] || [150, 150, 150];
            const y = START_Y + i * ITEM_H;

            const item = panelRoot.add([
                k.rect(ITEM_W, ITEM_H - 6),
                k.pos(SHELF_X, y),
                k.color(catColor[0] * 0.3, catColor[1] * 0.3, catColor[2] * 0.3),
                k.area(),
                k.outline(2, k.rgb(catColor[0], catColor[1], catColor[2])),
                "shelf-item",
            ]);

            // Category dot
            item.add([
                k.circle(6),
                k.pos(16, ITEM_H / 2 - 3),
                k.anchor("center"),
                k.color(catColor[0], catColor[1], catColor[2]),
            ]);

            // Name
            item.add([
                k.text(eq.name, { size: 16, width: ITEM_W - 40 }),
                k.pos(30, (ITEM_H - 6) / 2),
                k.anchor("left"),
                k.color(220, 235, 255),
            ]);

            item.onClick(() => {
                addToWorkbench(eqId);
            });

            shelfItems.push(item);
        }
    }

    function renderWorkbench() {
        for (const item of workbenchItems) k.destroy(item);
        workbenchItems.length = 0;

        const selArr = [...selected];
        for (let i = 0; i < selArr.length; i++) {
            const eqId = selArr[i];
            const eq = EQUIPMENT[eqId];
            if (!eq) continue;

            const isRequired = requiredEquipmentIds.includes(eqId);
            const catColor = CATEGORY_COLORS[eq.category] || [150, 150, 150];
            const y = START_Y + i * ITEM_H;

            const borderColor = isRequired
                ? k.rgb(80, 220, 130)
                : k.rgb(255, 210, 60);

            const item = panelRoot.add([
                k.rect(ITEM_W, ITEM_H - 6),
                k.pos(BENCH_X, y),
                k.color(20, 40, 30),
                k.area(),
                k.outline(3, borderColor),
                "bench-item",
            ]);

            item.add([
                k.circle(6),
                k.pos(16, ITEM_H / 2 - 3),
                k.anchor("center"),
                k.color(catColor[0], catColor[1], catColor[2]),
            ]);

            item.add([
                k.text(eq.name, { size: 16, width: ITEM_W - 60 }),
                k.pos(30, (ITEM_H - 6) / 2),
                k.anchor("left"),
                k.color(220, 235, 255),
            ]);

            // Status icon
            item.add([
                k.text(isRequired ? "(OK)" : "(?)", { size: 14 }),
                k.pos(ITEM_W - 40, (ITEM_H - 6) / 2),
                k.anchor("center"),
                k.color(isRequired ? 80 : 255, isRequired ? 220 : 210, isRequired ? 130 : 60),
            ]);

            // Click to remove
            item.onClick(() => {
                removeFromWorkbench(eqId);
            });

            workbenchItems.push(item);
        }
    }

    function addToWorkbench(eqId) {
        if (selected.has(eqId)) return;
        selected.add(eqId);

        // Check if it is a wrong tool
        const isWrong = !requiredEquipmentIds.includes(eqId);
        if (isWrong && typeof onWrongTool === "function") {
            onWrongTool(eqId);
        }

        renderShelf();
        renderWorkbench();
        if (typeof onSelectionChanged === "function") {
            onSelectionChanged([...selected]);
        }
    }

    function removeFromWorkbench(eqId) {
        selected.delete(eqId);
        renderShelf();
        renderWorkbench();
        if (typeof onSelectionChanged === "function") {
            onSelectionChanged([...selected]);
        }
    }

    // Initial render
    renderShelf();
    renderWorkbench();

    return {
        getSelected() {
            return [...selected];
        },
        destroy() {
            k.destroy(panelRoot);
        },
        isComplete() {
            return requiredEquipmentIds.every((id) => selected.has(id));
        },
    };
}
