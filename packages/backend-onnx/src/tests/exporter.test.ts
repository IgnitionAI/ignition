import { describe, it, expect } from 'vitest';
import { generateConversionScript } from '../exporter';

describe('generateConversionScript', () => {
  it('includes the source model dir', () => {
    const script = generateConversionScript('/models/dqn', '/models/dqn_savedmodel', '/models/dqn.onnx');
    expect(script).toContain('/models/dqn/model.json');
  });

  it('includes the savedmodel output dir', () => {
    const script = generateConversionScript('/models/dqn', '/models/dqn_savedmodel', '/models/dqn.onnx');
    expect(script).toContain('/models/dqn_savedmodel');
  });

  it('includes the onnx output path', () => {
    const script = generateConversionScript('/models/dqn', '/models/dqn_savedmodel', '/models/dqn.onnx');
    expect(script).toContain('/models/dqn.onnx');
  });

  it('uses opset 13', () => {
    const script = generateConversionScript('/a', '/b', '/c.onnx');
    expect(script).toContain('--opset 13');
  });

  it('is a valid bash script', () => {
    const script = generateConversionScript('/a', '/b', '/c.onnx');
    expect(script.startsWith('#!/bin/bash')).toBe(true);
  });
});
