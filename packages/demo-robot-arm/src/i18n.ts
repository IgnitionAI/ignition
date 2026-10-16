export type Lang = 'fr' | 'en';

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

const strings = {
  fr: {
    title: 'Robot Arm 3D',
    tagline: 'Un DQN apprend à amener l’extrémité d’un bras 3 articulations sur une cible XYZ.',
    back: '← IgnitionAI',
    train: 'Entraîner',
    resume: 'Reprendre',
    pause: 'Pause',
    inference: 'Inférence',
    newEpisode: 'Nouvel épisode',
    restart: 'Recommencer l’apprentissage',
    nextTarget: 'Cible suivante',
    resetCamera: 'Recentrer la caméra',
    speed: 'Vitesse',
    speedHint: 'cadence de commandes, pas de temps physique',
    mode: 'Mode',
    modes: { stopped: 'Arrêté', training: 'Entraînement', inference: 'Inférence' },
    angles: 'Angles (rad)',
    base: 'base', shoulder: 'épaule', elbow: 'coude',
    tip: 'Extrémité', target: 'Cible',
    distance: 'Distance',
    reward: 'Reward',
    blocked: 'bloquée',
    stats: 'Statistiques',
    episodes: 'épisodes',
    transitions: 'transitions',
    updates: 'mises à jour',
    epsilon: 'epsilon',
    lastEpisode: 'Dernier épisode',
    history: 'Historique (borné)',
    rewardHistory: 'Rewards récents',
    commands: 'commandes',
    success: 'succès',
    truncated: 'tronqué',
    avgCommandsSuccess: 'commandes jusqu’au succès (moyenne, réussites)',
    successRate: 'taux de succès',
    meanFinalDistance: 'distance finale moyenne',
    summary: 'Résumé numérique',
    noEpisode: 'aucun épisode terminé',
    needTraining: 'Lancez l’entraînement : l’inférence s’active après la première mise à jour des poids.',
    error: 'Erreur',
    loading: 'Initialisation de TensorFlow.js…',
    canvasAlt: 'Scène 3D : bras articulé (base, épaule, coude), cible octaédrique et extrémité sphérique. Toutes les valeurs sont aussi données numériquement dans le panneau ci-dessous.',
    help: '6 actions : base ±, épaule ±, coude ± (15° par commande). Succès à 0,10 m, épisode de 80 commandes.',
  },
  en: {
    title: 'Robot Arm 3D',
    tagline: 'A DQN learns to bring a 3-joint arm tip onto an XYZ target.',
    back: '← IgnitionAI',
    train: 'Train',
    resume: 'Resume',
    pause: 'Pause',
    inference: 'Inference',
    newEpisode: 'New episode',
    restart: 'Restart learning',
    nextTarget: 'Next target',
    resetCamera: 'Reset camera',
    speed: 'Speed',
    speedHint: 'command cadence, not physical time',
    mode: 'Mode',
    modes: { stopped: 'Stopped', training: 'Training', inference: 'Inference' },
    angles: 'Angles (rad)',
    base: 'base', shoulder: 'shoulder', elbow: 'elbow',
    tip: 'Tip', target: 'Target',
    distance: 'Distance',
    reward: 'Reward',
    blocked: 'blocked',
    stats: 'Statistics',
    episodes: 'episodes',
    transitions: 'transitions',
    updates: 'updates',
    epsilon: 'epsilon',
    lastEpisode: 'Last episode',
    history: 'History (bounded)',
    rewardHistory: 'Recent rewards',
    commands: 'commands',
    success: 'success',
    truncated: 'truncated',
    avgCommandsSuccess: 'commands to success (mean, successes)',
    successRate: 'success rate',
    meanFinalDistance: 'mean final distance',
    summary: 'Numeric summary',
    noEpisode: 'no finished episode',
    needTraining: 'Start training: inference unlocks after the first weight update.',
    error: 'Error',
    loading: 'Initializing TensorFlow.js…',
    canvasAlt: '3D scene: 3-joint arm (base, shoulder, elbow), octahedral target and spherical tip. Every value is also given numerically in the panel below.',
    help: '6 actions: base ±, shoulder ±, elbow ± (15° per command). Success within 0.10 m, 80-command episodes.',
  },
} as const;

export type I18n = Widen<(typeof strings)['fr']>;

/** Explicit locale wins (?lang=fr|en); then localStorage; then navigator. */
export function detectLang(search: string = window.location.search): Lang {
  const param = new URLSearchParams(search).get('lang');
  if (param === 'fr' || param === 'en') return param;
  try {
    const stored = window.localStorage.getItem('robot-arm-lang');
    if (stored === 'fr' || stored === 'en') return stored;
  } catch {
    // storage unavailable (private mode) — fall through
  }
  return window.navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function makeT(lang: Lang): I18n {
  return strings[lang];
}
