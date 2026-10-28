import { fileURLToPath } from 'node:url';

// Each loader is emitted as its own file next to this module (unbundled build), see vite.config.ts.
function loaderPath(name: string) {
    return fileURLToPath(new URL(`./loaders/${name}.mjs`, import.meta.url));
}

export const SOURCE_SUFFIX_LOADER = loaderPath('semi-source-suffix-loader');

export const SCSS_LOADER = loaderPath('semi-scss-loader');

export const OMIT_CSS_LOADER = loaderPath('semi-omit-css-loader');

export const PREFIX_LOADER = loaderPath('semi-prefix-loader');
