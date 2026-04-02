import { SUBJECT_IDS } from "./constants.js";
import { acidBaseExperiment } from "../data/experiments/acid_base.js";
import { densityExperiment } from "../data/experiments/density.js";
import { circuitsExperiment } from "../data/experiments/circuits.js";
import { pendulumExperiment } from "../data/experiments/pendulum.js";
import { heatTransferExperiment } from "../data/experiments/heat_transfer.js";

/**
 * Master list of all experiments.
 * Order determines unlock sequence (complete N to unlock N+1).
 */
export const EXPERIMENTS = [
    acidBaseExperiment,
    densityExperiment,
    circuitsExperiment,
    pendulumExperiment,
    heatTransferExperiment,
];

export function getExperimentById(id) {
    return EXPERIMENTS.find((e) => e.id === id) ?? null;
}

export function getExperimentsBySubject(subjectId) {
    return EXPERIMENTS.filter((e) => e.subject === subjectId);
}
