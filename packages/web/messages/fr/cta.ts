import type { cta as CtaMessages } from '../en/cta'

export const cta = {
  kicker: 'Open source · licence MIT',
  title: 'Prêt à entraîner votre premier agent ?',
  descriptionBefore: 'Une commande d’installation, une classe TrainingEnv, un appel à ',
  trainCode: 'env.train()',
  descriptionAfter: '. Votre agent apprend dans votre navigateur, puis se déploie partout via ONNX.',
  starGithub: 'Star on GitHub',
  readDocs: 'Lire la documentation',
} satisfies typeof CtaMessages
