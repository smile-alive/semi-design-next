import { warningFilter } from '../../lint/svelte/compiler-warnings.ts';

// Read by svelte-check and svelte-package; without it both fall back to the root vite-plus config, which has no Svelte plugin
export default { compilerOptions: { warningFilter } };
