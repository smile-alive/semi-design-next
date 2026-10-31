// Languages used by demo code blocks are registered once at the site entry; unregistered ones render as plain text,
// and blocks mounted earlier re-highlight. Registering through the foundation registry the components share keeps
// page scripts from loading a framework package.
import { register } from '@fibrae/semi-foundation/code-highlight/registry';

register({
    languages: [
        () => import('shiki/langs/javascript.mjs'),
        () => import('shiki/langs/typescript.mjs'),
        () => import('shiki/langs/jsx.mjs'),
        () => import('shiki/langs/tsx.mjs'),
        () => import('shiki/langs/css.mjs'),
        () => import('shiki/langs/html.mjs'),
        () => import('shiki/langs/json.mjs'),
        () => import('shiki/langs/bash.mjs'),
    ],
});
