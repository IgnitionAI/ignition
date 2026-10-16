# Contributor Quickstart: Editing the IgnitionAI Docs

**Feature**: 014-docs-complete
**Audience**: Anyone adding or editing a page under `/docs`

This is a two-page onboarding for contributors. It is **not** the reader-facing Quickstart (that one lives at `packages/web/content/quickstart.mdx`).

## Where docs live

```text
packages/web/
├── content/                     ← All doc pages are here
│   ├── _meta.js                 ← Top-level sidebar order
│   ├── index.mdx                ← /docs
│   ├── quickstart.mdx           ← /docs/quickstart
│   ├── algorithms/
│   │   ├── _meta.js
│   │   ├── index.mdx
│   │   ├── dqn.mdx
│   │   ├── ppo.mdx
│   │   └── q-table.mdx
│   ├── how-it-works/
│   │   ├── _meta.js
│   │   ├── index.mdx
│   │   ├── core.mdx
│   │   ├── backend-tfjs.mdx
│   │   ├── backend-onnx.mdx
│   │   └── storage.mdx
│   ├── r3f.mdx
│   └── tutorials/
│       ├── _meta.js
│       ├── index.mdx
│       └── grid-world.mdx
├── app/docs/layout.tsx          ← Nextra shell — don't touch unless you're changing the chrome
├── app/docs/[[...mdxPath]]/page.jsx  ← Catch-all route — don't touch
├── mdx-components.jsx           ← MDX → theme components bridge
└── next.config.mjs              ← Nextra wrapper with contentDirBasePath: '/docs'
```

## Run the dev server

```bash
pnpm --filter web dev
# http://localhost:3000/docs
```

The page updates on save. If the sidebar doesn't pick up a new file, restart the dev server once — Nextra caches the page map.

## Build before merging

```bash
pnpm --filter web build
```

A failing `build` is a blocker. The most common cause is a broken MDX import or a link to a non-existent page.

## Style guide

**Prose**

- Short sentences. Under 25 words.
- Active voice. "The agent learns" beats "learning is performed by the agent".
- Concrete before abstract. Show a code block, then explain.
- No idioms, no sarcasm — this site is read by non-English natives.
- Every paragraph earns its place. Delete the ones that don't.

**Code blocks**

- Every block has a language tag: ` ```ts ` not ` ``` `.
- Every file-scoped example declares its filename: ` ```ts filename="cartpole.ts" `.
- No `...` placeholders inside imports or class bodies. If a block cannot be runnable, use a prose explanation instead.
- Code imports from the **real** published packages: `@ignitionai/core`, `@ignitionai/backend-tfjs`, `@ignitionai/backend-onnx`, `@ignitionai/storage`. Never from an unpublished umbrella name.

**Hyperparameters**

- Every default cited in an algorithm page must match the source of truth in `packages/backend-tfjs/src/agents/<algo>.ts`. Before shipping, re-run the verification: `grep -n "lr:\|gamma:\|epsilon" packages/backend-tfjs/src/agents/*.ts`.
- If you change a default in the framework, update the docs in the same commit.

**Links**

- Use relative links for in-site navigation: `[Quickstart](/docs/quickstart)`.
- Use full `https://` links for external references (GitHub source, papers, npm pages).

## Adding a new page

1. Create the `.mdx` file under `packages/web/content/` in the right subdirectory.
2. Add front-matter at the top:
   ```yaml
   ---
   title: Your page title
   description: One-line description for SEO and search results
   ---
   ```
3. Update the sibling `_meta.js` to include the new file in sidebar order.
4. Add Previous / Next links at the bottom.
5. `pnpm --filter web dev` and verify the page renders, the sidebar updates, and all links resolve.
6. `pnpm --filter web build` and verify there are no broken links.

## Renaming / deleting a page

- Update the sibling `_meta.js` in the same commit.
- Grep the entire `content/` directory for inbound links to the old path and fix them.
- If the page had a meaningful external URL (appears on GitHub README, npm page, social posts), add a redirect in `next.config.mjs`.

## Preview before you ship

Before opening the PR:

- [ ] Page renders at its route in `pnpm --filter web dev`
- [ ] Sidebar shows the page in the right position
- [ ] All in-page links resolve (click every one)
- [ ] All code blocks have language tags
- [ ] `pnpm --filter web build` passes
- [ ] No `[NEEDS CLARIFICATION]`, `TODO`, or `...` placeholders
