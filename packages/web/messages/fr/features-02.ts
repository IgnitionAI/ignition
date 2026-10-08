import type { features02 as Features02Messages } from '../en/features-02'

export const features02 = {
  title: 'Tout ce qu’il faut pour shipper du RL.',
  subtitleBefore: 'Trois algorithmes, une auto-configuration, un export ONNX, du stockage HuggingFace et ',
  subtitleAfter: ' démos fonctionnelles. 100 % TypeScript, 100 % open source.',
  deploy: {
    title: 'Entraîner → ONNX → déployer partout',
    description: 'Entraînez dans le navigateur avec TensorFlow.js, puis exportez en ONNX et déployez dans Unity (Sentis), Unreal (NNE), Python, C++ ou sur des devices edge. Un seul pipeline, du prototype à la production.',
    learnMore: 'En savoir plus',
    diagramLabel: 'Entraîner dans le navigateur, exporter en ONNX, déployer partout',
  },
  algorithms: {
    title: 'Trois algorithmes, une seule API',
    descriptionBefore: 'DQN, PPO et Q-Learning tabulaire. Basculez en un mot : ',
    trainCode: 'env.train(\'ppo\')',
    descriptionAfter: '. Ne redéfinissez les hyperparamètres que lorsque vous avez besoin d’un contrôle fin.',
    diagramLabel: 'DQN, PPO, Q-Table — trois algorithmes, une seule API',
  },
  r3f: {
    title: 'R3F-first',
    description: 'Associez-le à votre scène Three.js — la boucle d’entraînement tourne indépendamment de la boucle de rendu.',
    diagramLabel: 'Intégration React Three Fiber',
  },
  list: [
    {
      title: 'Auto-configuration',
      descriptionBefore: 'Taille des entrées déduite de ',
      code: 'observe()',
      descriptionMiddle: ', taille des actions depuis ',
      code2: 'actions.length',
      descriptionAfter: '. Vous ne touchez jamais au code du réseau.',
    },
    {
      title: 'Accélération WebGPU',
      descriptionBefore: 'TensorFlow.js sélectionne automatiquement WebGPU → WebGL → WASM → CPU. Sans CUDA, sans installation.',
      code: '',
      descriptionMiddle: '',
      code2: '',
      descriptionAfter: '',
    },
    {
      title: 'Entraînement turbo',
      descriptionBefore: '',
      code: 'env.setSpeed(50)',
      descriptionMiddle: ' — convergence 50× plus rapide. Revenez à 1× pour regarder l’agent jouer.',
      code2: '',
      descriptionAfter: '',
    },
    {
      title: 'Stockage HuggingFace',
      descriptionBefore: 'Sauvegardez et chargez des modèles entraînés depuis HF Hub en une ligne. Partagez les poids comme un dataset.',
      code: '',
      descriptionMiddle: '',
      code2: '',
      descriptionAfter: '',
    },
    {
      title: 'TypeScript strict',
      descriptionBefore: 'Pas de ',
      code: 'any',
      descriptionMiddle: ', des configs validées par Zod, plus de 184 tests, de la CI/CD. Prêt pour la production dès le premier jour.',
      code2: '',
      descriptionAfter: '',
    },
  ],
  demos: {
    titleBefore: '',
    titleAfter: ' démos fonctionnelles',
    descriptionAfter: '. Clonez, exécutez, apprenez.',
  },
} satisfies typeof Features02Messages
