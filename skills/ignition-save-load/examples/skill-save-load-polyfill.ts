/**
 * Declared Node polyfill for the browser storage APIs used by
 * `LocalStorageProvider` (`localstorage://` TensorFlow.js IO handlers).
 *
 * Import this module before `@tensorflow/tfjs` or `@ignitionai/storage`.
 * TensorFlow.js registers `localstorage://` only when it believes it is
 * running in a browser (`window` + `document` present at first load).
 */

class MemoryLocalStorage {
  private readonly data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    const value = this.data.get(key);
    return value === undefined ? null : value;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(String(key), String(value));
  }
}

type PolyfillGlobal = typeof globalThis & {
  localStorage?: MemoryLocalStorage;
  window?: typeof globalThis & { localStorage?: MemoryLocalStorage };
  document?: { createElement: (tag: string) => Record<string, unknown> };
};

const g = globalThis as PolyfillGlobal;

if (typeof g.localStorage === 'undefined') {
  g.localStorage = new MemoryLocalStorage();
}

if (typeof g.window === 'undefined') {
  g.window = g;
}

if (g.window.localStorage === undefined) {
  g.window.localStorage = g.localStorage;
}

if (typeof g.document === 'undefined') {
  g.document = {
    createElement: () => ({}),
  };
}
