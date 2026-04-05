import { describe, it, expect, vi, afterEach } from 'vitest';
import '@tensorflow/tfjs-backend-cpu';
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
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // webgpu is not available in Node.js test environment — should fallback silently
    await expect(setBackend('webgpu')).resolves.toBeUndefined();
  });
});
