/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ZAI_BASE_URL?: string
  readonly VITE_ZAI_API_KEY?: string
  readonly VITE_ZAI_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
