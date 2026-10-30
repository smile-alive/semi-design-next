import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIconComponents } from '../../../scripts/build-icon-components.ts';

const coreSrc = resolve(dirname(fileURLToPath(import.meta.resolve('@fibrae/semi-icons-core/package.json'))), 'src');
const srcDir = resolve(import.meta.dirname, '../src');

buildIconComponents(srcDir, coreSrc, '../components/create-icon');
