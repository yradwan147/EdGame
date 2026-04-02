import { COLORS } from "../config/constants.js";

/**
 * Variable slider controls for experiment configuration.
 * Each variable gets a horizontal slider with label, value display, and unit.
 * For discrete option variables (like material), renders radio-style buttons.
 */
export function createVariableControls(k, {
    variables,
    initialValues,
    onValueChanged,
}) {
    const panelRoot = k.add([k.pos(0, 0), k.z(500), "variable-controls"]);
    const sliderRefs = {};
    const currentValues = { ...initialValues };

    const PANEL_X = 40;
    const PANEL_Y = 110;
    const SLIDER_W = 500;
    const ROW_H = 85;

    // Background panel
    panelRoot.add([
        k.rect(580, variables.length * ROW_H + 60),
        k.pos(PANEL_X - 15, PANEL_Y - 30),
        k.color(18, 30, 52),
        k.opacity(0.92),
        k.outline(2, k.rgb(40, 70, 110)),
    ]);

    panelRoot.add([
        k.text("Experiment Variables", { size: 20 }),
        k.pos(PANEL_X, PANEL_Y - 22),
        k.color(...COLORS.accent),
    ]);

    for (let vi = 0; vi < variables.length; vi++) {
        const v = variables[vi];
        const y = PANEL_Y + vi * ROW_H + 20;

        // Label
        panelRoot.add([
            k.text(`${v.label} (${v.unit || "value"})`, { size: 16 }),
            k.pos(PANEL_X, y),
            k.color(180, 200, 230),
        ]);

        if (v.options) {
            // Discrete options (radio buttons)
            const optBtns = [];
            for (let oi = 0; oi < v.options.length; oi++) {
                const ox = PANEL_X + oi * 130;
                const oy = y + 24;
                const isSelected = currentValues[v.name] === oi;

                const btn = panelRoot.add([
                    k.rect(120, 32),
                    k.pos(ox, oy),
                    k.color(isSelected ? 40 : 25, isSelected ? 100 : 45, isSelected ? 130 : 70),
                    k.area(),
                    k.outline(2, k.rgb(isSelected ? 90 : 50, isSelected ? 220 : 80, isSelected ? 255 : 120)),
                ]);
                btn.add([
                    k.text(v.optionLabels ? v.optionLabels[oi] : v.options[oi], { size: 13, width: 110 }),
                    k.pos(60, 16),
                    k.anchor("center"),
                    k.color(220, 235, 255),
                ]);

                const optIndex = oi;
                btn.onClick(() => {
                    currentValues[v.name] = optIndex;
                    // Update button visuals
                    for (let bi = 0; bi < optBtns.length; bi++) {
                        const sel = bi === optIndex;
                        optBtns[bi].color = k.rgb(sel ? 40 : 25, sel ? 100 : 45, sel ? 130 : 70);
                    }
                    if (typeof onValueChanged === "function") {
                        onValueChanged(v.name, optIndex, { ...currentValues });
                    }
                });

                optBtns.push(btn);
            }

            sliderRefs[v.name] = { type: "options", btns: optBtns };
        } else {
            // Continuous slider
            const sliderTrackY = y + 30;

            // Track background
            panelRoot.add([
                k.rect(SLIDER_W, 8),
                k.pos(PANEL_X, sliderTrackY),
                k.color(40, 55, 80),
            ]);

            // Filled portion
            const ratio = (currentValues[v.name] - v.min) / Math.max(1, v.max - v.min);
            const fill = panelRoot.add([
                k.rect(SLIDER_W * ratio, 8),
                k.pos(PANEL_X, sliderTrackY),
                k.color(...COLORS.accent),
            ]);

            // Thumb
            const thumbX = PANEL_X + SLIDER_W * ratio;
            const thumb = panelRoot.add([
                k.circle(12),
                k.pos(thumbX, sliderTrackY + 4),
                k.anchor("center"),
                k.color(...COLORS.accentBright),
                k.area(),
                k.z(502),
            ]);

            // Value display
            const valueText = panelRoot.add([
                k.text(`${currentValues[v.name]} ${v.unit}`, { size: 18 }),
                k.pos(PANEL_X + SLIDER_W + 20, sliderTrackY - 4),
                k.color(...COLORS.white),
            ]);

            // Min / Max labels
            panelRoot.add([
                k.text(`${v.min}`, { size: 12 }),
                k.pos(PANEL_X, sliderTrackY + 14),
                k.color(120, 140, 170),
            ]);
            panelRoot.add([
                k.text(`${v.max}`, { size: 12 }),
                k.pos(PANEL_X + SLIDER_W - 10, sliderTrackY + 14),
                k.color(120, 140, 170),
            ]);

            // Click-to-set on the track area (approximate dragging)
            const trackHitbox = panelRoot.add([
                k.rect(SLIDER_W + 24, 30),
                k.pos(PANEL_X - 12, sliderTrackY - 11),
                k.area(),
                k.opacity(0),
                k.z(501),
            ]);

            function updateSlider(mouseX) {
                const relX = mouseX - PANEL_X;
                const clamped = Math.max(0, Math.min(SLIDER_W, relX));
                const rawRatio = clamped / SLIDER_W;
                const range = v.max - v.min;
                const steps = Math.round((rawRatio * range) / v.step);
                const newValue = v.min + steps * v.step;
                const clampedValue = Math.max(v.min, Math.min(v.max, newValue));

                currentValues[v.name] = clampedValue;

                const newRatio = (clampedValue - v.min) / Math.max(1, range);
                fill.width = SLIDER_W * newRatio;
                thumb.pos.x = PANEL_X + SLIDER_W * newRatio;
                valueText.text = `${clampedValue} ${v.unit}`;

                if (typeof onValueChanged === "function") {
                    onValueChanged(v.name, clampedValue, { ...currentValues });
                }
            }

            trackHitbox.onClick(() => {
                const mp = k.mousePos();
                updateSlider(mp.x);
            });

            // Drag support: update while mouse is down on thumb
            let dragging = false;
            thumb.onClick(() => { dragging = true; });
            const cancelUpdate = k.onUpdate(() => {
                if (dragging && k.isMouseDown()) {
                    const mp = k.mousePos();
                    updateSlider(mp.x);
                } else {
                    dragging = false;
                }
            });

            sliderRefs[v.name] = { fill, thumb, valueText, trackHitbox, cancelUpdate };
        }
    }

    // Reset button
    const resetBtn = panelRoot.add([
        k.rect(130, 36),
        k.pos(PANEL_X, PANEL_Y + variables.length * ROW_H + 10),
        k.color(60, 40, 40),
        k.area(),
        k.outline(2, k.rgb(255, 120, 100)),
    ]);
    resetBtn.add([
        k.text("Reset All", { size: 16 }),
        k.pos(65, 18),
        k.anchor("center"),
        k.color(255, 180, 170),
    ]);
    resetBtn.onClick(() => {
        for (const v of variables) {
            currentValues[v.name] = initialValues[v.name] ?? v.defaultValue;
        }
        // Re-render would be complex; simple approach: reload
        if (typeof onValueChanged === "function") {
            for (const v of variables) {
                onValueChanged(v.name, currentValues[v.name], { ...currentValues });
            }
        }
    });

    return {
        getValues() {
            return { ...currentValues };
        },
        destroy() {
            // Cleanup cancel fns
            for (const ref of Object.values(sliderRefs)) {
                if (ref.cancelUpdate) ref.cancelUpdate();
            }
            k.destroy(panelRoot);
        },
    };
}
