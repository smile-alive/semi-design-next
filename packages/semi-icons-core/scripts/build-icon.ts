// Generates the data modules from the SVG sources: svgs/icons -> src/icons, svgs/lab -> src/lab/icons,
// svgs/illustrations -> src/illustrations/icons
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import { pascalCase } from 'es-toolkit';
import type { PluginConfig } from 'svgo';
import { svgToIconData } from '../../../scripts/svg-to-icon-data.ts';

const svgsDir = resolve(import.meta.dirname, '../svgs');
const srcDir = resolve(import.meta.dirname, '../src');

const convertPathData: PluginConfig = {
    name: 'convertPathData',
    params: {
        floatPrecision: 2,
        // newer rewrites (quadratic curves, z instead of the last line, arc radius rounding) change committed paths
        convertToQ: false,
        convertToZ: false,
        smartArcRounding: false,
    },
};
// Monochrome icons follow the text colour; the `{fillN}` placeholders of multi-colour icons are left for the factories
const convertColors: PluginConfig = { name: 'convertColors', params: { currentColor: /^(?!url|none|\{)./ } };
const cleanup: PluginConfig[] = [{ name: 'cleanupListOfValues' }, { name: 'removeStyleElement' }];
// Icons are sized by font-size; illustrations keep their width and height as the default size
const removeDimensions: PluginConfig = { name: 'removeDimensions' };
// Gradient, mask and filter ids get the per-instance `{uid}` prefix; a fixed id is shared by every copy on the page
const prefixIds: PluginConfig = { name: 'prefixIds', params: { prefix: '{uid}' } };
// Hand-tuned path data that differs from convertPathData's output; optimising it would change the markup
const keepPathData = /^(ai_\w+_level_[23]|ai_loading|maximize_2(_stroked)?|restore(_stroked)?)$/;

// ai_bell_level_1 -> IconAIBellLevel1, back-top -> IconBackTop
function iconName(name: string) {
    return `Icon${pascalCase(name.replace(/^ai_/, 'a_i_'))}`;
}

// noContent-dark -> IllustrationNoContentDark
function illustrationName(name: string) {
    return `Illustration${pascalCase(name)}`;
}

function build(svgDir: string, outDir: string, typesPath: string, exportName: (name: string) => string, pluginsFor: (name: string) => PluginConfig[]) {
    if (fs.existsSync(outDir)) execFileSync('trash', [outDir]);
    fs.mkdirSync(outDir);
    const names = fs
        .readdirSync(svgDir)
        .filter((file) => extname(file) === '.svg')
        .map((file) => basename(file, '.svg'))
        .sort();
    const exports: string[] = [];
    for (const name of names) {
        const data = svgToIconData(name, fs.readFileSync(resolve(svgDir, `${name}.svg`), 'utf-8'), pluginsFor(name));
        const component = exportName(name);
        fs.writeFileSync(resolve(outDir, `${component}.ts`), `import type { IconData } from '${typesPath}';\n\nconst ${component}: IconData = ${JSON.stringify(data)};\n\nexport default ${component};\n`);
        exports.push(`export { default as ${component} } from './${component}';\n`);
    }
    fs.writeFileSync(resolve(outDir, 'index.ts'), exports.join(''));
    return names.length;
}

const outDirs = {
    icons: resolve(srcDir, 'icons'),
    lab: resolve(srcDir, 'lab/icons'),
    illustrations: resolve(srcDir, 'illustrations/icons'),
};
const count = build(resolve(svgsDir, 'icons'), outDirs.icons, '../types', iconName, (name) => [convertColors, ...(keepPathData.test(name) ? [] : [convertPathData]), ...cleanup, removeDimensions, prefixIds]);
// Full-colour (lab) icons and illustrations keep their own colours
const labCount = build(resolve(svgsDir, 'lab'), outDirs.lab, '../../types', iconName, () => [convertPathData, ...cleanup, removeDimensions, prefixIds]);
const illustrationCount = build(resolve(svgsDir, 'illustrations'), outDirs.illustrations, '../../types', illustrationName, () => [convertPathData, ...cleanup, prefixIds]);
const rootDir = resolve(import.meta.dirname, '../../..');
execFileSync(resolve(rootDir, 'node_modules/.bin/vp'), ['fmt', ...Object.values(outDirs)], { cwd: rootDir, stdio: 'inherit' });
console.log(`${count} icons, ${labCount} lab icons, ${illustrationCount} illustrations`);
