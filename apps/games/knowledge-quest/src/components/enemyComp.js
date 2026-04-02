import { COLORS } from "../config/constants.js";

/**
 * Visual representation of an enemy in combat.
 *
 * Draws a styled shape with per-type personality animations:
 *   Imp:     small red circle, bounces, argument text bubbles
 *   Crawler: orange oval, wiggles, confusion swirls
 *   Shade:   purple translucent shape, whisper text fades
 *   Giant:   large gray rectangle, sleeps (z's), head droops
 *   Boss:    large pink diamond, crown, riddle text
 */
export function createEnemyComp(k, { enemyData }) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);

    /* mutable state */
    let hp = enemyData.currentHp;
    let maxHp = enemyData.maxHp;
    let isAlive = hp > 0;
    let statusEffects = [...(enemyData.statusEffects || [])];
    let behaviorState = { idleTurns: enemyData.idleTurns || 0, isAsleep: enemyData.isAsleep || false };

    /* root game object -- caller should position this */
    const root = k.add([
        k.pos(0, 0),
        k.fixed(),
        k.z(8200),
        "enemy-comp",
    ]);

    const cancelFns = [];

    /* ---- resolve sprite color from COLORS map ---- */
    const spriteColorKey = enemyData.spriteColor;
    const spriteColor = COLORS[spriteColorKey] || COLORS.primary;

    /* ---- determine enemy "type" from id ---- */
    const id = enemyData.id;
    const isImp = id.includes("imp");
    const isCrawler = id.includes("crawler");
    const isShade = id.includes("shade");
    const isGiant = id.includes("giant");
    const isBoss = id.includes("boss") || id.includes("riddler");

    /* ---- draw body based on type ---- */
    let body;

    if (isImp) {
        /* small red circle */
        body = root.add([
            k.circle(22),
            k.pos(0, 0),
            k.anchor("center"),
            k.color(...spriteColor),
            k.outline(2, rgb([255, 120, 120])),
        ]);
        /* eyes */
        root.add([k.circle(3), k.pos(-7, -6), k.anchor("center"), k.color(255, 255, 255)]);
        root.add([k.circle(3), k.pos(7, -6), k.anchor("center"), k.color(255, 255, 255)]);

        /* bounce animation */
        let bt = k.rand(0, Math.PI * 2);
        const bounceUpd = k.onUpdate(() => {
            bt += k.dt() * 5;
            body.pos.y = Math.sin(bt) * 4;
        });
        cancelFns.push(bounceUpd);

        /* argument text bubbles (periodic) */
        let argTimer = 0;
        const argTexts = ["Wrong!", "Nah!", "Give up!", "Ha!", "No way!"];
        const argUpd = k.onUpdate(() => {
            if (!isAlive) return;
            argTimer += k.dt();
            if (argTimer > 2.5) {
                argTimer = 0;
                const txt = argTexts[Math.floor(k.rand(0, argTexts.length))];
                const bubble = root.add([
                    k.text(txt, { size: 11 }),
                    k.pos(k.rand(-30, 30), -32),
                    k.anchor("center"),
                    k.color(255, 200, 200),
                    k.opacity(1),
                ]);
                let lt = 0;
                bubble.onUpdate(() => {
                    lt += k.dt();
                    bubble.pos.y -= 20 * k.dt();
                    bubble.opacity = 1 - lt / 1.2;
                    if (lt >= 1.2) k.destroy(bubble);
                });
            }
        });
        cancelFns.push(argUpd);
    } else if (isCrawler) {
        /* orange oval (wide rect rounded via outline trick) */
        body = root.add([
            k.rect(50, 28),
            k.pos(-25, -14),
            k.color(...spriteColor),
            k.outline(2, rgb([220, 160, 80])),
        ]);
        /* legs (small rects) */
        for (let i = 0; i < 4; i++) {
            root.add([
                k.rect(4, 10),
                k.pos(-20 + i * 14, 14),
                k.color(...spriteColor),
            ]);
        }

        /* wiggle */
        let wt = 0;
        const wigUpd = k.onUpdate(() => {
            wt += k.dt() * 4;
            body.pos.x = -25 + Math.sin(wt) * 3;
        });
        cancelFns.push(wigUpd);

        /* confusion swirls */
        let swirlTimer = 0;
        const swirlUpd = k.onUpdate(() => {
            if (!isAlive) return;
            swirlTimer += k.dt();
            if (swirlTimer > 1.8) {
                swirlTimer = 0;
                const sw = root.add([
                    k.text("~", { size: 16 }),
                    k.pos(k.rand(-15, 15), -24),
                    k.anchor("center"),
                    k.color(255, 220, 120),
                    k.opacity(1),
                ]);
                let lt = 0;
                sw.onUpdate(() => {
                    lt += k.dt();
                    sw.pos.y -= 15 * k.dt();
                    sw.pos.x += Math.sin(lt * 6) * 20 * k.dt();
                    sw.opacity = 1 - lt / 1.0;
                    if (lt >= 1.0) k.destroy(sw);
                });
            }
        });
        cancelFns.push(swirlUpd);
    } else if (isShade) {
        /* purple translucent shape */
        body = root.add([
            k.rect(36, 52),
            k.pos(-18, -26),
            k.color(...spriteColor),
            k.opacity(0.55),
            k.outline(2, rgb([160, 100, 220])),
        ]);

        /* fade pulse */
        let ft = 0;
        const fadeUpd = k.onUpdate(() => {
            ft += k.dt() * 2;
            body.opacity = 0.35 + Math.sin(ft) * 0.2;
        });
        cancelFns.push(fadeUpd);

        /* whisper text that fades in/out */
        let whisperTimer = 0;
        const whisperTexts = ["...doubt...", "...fail...", "...unsure...", "...weak..."];
        const whisperUpd = k.onUpdate(() => {
            if (!isAlive) return;
            whisperTimer += k.dt();
            if (whisperTimer > 2.0) {
                whisperTimer = 0;
                const txt = whisperTexts[Math.floor(k.rand(0, whisperTexts.length))];
                const wh = root.add([
                    k.text(txt, { size: 10 }),
                    k.pos(k.rand(-40, 40), k.rand(-40, 10)),
                    k.anchor("center"),
                    k.color(200, 160, 255),
                    k.opacity(0),
                ]);
                let lt = 0;
                wh.onUpdate(() => {
                    lt += k.dt();
                    if (lt < 0.5) wh.opacity = lt / 0.5;
                    else wh.opacity = 1 - (lt - 0.5) / 1.0;
                    if (lt >= 1.5) k.destroy(wh);
                });
            }
        });
        cancelFns.push(whisperUpd);
    } else if (isGiant) {
        /* large gray rectangle */
        body = root.add([
            k.rect(60, 80),
            k.pos(-30, -40),
            k.color(...spriteColor),
            k.outline(2, rgb([120, 120, 140])),
        ]);
        /* eyes */
        const leftEye = root.add([
            k.rect(8, 6),
            k.pos(-14, -20),
            k.color(40, 40, 60),
        ]);
        const rightEye = root.add([
            k.rect(8, 6),
            k.pos(6, -20),
            k.color(40, 40, 60),
        ]);

        /* sleep z's and head droop when asleep */
        let zzTimer = 0;
        const zzUpd = k.onUpdate(() => {
            if (!isAlive) return;
            if (behaviorState.isAsleep) {
                /* head droop */
                body.pos.y = -40 + 4;
                /* z's */
                zzTimer += k.dt();
                if (zzTimer > 0.8) {
                    zzTimer = 0;
                    const zz = root.add([
                        k.text("z", { size: 14 }),
                        k.pos(k.rand(-10, 20), -50),
                        k.anchor("center"),
                        k.color(180, 180, 220),
                        k.opacity(1),
                    ]);
                    let lt = 0;
                    zz.onUpdate(() => {
                        lt += k.dt();
                        zz.pos.y -= 25 * k.dt();
                        zz.pos.x += Math.sin(lt * 3) * 10 * k.dt();
                        zz.opacity = 1 - lt / 1.5;
                        if (lt >= 1.5) k.destroy(zz);
                    });
                }
                /* close eyes */
                leftEye.height = 2;
                rightEye.height = 2;
            } else {
                body.pos.y = -40;
                leftEye.height = 6;
                rightEye.height = 6;
            }
        });
        cancelFns.push(zzUpd);
    } else if (isBoss) {
        /* large pink diamond (rotated rect) */
        body = root.add([
            k.rect(56, 56),
            k.pos(0, 0),
            k.anchor("center"),
            k.color(...spriteColor),
            k.outline(3, rgb([255, 120, 220])),
            k.rotate(45),
        ]);
        /* crown icon */
        root.add([
            k.text("W", { size: 20 }),
            k.pos(0, -48),
            k.anchor("center"),
            k.color(255, 215, 0),
        ]);

        /* riddle text appears periodically */
        let riddleTimer = 0;
        const riddleTexts = [
            "What am I...?",
            "Think harder...",
            "Solve this!",
            "Can you see?",
        ];
        const riddleUpd = k.onUpdate(() => {
            if (!isAlive) return;
            riddleTimer += k.dt();
            if (riddleTimer > 3.0) {
                riddleTimer = 0;
                const txt = riddleTexts[Math.floor(k.rand(0, riddleTexts.length))];
                const rd = root.add([
                    k.text(txt, { size: 12 }),
                    k.pos(k.rand(-50, 50), -60),
                    k.anchor("center"),
                    k.color(255, 180, 220),
                    k.opacity(1),
                ]);
                let lt = 0;
                rd.onUpdate(() => {
                    lt += k.dt();
                    rd.pos.y -= 15 * k.dt();
                    rd.opacity = 1 - lt / 2.0;
                    if (lt >= 2.0) k.destroy(rd);
                });
            }
        });
        cancelFns.push(riddleUpd);
    } else {
        /* generic fallback */
        body = root.add([
            k.rect(40, 40),
            k.pos(-20, -20),
            k.color(...spriteColor),
            k.outline(2, rgb(COLORS.panelBorder)),
        ]);
    }

    /* ---- methods ---- */

    function takeDamage(amount) {
        hp = Math.max(0, hp - amount);
        if (hp <= 0) isAlive = false;

        /* flash white */
        if (body) {
            const origColor = body.color;
            body.color = k.rgb(255, 255, 255);
            k.wait(0.1, () => {
                if (body) body.color = origColor;
            });
        }
    }

    function applyStatus(effect) {
        statusEffects.push(effect);
    }

    function removeStatus(effectType) {
        statusEffects = statusEffects.filter((e) => e.type !== effectType);
    }

    function playDeathAnimation() {
        isAlive = false;
        /* flash, shrink, then destroy */
        if (body) {
            let dt2 = 0;
            const deathUpd = k.onUpdate(() => {
                dt2 += k.dt();
                root.opacity = 1 - dt2 / 0.6;
                if (body.scale) {
                    body.scale = k.vec2(1 - dt2 * 1.2, 1 - dt2 * 1.2);
                }
                if (dt2 >= 0.6) {
                    deathUpd.cancel();
                    destroy();
                }
            });
            cancelFns.push(deathUpd);
        } else {
            destroy();
        }
    }

    function setPosition(x, y) {
        root.pos.x = x;
        root.pos.y = y;
    }

    function setSleepState(asleep) {
        behaviorState.isAsleep = asleep;
    }

    function destroy() {
        for (const c of cancelFns) {
            if (typeof c === "function") c();
            if (c && typeof c.cancel === "function") c.cancel();
        }
        cancelFns.length = 0;
        k.destroy(root);
    }

    return {
        root,
        get hp() { return hp; },
        set hp(v) { hp = v; },
        get maxHp() { return maxHp; },
        get isAlive() { return isAlive; },
        get statusEffects() { return statusEffects; },
        get behaviorState() { return behaviorState; },
        takeDamage,
        applyStatus,
        removeStatus,
        playDeathAnimation,
        setPosition,
        setSleepState,
        destroy,
    };
}
