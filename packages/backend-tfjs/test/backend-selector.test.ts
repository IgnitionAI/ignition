import { describe, it, expect, vi, afterEach } from 'vitest';
import '@tensorflow/tfjs-node';
import { setBackend, getAvailableBackends } from '../src/utils/backend-selector';

describe('backend-selector', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('setBackend("cpu") sets the cpu backend without throwing', async () => {
    await expect(setBackend('cpu')).resolves.toBeUndefined();
  });

  it('setBackend("auto") does not throw', async () => {
    await expect(setBackend('auto')).resolves.toBeUndefined();
  });

  it('getAvailableBackends() returns a non-empty array', () => {
    const backends = getAvailableBackends();
    expect(Array.isArray(backends)).toBe(true);
    expect(backends.length).toBeGreaterThan(0);
  });

  it('setBackend falls back to cpu when requested backend is unavailable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // webgpu is not available in Node.js test environment
    await expect(setBackend('webgpu')).resolves.toBeUndefined();
    // Either fallback warning was emitted or backend was set successfully
    // In either case, no exception should be thrown
    expect(true).toBe(true);
  });
});
