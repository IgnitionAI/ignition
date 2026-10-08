import type { blog as BlogMessages } from '../en/blog'

export const blog = {
  metadata: {
    title: 'Blog',
    description: 'Des tutoriels concrets pour construire et entraîner des agents avec Ignition.',
  },
  kicker: 'Le blog Ignition',
  heading: 'Apprendre en construisant',
  subheading: 'Des expériences reproductibles, du code et des agents en action.',
  tutorialLabel: 'Tutoriel',
  readMore: 'Lire le tutoriel →',
  backToBlog: '← Le blog Ignition',
  cartpoleIntro: 'Lancez l’expérience dans votre navigateur, puis découvrez le code qui la fait tourner.',
} satisfies typeof BlogMessages
