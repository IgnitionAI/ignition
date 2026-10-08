import type { demoCatalog as DemoCatalogMessages } from '../en/demo-catalog'

export const demoCatalog = {
  intro: '{count} démos navigateur partagent ce catalogue avec la page d’accueil et le build statique.',
  columns: {
    demo: 'Démo',
    methods: 'Méthodes',
    runLocally: 'Exécuter en local',
  },
} satisfies typeof DemoCatalogMessages
