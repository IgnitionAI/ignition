# Validation Environments — Proposal

**Goal**: Environments where each algorithm (Q-Table, DQN, PPO) demonstrably converges, with visual feedback that proves learning is happening. Each env is a self-contained demo page.

---

## 1. GridWorld (Q-Table + DQN)

**What**: 2D grid (7x7 or 10x10), agent starts at top-left, target at bottom-right.
**Actions**: 4 discrete (up/down/left/right)
**Observation**: [row, col] normalized to [0,1]
**Reward**: +10 at goal, -1 per step (encourages shortest path), -5 for walls
**Termination**: goal reached or 100 steps

**Why it validates**:
- Q-Table: perfect for small discrete state space. Should converge in ~100 episodes to optimal path.
- DQN: slightly overkill but proves the network can learn a simple policy. Converges in ~200 episodes.

**Visual**: CSS grid with colored cells. Agent = blue, target = green, visited = light trail. You SEE the agent's path shorten over episodes.

**Wow factor**: Side-by-side Q-Table vs DQN on the same grid. Q-Table converges faster, DQN generalizes better.

---

## 2. CartPole Balance (DQN + PPO)

**What**: Classic control problem. A pole on a cart, apply force left/right to keep it balanced.
**Actions**: 2 discrete (push left, push right)
**Observation**: [cart_position, cart_velocity, pole_angle, pole_angular_velocity]
**Reward**: +1 per timestep the pole stays upright
**Termination**: pole angle > 12 degrees, cart out of bounds, or 500 steps (solved)

**Why it validates**:
- DQN: classic benchmark, should solve in ~300 episodes
- PPO: should solve faster (~100-200 episodes) with better stability

**Visual**: 2D canvas — cart as a rectangle sliding left/right, pole as a line rotating. Simple physics animation at 30fps. Instantly recognizable to anyone who knows RL.

**Wow factor**: The pole wobbling and then suddenly staying upright after training. Universally impressive.

---

## 3. MountainCar (DQN + PPO)

**What**: Car stuck in a valley, needs to build momentum to reach the flag on the right hill.
**Actions**: 3 discrete (push left, no action, push right)
**Observation**: [position, velocity]
**Reward**: -1 per step, +100 at goal (position > 0.5)
**Termination**: goal reached or 200 steps

**Why it validates**:
- Requires exploration — the agent must learn to go LEFT first (counterintuitive) to build momentum
- DQN with epsilon-greedy explores enough to discover this
- PPO's entropy bonus helps with the sparse reward

**Visual**: 2D canvas — valley curve (sin wave), car as a dot/rectangle moving along it, flag at the top. Simple and satisfying when the car finally makes it.

**Wow factor**: The "aha moment" when the agent learns to swing back and forth.

---

## 4. Navigation 2D (DQN + PPO)

**What**: Continuous 2D plane (400x400 canvas), agent navigates to a target avoiding obstacles.
**Actions**: 4 discrete (up/down/left/right) or 8 (add diagonals)
**Observation**: [agentX, agentY, targetX, targetY, dist_obstacle_1, ..., dist_obstacle_N] normalized
**Reward**: distance-based shaping: -distance_to_target + bonus at goal + penalty for obstacle collision
**Termination**: goal reached, collision, or 300 steps

**Why it validates**:
- More complex than GridWorld — continuous observations
- Tests DQN's generalization with replay buffer
- Tests PPO's on-policy learning with richer observation

**Visual**: Top-down 2D canvas. Agent = blue circle, target = green circle, obstacles = red rectangles. Trail showing agent's path. Clean and game-like.

**Wow factor**: The agent starts bumping into walls, then learns smooth paths around obstacles. Feels like a game AI.

---

## 5. Snake (DQN — stretch goal)

**What**: Classic Snake game. Agent controls direction, eats food, grows longer, avoids self.
**Actions**: 4 discrete (up/down/left/right)
**Observation**: [head_x, head_y, food_x, food_y, danger_up, danger_down, danger_left, danger_right, direction]
**Reward**: +10 eat food, -10 die, +1 closer to food, -1 farther
**Termination**: collision with self or wall

**Why it validates**:
- Complex sequential decision making
- Tests DQN replay buffer with long-horizon rewards
- Familiar game — anyone understands it immediately

**Visual**: Canvas grid, classic snake rendering. Immediately recognizable and shareable.

**Wow factor**: "I trained a snake AI in my browser." Instant social proof.

---

## Priority Order

| # | Env | Algo validation | Difficulty | Impact |
|---|-----|----------------|------------|--------|
| 1 | **GridWorld** | Q-Table + DQN | Easy | Must-have — proves the framework works |
| 2 | **CartPole** | DQN + PPO | Medium | Classic benchmark — credibility |
| 3 | **MountainCar** | DQN + PPO | Medium | Exploration showcase |
| 4 | **Navigation 2D** | DQN + PPO | Medium | Game-like, creative dev appeal |
| 5 | **Snake** | DQN | Hard | Viral potential, stretch goal |

## Implementation approach

Each env should be:
- A standalone HTML page (no R3F, just canvas/CSS)
- Self-contained: env logic + agent + visualization in one file
- Runnable with `pnpm dev` and a route like `/gridworld`, `/cartpole`, etc.
- Convergence proven by tests before the visual demo is built
