import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { root } from './paths.ts';

type Ext = 'ts' | 'svelte';
type ModuleSource = (data: string) => string;

// Read from the index build-icon.ts generates: kebab-case file names cannot be turned back into export names such as `IconAIBellLevel2`
export function readDataModules(dataDir: string) {
    const index = fs.readFileSync(path.resolve(dataDir, 'index.ts'), 'utf-8');
    const modules = index
        .matchAll(/^export \{ default as (\w+) \} from '\.\/([\w-]+)';$/gm)
        .map(([, name, file]) => ({ name, file }))
        .toArray();
    if (!modules.length) throw new Error(`no data modules listed in ${dataDir}/index.ts`);
    return modules;
}

// A Svelte component exists only through its compiler, so the generated module cannot call a factory: `factory` names the component that renders the data
const factorySource =
    (factory: string, createName: string): ModuleSource =>
    (data) =>
        `import data from '${data}';\nimport { ${createName} } from '${factory}';\n\nexport default ${createName}(data);\n`;

const svelteSource =
    (factory: string, component: string, propsType: string): ModuleSource =>
    (data) =>
        `<script lang="ts">\n    import data from '${data}';\n    import ${component}, { type ${propsType} } from '${factory}';\n\n    const props: ${propsType} = $props();\n</script>\n\n<${component} {...props} {data} />\n`;

// `outDir` is replaced wholesale, so it must hold nothing hand-written
function writeModules(outDir: string, coreSrc: string, dataDir: string, ext: Ext, source: ModuleSource) {
    // macOS trash fails with "File is busy" on two same-named directories at once, so build:icon runs the React and Vue
    // generators serially (--concurrency-limit 1)
    if (fs.existsSync(outDir)) execFileSync('trash', [outDir]);
    fs.mkdirSync(outDir, { recursive: true });
    const modules = readDataModules(path.resolve(coreSrc, dataDir));
    for (const { file } of modules) {
        fs.writeFileSync(path.resolve(outDir, `${file}.${ext}`), source(`@fibrae/semi-icons-core/${dataDir}/${file}`));
    }
    const suffix = ext === 'svelte' ? '.svelte' : '';
    fs.writeFileSync(path.resolve(outDir, 'index.ts'), modules.map(({ name, file }) => `export { default as ${name} } from './${file}${suffix}';\n`).join(''));
}

const formatDirs = (dirs: string[]) => execFileSync(path.resolve(root, 'node_modules/.bin/vp'), ['fmt', ...dirs], { cwd: root, stdio: 'inherit' });

export function buildIconComponents(srcDir: string, coreSrc: string, factory: string, ext: Ext = 'ts') {
    const source = ext === 'svelte' ? svelteSource(factory, 'Icon', 'SemiIconProps') : factorySource(factory, 'createIcon');
    const outDirs = ['icons', 'lab'].map((dataDir) => {
        const outDir = path.resolve(srcDir, dataDir);
        writeModules(outDir, coreSrc, dataDir, ext, source);
        return outDir;
    });
    formatDirs(outDirs);
}

export function buildIllustrationComponents(outDir: string, coreSrc: string, factory: string, ext: Ext = 'ts') {
    const source = ext === 'svelte' ? svelteSource(factory, 'Svg', 'SvgProps') : factorySource(factory, 'createSvgComponent');
    writeModules(outDir, coreSrc, 'illustrations', ext, source);
    formatDirs([outDir]);
}
