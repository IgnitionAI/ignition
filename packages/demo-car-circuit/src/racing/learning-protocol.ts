import { DRIVING_CONTRACT } from "./driving";
import { OBSERVATION_CONTRACT } from "./observations";
import { RACE_PROTOCOL } from "./race";

/** Fixed before training runs; held-out results must never choose the checkpoint. */
export const LEARNING_PROTOCOL = Object.freeze({
  id: "racing-learning-v2",
  driving: DRIVING_CONTRACT.id,
  observation: OBSERVATION_CONTRACT,
  race: RACE_PROTOCOL.id,
  trainingSeeds: [11, 29, 47],
  checkpointSelection: "last scheduled update on training circuit only",
  evaluationSeeds: [101, 307, 509],
  success: {
    completedLaps: 3,
    maxRescues: 0,
    maxPenalties: 10,
    minimumCompletionRate: 0.8,
  },
  evaluation:
    "All three training seeds on both circuits, solo and three frozen rule-based traffic drivers. Report every run, including failures.",
});
