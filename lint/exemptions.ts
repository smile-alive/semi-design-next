import type { Exemption } from './framework.ts';

// Exemptions for files that belong to no framework (the foundations, scripts)
export const exemptions: Exemption[] = [
    // DOM methods go only to expect()/vi.mocked(), or are kept to restore or run with .call(this); none runs unbound
    {
        files: ['packages/semi-foundation/src/upload/__tests__/upload-batch-auto-remove.test.ts'],
        off: ['typescript/unbound-method'],
    },
    // The shim tests save the native AbortSignal.any and checkVisibility to restore them; none runs unbound
    {
        files: ['packages/semi-polyfill/src/__tests__/polyfill.test.ts'],
        off: ['typescript/unbound-method'],
    },
    // Bundler plugin tests build entries that import both React and Vue packages
    {
        files: ['packages/{semi-vite,semi-rspack,semi-webpack}/test/fixture/**'],
        off: ['no-restricted-imports'],
    },
    // Registers the Astro integration of each demo framework
    {
        files: ['website/astro.config.ts'],
        off: ['no-restricted-imports'],
    },
    // The shell renders React icons and components to static HTML at build time (no client: directive), so no React reaches the browser
    {
        files: ['website/src/components/{SearchDialog,SiteHeader,ThemeToggle,LocaleMenu,FrameworkMenu,PrevNext,Notice,SideNav,DesignToken}.astro'],
        off: ['no-restricted-imports'],
    },
];
