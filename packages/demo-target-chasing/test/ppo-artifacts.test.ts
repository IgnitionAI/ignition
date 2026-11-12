import { describe, expect, it } from 'vitest';
import { fetchJson, missingArtifactMessage, parseEpisodeReturns } from '../src/ppo/artifacts';

describe('PPO demo artifacts', () => {
  it('formats an explicit missing-checkpoint error', () => {
    expect(missingArtifactMessage('/ppo/missing.json', 404)).toBe(
      'PPO checkpoint/log absent: /ppo/missing.json (404)',
    );
  });

  it('rejects a simulated success payload that is not a log', () => {
    expect(() => parseEpisodeReturns({ fake: true, reward: 999 })).toThrow(
      /not an array of numbers/,
    );
  });

  it('treats an HTML fallback as a missing artifact, not a successful load', async () => {
    const fetchImpl = async () =>
      new Response('<!DOCTYPE html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
    await expect(fetchJson('/ppo/does-not-exist.json', fetchImpl as typeof fetch)).rejects.toThrow(
      /PPO checkpoint\/log absent/,
    );
  });
});
