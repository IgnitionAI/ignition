import type { pricing as PricingMessages } from '../en/pricing'

export const pricing = {
  billing: {
    monthly: 'Mensuel',
    yearly: 'Annuel',
    yearlyDiscount: '-20%',
    srOnly: 'Payer annuellement',
  },
  perMonth: '/mois',
  planTagline: 'Tout à portée de main.',
  getStarted: 'Commencer',
  categories: {
    usage: 'Utilisation',
    features: 'Fonctionnalités',
    support: 'Support',
  },
  rows: {
    socialConnections: 'Connexions sociales',
    customDomains: 'Domaines personnalisés',
    userRoleManagement: 'Gestion des rôles utilisateurs',
    externalDatabases: 'Bases de données externes',
    customConnection: 'Connexion personnalisée',
    advancedDeployment: 'Options de déploiement avancées',
    extraAddons: 'Modules additionnels',
    adminRoles: 'Rôles administrateur',
    deployAndMonitor: 'Déployer et surveiller',
    enterpriseAddons: 'Modules entreprise',
    premiumSupport: 'Support premium',
  },
  unlimited: 'Illimité',
} satisfies typeof PricingMessages
