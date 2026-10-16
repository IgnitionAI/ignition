# Contract: Sidebar `_meta.js` files

**Feature**: 014-docs-complete
**Date**: 2026-04-13

Nextra renders its sidebar from `_meta.js` files colocated with content. Each file below is a binding contract: the final implementation must match byte-for-byte (modulo formatting) so that the data-model traceability matrix stays valid.

## `packages/web/content/_meta.js`

```js
export default {
  index: 'Introduction',
  quickstart: 'Quickstart',
  algorithms: 'Algorithms',
  'how-it-works': 'How it works',
  r3f: 'React Three Fiber',
  tutorials: 'Tutorials',
}
```

Replaces the current scaffold `_meta.js`, which predates this feature.

## `packages/web/content/algorithms/_meta.js`

```js
export default {
  index: 'Overview',
  dqn: 'DQN',
  ppo: 'PPO',
  'q-table': 'Q-Table',
}
```

## `packages/web/content/how-it-works/_meta.js`

```js
export default {
  index: 'Monorepo map',
  core: '@ignitionai/core',
  'backend-tfjs': '@ignitionai/backend-tfjs',
  'backend-onnx': '@ignitionai/backend-onnx',
  storage: '@ignitionai/storage',
}
```

## `packages/web/content/tutorials/_meta.js`

```js
export default {
  index: 'Tutorials',
  'grid-world': {
    title: 'GridWorld · Start here',
  },
}
```

The GridWorld entry uses the object form so we can attach a "Start here" prefix without renaming the file.

## Invariants

- Every file listed in `data-model.md`'s Page Catalog must appear in exactly one `_meta.js`.
- Every key in these `_meta.js` files must correspond to an actual MDX file. No dangling keys.
- Ordering in each `_meta.js` drives sidebar order, Previous / Next navigation, and breadcrumb fallback labels.
- Renaming any file requires updating the corresponding `_meta.js` entry in the same commit.
