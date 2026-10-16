import type { quickstart as QuickstartMessages } from '../en/quickstart'

export const quickstart = {
  eyebrow: 'Démarrage rapide',
  title: 'Entraînez votre premier agent en 7 lignes',
  description: {
    before:
      'Pas de code de réseau de neurones. Pas de réglage d’hyperparamètres. Pas de fichiers de configuration. Décrivez votre monde, appelez ',
    code: 'train()',
    after: ', et le framework fait le reste.',
  },
  caption: 'C’est tout. L’agent apprend. Le pendule reste en équilibre.',
} satisfies typeof QuickstartMessages
