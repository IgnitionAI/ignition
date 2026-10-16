import type { features as FeaturesMessages } from '../en/features'

export const features = {
  kicker: 'Conçu pour les devs JS créatifs',
  title: 'L’apprentissage par renforcement qui s’adapte à votre stack',
  descriptionBefore: 'Décrivez votre monde dans une classe, appelez ',
  trainCode: 'env.train()',
  descriptionAfter: ', et regardez votre agent apprendre en temps réel. Sans Python, sans serveur, sans cluster GPU.',
  tabs: [
    { label: 'Entraînement zéro config' },
    { label: 'Natif navigateur avec WebGPU' },
    { label: 'Entraîner → ONNX → déployer partout' },
  ],
  illustrationAlt: 'Illustration des fonctionnalités',
} satisfies typeof FeaturesMessages
