# Feature Specification: Complete Documentation Site

**Feature Branch**: `014-docs-complete`
**Created**: 2026-04-13
**Status**: Draft
**Input**: User description: "DOCUMENTATION Complete — Introduction, Quickstart, Algorithms (DQN verbose / PPO verbose / Q-Table verbose), How this works (TFJS + all backends, one page per backend, pedagogical), R3F and Why. Then tutorials (start with a simple one, each tutorial spec'd separately in a follow-up)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — First-time visitor understands what IgnitionAI is and installs it (Priority: P1)

A JavaScript developer lands on `/docs` from the landing page or a search result. Within two minutes they should know what IgnitionAI is, why it exists, who it's for, and how to install it. They should then be able to follow the Quickstart and have a running CartPole training session in their browser inside five minutes.

**Why this priority**: Without a working introduction and Quickstart, all other documentation is worthless — developers bounce before they discover the rest. This is the single highest-leverage page on the site.

**Independent Test**: Give a JS developer who has never heard of IgnitionAI the URL `/docs`. Without any other help, they must be able to (a) explain in one sentence what IgnitionAI does, (b) install the packages, and (c) run their first training in a local Next.js or Vite project.

**Acceptance Scenarios**:

1. **Given** a new visitor on `/docs`, **When** they read the Introduction page, **Then** they find a one-sentence description, the "why IgnitionAI" rationale, a comparison with Unity ML-Agents / Python RL libraries, and a clear link to the Quickstart.
2. **Given** a visitor on `/docs/quickstart`, **When** they copy-paste the install command and the 7-line example, **Then** a CartPole agent begins learning in the browser without any additional configuration.
3. **Given** a visitor who completes the Quickstart, **When** they look for "what's next", **Then** they see clearly linked next steps: Core Concepts, the three algorithm pages, and the tutorial track.

---

### User Story 2 — Curious developer reads a full algorithm page and understands how DQN/PPO/Q-Table actually work (Priority: P1)

A developer with some ML curiosity but no deep RL background wants to understand what `env.train('dqn')` actually does under the hood. They open `/docs/algorithms/dqn`. They should leave understanding the intuition behind the algorithm, the key equations (accessible, not proof-grade), IgnitionAI's exact defaults, which hyperparameters to tune and when, and common failure modes with how to diagnose them.

**Why this priority**: The "verbose" qualifier in the user's input is load-bearing — these pages are the pedagogical backbone of the site and the single biggest differentiator from other RL libraries whose docs are API references with zero intuition.

**Independent Test**: A reader who has never implemented DQN before should, after reading `/docs/algorithms/dqn`, be able to answer without looking back: (a) why DQN uses a replay buffer, (b) why there's a target network, (c) what epsilon-decay does, (d) what IgnitionAI's default learning rate is and why. Same test for PPO (clipping, GAE, on-policy vs off-policy) and Q-Table (discretization, exploration).

**Acceptance Scenarios**:

1. **Given** the DQN page, **When** a reader reaches the end, **Then** they have seen: intuition, the Bellman update in plain language, replay buffer + target network explained, the exact default hyperparameters used by IgnitionAI, a "when to use DQN vs PPO" callout, and a list of 3–5 failure modes with fixes.
2. **Given** the PPO page, **When** a reader reaches the end, **Then** they understand policy gradient intuition, why PPO clips the ratio, how advantage estimation works at a high level, and when PPO outperforms DQN.
3. **Given** the Q-Table page, **When** a reader reaches the end, **Then** they understand when tabular methods are appropriate, how state discretization works, and why Q-Table converges faster than DQN on small grid worlds.

---

### User Story 3 — Developer reads "How it works" backend pages and understands the internals (Priority: P2)

A developer who has already shipped one agent wants to understand the architecture: how does IgnitionAI turn their `TrainingEnv` class into a neural network? Why TensorFlow.js? How does ONNX export actually work? What's in the core package vs. the backend packages? They open `/docs/how-it-works` and find one page per backend (`core`, `backend-tfjs`, `backend-onnx`, `storage`), each explaining the package's responsibility, its public API surface, and an annotated walkthrough of the most important file.

