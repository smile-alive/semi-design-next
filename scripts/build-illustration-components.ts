import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { basename, resolve } from 'node:path';

/**
 * Writes one module per illustration data module of semi-icons-core that passes it to `createSvgComponent` from `factory`;
 * `ext` svelte writes `.svelte` files instead, where `factory` names the component that renders the data
 */
export function buildIllustrationComponents(outDir: string, coreSrc: string, factory: string, ext: 'ts' | 'svelte' = 'ts') {
    // macOS trash fails with "File is busy" on two same-named directories at once, so build:icon runs the React and Vue
    // generators serially (--concurrency-limit 1)
    if (fs.existsSync(outDir)) execFileSync('trash', [outDir]);
    fs.mkdirSync(outDir, { recursive: true });
    const names = fs
        .readdirSync(resolve(coreSrc, 'illustrations/icons'))
        .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
        .map((file) => basename(file, '.ts'))
        .sort();
    for (const name of names) {
        const data = `@fibrae/semi-icons-core/illustrations/icons/${name}`;
        const source =
            ext === 'svelte'
                ? `<script lang="ts">\n    import data from '${data}';\n    import Svg, { type SvgProps } from '${factory}';\n\n    const props: SvgProps = $props();\n</script>\n\n<Svg {...props} {data} />\n`
                : `import data from '${data}';\nimport { createSvgComponent } from '${factory}';\n\nexport default createSvgComponent(data);\n`;
        fs.writeFileSync(resolve(outDir, `${name}.${ext}`), source);
    }
    const suffix = ext === 'svelte' ? '.svelte' : '';
    fs.writeFileSync(resolve(outDir, 'index.ts'), names.map((name) => `export { default as ${name} } from './${name}${suffix}';\n`).join(''));
    const rootDir = resolve(import.meta.dirname, '..');
    execFileSync(resolve(rootDir, 'node_modules/.bin/vp'), ['fmt', outDir], { cwd: rootDir, stdio: 'inherit' });
}
