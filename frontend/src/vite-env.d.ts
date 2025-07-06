/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
