import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted fixtures (available before vi.mock hoisting) ──────────────────
const { fakeModel } = vi.hoisted(() => {
  const fakeModel = {
    toJSON: vi.fn().mockReturnValue({ class_name: 'Sequential', config: {} }),
    getWeights: vi.fn().mockReturnValue([
      { size: 4, dataSync: () => new Float32Array([0.1, 0.2, 0.3, 0.4]) },
    ]),
    dispose: vi.fn(),
  };
  return { fakeModel };
});

// ── Mock @huggingface/hub ─────────────────────────────────────────────────
vi.mock('@huggingface/hub', () => ({
  createRepo: vi.fn().mockResolvedValue(undefined),
  uploadFiles: vi.fn().mockResolvedValue(undefined),
  commit: vi.fn().mockResolvedValue(undefined),
}));

// ── Mock @tensorflow/tfjs ─────────────────────────────────────────────────
vi.mock('@tensorflow/tfjs', () => ({
  loadLayersModel: vi.fn().mockResolvedValue(fakeModel),
}));

// ── Mock global fetch ─────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── Imports after mocks ───────────────────────────────────────────────────
import { commit, createRepo, uploadFiles } from '@huggingface/hub';
import * as tf from '@tensorflow/tfjs';
import { HuggingFaceProvider } from '../src/providers/huggingface';

const TEST_CONFIG = { token: 'hf_testtoken123', repoId: 'testuser/test-repo' };

