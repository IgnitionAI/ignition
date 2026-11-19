import { describe, expect, it } from 'vitest';
import {
  fetchJson,
  formatPpoNumber,
  PpoArtifactMissingError,
  ppoArtifactUrl,
} from '../src/ppo/artifacts';

describe('PPO artifact URLs under a Vite base', () => {
  it('resolves artifacts at the site root during local dev', () => {
    expect(ppoArtifactUrl('manifest.json', '/')).toBe('/ppo/manifest.json');
    expect(ppoArtifactUrl('', '/')).toBe('/ppo');
  });

  it('resolves artifacts under the website demo route', () => {
    const base = '/demos/target-chasing/';
    expect(ppoArtifactUrl('manifest.json', base)).toBe('/demos/target-chasing/ppo/manifest.json');
    expect(ppoArtifactUrl('/seed-29/episodes.json', base)).toBe(
      '/demos/target-chasing/ppo/seed-29/episodes.json',
    );
    expect(ppoArtifactUrl('', '/demos/target-chasing')).toBe('/demos/target-chasing/ppo');
  });

  it('keeps url and status on a missing artifact so the UI can localize it', async () => {
    const fetchImpl = async () => new Response('not found', { status: 404 });
    const error = await fetchJson('/demos/target-chasing/ppo/x.json', fetchImpl as typeof fetch).catch(
      (cause: unknown) => cause,
    );
    expect(error).toBeInstanceOf(PpoArtifactMissingError);
    expect((error as PpoArtifactMissingError).url).toBe('/demos/target-chasing/ppo/x.json');
    expect((error as PpoArtifactMissingError).status).toBe(404);
  });

  it('formats returns with the French decimal comma', () => {
    expect(formatPpoNumber(-1.2500000000000002, 'fr', 'absent', 3)).toBe('-1,250');
    expect(formatPpoNumber(0.85, 'en', 'absent', 3)).toBe('0.850');
    expect(formatPpoNumber(null, 'fr', 'absent')).toBe('absent');
  });
});
