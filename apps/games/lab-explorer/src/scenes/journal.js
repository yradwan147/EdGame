import { COLORS } from "../config/constants.js";
import { EXPERIMENTS } from "../config/experiments.js";

/**
 * Discovery Journal viewer.
 * Two tabs: Discoveries and Disaster Gallery.
 * Shows all found discoveries with descriptions and progress bars.
 */
export function registerJournalScene({ k, progression }) {
    k.scene("journal", () => {
        const profile = progression.getProfile();

        k.add([k.rect(k.width(), k.height()), k.color(...COLORS.labBg)]);

        k.add([
            k.text("Lab Journal", { size: 48 }),
            k.pos(k.width() / 2, 40),
            k.anchor("center"),
            k.color(...COLORS.discoveryGold),
        ]);

        // Tab system
        let activeTab = "discoveries";
        let tabContent = null;

        function clearTabContent() {
            if (tabContent) {
                k.destroy(tabContent);
                tabContent = null;
            }
        }

        // Tab buttons
        const discTabBtn = k.add([
            k.rect(220, 40),
            k.pos(k.width() / 2 - 230, 80),
            k.color(30, 60, 90),
            k.area(),
            k.outline(2, k.rgb(...COLORS.discoveryGold)),
        ]);
        discTabBtn.add([
            k.text("Discoveries", { size: 18 }),
            k.pos(110, 20),
            k.anchor("center"),
            k.color(...COLORS.discoveryGold),
        ]);

        const disasterTabBtn = k.add([
            k.rect(220, 40),
            k.pos(k.width() / 2 + 10, 80),
            k.color(30, 30, 45),
            k.area(),
            k.outline(2, k.rgb(...COLORS.disasterPurple)),
        ]);
        disasterTabBtn.add([
            k.text("Disaster Gallery", { size: 18 }),
            k.pos(110, 20),
            k.anchor("center"),
            k.color(...COLORS.disasterPurple),
        ]);

        discTabBtn.onClick(() => {
            activeTab = "discoveries";
            discTabBtn.color = k.rgb(30, 60, 90);
            disasterTabBtn.color = k.rgb(30, 30, 45);
            showDiscoveries();
        });

        disasterTabBtn.onClick(() => {
            activeTab = "disasters";
            disasterTabBtn.color = k.rgb(50, 30, 60);
            discTabBtn.color = k.rgb(20, 30, 45);
            showDisasters();
        });

        function showDiscoveries() {
            clearTabContent();
            tabContent = k.add([k.pos(0, 0), k.z(100), "tab-content"]);

            // Collect all possible discoveries
            const allDiscoveries = [];
            for (const exp of EXPERIMENTS) {
                for (const disc of exp.discoveries || []) {
                    allDiscoveries.push({
                        ...disc,
                        experimentName: exp.name,
                        experimentId: exp.id,
                        found: profile.discoveriesFound.includes(disc.id),
                    });
                }
            }

            const found = allDiscoveries.filter((d) => d.found).length;
            const total = allDiscoveries.length;

            // Progress bar
            tabContent.add([
                k.rect(600, 20),
                k.pos(k.width() / 2 - 300, 135),
                k.color(30, 40, 55),
            ]);
            tabContent.add([
                k.rect(Math.max(1, (found / Math.max(1, total)) * 600), 20),
                k.pos(k.width() / 2 - 300, 135),
                k.color(...COLORS.discoveryGold),
            ]);
            tabContent.add([
                k.text(`${found} / ${total} Discoveries`, { size: 16 }),
                k.pos(k.width() / 2, 132),
                k.anchor("center"),
                k.color(...COLORS.white),
            ]);

            // Discovery list
            const startY = 170;
            const ROW_H = 70;
            const maxVisible = 7;

            for (let i = 0; i < Math.min(allDiscoveries.length, maxVisible); i++) {
                const d = allDiscoveries[i];
                const y = startY + i * ROW_H;

                tabContent.add([
                    k.rect(900, ROW_H - 8),
                    k.pos(k.width() / 2 - 450, y),
                    k.color(d.found ? 25 : 18, d.found ? 40 : 25, d.found ? 55 : 35),
                    k.outline(1, k.rgb(d.found ? 80 : 40, d.found ? 120 : 50, d.found ? 160 : 70)),
                ]);

                // Name
                tabContent.add([
                    k.text(
                        d.found ? d.name : "??? (Undiscovered)",
                        { size: 17 },
                    ),
                    k.pos(k.width() / 2 - 430, y + 10),
                    k.color(d.found ? 255 : 100, d.found ? 215 : 100, d.found ? 80 : 120),
                ]);

                // Experiment name
                tabContent.add([
                    k.text(`[${d.experimentName}]`, { size: 12 }),
                    k.pos(k.width() / 2 + 300, y + 10),
                    k.color(120, 140, 170),
                ]);

                // Description
                tabContent.add([
                    k.text(
                        d.found ? d.description : "Complete the experiment to discover this!",
                        { size: 13, width: 860 },
                    ),
                    k.pos(k.width() / 2 - 430, y + 32),
                    k.color(d.found ? 170 : 80, d.found ? 185 : 90, d.found ? 210 : 110),
                ]);
            }

            if (allDiscoveries.length > maxVisible) {
                tabContent.add([
                    k.text(`...and ${allDiscoveries.length - maxVisible} more`, { size: 14 }),
                    k.pos(k.width() / 2, startY + maxVisible * ROW_H + 10),
                    k.anchor("center"),
                    k.color(120, 140, 170),
                ]);
            }
        }

        function showDisasters() {
            clearTabContent();
            tabContent = k.add([k.pos(0, 0), k.z(100), "tab-content"]);

            // Collect all possible failures
            const allFailures = [];
            for (const exp of EXPERIMENTS) {
                for (const fail of exp.failureStates || []) {
                    allFailures.push({
                        ...fail,
                        experimentName: exp.name,
                        experimentId: exp.id,
                        triggered: profile.failuresTriggered.includes(fail.id),
                    });
                }
            }

            const triggered = allFailures.filter((f) => f.triggered).length;
            const total = allFailures.length;

            // Progress bar
            tabContent.add([
                k.rect(600, 20),
                k.pos(k.width() / 2 - 300, 135),
                k.color(30, 40, 55),
            ]);
            tabContent.add([
                k.rect(Math.max(1, (triggered / Math.max(1, total)) * 600), 20),
                k.pos(k.width() / 2 - 300, 135),
                k.color(...COLORS.disasterPurple),
            ]);
            tabContent.add([
                k.text(`${triggered} / ${total} Disasters Collected`, { size: 16 }),
                k.pos(k.width() / 2, 132),
                k.anchor("center"),
                k.color(...COLORS.white),
            ]);

            // Disaster list
            const startY = 170;
            const ROW_H = 80;
            const maxVisible = 6;

            for (let i = 0; i < Math.min(allFailures.length, maxVisible); i++) {
                const f = allFailures[i];
                const y = startY + i * ROW_H;

                tabContent.add([
                    k.rect(900, ROW_H - 8),
                    k.pos(k.width() / 2 - 450, y),
                    k.color(f.triggered ? 35 : 18, f.triggered ? 20 : 20, f.triggered ? 30 : 30),
                    k.outline(1, k.rgb(f.triggered ? 180 : 50, f.triggered ? 60 : 50, f.triggered ? 180 : 60)),
                ]);

                tabContent.add([
                    k.text(
                        f.triggered ? `${f.id.replace(/_/g, " ").toUpperCase()}` : "??? (Unknown Disaster)",
                        { size: 17 },
                    ),
                    k.pos(k.width() / 2 - 430, y + 10),
                    k.color(f.triggered ? 220 : 100, f.triggered ? 80 : 100, f.triggered ? 200 : 120),
                ]);

                tabContent.add([
                    k.text(`[${f.experimentName}]`, { size: 12 }),
                    k.pos(k.width() / 2 + 300, y + 10),
                    k.color(120, 140, 170),
                ]);

                tabContent.add([
                    k.text(
                        f.triggered ? f.description : "Something spectacular happens here...",
                        { size: 13, width: 860 },
                    ),
                    k.pos(k.width() / 2 - 430, y + 34),
                    k.color(f.triggered ? 180 : 80, f.triggered ? 160 : 80, f.triggered ? 200 : 100),
                ]);
            }
        }

        // Initial view
        showDiscoveries();

        // Back button
        const backBtn = k.add([
            k.rect(160, 44),
            k.pos(30, k.height() - 65),
            k.color(40, 30, 30),
            k.area(),
            k.outline(2, k.rgb(180, 140, 140)),
        ]);
        backBtn.add([
            k.text("Back to Menu", { size: 18 }),
            k.pos(80, 22),
            k.anchor("center"),
            k.color(200, 170, 170),
        ]);
        backBtn.onClick(() => k.go("menu"));

        k.onKeyPress("escape", () => k.go("menu"));
    });
}
