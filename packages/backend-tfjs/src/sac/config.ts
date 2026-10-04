import { validateContinuousBounds, type BoxSpace, type ContinuousActionBounds } from '@ignitionai/core';

export interface SACConfig {
  inputSize: number;
  actionSpace: BoxSpace;
  hiddenLayers?: number[];
  lr?: number;
  gamma?: number;
  alpha?: number;
  tau?: number;
  batchSize?: number;
  memorySize?: number;
  warmup?: number;
  updateEvery?: number;
  seed?: number;
}

export interface SACSettings {
  inputSize: number; hiddenLayers: number[]; lr: number; gamma: number; alpha: number; tau: number;
  batchSize: number; memorySize: number; warmup: number; updateEvery: number; seed: number;
}

export function resolveSACConfig(config: SACConfig): { settings: SACSettings; bounds: ContinuousActionBounds } {
  const bounds = validateContinuousBounds(config.actionSpace);
  const settings: SACSettings = {
    inputSize: config.inputSize, hiddenLayers: [...(config.hiddenLayers ?? [32, 32])],
    lr: config.lr ?? 0.0003, gamma: config.gamma ?? 0.99, alpha: config.alpha ?? 0.05,
    tau: config.tau ?? 0.005, batchSize: config.batchSize ?? 64, memorySize: config.memorySize ?? 10000,
    warmup: config.warmup ?? 500, updateEvery: config.updateEvery ?? 2, seed: config.seed ?? 11,
  };
  const positiveIntegers = [settings.inputSize, settings.batchSize, settings.memorySize,
    settings.updateEvery, ...settings.hiddenLayers];
  if (!positiveIntegers.every(value => Number.isSafeInteger(value) && value > 0)
    || settings.memorySize > 0xffffffff || settings.memorySize < settings.batchSize || !settings.hiddenLayers.length
    || !Number.isSafeInteger(settings.warmup) || settings.warmup < 0
    || !Number.isInteger(settings.seed) || settings.seed < 0 || settings.seed > 0xffffffff
    || !Number.isFinite(Math.fround(settings.lr)) || !(Math.fround(settings.lr) > 0)
    || !Number.isFinite(settings.gamma) || settings.gamma < 0 || settings.gamma > 1
    || !Number.isFinite(Math.fround(settings.alpha)) || settings.alpha < 0
    || !Number.isFinite(settings.tau) || settings.tau <= 0 || settings.tau > 1) {
    throw new Error('[SAC] Invalid configuration');
  }
  for (let i = 0; i < bounds.size; i++) {
    const low = Math.fround(bounds.low[i]), high = Math.fround(bounds.high[i]);
    const scale = Math.fround((bounds.high[i] - bounds.low[i]) / 2);
    if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low || !(scale > 0) || !Number.isFinite(scale)) {
      throw new Error('[SAC] Bounds must be distinct finite float32 values');
    }
  }
  Object.freeze(settings.hiddenLayers);
  Object.freeze(settings);
  return { settings, bounds };
}
