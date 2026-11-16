# IgnitionRL agent skills

Nine Agent Skills (`SKILL.md`) so a code agent can use `@ignitionai/*` **0.1.0** without extra context: create an env, train, split train/infer, evaluate, export.

Success is measured only with numbers you actually ran: CartPole training, evaluation on several seeds, ONNX export. Do not claim convergence without those measurements.

## Skills

| Skill | One sentence | Path |
|---|---|---|
| ignition-quickstart | Install the three packages, run the CartPole docs Quickstart, stop the loop, and pick the next skill. | `skills/ignition-quickstart/` |
| ignition-create-env | Implement a `TrainingEnv` the runner can wrap. | `skills/ignition-create-env/` |
| ignition-train | Start and bound a DQN / PPO / Q-table loop with public `train()` / `step()` / `stop()`. | `skills/ignition-train/` |
| ignition-train-infer-split | Separate learning ticks from greedy `infer()` / `inferStep()` without mixing modes. | `skills/ignition-train-infer-split/` |
| ignition-reward-shaping | Change `reward()` (and related signals) without hiding the true task. | `skills/ignition-reward-shaping/` |
| ignition-debug-training | Inspect `lastError`, step counts, and loop lifecycle when learning looks stuck. | `skills/ignition-debug-training/` |
| ignition-evaluate | Report returns across at least three declared seeds; no invented thresholds. | `skills/ignition-evaluate/` |
| ignition-export-onnx | Export a trained TF.js policy to ONNX using the published backend API. | `skills/ignition-export-onnx/` |
| ignition-save-load | Persist and restore agent weights and runner-facing state. | `skills/ignition-save-load/` |

Start at **ignition-quickstart**. The other eight folders are specified in the same batch and may land in parallel pull requests.

## Conventions

- Location: `skills/ignition-<name>/SKILL.md`.
- Frontmatter: `name` equals the folder name; `description` says what the skill does and when to use it (max 1024 characters). Body in English, max 500 lines; extra detail in `references/`.
- API: only `dev` at SHA `343a76952f9dcd6594674c3526ee03ee45b4d93e`. Cite each signature as `file:line`.
- Runnable example: `examples/*.ts` plus `examples/*.test.ts`, executed by the root Vitest config with `@ignitionai/*` aliases. Tests call the real framework (no mocks) and stay under 60 s CPU.
- Declare budget and seeds (at least three) before running. Paste raw results, including failures. Never weaken an existing test.

## How to install a skill

There is no Ignition CLI that registers skills.

Copy a skill directory into the project's Agent Skills folder, keeping the folder name:

```text
cp -R skills/ignition-quickstart .claude/skills/ignition-quickstart
```

The file the agent reads is `.claude/skills/ignition-quickstart/SKILL.md`. Repeat for any other `skills/ignition-*` directory you need. This matches how this repository already stores project skills under `.claude/skills/`.
