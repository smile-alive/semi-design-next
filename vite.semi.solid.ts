import type { PackUserConfig } from 'vite-plus/pack';
import { semiScssToCss } from './vite.semi.ts';

// The Solid packages ship twice: the dom build for plain bundlers, and the same modules with JSX left in place under
// the `solid` export condition. Solid compiles JSX per target, and the dom output cannot be recompiled for the server
// (SolidStart needs the source form for SSR). Every package needs the `solid` key, including ones without JSX:
// vite-plugin-solid (SolidStart, Vike, TanStack Start) and unplugin-solid both find Solid packages by that key, so a
// dependent without it is externalized on the server and resolves its Solid dependencies to the dom build.
export function semiSolidPack(dom: PackUserConfig): PackUserConfig[] {
    const { entry, unbundle, platform, define, outDir } = dom;
    return [
        dom,
        {
            entry,
            unbundle,
            platform,
            define,
            outDir,
            dts: false,
            // JSX stays in place through the packages' tsconfig `jsx: preserve`
            outExtensions: () => ({ js: '.jsx' }),
            // Stylesheets and declarations come from the dom pass
            plugins: [semiScssToCss],
        },
    ];
}
