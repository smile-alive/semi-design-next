import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIconComponents } from '../../../scripts/build-icon-components.ts';
import { buildIllustrationComponents } from '../../../scripts/build-illustration-components.ts';

const coreSrc = resolve(dirname(fileURLToPath(import.meta.resolve('@fibrae/semi-icons-core/package.json'))), 'src');
const srcDir = resolve(import.meta.dirname, '../src');

buildIconComponents(srcDir, coreSrc, '../components/built-in-icon.svelte', 'svelte');
buildIllustrationComponents(resolve(srcDir, 'illustrations'), coreSrc, '../components/svg.svelte', 'svelte');
