import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIllustrationComponents } from '../../../scripts/build-illustration-components.ts';

const coreSrc = resolve(dirname(fileURLToPath(import.meta.resolve('@fibrae/semi-icons-core/package.json'))), 'src');

buildIllustrationComponents(resolve(import.meta.dirname, '../src/illustrations'), coreSrc, '@fibrae/semi-icons-vue/components/create-icon');
