import type { Compiler } from '@rspack/core';
import { assertNoStyleOptionsWithOmitCss } from '@fibrae/semi-theme-shared';
import { applySemiRules } from './rule';
import type { SemiWebpackPluginOptions } from './types';

export class SemiRspackPlugin {
    opts: SemiWebpackPluginOptions;

    constructor(options: SemiWebpackPluginOptions = {}) {
        assertNoStyleOptionsWithOmitCss(options);
        this.opts = options;
    }

    apply(compiler: Compiler) {
        const rules = applySemiRules(this.opts);
        compiler.options.module.rules.push(...rules);
    }
}
