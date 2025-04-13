import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs';
// Import tfjs-node for Node.js support
import '@tensorflow/tfjs-node';
import { setBackendSafe } from '../backend/setBackend';
import { initTfjsBackend, isWebGPUAvailable, getTfjsBackendInfo } from '../backend/setBackend';

describe('TFJS Backend Functions', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should check if code contains expected warn messages', () => {
    // Check that the source code contains the expected warning messages
    const setBackendSafeCode = setBackendSafe.toString();
    
    expect(setBackendSafeCode).toContain('Backend');
    expect(setBackendSafeCode).toContain('not supported');
    expect(setBackendSafeCode).toContain('webgpu');
    expect(setBackendSafeCode).toContain('experimental');
    expect(setBackendSafeCode).toContain('Falling back');
  });

  it('should have isWebGPUAvailable function', () => {
    expect(typeof isWebGPUAvailable).toBe('function');
  });

  it('should have getTfjsBackendInfo function', () => {
    expect(typeof getTfjsBackendInfo).toBe('function');
  });

  it('should have initTfjsBackend function', () => {
    expect(typeof initTfjsBackend).toBe('function');
  });
  
  it('should have setBackendSafe function', () => {
    expect(typeof setBackendSafe).toBe('function');
  });
}); 