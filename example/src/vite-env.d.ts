/// <reference types="vite/client" />

interface ImportMetaEnv {
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare const APP_VERSION: string;