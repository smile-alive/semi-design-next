import type { Exemption } from './framework.ts';

export const exemptions: Exemption[] = [
    // DOM methods go only to expect()/vi.mocked(), or are kept to restore or run with .call(this); none runs unbound
    {
        files: ['packages/shared/semi-foundation/src/components/upload/__tests__/upload-batch-auto-remove.test.ts'],
        off: ['typescript/unbound-method'],
    },
    // The shim tests save the native AbortSignal.any and checkVisibility to restore them; none runs unbound
    {
        files: ['packages/shared/semi-polyfill/src/__tests__/polyfill.test.ts'],
        off: ['typescript/unbound-method'],
    },
    // The spec runner receives each spec's describe name as a parameter
    {
        files: ['vitest/specs/shared/define-spec.ts'],
        off: ['vitest/valid-title'],
    },
    // Bundler plugin tests build entries that import both React and Vue packages
    {
        files: ['packages/plugins/{semi-vite,semi-rspack,semi-webpack}/test/fixture/**'],
        off: ['no-restricted-imports'],
    },
    // Registers the Astro integration of each demo framework
    {
        files: ['website/astro.config.ts'],
        off: ['no-restricted-imports'],
    },
    // The shell renders React icons and components to static HTML at build time (no client: directive), so no React reaches the browser
    {
        files: ['website/src/components/{SearchDialog,SiteHeader,ThemeToggle,LocaleMenu,FrameworkMenu,MoreMenu,PrevNext,Notice,SideNav,DesignToken}.astro', 'website/src/pages/*/index.astro', 'website/src/pages/404.astro'],
        off: ['no-restricted-imports'],
    },
];
