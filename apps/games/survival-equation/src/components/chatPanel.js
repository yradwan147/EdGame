import { COLORS } from "../config/constants.js";
import { ROLE_CONFIG } from "../config/roles.js";

/**
 * Chat panel: message history with role-colored sender names,
 * quick-prompt buttons, and a text input area.
 */
export function createChatPanel(k, { onSendMessage }) {
    const PANEL_X = 0;
    const PANEL_Y = 520;
    const PANEL_W = 780;
    const PANEL_H = 200;
    const MSG_AREA_H = 130;
    const INPUT_H = 35;
    const MAX_VISIBLE = 7;

    let root = null;
    let messageObjects = [];
    let displayedMessages = [];
    let quickPromptRow = null;
    let inputActive = false;
    let inputText = "";
    let inputTextObj = null;
    let cursorObj = null;

    const quickPrompts = [
        { label: "What do we know?", text: "What information do we have about this puzzle?" },
        { label: "Is this safe?", text: "Kit, is this plan safe for the team?" },
        { label: "Check materials", text: "Raza, what materials do we have available?" },
        { label: "What's the math?", text: "Juno, can you calculate that for us?" },
        { label: "Check surroundings", text: "Navi, what does the terrain look like?" },
    ];

    function init() {
        root = k.add([k.pos(0, 0), k.fixed(), k.z(1100)]);

        // Panel background
        root.add([
            k.rect(PANEL_W, PANEL_H),
            k.pos(PANEL_X, PANEL_Y),
            k.color(...COLORS.bgPanel),
            k.opacity(0.93),
        ]);

        // Panel border
        root.add([
            k.rect(PANEL_W, 2),
            k.pos(PANEL_X, PANEL_Y),
            k.color(...COLORS.earth),
        ]);

        // "Team Chat" label
        root.add([
            k.text("Team Chat", { size: 13 }),
            k.pos(PANEL_X + 10, PANEL_Y + 4),
            k.color(...COLORS.earthLight),
        ]);

        // Quick prompts row
        quickPromptRow = root.add([k.pos(PANEL_X + 10, PANEL_Y + PANEL_H - 32)]);
        let px = 0;
        for (const qp of quickPrompts) {
            const btnW = k.formatText({ text: qp.label, size: 11 }).width + 16;
            const btn = quickPromptRow.add([
                k.rect(btnW, 22),
                k.pos(px, 0),
                k.color(...COLORS.bgCard),
                k.area(),
                k.outline(1, k.rgb(...COLORS.earth)),
            ]);
            btn.add([
                k.text(qp.label, { size: 11 }),
                k.pos(8, 5),
                k.color(...COLORS.textSecondary),
            ]);
            btn.onClick(() => {
                if (onSendMessage) onSendMessage(qp.text);
            });
            px += btnW + 6;
        }

        // Input area background
        root.add([
            k.rect(PANEL_W - 20, INPUT_H),
            k.pos(PANEL_X + 10, PANEL_Y + PANEL_H - 62),
            k.color(14, 24, 38),
            k.outline(1, k.rgb(...COLORS.earth)),
        ]);

        // Input prompt
        root.add([
            k.text(">", { size: 14 }),
            k.pos(PANEL_X + 16, PANEL_Y + PANEL_H - 54),
            k.color(...COLORS.accentTeal),
        ]);

        // Input text display
        inputTextObj = root.add([
            k.text("Type a message or use quick prompts below...", { size: 13, width: PANEL_W - 60 }),
            k.pos(PANEL_X + 30, PANEL_Y + PANEL_H - 52),
            k.color(...COLORS.textMuted),
        ]);

        // Cursor blink
        cursorObj = root.add([
            k.rect(2, 16),
            k.pos(PANEL_X + 30, PANEL_Y + PANEL_H - 52),
            k.color(...COLORS.accentTeal),
            k.opacity(0),
        ]);

        // Handle text input
        k.onCharInput((ch) => {
            inputText += ch;
            updateInputDisplay();
        });

        k.onKeyPress("backspace", () => {
            inputText = inputText.slice(0, -1);
            updateInputDisplay();
        });

        k.onKeyPress("enter", () => {
            if (inputText.trim().length > 0) {
                if (onSendMessage) onSendMessage(inputText.trim());
                inputText = "";
                updateInputDisplay();
            }
        });
    }

    function updateInputDisplay() {
        if (!inputTextObj) return;
        if (inputText.length > 0) {
            inputTextObj.text = inputText;
            inputTextObj.color = k.rgb(...COLORS.textPrimary);
            cursorObj.opacity = 1;
            const textW = k.formatText({ text: inputText, size: 13 }).width;
            cursorObj.pos.x = PANEL_X + 30 + Math.min(textW, PANEL_W - 70);
        } else {
            inputTextObj.text = "Type a message or use quick prompts below...";
            inputTextObj.color = k.rgb(...COLORS.textMuted);
            cursorObj.opacity = 0;
        }
    }

    function addMessage(sender, text, roleId = null) {
        const color = roleId && ROLE_CONFIG[roleId] ? ROLE_CONFIG[roleId].color : COLORS.textPrimary;
        const senderName = roleId && ROLE_CONFIG[roleId] ? ROLE_CONFIG[roleId].name : sender;

        displayedMessages.push({ senderName, text, color, roleId });
        renderMessages();
    }

    function addPlayerMessage(text) {
        displayedMessages.push({ senderName: "You", text, color: COLORS.accentTeal, roleId: "player" });
        renderMessages();
    }

    function addSystemMessage(text) {
        displayedMessages.push({ senderName: "SYSTEM", text, color: COLORS.dangerOrange, roleId: "system" });
        renderMessages();
    }

    function renderMessages() {
        // Clear old message objects
        for (const obj of messageObjects) {
            if (obj.exists()) k.destroy(obj);
        }
        messageObjects = [];

        const visible = displayedMessages.slice(-MAX_VISIBLE);
        const startY = PANEL_Y + 20;

        for (let i = 0; i < visible.length; i++) {
            const msg = visible[i];
            const y = startY + i * 15;

            const senderObj = root.add([
                k.text(`${msg.senderName}: `, { size: 12 }),
                k.pos(PANEL_X + 10, y),
                k.color(...msg.color),
            ]);
            messageObjects.push(senderObj);

            const senderW = k.formatText({ text: `${msg.senderName}: `, size: 12 }).width;
            const msgText = msg.text.length > 80 ? msg.text.slice(0, 77) + "..." : msg.text;
            const textObj = root.add([
                k.text(msgText, { size: 12, width: PANEL_W - 30 - senderW }),
                k.pos(PANEL_X + 10 + senderW, y),
                k.color(...COLORS.textPrimary),
            ]);
            messageObjects.push(textObj);
        }
    }

    function clearMessages() {
        displayedMessages = [];
        for (const obj of messageObjects) {
            if (obj.exists()) k.destroy(obj);
        }
        messageObjects = [];
    }

    return {
        init,
        addMessage,
        addPlayerMessage,
        addSystemMessage,
        clearMessages,
        getDisplayedMessages() {
            return [...displayedMessages];
        },
    };
}
