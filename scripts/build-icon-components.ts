import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { basename, resolve } from 'node:path';

// [core data directory, output directory]: core's lab/ also holds its index, while a framework package's lab/ holds
// nothing but the generated icons
const sets = [
    ['icons', 'icons'],
    ['lab/icons', 'lab'],
] as const;

export function buildIconComponents(srcDir: string, coreSrc: string, factory: string) {
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
            fs.writeFileSync(resolve(outDir, `${name}.ts`), `import data from '@fibrae/semi-icons-core/${dataDir}/${name}';\nimport { createIcon } from '${factory}';\n\nexport default createIcon(data);\n`);
        }
        fs.writeFileSync(outDir + '/index.ts', names.map((name) => `export { default as ${name} } from './${name}';\n`).join(''));
        return outDir;
    });
    const rootDir = resolve(import.meta.dirname, '..');
    execFileSync(resolve(rootDir, 'node_modules/.bin/vp'), ['fmt', ...outDirs], { cwd: rootDir, stdio: 'inherit' });
}
