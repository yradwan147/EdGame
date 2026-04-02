import { COLORS } from "../config/constants.js";

/**
 * Interactive puzzle board component.
 * Supports: drag_order, calculation, multiple_choice, node_wiring, slider, beam_placement.
 */
export function createPuzzleBoard(k) {
    let root = null;
    let resolveCallback = null;

    function cleanup() {
        if (root && root.exists()) k.destroy(root);
        root = null;
        resolveCallback = null;
    }

    /**
     * Show a puzzle step and return a promise that resolves with the player's input.
     */
    function showStep(step) {
        cleanup();
        return new Promise((resolve) => {
            resolveCallback = resolve;
            root = k.add([k.pos(0, 0), k.fixed(), k.z(1050)]);

            switch (step.type) {
                case "drag_order":
                    buildDragOrder(step);
                    break;
                case "calculation":
                    buildCalculation(step);
                    break;
                case "multiple_choice":
                    buildMultipleChoice(step);
                    break;
                case "node_wiring":
                    buildNodeWiring(step);
                    break;
                case "slider":
                    buildSlider(step);
                    break;
                case "beam_placement":
                    buildBeamPlacement(step);
                    break;
                default:
                    buildMultipleChoice(step);
            }
        });
    }

    // ---- DRAG ORDER ----
    function buildDragOrder(step) {
        const PX = 180;
        const PY = 80;
        const SLOT_W = 420;
        const SLOT_H = 45;
        const GAP = 8;

        root.add([
            k.rect(500, 50),
            k.pos(PX, PY - 55),
            k.color(...COLORS.bgPanel),
        ]);
        root.add([
            k.text(step.instruction, { size: 14, width: 480 }),
            k.pos(PX + 10, PY - 48),
            k.color(...COLORS.textPrimary),
        ]);

        // Shuffled items
        const shuffled = [...step.items].sort(() => Math.random() - 0.5);
        const currentOrder = shuffled.map((it) => it.id);
        const slotObjects = [];

        function renderSlots() {
            for (const obj of slotObjects) {
                if (obj.exists()) k.destroy(obj);
            }
            slotObjects.length = 0;

            for (let i = 0; i < currentOrder.length; i++) {
                const itemId = currentOrder[i];
                const item = step.items.find((it) => it.id === itemId);
                const sy = PY + i * (SLOT_H + GAP);

                // Slot number
                const numObj = root.add([
                    k.text(`${i + 1}.`, { size: 16 }),
                    k.pos(PX - 25, sy + 12),
                    k.color(...COLORS.earthLight),
                ]);
                slotObjects.push(numObj);

                // Slot box
                const box = root.add([
                    k.rect(SLOT_W, SLOT_H),
                    k.pos(PX, sy),
                    k.color(...COLORS.bgCard),
                    k.area(),
                    k.outline(2, k.rgb(...COLORS.earth)),
                ]);
                slotObjects.push(box);

                box.add([
                    k.text(item.label, { size: 14, width: SLOT_W - 80 }),
                    k.pos(15, 13),
                    k.color(...COLORS.textPrimary),
                ]);

                // Up/Down buttons
                if (i > 0) {
                    const upBtn = box.add([
                        k.rect(30, 20),
                        k.pos(SLOT_W - 70, 12),
                        k.color(...COLORS.waterBlue),
                        k.area(),
                    ]);
                    upBtn.add([k.text("Up", { size: 10 }), k.pos(6, 3), k.color(255, 255, 255)]);
                    upBtn.onClick(() => {
                        [currentOrder[i - 1], currentOrder[i]] = [currentOrder[i], currentOrder[i - 1]];
                        renderSlots();
                    });
                }
                if (i < currentOrder.length - 1) {
                    const downBtn = box.add([
                        k.rect(30, 20),
                        k.pos(SLOT_W - 35, 12),
                        k.color(...COLORS.dangerOrange),
                        k.area(),
                    ]);
                    downBtn.add([k.text("Dn", { size: 10 }), k.pos(4, 3), k.color(255, 255, 255)]);
                    downBtn.onClick(() => {
                        [currentOrder[i], currentOrder[i + 1]] = [currentOrder[i + 1], currentOrder[i]];
                        renderSlots();
                    });
                }
            }
        }

        renderSlots();

        // Submit button
        const submitBtn = root.add([
            k.rect(160, 44),
            k.pos(PX + SLOT_W + 20, PY + 80),
            k.color(...COLORS.safeGreen),
            k.area(),
            k.outline(2, k.rgb(255, 255, 255)),
        ]);
        submitBtn.add([
            k.text("CONFIRM", { size: 18 }),
            k.pos(80, 22),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        submitBtn.onClick(() => {
            if (resolveCallback) resolveCallback([...currentOrder]);
            cleanup();
        });
    }

    // ---- CALCULATION ----
    function buildCalculation(step) {
        const CX = 200;
        const CY = 120;

        root.add([
            k.rect(500, 70),
            k.pos(CX, CY - 10),
            k.color(...COLORS.bgPanel),
            k.outline(1, k.rgb(...COLORS.earth)),
        ]);
        root.add([
            k.text(step.instruction, { size: 14, width: 480 }),
            k.pos(CX + 10, CY),
            k.color(...COLORS.textPrimary),
        ]);

        if (step.hint) {
            root.add([
                k.text(`Hint: ${step.hint}`, { size: 12, width: 480 }),
                k.pos(CX + 10, CY + 80),
                k.color(...COLORS.textMuted),
            ]);
        }

        // Input area
        root.add([
            k.rect(200, 40),
            k.pos(CX + 50, CY + 110),
            k.color(14, 24, 38),
            k.outline(2, k.rgb(...COLORS.accentTeal)),
        ]);

        let userInput = "";
        const inputText = root.add([
            k.text("_", { size: 24 }),
            k.pos(CX + 60, CY + 118),
            k.color(...COLORS.textPrimary),
        ]);

        if (step.unit) {
            root.add([
                k.text(step.unit, { size: 18 }),
                k.pos(CX + 260, CY + 120),
                k.color(...COLORS.textSecondary),
            ]);
        }

        const numKeys = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        const cancelFns = [];

        for (const nk of numKeys) {
            cancelFns.push(k.onKeyPress(nk, () => {
                userInput += nk;
                inputText.text = userInput + "_";
            }));
        }
        cancelFns.push(k.onKeyPress(".", () => {
            if (!userInput.includes(".")) {
                userInput += ".";
                inputText.text = userInput + "_";
            }
        }));
        cancelFns.push(k.onKeyPress("-", () => {
            if (userInput.length === 0) {
                userInput = "-";
                inputText.text = userInput + "_";
            }
        }));
        cancelFns.push(k.onKeyPress("backspace", () => {
            userInput = userInput.slice(0, -1);
            inputText.text = (userInput || "_");
        }));

        // Submit
        const submitBtn = root.add([
            k.rect(160, 44),
            k.pos(CX + 300, CY + 110),
            k.color(...COLORS.safeGreen),
            k.area(),
            k.outline(2, k.rgb(255, 255, 255)),
        ]);
        submitBtn.add([
            k.text("SUBMIT", { size: 18 }),
            k.pos(80, 22),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        submitBtn.onClick(() => {
            for (const cf of cancelFns) {
                if (typeof cf === "function") cf();
                if (cf && typeof cf.cancel === "function") cf.cancel();
            }
            if (resolveCallback) resolveCallback(userInput);
            cleanup();
        });
        cancelFns.push(k.onKeyPress("enter", () => {
            for (const cf of cancelFns) {
                if (typeof cf === "function") cf();
                if (cf && typeof cf.cancel === "function") cf.cancel();
            }
            if (resolveCallback) resolveCallback(userInput);
            cleanup();
        }));
    }

    // ---- MULTIPLE CHOICE ----
    function buildMultipleChoice(step) {
        const MX = 180;
        const MY = 100;

        root.add([
            k.rect(540, 60),
            k.pos(MX, MY - 10),
            k.color(...COLORS.bgPanel),
        ]);
        root.add([
            k.text(step.instruction, { size: 15, width: 520 }),
            k.pos(MX + 10, MY),
            k.color(...COLORS.textPrimary),
        ]);

        const labels = ["A", "B", "C", "D"];
        const btnColors = [COLORS.dangerOrange, COLORS.waterBlue, COLORS.safeGreen, COLORS.earthLight];

        for (let i = 0; i < (step.options || []).length; i++) {
            const by = MY + 70 + i * 65;
            const btn = root.add([
                k.rect(520, 52),
                k.pos(MX, by),
                k.color(...(btnColors[i] || COLORS.bgCard)),
                k.area(),
                k.outline(2, k.rgb(255, 255, 255)),
            ]);
            btn.add([
                k.text(`(${labels[i]}) ${step.options[i]}`, { size: 16, width: 490 }),
                k.pos(15, 16),
                k.color(255, 255, 255),
            ]);
            btn.onClick(() => {
                if (resolveCallback) resolveCallback(i);
                cleanup();
            });
        }

        // Keyboard shortcuts
        ["1", "2", "3", "4"].forEach((key, idx) => {
            if (idx < (step.options || []).length) {
                k.onKeyPress(key, () => {
                    if (resolveCallback) resolveCallback(idx);
                    cleanup();
                });
            }
        });
    }

    // ---- NODE WIRING ----
    function buildNodeWiring(step) {
        const NX = 170;
        const NY = 70;
        const NW = 550;
        const NH = 350;

        root.add([
            k.rect(NW + 40, 40),
            k.pos(NX - 10, NY - 40),
            k.color(...COLORS.bgPanel),
        ]);
        root.add([
            k.text(step.instruction, { size: 13, width: NW + 20 }),
            k.pos(NX, NY - 35),
            k.color(...COLORS.textPrimary),
        ]);

        // Workspace
        root.add([
            k.rect(NW, NH),
            k.pos(NX, NY),
            k.color(12, 18, 32),
            k.outline(1, k.rgb(...COLORS.earth)),
        ]);

        const nodePositions = {};
        const connections = [];
        let selectedNode = null;

        // Draw nodes
        for (const node of step.nodes) {
            const nx = NX + node.x * NW;
            const ny = NY + node.y * NH;
            nodePositions[node.id] = { x: nx, y: ny };

            const nodeColor = node.type === "source" ? COLORS.safeGreen
                : node.type === "ground" ? COLORS.textMuted
                : node.type === "output" ? COLORS.dangerOrange
                : COLORS.waterBlue;

            const nodeObj = root.add([
                k.circle(22),
                k.pos(nx, ny),
                k.anchor("center"),
                k.color(...nodeColor),
                k.area(),
                k.outline(2, k.rgb(255, 255, 255)),
            ]);

            root.add([
                k.text(node.label, { size: 10, width: 90 }),
                k.pos(nx, ny + 28),
                k.anchor("center"),
                k.color(...COLORS.textPrimary),
            ]);

            nodeObj.onClick(() => {
                if (selectedNode === null) {
                    selectedNode = node.id;
                    nodeObj.color = k.rgb(...COLORS.xpGold);
                } else if (selectedNode !== node.id) {
                    // Create connection
                    const exists = connections.some(
                        ([a, b]) => (a === selectedNode && b === node.id) || (a === node.id && b === selectedNode)
                    );
                    if (!exists) {
                        connections.push([selectedNode, node.id]);
                        drawWire(nodePositions[selectedNode], nodePositions[node.id]);
                    }
                    selectedNode = null;
                    nodeObj.color = k.rgb(...nodeColor);
                } else {
                    selectedNode = null;
                    nodeObj.color = k.rgb(...nodeColor);
                }
            });
        }

        function drawWire(from, to) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            root.add([
                k.rect(len, 3),
                k.pos(from.x, from.y),
                k.anchor("left"),
                k.color(...COLORS.xpGold),
                k.rotate(Math.atan2(dy, dx) * 180 / Math.PI),
                k.opacity(0.8),
            ]);
        }

        // Submit
        const submitBtn = root.add([
            k.rect(160, 44),
            k.pos(NX + NW + 15, NY + 100),
            k.color(...COLORS.safeGreen),
            k.area(),
            k.outline(2, k.rgb(255, 255, 255)),
        ]);
        submitBtn.add([k.text("SUBMIT", { size: 18 }), k.pos(80, 22), k.anchor("center"), k.color(255, 255, 255)]);
        submitBtn.onClick(() => {
            if (resolveCallback) resolveCallback([...connections]);
            cleanup();
        });

        // Undo button
        const undoBtn = root.add([
            k.rect(100, 34),
            k.pos(NX + NW + 15, NY + 160),
            k.color(...COLORS.dangerOrange),
            k.area(),
        ]);
        undoBtn.add([k.text("UNDO", { size: 14 }), k.pos(50, 17), k.anchor("center"), k.color(255, 255, 255)]);
        undoBtn.onClick(() => {
            connections.pop();
            // Rebuild visual -- just restart
            if (resolveCallback) {
                const cb = resolveCallback;
                cleanup();
                const newPromise = showStep(step);
                newPromise.then((result) => cb(result));
            }
        });
    }

    // ---- SLIDER ----
    function buildSlider(step) {
        const SX = 200;
        const SY = 120;
        const TRACK_W = 450;

        root.add([
            k.rect(520, 60),
            k.pos(SX - 10, SY - 10),
            k.color(...COLORS.bgPanel),
        ]);
        root.add([
            k.text(step.instruction, { size: 14, width: 500 }),
            k.pos(SX, SY),
            k.color(...COLORS.textPrimary),
        ]);

        // Track
        root.add([
            k.rect(TRACK_W, 10),
            k.pos(SX, SY + 90),
            k.color(40, 40, 55),
        ]);

        // Labels along track
        if (step.labels) {
            for (const [val, label] of Object.entries(step.labels)) {
                const frac = (parseFloat(val) - step.min) / (step.max - step.min);
                const lx = SX + frac * TRACK_W;
                root.add([
                    k.text(label, { size: 10 }),
                    k.pos(lx, SY + 108),
                    k.anchor("center"),
                    k.color(...COLORS.textMuted),
                ]);
                root.add([
                    k.rect(1, 16),
                    k.pos(lx, SY + 85),
                    k.color(...COLORS.textMuted),
                    k.opacity(0.5),
                ]);
            }
        }

        // Slider handle
        let currentValue = (step.min + step.max) / 2;
        const handleX = () => SX + ((currentValue - step.min) / (step.max - step.min)) * TRACK_W;

        const handle = root.add([
            k.circle(14),
            k.pos(handleX(), SY + 95),
            k.anchor("center"),
            k.color(...COLORS.accentTeal),
            k.area(),
        ]);

        const valueText = root.add([
            k.text(`${currentValue} ${step.unit || ""}`, { size: 20 }),
            k.pos(SX + TRACK_W / 2, SY + 140),
            k.anchor("center"),
            k.color(...COLORS.xpGold),
        ]);

        // Click on track to move slider
        const trackArea = root.add([
            k.rect(TRACK_W, 30),
            k.pos(SX, SY + 80),
            k.area(),
            k.opacity(0),
        ]);
        trackArea.onClick(() => {
            const mouseX = k.mousePos().x;
            const frac = Math.max(0, Math.min(1, (mouseX - SX) / TRACK_W));
            currentValue = Math.round((step.min + frac * (step.max - step.min)) * 10) / 10;
            handle.pos.x = handleX();
            valueText.text = `${currentValue} ${step.unit || ""}`;
        });

        // Arrow key adjustment
        k.onKeyPress("left", () => {
            const increment = (step.max - step.min) / 100;
            currentValue = Math.max(step.min, currentValue - increment);
            handle.pos.x = handleX();
            valueText.text = `${Math.round(currentValue * 10) / 10} ${step.unit || ""}`;
        });
        k.onKeyPress("right", () => {
            const increment = (step.max - step.min) / 100;
            currentValue = Math.min(step.max, currentValue + increment);
            handle.pos.x = handleX();
            valueText.text = `${Math.round(currentValue * 10) / 10} ${step.unit || ""}`;
        });

        // Submit
        const submitBtn = root.add([
            k.rect(160, 44),
            k.pos(SX + TRACK_W / 2 - 80, SY + 180),
            k.color(...COLORS.safeGreen),
            k.area(),
            k.outline(2, k.rgb(255, 255, 255)),
        ]);
        submitBtn.add([k.text("CONFIRM", { size: 18 }), k.pos(80, 22), k.anchor("center"), k.color(255, 255, 255)]);
        submitBtn.onClick(() => {
            if (resolveCallback) resolveCallback(currentValue);
            cleanup();
        });
    }

    // ---- BEAM PLACEMENT ----
    function buildBeamPlacement(step) {
        const BX = 180;
        const BY = 75;
        const CELL = 48;

        root.add([
            k.rect(520, 40),
            k.pos(BX - 10, BY - 50),
            k.color(...COLORS.bgPanel),
        ]);
        root.add([
            k.text(step.instruction, { size: 12, width: 500 }),
            k.pos(BX, BY - 43),
            k.color(...COLORS.textPrimary),
        ]);

        const gw = step.gridWidth || 8;
        const gh = step.gridHeight || 6;
        const grid = Array.from({ length: gh }, () => Array(gw).fill(0));
        // 0 = empty, 1 = vertical, 2 = diagonal
        let placeMode = 1; // 1=vertical, 2=diagonal

        const cellObjects = [];

        function renderGrid() {
            for (const obj of cellObjects) {
                if (obj.exists()) k.destroy(obj);
            }
            cellObjects.length = 0;

            for (let r = 0; r < gh; r++) {
                for (let c = 0; c < gw; c++) {
                    const cx = BX + c * CELL;
                    const cy = BY + r * CELL;
                    const val = grid[r][c];

                    const cellColor = val === 0 ? [30, 40, 55]
                        : val === 1 ? COLORS.earthLight
                        : COLORS.waterBlue;

                    const cell = root.add([
                        k.rect(CELL - 2, CELL - 2),
                        k.pos(cx, cy),
                        k.color(...cellColor),
                        k.area(),
                        k.outline(1, k.rgb(60, 70, 80)),
                    ]);
                    cellObjects.push(cell);

                    if (val === 1) {
                        const beam = root.add([
                            k.rect(6, CELL - 8),
                            k.pos(cx + CELL / 2 - 3, cy + 4),
                            k.color(...COLORS.earth),
                        ]);
                        cellObjects.push(beam);
                    } else if (val === 2) {
                        const beam = root.add([
                            k.rect(CELL - 8, 6),
                            k.pos(cx + 4, cy + CELL / 2 - 3),
                            k.color(...COLORS.waterBlue),
                            k.rotate(45),
                        ]);
                        cellObjects.push(beam);
                    }

                    cell.onClick(() => {
                        grid[r][c] = grid[r][c] === placeMode ? 0 : placeMode;
                        renderGrid();
                        updateCounts();
                    });
                }
            }
        }

        // Mode toggle
        const modeBtn = root.add([
            k.rect(140, 34),
            k.pos(BX + gw * CELL + 15, BY),
            k.color(...COLORS.bgCard),
            k.area(),
            k.outline(1, k.rgb(...COLORS.earth)),
        ]);
        const modeText = modeBtn.add([
            k.text("Mode: Vertical", { size: 12 }),
            k.pos(10, 9),
            k.color(...COLORS.earthLight),
        ]);
        modeBtn.onClick(() => {
            placeMode = placeMode === 1 ? 2 : 1;
            modeText.text = placeMode === 1 ? "Mode: Vertical" : "Mode: Diagonal";
        });

        // Counts display
        const countText = root.add([
            k.text(`Vertical: 0/${step.requiredVertical}  Diagonal: 0/${step.requiredDiagonal}`, { size: 13 }),
            k.pos(BX + gw * CELL + 15, BY + 45),
            k.color(...COLORS.textPrimary),
        ]);

        function updateCounts() {
            let v = 0;
            let d = 0;
            for (let r = 0; r < gh; r++) {
                for (let c = 0; c < gw; c++) {
                    if (grid[r][c] === 1) v++;
                    if (grid[r][c] === 2) d++;
                }
            }
            countText.text = `Vertical: ${v}/${step.requiredVertical}  Diagonal: ${d}/${step.requiredDiagonal}`;
        }

        renderGrid();

        // Submit
        const submitBtn = root.add([
            k.rect(140, 44),
            k.pos(BX + gw * CELL + 15, BY + 85),
            k.color(...COLORS.safeGreen),
            k.area(),
            k.outline(2, k.rgb(255, 255, 255)),
        ]);
        submitBtn.add([k.text("BUILD", { size: 18 }), k.pos(70, 22), k.anchor("center"), k.color(255, 255, 255)]);
        submitBtn.onClick(() => {
            let v = 0;
            let d = 0;
            for (let r = 0; r < gh; r++) {
                for (let c = 0; c < gw; c++) {
                    if (grid[r][c] === 1) v++;
                    if (grid[r][c] === 2) d++;
                }
            }
            if (resolveCallback) resolveCallback({ vertical: v, diagonal: d });
            cleanup();
        });

        // Clear button
        const clearBtn = root.add([
            k.rect(100, 34),
            k.pos(BX + gw * CELL + 15, BY + 145),
            k.color(...COLORS.dangerOrange),
            k.area(),
        ]);
        clearBtn.add([k.text("CLEAR", { size: 14 }), k.pos(50, 17), k.anchor("center"), k.color(255, 255, 255)]);
        clearBtn.onClick(() => {
            for (let r = 0; r < gh; r++) {
                for (let c = 0; c < gw; c++) {
                    grid[r][c] = 0;
                }
            }
            renderGrid();
            updateCounts();
        });
    }

    return {
        showStep,
        cleanup,
        isActive() {
            return root !== null;
        },
    };
}