**Why this priority**: This is the pedagogical content that converts users into contributors. It's not needed to ship an agent, so it ranks below P1 Intro/Quickstart/Algorithms, but it's essential for the open-source story.

**Independent Test**: A reader who finishes `/docs/how-it-works/backend-tfjs` should be able to explain (a) why the training loop is decoupled from the render loop, (b) how `setSpeed()` is implemented, and (c) where they would add a new algorithm.

**Acceptance Scenarios**:

1. **Given** the How-it-works index, **When** a reader visits it, **Then** they see a clear map of the monorepo with one link per backend package.
2. **Given** any backend page (e.g., `backend-tfjs`), **When** the reader reaches the end, **Then** they have seen: the package's single responsibility, its exports, a sequence-style walkthrough of the training loop, and a pointer to the actual source file on GitHub.
3. **Given** the `core` page, **When** the reader reaches the end, **Then** they understand the `TrainingEnv` interface in depth and how auto-configuration deduces network shape.

---

### User Story 4 — React Three Fiber developer finds the R3F integration page and sees why IgnitionAI fits their stack (Priority: P2)

A Three.js / R3F developer who builds creative 3D experiences wants to add learning agents to their scenes. They open `/docs/r3f` and find (a) a rationale for why IgnitionAI is specifically built for R3F, (b) a complete, runnable R3F integration example, (c) an explanation of how the training loop runs independently of the render loop, and (d) pointers to the 3D demos (CartPole 3D, Car Circuit).

**Why this priority**: R3F is the single biggest audience segment for the framework. One great page here is worth 100 generic pages.

**Independent Test**: An R3F developer who has never used IgnitionAI should, after reading this page, be able to paste the example into their existing R3F project and see an agent start learning.

**Acceptance Scenarios**:

1. **Given** the R3F page, **When** the reader reaches the end, **Then** they have seen the rationale ("why R3F-first"), a full minimal `<Canvas>` + `TrainingEnv` example, and the "training loop vs render loop" explanation.
2. **Given** the R3F page, **When** the reader clicks the demo links, **Then** they land on the CartPole 3D and Car Circuit demo pages.

---

### User Story 5 — Beginner follows a tutorial from scratch (Priority: P2)

A complete beginner who has never written an RL environment follows `/docs/tutorials/grid-world` (the simplest tutorial) end-to-end. They copy-paste blocks into a fresh Vite project, and by the end they have a working GridWorld agent that learns to find the shortest path. The tutorial is explicit: every step shows the exact code, the exact file it goes in, and what success looks like at that step.

**Why this priority**: Tutorials are how most users actually learn. The single tutorial shipped with this feature is the template for all future tutorials, each of which will get its own follow-up `/speckit.specify`.

**Independent Test**: A beginner with a blank Vite project, no prior IgnitionAI knowledge, and 30 minutes of time should be able to complete the GridWorld tutorial without asking for help and without opening unrelated docs.

**Acceptance Scenarios**:

1. **Given** the Tutorials index page, **When** the reader visits it, **Then** they see the GridWorld tutorial marked as "Start here" with an estimated time and difficulty level.
2. **Given** the GridWorld tutorial, **When** the reader follows it step by step, **Then** each code block builds on the previous one, each step explains *why* not just *what*, and the final step produces a trained agent.
3. **Given** a reader who finishes the tutorial, **When** they reach the "Next steps" section, **Then** they see the other tutorials (forthcoming) and a link to "build your own environment".

---

### Edge Cases

- Reader arrives on a page deep in the site (e.g., `/docs/algorithms/ppo`) via a search engine — they must still be able to navigate and understand their context via breadcrumbs, sidebar, and clear backlinks.
- Reader is on mobile — sidebar must collapse into a drawer, code blocks must scroll horizontally, no layout break below 375 px.
- Reader copies code — every code block must be copy-paste-runnable in a fresh project (no missing imports, no hidden globals, no `...` placeholders in critical paths).
- Reader is a non-English native — pages use simple English, short sentences, no idioms, and concrete examples over abstract prose.
- Content drift — when the framework's default hyperparameters change, there must be a single source of truth that the docs reference so pages don't go stale silently.
- A tutorial's code snippets target an outdated package version — version pin at the top of each tutorial, and a manual ship-time check that the snippets still work against the latest published packages.

