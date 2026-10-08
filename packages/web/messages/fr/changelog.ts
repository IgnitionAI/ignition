import type { changelog as ChangelogMessages } from '../en/changelog'

export const changelog = {
  section: {
    eyebrow: 'Dernières mises à jour',
    title: 'Nouveautés',
    descriptionBefore: 'IgnitionAI livre vite. Voici la dernière release — tout le reste se trouve dans le ',
    fullChangelog: 'changelog complet',
    descriptionAfter: '.',
    seeFull: 'Voir le changelog complet →',
  },
  page: {
    eyebrow: 'Changelog',
    title: 'Ce qu’on a livré',
    descriptionBefore: 'Chaque release, avec sa liste complète de changements. La source de vérité est ',
    sourceLink: 'CHANGELOG.md sur GitHub',
    descriptionAfter: '.',
    backLink: '← Retour à IgnitionAI',
  },
} satisfies typeof ChangelogMessages
