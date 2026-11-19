export function nav1dStep(pos, action) {
  const delta = action === 1 ? 0.15 : -0.15;
  const newPos = Math.max(0, Math.min(1, pos + delta));
  const done = newPos > 0.7;
  return { newPos, reward: done ? 1.0 : -0.05, done };
}

export function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function mean(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
