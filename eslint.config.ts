import oxlint from 'eslint-plugin-oxlint';
import { defineConfig } from 'eslint/config';
import { lintConfig } from './lint/index.ts';
import { vueEslint } from './lint/vue/eslint.ts';

// The converter mutates plugins while expanding categories; clone to keep the oxlint configuration intact
const overlappingRules = oxlint.buildFromOxlintConfig(structuredClone(lintConfig));

// ESLint checks only what oxlint cannot parse: framework templates (D-2)
export default defineConfig([{ ignores: ['**/dist/**', '**/coverage/**'] }, ...vueEslint(overlappingRules)]);
