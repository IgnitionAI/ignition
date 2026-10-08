// i18n maison minimal (pas de React ici) : dictionnaires fr/en,
// détection navigator.language, persistance localStorage, sync DOM.
import fr from './locales/fr.json';
import en from './locales/en.json';

export type Language = 'fr' | 'en';

type Messages = typeof fr;

// typeof en doit correspondre : toute divergence de structure est une erreur de compilation.
const resources: Record<Language, Messages> = { fr, en };

const detect = (): Language => {
  const stored = localStorage.getItem('lang');
  if (stored === 'fr' || stored === 'en') return stored;
  return navigator.language.startsWith('fr') ? 'fr' : 'en';
};

let lang: Language = detect();

function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function syncDom(): void {
  document.documentElement.lang = lang;
  document.title = t('page.title');
}

export function t(key: string): string {
  return lookup(resources[lang], key) ?? key;
}

export function getLanguage(): Language {
  return lang;
}

export function setLanguage(next: Language): void {
  lang = next;
  localStorage.setItem('lang', next);
  syncDom();
}

syncDom();
