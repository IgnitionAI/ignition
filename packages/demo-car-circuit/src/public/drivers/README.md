# Learned demonstration drivers

These are actual network weights trained by `scripts/train-racing.mts`, not rule controllers. Method: imitation with dataset aggregation, 16 fixed rounds, seeds 11/29/47, 65,536 examples per seed, three gradient epochs per round. Same 20-observation/nine-action contract and race physics as the player. Solo collection followed by frozen rule-based traffic.

Checkpoint selection was the final scheduled update on the training track. All three scheduled seeds are included, without held-out selection. Reports include the untrained baseline and every evaluation (three scenario seeds, two circuits, solo/traffic). Aggregate success: 29/36. Each untrained baseline completed zero laps. Seed 11: 9/12, seed 29: 10/12, seed 47: 10/12. Failure reports remain included. Seed 11 fails all three solo Harbour runs; no universal driving competence is claimed. Traffic contains many repeated contact ticks; these drivers are not collision-free racers.

Saved JSON files contain trained weights and contract metadata. Inference reconstructs the network and uses its output directly. No reference controller fallback is present. The reports were measured using TensorFlow.js 4.22 native on macOS arm64; browser backend variation requires a separate browser check.
