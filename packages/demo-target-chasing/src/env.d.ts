/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HF_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 