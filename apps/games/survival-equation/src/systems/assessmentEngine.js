/**
 * Assessment Engine for Survival Equation.
 * Multi-dimensional assessment following the EdGame assessment framework.
 *
 * D1: Knowledge Accuracy (question correctness)
 * D2: Task Completion (puzzles solved, scenario progress)
 * D3: Strategic Thinking (resource allocation, puzzle approach)
 * D4: Communication & Collaboration (PRIMARY) (message quality, info sharing, team equity)
 * D5: Empathy & Values (resource sharing, patience, helping AI partners)
 * D6: Growth & Adaptation (collaboration quality trend over the scenario)
 */

export function createAssessmentEngine() {
    return {
        /**
         * Build the full assessment report from game state.
         */
        buildAssessment(gameState, communicationStats, resourceHistory, puzzleResults) {
            const d1 = this.assessKnowledge(gameState);
            const d2 = this.assessCompletion(gameState, puzzleResults);
            const d3 = this.assessStrategy(gameState, resourceHistory);
            const d4 = this.assessCollaboration(gameState, communicationStats);
            const d5 = this.assessEmpathy(gameState, resourceHistory);
            const d6 = this.assessGrowth(gameState, communicationStats);

            const overallScore = (
                d1.score * 0.10 +
                d2.score * 0.15 +
                d3.score * 0.15 +
                d4.score * 0.30 +
                d5.score * 0.15 +
                d6.score * 0.15
            );

            return {
                overall: {
                    score: Math.round(overallScore * 100) / 100,
                    grade: this._scoreToGrade(overallScore),
                    label: this._scoreToLabel(overallScore),
                },
                dimensions: { d1, d2, d3, d4, d5, d6 },
                strengths: this._identifyStrengths({ d1, d2, d3, d4, d5, d6 }),
                growthAreas: this._identifyGrowthAreas({ d1, d2, d3, d4, d5, d6 }),
            };
        },

        /**
         * D1: Knowledge Accuracy
         */
        assessKnowledge(gameState) {
            const questions = gameState.questionsAnswered || [];
            if (questions.length === 0) {
                return { score: 0.5, label: "Knowledge", details: { accuracy: 0, questionsAnswered: 0, avgDifficulty: 0 } };
            }
            const correct = questions.filter((q) => q.correct).length;
            const accuracy = correct / questions.length;
            const avgDifficulty = questions.reduce((s, q) => s + (q.difficulty || 1), 0) / questions.length;
            const score = accuracy * (0.7 + avgDifficulty * 0.06); // higher difficulty boosts score

            return {
                score: Math.min(1, score),
                label: "Knowledge Accuracy",
                details: {
                    accuracy: Math.round(accuracy * 100),
                    questionsAnswered: questions.length,
                    correctCount: correct,
                    avgDifficulty: Math.round(avgDifficulty * 10) / 10,
                },
            };
        },

        /**
         * D2: Task Completion
         */
        assessCompletion(gameState, puzzleResults) {
            const totalPuzzles = gameState.totalDays || 5;
            const completed = (puzzleResults || gameState.puzzlesCompleted || []).length;
            const completionRate = completed / totalPuzzles;

            const avgPuzzleScore = completed > 0
                ? (puzzleResults || gameState.puzzlesCompleted || []).reduce((s, p) => s + (p.score || 0), 0) / completed
                : 0;

            const daysSurvived = gameState.currentDay || 0;
            const survivalRate = daysSurvived / totalPuzzles;

            const score = completionRate * 0.5 + avgPuzzleScore * 0.3 + survivalRate * 0.2;

            return {
                score: Math.min(1, score),
                label: "Task Completion",
                details: {
                    puzzlesCompleted: completed,
                    totalPuzzles,
                    avgPuzzleScore: Math.round(avgPuzzleScore * 100),
                    daysSurvived,
                    completionRate: Math.round(completionRate * 100),
                },
            };
        },

        /**
         * D3: Strategic Thinking
         */
        assessStrategy(gameState, resourceHistory) {
            const resources = gameState.resources || { food: 0, water: 0, materials: 0 };
            const totalRemaining = resources.food + resources.water + resources.materials;
            const startTotal = (gameState.scenarioData?.startResources)
                ? gameState.scenarioData.startResources.food + gameState.scenarioData.startResources.water + gameState.scenarioData.startResources.materials
                : 150;

            const resourceEfficiency = Math.min(1, totalRemaining / (startTotal * 0.5)); // 50% remaining = perfect
            const balanceScore = this._resourceBalance(resources);

            // Puzzle approach: did they solve systematically or brute-force?
            const puzzles = gameState.puzzlesCompleted || [];
            const avgFirstAttemptScore = puzzles.length > 0
                ? puzzles.reduce((s, p) => s + (p.score || 0), 0) / puzzles.length
                : 0.5;

            const score = resourceEfficiency * 0.35 + balanceScore * 0.30 + avgFirstAttemptScore * 0.35;

            return {
                score: Math.min(1, score),
                label: "Strategic Thinking",
                details: {
                    resourceEfficiency: Math.round(resourceEfficiency * 100),
                    resourceBalance: Math.round(balanceScore * 100),
                    firstAttemptAccuracy: Math.round(avgFirstAttemptScore * 100),
                    remainingResources: { ...resources },
                },
            };
        },

        /**
         * D4: Communication & Collaboration (PRIMARY DIMENSION)
         */
        assessCollaboration(gameState, communicationStats) {
            const stats = communicationStats || {};
            const msgCount = stats.totalMessages || 0;
            const onTaskRatio = stats.onTaskRatio || 0;
            const infoShareRate = stats.infoShareRate || 0;
            const playerMsgCount = stats.playerMessageCount || 0;

            // Message quality
            const qualityScore = onTaskRatio * 0.5 + Math.min(1, infoShareRate * 3) * 0.5;

            // Info request/sharing balance
            const requestCount = stats.infoRequestCount || 0;
            const requestRatio = playerMsgCount > 0 ? requestCount / playerMsgCount : 0;
            const infoFlowScore = Math.min(1, (requestRatio * 2 + infoShareRate * 3) / 2);

            // Team contribution equity (did player communicate with all partners?)
            const partnerInteractions = this._computePartnerEquity(gameState);

            // Participation volume
            const participationScore = Math.min(1, playerMsgCount / 20);

            // Leadership pattern (did they ask for input before making decisions?)
            const leadershipScore = Math.min(1, requestRatio * 2.5);

            const score = (
                qualityScore * 0.25 +
                infoFlowScore * 0.25 +
                partnerInteractions * 0.20 +
                participationScore * 0.15 +
                leadershipScore * 0.15
            );

            return {
                score: Math.min(1, score),
                label: "Communication & Collaboration",
                primary: true,
                details: {
                    messageQuality: Math.round(qualityScore * 100),
                    infoFlow: Math.round(infoFlowScore * 100),
                    partnerEquity: Math.round(partnerInteractions * 100),
                    participation: Math.round(participationScore * 100),
                    leadership: Math.round(leadershipScore * 100),
                    totalMessages: msgCount,
                    playerMessages: playerMsgCount,
                },
            };
        },

        /**
         * D5: Empathy & Values
         */
        assessEmpathy(gameState, resourceHistory) {
            // Resource sharing generosity
            const allocations = gameState.resourceAllocationHistory || [];
            let sharingScore = 0.5;
            if (allocations.length > 0) {
                const shareEvents = allocations.filter((a) => a.type === "share" || (a.distribution && Object.values(a.distribution).some((v) => v > 0)));
                sharingScore = Math.min(1, shareEvents.length / allocations.length * 1.5);
            }

            // Patience (did they wait for AI input before solving?)
            const collabEvents = gameState.collaborationEvents || [];
            const waitedForInput = collabEvents.filter((e) => e.type === "waited_for_partner").length;
            const rushedAhead = collabEvents.filter((e) => e.type === "solved_without_consulting").length;
            const totalDecisions = waitedForInput + rushedAhead;
            const patienceScore = totalDecisions > 0 ? waitedForInput / totalDecisions : 0.5;

            // Team health management
            const teamHealth = gameState.teamHealth || {};
            const healthValues = Object.values(teamHealth);
            const avgHealth = healthValues.length > 0 ? healthValues.reduce((s, v) => s + v, 0) / healthValues.length : 50;
            const healthScore = avgHealth / 100;

            const score = sharingScore * 0.35 + patienceScore * 0.35 + healthScore * 0.30;

            return {
                score: Math.min(1, score),
                label: "Empathy & Values",
                details: {
                    sharingBehavior: Math.round(sharingScore * 100),
                    patience: Math.round(patienceScore * 100),
                    teamHealthMaintenance: Math.round(healthScore * 100),
                },
            };
        },

        /**
         * D6: Growth & Adaptation
         */
        assessGrowth(gameState, communicationStats) {
            // Trend in puzzle scores over the scenario
            const puzzles = gameState.puzzlesCompleted || [];
            let trendScore = 0.5;
            if (puzzles.length >= 2) {
                const firstHalf = puzzles.slice(0, Math.ceil(puzzles.length / 2));
                const secondHalf = puzzles.slice(Math.ceil(puzzles.length / 2));
                const firstAvg = firstHalf.reduce((s, p) => s + (p.score || 0), 0) / firstHalf.length;
                const secondAvg = secondHalf.reduce((s, p) => s + (p.score || 0), 0) / secondHalf.length;
                trendScore = secondAvg >= firstAvg ? Math.min(1, 0.5 + (secondAvg - firstAvg) * 2) : Math.max(0, 0.5 - (firstAvg - secondAvg));
            }

            // Adaptive behavior (did they change approach after failures?)
            const stepResults = puzzles.flatMap((p) => p.stepResults || []);
            let adaptCount = 0;
            for (let i = 1; i < stepResults.length; i++) {
                if (!stepResults[i - 1].correct && stepResults[i].correct) {
                    adaptCount += 1; // recovered after a mistake
                }
            }
            const adaptScore = stepResults.length > 1 ? Math.min(1, adaptCount / (stepResults.length * 0.3)) : 0.5;

            const score = trendScore * 0.6 + adaptScore * 0.4;

            return {
                score: Math.min(1, score),
                label: "Growth & Adaptation",
                details: {
                    performanceTrend: trendScore >= 0.5 ? "improving" : "declining",
                    trendScore: Math.round(trendScore * 100),
                    adaptationScore: Math.round(adaptScore * 100),
                    recoveryCount: adaptCount,
                },
            };
        },

        // --- Private helpers ---

        _resourceBalance(resources) {
            const values = [resources.food || 0, resources.water || 0, resources.materials || 0];
            const total = values.reduce((s, v) => s + v, 0);
            if (total === 0) return 0;
            const ideal = total / 3;
            const deviation = values.reduce((s, v) => s + Math.abs(v - ideal), 0) / (3 * ideal);
            return Math.max(0, 1 - deviation);
        },

        _computePartnerEquity(gameState) {
            const messages = gameState.messageLog || [];
            const partnerSet = new Set(gameState.aiPartners || []);
            if (partnerSet.size === 0) return 0.5;

            const interactionCounts = {};
            for (const roleId of partnerSet) {
                interactionCounts[roleId] = 0;
            }

            for (const msg of messages) {
                if (msg.sender === "player") {
                    // Check if message was in context of any partner
                    const nextMsgs = messages.filter((m) => m.ts > msg.ts && m.ts < msg.ts + 10000 && m.sender !== "player");
                    for (const resp of nextMsgs) {
                        if (interactionCounts[resp.sender] !== undefined) {
                            interactionCounts[resp.sender] += 1;
                        }
                    }
                }
            }

            const counts = Object.values(interactionCounts);
            if (counts.every((c) => c === 0)) return 0.3;
            const total = counts.reduce((s, v) => s + v, 0);
            const ideal = total / counts.length;
            if (ideal === 0) return 0.3;
            const deviation = counts.reduce((s, v) => s + Math.abs(v - ideal), 0) / (counts.length * ideal);
            return Math.max(0, 1 - deviation * 0.5);
        },

        _scoreToGrade(score) {
            if (score >= 0.9) return "A+";
            if (score >= 0.8) return "A";
            if (score >= 0.7) return "B+";
            if (score >= 0.6) return "B";
            if (score >= 0.5) return "C+";
            if (score >= 0.4) return "C";
            return "D";
        },

        _scoreToLabel(score) {
            if (score >= 0.9) return "Exceptional Survivor";
            if (score >= 0.8) return "Team Leader";
            if (score >= 0.7) return "Strong Collaborator";
            if (score >= 0.6) return "Reliable Teammate";
            if (score >= 0.5) return "Learning Survivor";
            if (score >= 0.4) return "Growing Together";
            return "Keep Practicing";
        },

        _identifyStrengths(dimensions) {
            const sorted = Object.entries(dimensions).sort((a, b) => b[1].score - a[1].score);
            return sorted.slice(0, 2).map(([key, dim]) => ({
                dimension: key,
                label: dim.label,
                score: Math.round(dim.score * 100),
            }));
        },

        _identifyGrowthAreas(dimensions) {
            const sorted = Object.entries(dimensions).sort((a, b) => a[1].score - b[1].score);
            return sorted.slice(0, 2).map(([key, dim]) => ({
                dimension: key,
                label: dim.label,
                score: Math.round(dim.score * 100),
            }));
        },
    };
}
