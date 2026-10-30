import { warningFilter } from './lint/svelte/compiler-warnings.ts';

// Read by svelte-check run from the repository root (vitest/svelte tsconfigs); without it svelte-check falls back to the root vite-plus config, which has no Svelte plugin
export default { compilerOptions: { warningFilter } };
