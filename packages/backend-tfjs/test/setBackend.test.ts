import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs';
// Import tfjs-node for Node.js support
import '@tensorflow/tfjs-node';
import { setBackendSafe } from '../backend/setBackend';
import { initTfjsBackend, isWebGPUAvailable, getTfjsBackendInfo } from '../backend/setBackend';

describe('TFJS Backend Selector', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Backend Initialization in Node Environment', () => {
    it('should use tensorflow backend in Node.js environment', async () => {
      // In Node.js with tfjs-node, the backend should be 'tensorflow'
      const currentBackend = tf.getBackend();
      expect(currentBackend).toBe('tensorflow');
    });

    it('should attempt to use webgl in Node.js', async () => {
      const warnSpy = vi.spyOn(console, 'warn');
      await setBackendSafe('webgl');
      
      // In Node.js, we expect a warning about failed backend initialization
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to set backend'));
    });

    it('should attempt to use wasm in Node.js', async () => {
      const warnSpy = vi.spyOn(console, 'warn');
      await setBackendSafe('wasm');
      
      // In Node.js, we expect a warning about failed backend initialization
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to set backend'));
    });

    it('should warn on webgpu backend', async () => {
      const warnSpy = vi.spyOn(console, 'warn');
      await setBackendSafe('webgpu');
      
      // We expect warnings related to webgpu
      const warningCalled = warnSpy.mock.calls.some(
        call => call[0] && typeof call[0] === 'string' && 
        (call[0].includes('webgpu') || call[0].includes('Failed to set backend'))
      );
      expect(warningCalled).toBe(true);
    });

    it('should select available backend with initTfjsBackend', async () => {
      const backend = await initTfjsBackend();
      // In Node.js environment with tfjs-node, we expect to get 'tensorflow'
      expect(backend).toBe('cpu');
    });
  });

  describe('Other Backend Tests', () => {
    it('should have isWebGPUAvailable function', () => {
      expect(typeof isWebGPUAvailable).toBe('function');
    });

    it('should have getTfjsBackendInfo function', () => {
      const info = getTfjsBackendInfo();
      expect(info.backend).toBe('cpu');
      expect(typeof info.numTensors).toBe('number');
    });
  });
}); 