describe('HuggingFaceProvider', () => {
  let provider: HuggingFaceProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    // restore default mock return values after clearAllMocks
    vi.mocked(tf.loadLayersModel).mockResolvedValue(fakeModel as any);
    provider = new HuggingFaceProvider(TEST_CONFIG);
  });

  // ── save ────────────────────────────────────────────────────────────────

  describe('save()', () => {
    it('creates repo and uploads model + weights files', async () => {
      await provider.save('my-model', fakeModel as any);

      expect(createRepo).toHaveBeenCalledWith({
        repo: 'testuser/test-repo',
        accessToken: 'hf_testtoken123',
      });

      const uploadCall = vi.mocked(uploadFiles).mock.calls[0][0] as any;
      expect(uploadCall.repo).toBe('testuser/test-repo');
      expect(uploadCall.accessToken).toBe('hf_testtoken123');

      const paths = uploadCall.files.map((f: any) => f.path);
      expect(paths).toContain('my-model/model.json');
      expect(paths).toContain('my-model/weights.bin');
    });

    it('returns the correct hf:// URI', async () => {
      const uri = await provider.save('checkpoint-1', fakeModel as any);
      expect(uri).toBe('hf://testuser/test-repo/checkpoint-1');
    });

    it('includes metadata.json when metadata is provided', async () => {
      await provider.save('checkpoint-2', fakeModel as any, { step: 42 });

      const uploadCall = vi.mocked(uploadFiles).mock.calls[0][0] as any;
      const paths = uploadCall.files.map((f: any) => f.path);
      expect(paths).toContain('checkpoint-2/metadata.json');
    });

    it('does not include metadata.json when metadata is omitted', async () => {
      await provider.save('checkpoint-3', fakeModel as any);

      const uploadCall = vi.mocked(uploadFiles).mock.calls[0][0] as any;
      const paths = uploadCall.files.map((f: any) => f.path);
      expect(paths).not.toContain('checkpoint-3/metadata.json');
    });

    it('silently ignores createRepo errors (repo already exists)', async () => {
      vi.mocked(createRepo).mockRejectedValueOnce(new Error('already exists'));
      await expect(provider.save('model', fakeModel as any)).resolves.toBeDefined();
    });
  });

  // ── load ────────────────────────────────────────────────────────────────

  describe('load()', () => {
    it('calls tf.loadLayersModel with the correct URL', async () => {
      const model = await provider.load('best-model');

      expect(tf.loadLayersModel).toHaveBeenCalledWith(
        'https://huggingface.co/testuser/test-repo/resolve/main/best-model/model.json'
      );
      expect(model).toBe(fakeModel);
    });

    it('retries on failure and eventually throws', async () => {
      vi.mocked(tf.loadLayersModel)
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('network error'));

      await expect(provider.load('failing-model', 3, 0)).rejects.toThrow('network error');
      expect(tf.loadLayersModel).toHaveBeenCalledTimes(3);
    });

    it('succeeds on second attempt after initial failure', async () => {
      vi.mocked(tf.loadLayersModel)
        .mockRejectedValueOnce(new Error('temporary error'))
        .mockResolvedValueOnce(fakeModel as any);

      const model = await provider.load('flaky-model', 3, 0);
      expect(model).toBe(fakeModel);
      expect(tf.loadLayersModel).toHaveBeenCalledTimes(2);
    });
  });

  // ── list ────────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('returns ModelInfo for each directory containing model.json', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          siblings: [
            { rfilename: 'checkpoint-1/model.json' },
            { rfilename: 'checkpoint-1/weights.bin' },
            { rfilename: 'checkpoint-2/model.json' },
            { rfilename: 'checkpoint-2/weights.bin' },
            { rfilename: 'README.md' },
          ],
        }),
      });

      const models = await provider.list();
      expect(models).toHaveLength(2);
      expect(models.map(m => m.modelId)).toEqual(
        expect.arrayContaining(['checkpoint-1', 'checkpoint-2'])
      );
      expect(models[0].uri).toMatch(/^hf:\/\/testuser\/test-repo\//);
    });

    it('returns empty array when repo has no model directories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ siblings: [{ rfilename: 'README.md' }] }),
      });

      const models = await provider.list();
      expect(models).toHaveLength(0);
    });

    it('throws when the API call fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(provider.list()).rejects.toThrow('404');
    });
  });

  // ── delete ──────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('commits delete operations for model.json and weights.bin', async () => {
      await provider.delete('old-model');

      expect(commit).toHaveBeenCalledWith(
        expect.objectContaining({
          repo: 'testuser/test-repo',
          accessToken: 'hf_testtoken123',
          operations: expect.arrayContaining([
            { operation: 'delete', path: 'old-model/model.json' },
            { operation: 'delete', path: 'old-model/weights.bin' },
          ]),
        })
      );
    });
  });

  // ── exists ──────────────────────────────────────────────────────────────

  describe('exists()', () => {
    it('returns true when model.json responds with 200', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });
      const result = await provider.exists('my-model');
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://huggingface.co/testuser/test-repo/resolve/main/my-model/model.json',
        expect.objectContaining({ method: 'HEAD' })
      );
    });

    it('returns false when model.json responds with 404', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      const result = await provider.exists('missing-model');
      expect(result).toBe(false);
    });

    it('returns false when fetch throws (network error)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network error'));
      const result = await provider.exists('unreachable-model');
      expect(result).toBe(false);
    });
  });

  // ── config validation ────────────────────────────────────────────────────

  describe('parseHFConfig()', () => {
    it('throws when HF_TOKEN is missing', async () => {
      const { parseHFConfig } = await import('../src/config');
      expect(() => parseHFConfig({ HF_REPO_ID: 'user/repo' })).toThrow();
    });

    it('throws when HF_TOKEN does not start with hf_', async () => {
      const { parseHFConfig } = await import('../src/config');
      expect(() =>
        parseHFConfig({ HF_TOKEN: 'bad-token', HF_REPO_ID: 'user/repo' })
      ).toThrow(/hf_/);
    });

    it('throws when HF_REPO_ID is not in owner/repo format', async () => {
      const { parseHFConfig } = await import('../src/config');
      expect(() =>
        parseHFConfig({ HF_TOKEN: 'hf_valid', HF_REPO_ID: 'noslash' })
      ).toThrow();
    });

    it('returns parsed config when inputs are valid', async () => {
      const { parseHFConfig } = await import('../src/config');
      const config = parseHFConfig({ HF_TOKEN: 'hf_abc123', HF_REPO_ID: 'user/repo' });
      expect(config).toEqual({ token: 'hf_abc123', repoId: 'user/repo' });
    });
  });
});
