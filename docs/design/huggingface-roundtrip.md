# Hugging Face persistence — issue #31 delivery plan

## Analysis

The provider uploads JSON.stringify(model.toJSON()) and concatenates unnamed weights. In TFJS 4.22, toJSON returns a topology string, not a loadable model document. Real save handlers supply modelTopology, weightSpecs and weightData. Existing tests mock loadLayersModel and miss this defect. Loading also omits authentication, although list/exists send a token. The existing authenticated backend tests cover another path.

## Desired behavior and scope

A real TFJS model survives provider save/load with identical shapes, weights and inference. Topology and weights requests use configured authentication. Preserve public methods, metadata and file paths. A successful opt-in authenticated remote round-trip in an isolated repository remains necessary to complete #31.

Out of scope: publishing curated public models, changing other providers, mandatory fork secrets, recovering old files without their missing weight specs.

## Decisions

1. Use a LayersModel save handler. Upload modelTopology, format/provenance and weightsManifest pointing to weights.bin with actual named specs, alongside exact handler binary data.
2. Use TFJS requestInit Authorization for topology and weights. Preserve retries/delays, validate arguments and avoid delay after the final failure. Never print credentials.
3. Ignore only an SDK repository conflict (HubApiError.statusCode 409); propagate auth/network failures.
4. Owner-boundary regression uses a real model and loader. Mock only transport; store exact uploaded Blobs and serve them back. Compare shapes, weights and fixed-observation inference. Demonstrate failure before repair. Check auth and missing-file failures separately. No test-only production hooks.
5. Opt-in actual provider integration uses HF_TOKEN and dedicated HF_TEST_REPO_ID. Explicit skip without both. Unique model path; round-trip a small model and clean only its created files, recording cleanup failure. Preserve sanitized evidence.

## Verification and acceptance

Regression red before fix, green after; full storage tests and strict types/build. Verify transported bytes, authentication, errors, resource disposal and unchanged API call sites. Inspect provider/SDK implementations during review. Actual authenticated HF round-trip stays NOT PROVEN until executed and cleaned successfully; local transport success cannot close #31. Read back external issue/PR state.

Analyze complete. Plan authoritative. Next: implement -> code-review -> verify, then remote verification when access exists.
