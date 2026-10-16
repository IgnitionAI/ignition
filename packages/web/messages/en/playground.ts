export const playground = {
  eyebrow: 'Interactive Playground',
  title: 'Train an agent in your browser',
  description:
    'Pick an algorithm, hit Train, and watch the reward climb in real time. This is a simulation — open a live demo below to run real RL.',
  labels: {
    algorithm: 'Algorithm',
    speed: 'Speed',
  },
  actions: {
    train: 'Train',
    stop: 'Stop',
  },
  status: {
    ready: 'Ready',
    training: 'Training...',
    stopped: 'Stopped',
  },
  // {count} = nombre d'épisodes simulés
  episodes: '{count} episodes',
  emptyChart: 'Click Train to start',
  axes: {
    episode: 'Episode {count}',
    reward: 'Reward {count}',
  },
  stats: {
    episodes: 'Episodes',
    latestReward: 'Latest reward',
    bestReward: 'Best reward',
  },
}
