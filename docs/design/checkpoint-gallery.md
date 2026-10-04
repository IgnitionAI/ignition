# Compatible checkpoint gallery — issue #35 source plan

## Analysis

No public checkpoint gallery exists. ModelInfo does not require semantic contracts or evaluation provenance. The SAC lot now retains five real final policies from a frozen point-mass protocol with exact reproduced results. Existing racing reports include contact physics different from the current interactive ghost race, so their scores cannot silently become current comparable gallery results. Root and backend package metadata declare MIT; the root README license-file link is missing, so the gallery will explicitly attribute the declared license to package metadata rather than invent a separate model license document.

## Desired behavior and scope

A visitor discovers checkpoints with their algorithm, environment/observation/action versions, provenance, declared license, evaluation protocol and limitations. Loading validates metadata and the actual downloaded artifact before applying it to the compatible environment. Provide an operational public gallery with all five verified SAC policies and an embedded real point-mass consumer; an incompatible checkpoint, malformed catalogue, missing file or failed network request yields a visible error. Public Hugging Face files are supported through pinned read-only sources. No token enters the website.

Out of scope: uploading models to public HF repositories, comparisons across unrelated protocols, accounts, billing, arbitrary agent formats, changing the existing eight-demo inventory, or claiming the authenticated #31 integration is proved by gallery tests.

## Decisions

1. Storage owns a reusable versioned catalogue schema and loader. Entries include semantic algorithm/checkpoint/environment/observation/action contracts; observation dimensions and action bounds/count; source, expected SHA256 and byte size; commit/seed/budget/backend provenance; license identifier/source; mandatory evaluation protocol and optional measured outcomes; explicit limits. Require unique IDs and bounded manifest/artifact sizes.
2. Support trusted local absolute paths and hf:// equivalents via structured public HF repoId/full commit revision/file. Construct pinned resolve URLs, omit credentials, reject invalid paths. Check compatibility before requesting; check actual size/hash and artifact envelope contract before calling the native validator. Never silently use a fallback policy. The generic loader cannot claim native weight validation; the real consumer performs SAC schema/config/weight-shape validation before swapping the policy.
3. Curate all five final SAC policies without winner selection. Model envelopes and reports are static site assets; manifest/checkpoint hashes and measured fields are generated from retained raw proof and checked at build. License is explicitly MIT as declared in package.json, with source link. No general convergence or isolated timing claim.
4. Add /models using the existing site layout and navigation, with readable cards, protocol/report downloads, source/license/limits and explicit loading/error states. Allow bounded JSON catalogue file import for public HF sources. Selecting a model loads a same-origin embedded actual point-mass application through a documented message protocol, guarded by origin/source. No private globals/hooks. The child validates the native snapshot and runs actual frozen inference, evaluation and persistence.
5. Build the lab and validate/copy catalogue assets during the existing web prebuild, reusing the workspace esbuild tool. Preserve previous generated assets in scratch backups; never rm -rf. Keep the eight-demo catalogue unchanged.

## Acceptance and verification

- Public loader tests protect semantic compatibility before network/mutation, pinned source resolution, integrity/size mismatch, invalid envelope/native validator failure and HTTP errors. Use real Response bytes and Crypto, mock only transport; no private predicate/source-list tests or production test hooks.
- Storage types/build, affected web types/lint and complete source/web build pass; original SAC task/weights are unchanged.
- Chromium: all five entries with exact report-derived measures; load real model, observe true 20,000/9,751 counters, complete frozen episode/quick evaluation; select another seed; download artifacts; import incompatible catalogue/payload and observe refusal; missing HF file/network errors visible; mobile layout and console errors checked. Display every captured screenshot.
- Verify all hashes and report/source links from the production artifact, exact catalogue/read-back and native consumer checkpoint correspondence. Preserve evidence under docs/verification/checkpoint-gallery.
- Review spec/standards, then verify every #35 criterion before comment/closure. #31 remains independently dependent on authenticated remote proof.

Analyze complete; this plan is authoritative. Next: implement -> code-review -> verify.
