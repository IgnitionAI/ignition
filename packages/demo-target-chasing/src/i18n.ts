// i18n maison minimal (pas de React ici) : dictionnaires fr/en,
// détection navigator.language, persistance localStorage, sync DOM.
// Chaque page choisit la clé de son titre via <html data-i18n-title="...">
// (défaut : page.title) ; les vues React s'abonnent via subscribe().
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
const listeners = new Set<() => void>();

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
  document.title = t(document.documentElement.dataset.i18nTitle ?? 'page.title');
}

/** Traduit `key` ; les jetons `{nom}` sont remplacés par `vars.nom`. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const message = lookup(resources[lang], key) ?? key;
  if (!vars) return message;
  return message.replace(/\{(\w+)\}/g, (token, name: string) =>
    name in vars ? String(vars[name]) : token,
  );
}

export function getLanguage(): Language {
  return lang;
}

export function setLanguage(next: Language): void {
  lang = next;
  localStorage.setItem('lang', next);
  syncDom();
  listeners.forEach((listener) => listener());
}

/** Abonnement aux changements de langue ; renvoie la fonction de désabonnement. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

syncDom();
