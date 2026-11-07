import type { RuleSetRule } from '@rspack/core';
import { SOURCE_SUFFIX_LOADER, SCSS_LOADER, OMIT_CSS_LOADER, PREFIX_LOADER } from './constants';
import type { SemiWebpackPluginOptions } from './types';

export function createSourceSuffixLoaderRule(_opts?: SemiWebpackPluginOptions) {
    return {
        test: /@fibrae(\/|\\)+semi-(ui-react|ui-vue|ai-react|ai-vue|icons-react|icons-vue)(\/|\\)+.+\.js$/,
        use: [{ loader: SOURCE_SUFFIX_LOADER }],
    };
}

export function createThemeLoaderRule(opts?: SemiWebpackPluginOptions) {
    const options = {
        prefixCls: opts.prefixCls,
        cssLayer: opts.cssLayer,
    };
    return {
        test: /@fibrae(\/|\\)+semi-(ui-react|ui-vue|ai-react|ai-vue|icons-core|icons-vue|foundation|ai-foundation)(\/|\\)+dist(\/|\\)+.+\.scss$/,
        use: [{ loader: SCSS_LOADER, options }],
    };
}

export function createOmitCssLoaderRule(_opts?: SemiWebpackPluginOptions) {
    return {
        // CSS imports live in each component's JS, not in env.js
        test: /@fibrae(\/|\\)+semi-(ui-react|ui-vue|ai-react|ai-vue|icons-react|icons-vue)(\/|\\)+dist(\/|\\)+.+\.js$/,
        use: [{ loader: OMIT_CSS_LOADER }],
    };
}

export function createPrefixLoaderRule(opts?: SemiWebpackPluginOptions) {
    const options = {
        replacers: { BASE_CLASS_PREFIX: opts.prefixCls },
    };
    return {
        test: /@fibrae(\/|\\)+semi-[^/]+(\/|\\)+.+env\.js$/,
        use: [{ loader: PREFIX_LOADER, options }],
    };
}

export function applySemiRules(opts?: SemiWebpackPluginOptions) {
    const rules: RuleSetRule[] = [];
    // The prefix lives in Semi's JS, so it is rewritten even with a prebuilt stylesheet
    if (opts.prefixCls) {
        rules.push(createPrefixLoaderRule(opts));
    }
    if (opts.omitCss) {
        rules.push(createOmitCssLoaderRule(opts));
        return rules;
    }
    rules.push(createSourceSuffixLoaderRule(opts));
    rules.push(createThemeLoaderRule(opts));
    return rules;
}
