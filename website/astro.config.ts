import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import solid from '@astrojs/solid-js';
import vue from '@astrojs/vue';
import { semiCssLayer, semiInlineJsonWorker, semiScssOptions, semiSourceAliases } from '../vite.semi.ts';
import frameworkMdx from './plugins/framework-mdx.ts';
import rehypeAnchorIds from './plugins/rehype-anchor-ids.ts';
import rehypeTableContainer from './plugins/rehype-table-container.ts';
import remarkDemo from './plugins/remark-demo.ts';
import { defaultLocale, locales } from './src/i18n/locales.ts';
import { shikiThemes } from './src/lib/shiki.ts';

// Two JSX integrations split files by the repo's naming rule: the Solid packages (aliased to source) and *.solid.tsx demos
const solidFiles = [/\/packages\/semi-[a-z-]+-solid\//, /\.solid\.tsx$/];

export default defineConfig({
    devToolbar: {
        enabled: false,
    },
    // Pages live under src/pages/[locale]/, so every locale is prefixed; components read Astro.currentLocale
    i18n: {
        locales: [...locales],
        defaultLocale,
        routing: { prefixDefaultLocale: true },
    },
    // The default satteri processor skips remark plugins; MDX shares this one.
    markdown: {
        // Docs show values like "primary" verbatim, so SmartyPants is off.
        processor: unified({
            remarkPlugins: [remarkDemo],
            rehypePlugins: [rehypeAnchorIds, rehypeTableContainer],
            smartypants: false,
        }),
        shikiConfig: { themes: shikiThemes, defaultColor: false },
    },
    // Compiling demos and semi-ui-react source (via semiSourceAliases) matches what consumers get with the compiler on.
    // exclude feeds compiler and Fast Refresh alike: Vue and Solid package .tsx also resolve to source; neither handles their JSX.
    integrations: [react({ compiler: true, exclude: [/\/packages\/semi-(ui|ai|icons|illustrations)-vue\//, ...solidFiles] }), vue({ appEntrypoint: '/src/lib/vue.app.ts' }), solid({ include: solidFiles }), mdx()],
    vite: {
        plugins: [frameworkMdx(), semiInlineJsonWorker],
        build: {
            // Every page's sidebar emits 101 doc icons; inlining them as data URIs adds ~140 KB per page.
            assetsInlineLimit: (file) => (file.includes('/doc-icons/') ? false : undefined),
        },
        optimizeDeps: {
            // Astro only scans src/ but demos live in content/. Deps found late trigger a mid-session re-bundle,
            // already-loaded modules return 504 and client-side navigation breaks.
            entries: ['content/**/*.{tsx,vue,mdx}'],
            // The scan cannot see the router modules imported by ClientRouter's script inside the astro package.
            // vite-plugin-solid makes the scan keep JSX as-is, so it never sees the runtime import that Vue JSX compiles to
            // (the React plugin adds its own runtime to include).
            include: ['astro/virtual-modules/transitions-*.js', 'vue/jsx-dev-runtime'],
        },
        resolve: {
            alias: [
                {
                    find: '#/',
                    replacement: `${fileURLToPath(new URL('./src/', import.meta.url))}`,
                },
                {
                    find: '#packages/',
                    replacement: `${fileURLToPath(new URL('../packages/', import.meta.url))}`,
                },
                ...semiSourceAliases,
            ],
        },
        css: { preprocessorOptions: { scss: semiScssOptions }, postcss: { plugins: [semiCssLayer] } },
    },
});
