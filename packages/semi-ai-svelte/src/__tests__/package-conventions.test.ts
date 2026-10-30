import { existsSync, globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

const root = path.resolve(import.meta.dirname, '..');
const uiRoot = path.resolve(root, '../../semi-ui-svelte/src');

describe('源码约定', () => {
    // semi-ui-svelte publishes `./*.svelte.js` -> `dist/*.svelte.js`, `./*.svelte` -> `dist/*.svelte` and `./*` ->
    // `dist/*.js`: a rune module is named `<name>.svelte.js`, a component `<name>.svelte`, any other module has no
    // extension. The root entry would pull in every component
    it('只按发布后可解析的子路径导入 semi-ui-svelte', () => {
        const resolves = (subpath: string) => {
            if (subpath.endsWith('.svelte.js')) {
                return existsSync(path.join(uiRoot, `${subpath.slice(0, -3)}.ts`));
            }
            return existsSync(path.join(uiRoot, subpath.endsWith('.svelte') ? subpath : `${subpath}.ts`));
        };
        const files = globSync('**/*.{ts,svelte}', { cwd: root, exclude: ['**/__tests__/**'] });
        const violations = files.flatMap((file) => [...readFileSync(path.join(root, file), 'utf8').matchAll(/['"]@fibrae\/semi-ui-svelte(\/[^'"]*)?['"]/g)].filter(([, subpath]) => !subpath || !resolves(subpath)).map(([specifier]) => `${file}: ${specifier}`));
        expect(violations).toEqual([]);
    });
});
