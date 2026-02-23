export function playerComp(config) {
    return {
        id: "playerComp",
        require: ["pos"],
        actorId: config.actorId,
        roleId: config.roleId,
        teamId: config.teamId,
        displayName: config.displayName,
        maxHp: config.maxHp,
        hp: config.maxHp,
        speed: config.speed,
        currentAnim: "idle",
        facingLeft: false,
        shieldUntil: 0,
        cooldowns: {},
        isAlive: true,
        isPlayerControlled: true,
        questionStats: {
            total: 0,
            correct: 0,
            recent: [],
        },

        setAnimation(animName) {
            if (this.currentAnim === animName) return;
            this.currentAnim = animName;
            const spriteName = `${config.spritePrefix}_${animName}`;
            try {
                // In this project Kaplay runs with global:false, so use the injected k instance.
                const nextSprite = config.k?.sprite?.(spriteName);
                if (!nextSprite) return;
                if (this.sprite) {
                    this.unuse("sprite");
                }
                this.use(nextSprite);
                if (typeof this.play === "function") {
                    this.play(animName);
                }
            } catch {
                // Fallback for when sprite sheets are unavailable.
            }
        },

        performAction(actionId, targetId) {
            return {
                actorId: this.actorId,
                actionId,
                targetId,
                teamId: this.teamId,
                roleId: this.roleId,
                startedAt: Date.now(),
            };
        },

        receiveEffect(effect) {
            if (!this.isAlive) return;
            if (effect.type === "damage") {
                const shieldActive = this.shieldUntil > Date.now();
                const multiplier = shieldActive ? (1 - (effect.shieldReduction ?? 0.35)) : 1;
                this.hp = Math.max(0, this.hp - Math.round(effect.amount * multiplier));
                if (this.hp <= 0) {
                    this.isAlive = false;
                    this.setAnimation("death");
                } else {
                    this.setAnimation("hurt");
                }
            }
            if (effect.type === "heal") {
                this.hp = Math.min(this.maxHp, this.hp + Math.round(effect.amount));
            }
            if (effect.type === "shield") {
                this.shieldUntil = Date.now() + effect.durationMs;
            }
        },

        applyQuestionResult(correct) {
            this.questionStats.total += 1;
            if (correct) this.questionStats.correct += 1;
            this.questionStats.recent.push(correct ? 1 : 0);
            if (this.questionStats.recent.length > 20) {
                this.questionStats.recent.shift();
            }
        },

        getState() {
            return {
                id: this.actorId,
                roleId: this.roleId,
                teamId: this.teamId,
                hp: this.hp,
                maxHp: this.maxHp,
                isAlive: this.isAlive,
                cooldowns: { ...this.cooldowns },
                questionStats: { ...this.questionStats },
            };
        },
    };
}
