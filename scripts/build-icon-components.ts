import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { basename, resolve } from 'node:path';

// [core data directory, output directory]: core's lab/ also holds its index, while a framework package's lab/ holds
// nothing but the generated icons
const sets = [
    ['icons', 'icons'],
    ['lab/icons', 'lab'],
] as const;

/**
 * `ext` svelte writes `.svelte` files: Svelte components exist only through its compiler, so the generated module cannot
 * call a factory and `factory` names the component that renders the icon data
 */
export function buildIconComponents(srcDir: string, coreSrc: string, factory: string, ext: 'ts' | 'svelte' = 'ts') {
    const outDirs = sets.map(([dataDir, out]) => {
        const outDir = resolve(srcDir, out);
        if (fs.existsSync(outDir)) execFileSync('trash', [outDir]);
        fs.mkdirSync(outDir);
        const names = fs
            .readdirSync(resolve(coreSrc, dataDir))
            .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
            .map((file) => basename(file, '.ts'))
            .sort();
        for (const name of names) {
            const data = `@fibrae/semi-icons-core/${dataDir}/${name}`;
            const source =
                ext === 'svelte'
                    ? `<script lang="ts">\n    import data from '${data}';\n    import Icon, { type SemiIconProps } from '${factory}';\n\n    const props: SemiIconProps = $props();\n</script>\n\n<Icon {...props} {data} />\n`
                    : `import data from '${data}';\nimport { createIcon } from '${factory}';\n\nexport default createIcon(data);\n`;
            fs.writeFileSync(resolve(outDir, `${name}.${ext}`), source);
        }
        const suffix = ext === 'svelte' ? '.svelte' : '';
        fs.writeFileSync(outDir + '/index.ts', names.map((name) => `export { default as ${name} } from './${name}${suffix}';\n`).join(''));
        return outDir;
    });
    const rootDir = resolve(import.meta.dirname, '..');
    execFileSync(resolve(rootDir, 'node_modules/.bin/vp'), ['fmt', ...outDirs], { cwd: rootDir, stdio: 'inherit' });
}
