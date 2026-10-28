#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { compile, compileAi } from './index';

const usage = ['Usage: semi-build-scss [-f <foundation>] [-i <icon>] -o <output> [--min] [--prefix <cls>] [--no-layer]', '       semi-build-scss [-f <foundation>] --ai <ai-foundation> -o <output> [--min] [--prefix <cls>] [--no-layer]'].join('\n');

const { values } = parseArgs({
    options: {
        foundation: { type: 'string', short: 'f' },
        icon: { type: 'string', short: 'i' },
        ai: { type: 'string', short: 'a' },
        output: { type: 'string', short: 'o' },
        min: { type: 'boolean', short: 'm', default: false },
        prefix: { type: 'string' },
        layer: { type: 'boolean', default: true },
    },
    allowNegative: true,
});

const { foundation, icon, ai, output } = values;
const options = { isMin: values.min, prefixCls: values.prefix, cssLayer: values.layer };
if (output && !ai) {
    compile({ foundationPath: foundation, iconPath: icon, outputPath: output, ...options });
} else if (output && ai && !icon) {
    compileAi({ foundationPath: foundation, aiFoundationPath: ai, outputPath: output, ...options });
} else {
    console.error(`Error: --output is required, and --ai excludes --icon.\n${usage}`);
    process.exitCode = 1;
}
