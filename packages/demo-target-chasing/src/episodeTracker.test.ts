import { describe, expect, it } from 'vitest';

import { createEpisodeTracker } from './episodeTracker';
import type { TrainingFrame } from '@ignitionai/viz';

describe('createEpisodeTracker', () => {
  it('accumule reward/steps et émet une frame par épisode', () => {
    const frames: TrainingFrame[] = [];
    const tracker = createEpisodeTracker((frame) => frames.push(frame));

    tracker.step(0.5);
    tracker.step(1.5);
    tracker.end(true);

    tracker.step(-0.25);
    tracker.end(false);

    expect(frames).toEqual([
      { episode: 1, reward: 2, steps: 2, success: true },
      { episode: 2, reward: -0.25, steps: 1, success: false },
    ]);
  });
});