## Requirements *(mandatory)*

### Functional Requirements

**Navigation & structure**

- **FR-001**: Documentation site MUST expose the following top-level sections in the sidebar, in this order: Introduction, Quickstart, Algorithms, How it works, React Three Fiber, Tutorials.
- **FR-002**: The Algorithms section MUST contain three sub-pages: DQN, PPO, Q-Table.
- **FR-003**: The How-it-works section MUST contain one page per published backend package: `core`, `backend-tfjs`, `backend-onnx`, `storage`.
- **FR-004**: The Tutorials section MUST contain at least one tutorial (GridWorld) in this feature; additional tutorials are out of scope and will be added via separate specify invocations.
- **FR-005**: Every page MUST expose a "Next" link pointing to the next logical page and a "Previous" link to the prior one.
- **FR-006**: Every page MUST show breadcrumbs that let the reader understand their position in the site hierarchy.

**Content — Introduction**

- **FR-007**: The Introduction page MUST include: a one-sentence description, a "why IgnitionAI" rationale, a comparison with Unity ML-Agents / Python RL libraries, the install command, and explicit links to Quickstart and the algorithms.

**Content — Quickstart**

- **FR-008**: The Quickstart page MUST contain a complete copy-paste-runnable example that trains a CartPole agent in under 10 lines of code.
- **FR-009**: The Quickstart code MUST import from the actually-published npm packages (`@ignitionai/core`, `@ignitionai/backend-tfjs`) and not from the unpublished umbrella name.
- **FR-010**: The Quickstart MUST end with a "What just happened" section that maps each line of the example to a concept that is explained in more depth elsewhere in the docs.

**Content — Algorithm pages (DQN, PPO, Q-Table)**

- **FR-011**: Each algorithm page MUST contain: (a) plain-language intuition, (b) the core update rule in accessible math, (c) a "when to use" callout, (d) IgnitionAI's exact default hyperparameters, (e) which hyperparameters to tune and in what order, (f) 3–5 common failure modes with diagnostics and fixes.
- **FR-012**: The DQN page MUST explain replay buffer, target network, epsilon-greedy exploration, and the difference between DQN and vanilla Q-learning.
- **FR-013**: The PPO page MUST explain policy gradient intuition, the clipped surrogate objective, advantage estimation at a high level, and why PPO is more stable than REINFORCE.
- **FR-014**: The Q-Table page MUST explain when tabular methods are appropriate, state discretization, and the tradeoff between table size and generalization.

**Content — How it works**

- **FR-015**: Each backend page MUST describe: single responsibility, public API surface, an annotated walkthrough of the most important file, and a GitHub source link.
- **FR-016**: The `core` page MUST document the `TrainingEnv` interface in depth and explain auto-configuration (how `inputSize` and `actionSize` are deduced).
- **FR-017**: The `backend-tfjs` page MUST explain the TF.js backend selection (WebGPU / WebGL / WASM / CPU), the training loop's decoupling from the render loop, and how `setSpeed()` works.
- **FR-018**: The `backend-onnx` page MUST walk through the full Train → Export → Convert → Deploy pipeline with one code example per stage.
- **FR-019**: The `storage` page MUST show a complete save/load round-trip with HuggingFace Hub.

**Content — R3F**

- **FR-020**: The R3F page MUST include a complete R3F example using `@react-three/fiber` and `@ignitionai/backend-tfjs`, and explain why the training loop runs independently of the render loop.
- **FR-021**: The R3F page MUST link to the CartPole 3D and Car Circuit demos.

**Content — First tutorial (GridWorld)**

- **FR-022**: The GridWorld tutorial MUST be step-by-step, with each step showing: the exact code to add, the file it goes in, what the reader should observe, and why this step exists.
- **FR-023**: The GridWorld tutorial MUST specify its prerequisites (Node version, package versions, starter — Vite or Next.js).
- **FR-024**: The GridWorld tutorial MUST end with a "Next steps" section pointing to the algorithms pages and the (future) list of tutorials.

