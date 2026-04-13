# Spec: Tutorial — Export to Unity via ONNX

**Branch**: `014-docs-complete` (bundled) | **Created**: 2026-04-13 | **Parent**: 014-docs-complete

## Summary

Add `/docs/tutorials/onnx-unity.mdx`. The full Train → Export → Convert → Deploy round-trip. Takes the CartPole policy from the Quickstart, exports it to an `.onnx` file, and drops it into a Unity Sentis project. This is IgnitionAI's deploy story in one tutorial.

## User Story (P3)

A game developer has trained an agent in the browser and wants to ship it in a Unity game. This tutorial shows the complete flow end-to-end so they can evaluate whether IgnitionAI fits into their deploy pipeline.

## Functional Requirements

- **FR-1**: Page exists at `packages/web/content/tutorials/onnx-unity.mdx`.
- **FR-2**: `tutorials/_meta.js` includes `'onnx-unity': 'Export to Unity (ONNX)'`.
- **FR-3**: Four steps mapping to the Train → Export → Convert → Deploy pipeline from `backend-onnx.mdx`.
- **FR-4**: `tf2onnx` Python conversion step documented with exact install command.
- **FR-5**: Unity Sentis integration with a minimal C# snippet.
- **FR-6**: Clear "publish pending" callout for `@ignitionai/backend-onnx` matching the how-it-works page.

## Success Criteria

- Reader finishes in ~60 minutes (includes Unity install, which is slow).
- Reader can explain the 4-stage pipeline without re-reading.
- Build passes.
