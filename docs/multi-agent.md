# Simultaneous multi-agent environments

`MultiAgentRunner` is an additive core API. Existing `IgnitionEnv` environments
and agents remain unchanged. Provide a `MultiAgentEnv` and a Map containing one
independent `AgentInterface` instance per fixed agent ID. Duplicate IDs, unknown
active IDs and implicitly shared policy instances are rejected.

Every tick snapshots all active observations before requesting asynchronous
policy decisions. It passes all actions to **one** environment `step` call.
Rewards, actions, previous observations and final observations stay attached to
their agent ID. Each policy remembers and trains only its own transitions.
Policies must not mutate the world while selecting an action.

The world reports per-agent termination and truncation. Finished agents retire
until a shared reset, even if `activeAgentIds()` keeps returning them. A global
`done()` truncates surviving agents; all agents finishing also ends the episode.
The world must retain a finished agent's final observation until reset. The
runner resets the world after capturing transitions, so returned final states
are not replaced by next-episode observations. Environment `step` must not
reset the world itself. An active subset may vary, but a live tick needs at least
one active, unfinished agent.

`step()` learns; `inferStep()` requests greedy actions and never remembers or
trains. Operations, including manual reset, share a serialized queue. Manual
reset and inference discard pending on-policy rollouts. Normal episode resets
preserve them so rollout algorithms can span episode boundaries.

`start('train' | 'infer', intervalMs)` creates one automatic loop. Mode changes
cancel future old ticks. `stop()` cancels future ticks, including those queued
behind another transition; a transition already executing can finish. Await
`reset()` (or another queued operation) before disposing a policy. The runner
never owns or disposes policies. Automatic errors stop the loop and appear in
`lastError`; a new start clears it. Manual errors reject their returned promise. A failed policy decision waits for all sibling decisions to settle before releasing the queue.
There is no rollback after an environment/policy exception; reset before
resuming if it may have partially mutated the world or learned policies.

Results contain a Map of transitions. For JSON use
`JSON.stringify([...result.transitions])`; reconstruct using `new Map(entries)`.
This serializes the report, not an entire environment/optimizer checkpoint.
Checkpointing remains each policy's responsibility.

## Executable example

`examples/multi-agent.ts` trains two independent Q-tables in a common corridor,
then evaluates greedy policies for twenty episodes. It reports actual goals,
including failures; it does not promise universal convergence or seeded results.
From a source checkout with dependencies installed:

```bash
pnpm --filter @ignitionai/backend-onnx exec esbuild ../../examples/multi-agent.ts --bundle --platform=node --format=cjs --alias:@ignitionai/core=../core/src/index.ts --alias:@ignitionai/backend-tfjs=../backend-tfjs/src/index.ts --external:@tensorflow/tfjs-node --outfile=../../.scratch/multi-agent-example.cjs
node .scratch/multi-agent-example.cjs
```

Self-play, policy sharing, network multiplayer and continuous actions are
separate contracts and are not implied by this runner.
