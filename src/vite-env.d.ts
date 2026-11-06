/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Event to load. With either of these missing, the demo runs on the mock API. */
  readonly VITE_EVENT_CODE?: string
  readonly VITE_EVENT_SLUG?: string
  /** Only for a build served from another domain; leave empty when the page and API share one. */
  readonly VITE_API_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
