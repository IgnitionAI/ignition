# Hugging Face Hub (load only)

`loadOnnxModelFromHub` downloads a **public** `.onnx` with `fetch`. It does not accept a token, Authorization header, or Hub write API.

```ts
import { loadOnnxModelFromHub, OnnxAgent } from '@ignitionai/backend-onnx';

const buffer = await loadOnnxModelFromHub('org-or-user/public-repo', 'model.onnx');
const agent = new OnnxAgent({ modelPath: buffer, actionSize: 2, inputName, outputName });
await agent.load();
```

URL shape: `https://huggingface.co/<repoId>/resolve/main/<filename>`.

Retries: up to `maxRetries` (default 3) with exponential backoff starting at 2s.

Do not embed access tokens, cookies, or private repo IDs in skills, tests, or examples. Publishing models is out of scope for this skill.
