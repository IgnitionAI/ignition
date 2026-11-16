# Reward checklist (before training)

Use this before a long run. Checking the signal is cheaper than retuning `lr`.

1. **True objective is named.** Write the success event in environment terms (flag reached, laps completed, pole stayed up). Training return is not the objective.
2. **Sparse vs dense is a choice.** If almost every transition has the same `reward()`, the Bellman target has no direction. Add a dense term or accept that random exploration must hit the event first.
3. **Potential-based shaping is preferred for “closer is better”.** Use `r' = r + γ Φ(s') − Φ(s)` with Φ a function of the observation only. Do not bake Φ into the environment class; wrap it.
4. **Scale and sign are visible.** If you multiply `r` or flip its sign, document it. A sign error trains the opposite of the objective.
5. **Time penalty is small and consistent.** A constant negative term encourages shorter episodes. If it dominates Φ, the agent only learns to die fast.
6. **Termination is split.** `terminated` = the task actually ended (success or failure). `truncated` = time limit. Timeouts must not be treated as absorbing successes.
7. **True success is logged separately.** Count the named event. Do not declare “it learned” from a rising shaped return alone.
8. **Hacking scan.** Ask: can the agent farm Φ forever without the event? Can it oscillate? Can it end the episode to harvest a bonus?
9. **Seeds and budget are declared first.** At least three seeds. Write episode/step limits before the first `step()`. Paste raw counts, including zeros.
10. **Compare against the unshaped env.** Same algorithm, same seeds, same budget. The wrapper is the only difference.
