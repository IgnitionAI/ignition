import type { playground as PlaygroundMessages } from '../en/playground'

export const playground = {
  eyebrow: 'Terrain de jeu interactif',
  title: 'Entraînez un agent dans votre navigateur',
  description:
    'Choisissez un algorithme, lancez l’entraînement et regardez la récompense grimper en temps réel. Ceci est une simulation — ouvrez une démo en direct ci-dessous pour du vrai RL.',
  labels: {
    algorithm: 'Algorithme',
    speed: 'Vitesse',
  },
  actions: {
    train: 'Entraîner',
    stop: 'Arrêter',
  },
  status: {
    ready: 'Prêt',
    training: 'Entraînement…',
    stopped: 'Arrêté',
  },
  episodes: '{count} épisodes',
  emptyChart: 'Cliquez sur Entraîner pour démarrer',
  axes: {
    episode: 'Épisode {count}',
    reward: 'Récompense {count}',
  },
  stats: {
    episodes: 'Épisodes',
    latestReward: 'Dernière récompense',
    bestReward: 'Meilleure récompense',
  },
} satisfies typeof PlaygroundMessages
