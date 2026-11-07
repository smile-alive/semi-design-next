import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { resolve } from 'node:path';

// Directory names shared by the core data and the framework package output
const sets = ['icons', 'lab'] as const;

/**
 * [export name, file name] of every data module in a semi-icons-core directory, read from the index that its build-icon.ts
 * generates: file names are kebab-case and cannot be turned back into export names such as `IconAIBellLevel2`
 */
export function readDataModules(dataDir: string) {
    const modules = [...fs.readFileSync(resolve(dataDir, 'index.ts'), 'utf-8').matchAll(/^export \{ default as (\w+) \} from '\.\/([\w-]+)';$/gm)].map(([, name, file]) => ({ name, file }));
    if (!modules.length) throw new Error(`no data modules listed in ${dataDir}/index.ts`);
    return modules;
}

/**
 * `ext` svelte writes `.svelte` files: Svelte components exist only through its compiler, so the generated module cannot
 * call a factory and `factory` names the component that renders the icon data
 */
export function buildIconComponents(srcDir: string, coreSrc: string, factory: string, ext: 'ts' | 'svelte' = 'ts') {
    const outDirs = sets.map((dataDir) => {
        const outDir = resolve(srcDir, dataDir);
        if (fs.existsSync(outDir)) execFileSync('trash', [outDir]);
        fs.mkdirSync(outDir);
        const modules = readDataModules(resolve(coreSrc, dataDir));
        for (const { file } of modules) {
            const data = `@fibrae/semi-icons-core/${dataDir}/${file}`;
            const source =
                ext === 'svelte'
                    ? `<script lang="ts">\n    import data from '${data}';\n    import Icon, { type SemiIconProps } from '${factory}';\n\n    const props: SemiIconProps = $props();\n</script>\n\n<Icon {...props} {data} />\n`
                    : `import data from '${data}';\nimport { createIcon } from '${factory}';\n\nexport default createIcon(data);\n`;
            fs.writeFileSync(resolve(outDir, `${file}.${ext}`), source);
        }
        const suffix = ext === 'svelte' ? '.svelte' : '';
        fs.writeFileSync(outDir + '/index.ts', modules.map(({ name, file }) => `export { default as ${name} } from './${file}${suffix}';\n`).join(''));
        return outDir;
    });
    const rootDir = resolve(import.meta.dirname, '..');
    execFileSync(resolve(rootDir, 'node_modules/.bin/vp'), ['fmt', ...outDirs], { cwd: rootDir, stdio: 'inherit' });
}
