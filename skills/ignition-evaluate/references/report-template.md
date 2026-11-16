# Evaluation report template

Fill this **after** declaring seeds and budget, and **after** the run. Paste raw numbers. Do not edit returns to look better.

```text
# Policy evaluation report

- Framework API: IgnitionRL `@ignitionai/*` 0.1.0
- Policy: frozen greedy (getAction(obs, true) / inferStep). Algorithm + checkpoint id:
- Train seeds (not evaluated):
- Eval seeds (≥ 3, disjoint from train):
- Episodes per eval seed:
- Max steps per episode / max env steps (budget):
- Wall-clock cap (if any) and whether it fired:
- Episode returns (all of them):
- Mean ± sample std (n=…):
- 95% CI:
- Random baseline mean ± sample std (same env seeds):
- Policy mean − random mean:
- Weight snapshot unchanged (yes/no):
- Convergence criterion (if any) and whether it was met:
```

If you did not define a numeric success threshold **before** the run, write: `No convergence is claimed.`