**Pedagogical consistency**

- **FR-025**: Every "How it works" and algorithm page MUST follow a consistent structure (heading order, code block styling, callout styling) so readers build pattern recognition.
- **FR-026**: Code blocks MUST specify their filename (e.g., `// cartpole.ts`) when the file context matters.
- **FR-027**: Claims about hyperparameter defaults MUST match the actual values in the source code at the time of writing; stale defaults are a bug.

**Technical constraints**

- **FR-028**: All documentation pages MUST be authored in MDX so they can embed rich components when needed (callouts, interactive widgets in future work).
- **FR-029**: Documentation MUST be part of the same Next.js deployment as the landing page — a single Vercel deployment serves both `/` and `/docs`.
- **FR-030**: The documentation sidebar MUST be auto-generated from the file structure with explicit `_meta.js` overrides for ordering and display titles.
- **FR-031**: Every documentation page MUST have working dark mode (matching the landing page palette).

### Key Entities

- **Doc page**: An MDX file under `packages/web/content/`. Has a title (front-matter), a position in the sidebar (via `_meta.js`), and a body. Must be independently linkable and independently testable for content correctness.
- **Sidebar entry**: An item in `_meta.js` that maps a file key to a display label and ordering. Drives navigation and breadcrumbs.
- **Algorithm page**: A subtype of Doc page that additionally contains structured sections: intuition, math, defaults, tuning guide, failure modes.
- **Backend page**: A subtype of Doc page covering one `@ignitionai/*` npm package.
- **Tutorial**: A Doc page structured as sequential steps, each with code + observation + rationale.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can go from landing on `/docs` to a running CartPole training in under 5 minutes on their own machine, without asking for help.
- **SC-002**: A reader who finishes any single algorithm page can correctly answer 4 out of 5 comprehension questions about that algorithm (intuition, one key mechanism, the default hyperparameters, when to use it, one failure mode) without consulting the page again.
- **SC-003**: A beginner can complete the GridWorld tutorial end-to-end in under 30 minutes on a fresh project with no prior IgnitionAI knowledge.
- **SC-004**: Every code block on the site is runnable as-is: zero "missing import", "undefined variable", or "wrong package name" errors when copy-pasted into a fresh project targeting the latest published package versions.
- **SC-005**: Site-wide, no page has more than one "stub" or "TODO" marker; stubs are acceptable only for explicitly flagged future tutorials.
- **SC-006**: An R3F developer with no prior IgnitionAI knowledge can paste the R3F example into a working R3F project and see an agent start learning within 10 minutes.
- **SC-007**: 100% of the pages required by FR-001 through FR-004 exist and are linked from the sidebar when this feature ships.
- **SC-008**: Every hyperparameter default cited in the Algorithms section matches the value in the source code at ship time.

## Assumptions

- The Nextra docs scaffold (landing + `/docs` in the same Next.js deployment, content under `packages/web/content/`, sidebar via `_meta.js`) is already in place and does not need to be reimplemented.
- The published packages are `@ignitionai/core` and `@ignitionai/backend-tfjs`; other backends (`backend-onnx`, `storage`) may or may not be on npm yet, but they exist in the monorepo and their public APIs are stable enough to document.
- The GridWorld demo under `packages/demo-gridworld/` is the canonical reference implementation and its code can be reused verbatim in the tutorial.
- "Verbose" in the user's input means "pedagogical, with intuition and worked examples", not "long-winded". The bar is Karpathy-style clarity, not textbook exhaustiveness.
- Each future tutorial (e.g., CartPole, MountainCar, Car Circuit) will be spec'd and implemented in its own `/speckit.specify` invocation. Only one tutorial (GridWorld) is in scope for this feature.
- Interactive in-page widgets (live training, hyperparameter sliders, embedded demos) are out of scope for v1 of the docs and will be spec'd separately.
- Translations are out of scope; the site is English-first.
