# Hugging Face provider verification — #31

## Local runtime PASS; authenticated remote NOT PROVEN

The pre-fix provider double-encoded the model topology and omitted named weight specs/weightsManifest. A real TFJS 4.22 model cannot load the resulting HTTP document. `roundtrip-before.json` records that precise loader failure. After repair, provider.save uploads a real TFJS save-handler document and binary weights; provider.load uses the actual TFJS HTTP loader over a fixture transport that serves the exact uploaded Blobs. It restores input/output shape `[null,2]`, weights `[[1,-2,3,4],[0.5,-0.5]]`, and fixed-observation predictions `[-0.5,-8.5,9.5,11.5]`. Metadata round-trips separately. No model/loader mock stands in for this proof; no public HF service is involved in this local test.

`auth-before.json` isolates the former missing-request-auth behavior after serialization works: its public transport authentication check fails. `repo-error-before.json` isolates the previous blanket repository-creation catch: save resolves after a 401 instead of rejecting. Repairs authenticate topology and weights, ignore only SDK HubApiError 409 conflicts, and propagate auth/network failures. The SDK's actual HubApiError/createRepo implementation was inspected. Retry validation and removal of the final unnecessary delay preserve load's public signature.

`storage-tests.json`: 23 PASS, zero FAIL, one explicit SKIP because the authenticated provider integration needs both HF_TOKEN and HF_TEST_REPO_ID. Storage build and strict no-emit compilation of all three test files pass. Review: spec PASS for the local serialization/auth/error repair; standards PASS. Full issue verification remains NOT PROVEN because no authenticated remote run exists.

## Reproduction

From a source checkout with locked dependencies:

```sh
pnpm exec vitest run packages/storage/test
pnpm --filter @ignitionai/storage build
```

For an actual authenticated test, supply HF_TOKEN and HF_TEST_REPO_ID through a secrets environment. The dedicated repository must already exist and be private. Do not put tokens in terminal arguments or committed files. Then run:

```sh
pnpm exec vitest run packages/storage/test/huggingface-live.test.ts
```

The test uses a unique model directory, verifies exact weights/inference, and deletes only its three created files in finally. Cleanup is read back with an authenticated HEAD requiring HTTP 404; auth/network errors cannot count as successful cleanup. It retains sanitized `.scratch/hf-live-roundtrip.json`, with no token values. It does not delete the repository. Old malformed files cannot be repaired automatically without their missing weight specification; re-save from the original model.

A manual-only GitHub workflow uses the same opt-in test and uploads sanitized evidence. It fails its prerequisite step when secrets are missing, rather than reporting an integration success from a skipped test. It never receives secrets through fork PR events. Repository secret-name listing currently returns no entries; local integration was skipped. Do not close #31 until actual remote PASS and successful cleanup are recorded.
