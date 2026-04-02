/**
 * Assessment Engine for Lab Explorer.
 * Maps game behaviors to 6 assessment dimensions:
 *   D1: Knowledge/Correctness — question accuracy, measurement accuracy
 *   D2: Efficiency — experiments completed, time per experiment
 *   D3: Process (PRIMARY) — equipment selection, variable exploration,
 *       systematic experimentation rate, self-correction, step sequence
 *   D5: Dispositions — safety awareness, risk-taking, curiosity
 *   D6: Transfer — skill transfer between experiments, accuracy improvement
 */

export function createAssessmentEngine() {
    const sessionHistory = [];  // Each entry: one experiment's assessment data

    /**
     * Record a completed experiment for assessment.
     */
    function recordExperiment(data) {
        sessionHistory.push({
            experimentId: data.experimentId,
            ts: Date.now(),
            // D1 inputs
            questionsAnswered: data.questionsAnswered || 0,
            questionsCorrect: data.questionsCorrect || 0,
            bestAccuracyError: data.bestAccuracyError ?? 1.0,
            hypothesisCorrect: data.hypothesisCorrect || false,
            conclusionCorrect: data.conclusionCorrect || false,
            // D2 inputs
            durationMs: data.durationMs || 0,
            runCount: data.runCount || 0,
            // D3 inputs
            equipmentScore: data.equipmentScore || 0,
            explorationScore: data.explorationScore || 0,
            wasSystematic: data.wasSystematic || false,
            selfCorrectionCount: data.selfCorrectionCount || 0,
            stepSequence: data.stepSequence || [],
            // D5 inputs
            gogglesWorn: data.gogglesWorn || false,
            extremeValueAttempts: data.extremeValueAttempts || 0,
            discoveriesFound: data.discoveriesFound || 0,
            failuresTriggered: data.failuresTriggered || 0,
            wrongToolAttempts: data.wrongToolAttempts || 0,
            // D6 inputs
            accuracyScore: data.accuracyScore || 0,
        });
    }

    /**
     * D1: Knowledge/Correctness dimension.
     */
    function assessD1() {
        if (sessionHistory.length === 0) return { score: 0, details: {} };

        const latest = sessionHistory[sessionHistory.length - 1];
        const questionAccuracy = latest.questionsAnswered > 0
            ? latest.questionsCorrect / latest.questionsAnswered
            : 0;

        const measurementScore = Math.max(0, 1 - latest.bestAccuracyError);

        const score = (
            questionAccuracy * 0.4 +
            measurementScore * 0.3 +
            (latest.hypothesisCorrect ? 0.15 : 0) +
            (latest.conclusionCorrect ? 0.15 : 0)
        );

        return {
            score: Math.round(score * 100),
            details: {
                questionAccuracy: Math.round(questionAccuracy * 100),
                measurementAccuracy: Math.round(measurementScore * 100),
                hypothesisCorrect: latest.hypothesisCorrect,
                conclusionCorrect: latest.conclusionCorrect,
            },
        };
    }

    /**
     * D2: Efficiency dimension.
     */
    function assessD2() {
        if (sessionHistory.length === 0) return { score: 0, details: {} };

        const totalExperiments = sessionHistory.length;
        const avgDuration = sessionHistory.reduce((s, e) => s + e.durationMs, 0) / totalExperiments;
        const avgRuns = sessionHistory.reduce((s, e) => s + e.runCount, 0) / totalExperiments;

        // Efficient: 3-6 runs per experiment, 2-5 min duration
        const runEfficiency = avgRuns >= 3 && avgRuns <= 6 ? 1.0
            : avgRuns < 3 ? 0.5
            : Math.max(0.3, 1.0 - (avgRuns - 6) * 0.1);

        const timeEfficiency = avgDuration < 60000 ? 0.5  // too fast = not thorough
            : avgDuration < 300000 ? 1.0                   // 1-5 min sweet spot
            : Math.max(0.3, 1.0 - (avgDuration - 300000) / 600000);

        const throughputBonus = Math.min(totalExperiments / 5, 1.0);

        const score = runEfficiency * 0.35 + timeEfficiency * 0.35 + throughputBonus * 0.3;

        return {
            score: Math.round(score * 100),
            details: {
                experimentsCompleted: totalExperiments,
                avgDurationSec: Math.round(avgDuration / 1000),
                avgRuns: Math.round(avgRuns * 10) / 10,
            },
        };
    }

    /**
     * D3: Scientific Process dimension (PRIMARY).
     */
    function assessD3() {
        if (sessionHistory.length === 0) return { score: 0, details: {} };

        const latest = sessionHistory[sessionHistory.length - 1];

        const equipmentQuality = latest.equipmentScore / 20;
        const explorationBreadth = latest.explorationScore / 20;
        const systematicRate = latest.wasSystematic ? 1.0 : 0.3;
        const selfCorrectionNorm = Math.min(latest.selfCorrectionCount / 3, 1.0);

        // Process mining: check step sequence completeness
        const expectedPhases = ["hypothesis", "equipment", "variable", "run", "observe", "conclude"];
        const actualPhases = latest.stepSequence.map((s) => s.phase);
        const phaseCompleteness = expectedPhases.filter((p) => actualPhases.includes(p)).length / expectedPhases.length;

        const score = (
            equipmentQuality * 0.20 +
            explorationBreadth * 0.25 +
            systematicRate * 0.25 +
            selfCorrectionNorm * 0.15 +
            phaseCompleteness * 0.15
        );

        return {
            score: Math.round(score * 100),
            details: {
                equipmentQuality: Math.round(equipmentQuality * 100),
                explorationBreadth: Math.round(explorationBreadth * 100),
                systematicRate: Math.round(systematicRate * 100),
                selfCorrections: latest.selfCorrectionCount,
                phaseCompleteness: Math.round(phaseCompleteness * 100),
            },
        };
    }

    /**
     * D5: Dispositions — safety, risk, curiosity.
     */
    function assessD5() {
        if (sessionHistory.length === 0) return { score: 0, details: {} };

        const latest = sessionHistory[sessionHistory.length - 1];

        // Safety: goggles worn + no excessive wrong tool attempts
        const safetyAwareness = latest.gogglesWorn ? 0.6 : 0.0;
        const toolSafety = Math.max(0, 0.4 - latest.wrongToolAttempts * 0.1);
        const safetyScore = safetyAwareness + toolSafety;

        // Risk-taking: trying extreme values (neither good nor bad, but interesting)
        const riskScore = Math.min(latest.extremeValueAttempts / 3, 1.0);

        // Curiosity: discoveries beyond minimum
        const curiosityScore = Math.min(latest.discoveriesFound / 3, 1.0);

        const score = safetyScore * 0.4 + riskScore * 0.2 + curiosityScore * 0.4;

        return {
            score: Math.round(score * 100),
            details: {
                safetyAwareness: Math.round(safetyScore * 100),
                riskTaking: Math.round(riskScore * 100),
                curiosity: Math.round(curiosityScore * 100),
                gogglesWorn: latest.gogglesWorn,
                discoveriesFound: latest.discoveriesFound,
            },
        };
    }

    /**
     * D6: Transfer — skill improvement across experiments.
     */
    function assessD6() {
        if (sessionHistory.length < 2) return { score: 0, details: { note: "Need 2+ experiments" } };

        const scores = sessionHistory.map((e) => e.accuracyScore);

        // Accuracy trend: is it improving?
        let improvementCount = 0;
        for (let i = 1; i < scores.length; i++) {
            if (scores[i] > scores[i - 1]) improvementCount += 1;
        }
        const improvementRate = improvementCount / (scores.length - 1);

        // Skill transfer: later experiments should start with better scores
        const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
        const secondHalf = scores.slice(Math.ceil(scores.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / Math.max(1, secondHalf.length);
        const transferGain = Math.max(0, (secondAvg - firstAvg) / 20);

        const score = improvementRate * 0.5 + Math.min(transferGain, 1.0) * 0.5;

        return {
            score: Math.round(score * 100),
            details: {
                improvementRate: Math.round(improvementRate * 100),
                transferGain: Math.round(transferGain * 100),
                experimentsAnalyzed: sessionHistory.length,
            },
        };
    }

    /**
     * Generate full assessment report across all dimensions.
     */
    function generateReport() {
        const d1 = assessD1();
        const d2 = assessD2();
        const d3 = assessD3();
        const d5 = assessD5();
        const d6 = assessD6();

        return {
            dimensions: { d1, d2, d3, d5, d6 },
            primaryDimension: d3,
            overallScore: Math.round(
                d1.score * 0.15 + d2.score * 0.10 + d3.score * 0.40 + d5.score * 0.20 + d6.score * 0.15
            ),
            experimentsAssessed: sessionHistory.length,
        };
    }

    return {
        recordExperiment,
        assessD1,
        assessD2,
        assessD3,
        assessD5,
        assessD6,
        generateReport,
    };
}
