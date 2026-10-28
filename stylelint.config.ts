import type { Config } from 'stylelint';

export default {
    extends: ['stylelint-config-recess-order'],
    plugins: ['stylelint-order', 'stylelint-scss'],
    customSyntax: 'postcss-scss',
    // ignoreFiles replaces stylelint's default node_modules ignore, so it is listed
    ignoreFiles: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.astro/**', '.claude/**'],
    // A disable must name its reason (`-- why`) and still suppress something
    reportDescriptionlessDisables: true,
    reportNeedlessDisables: true,
    reportInvalidScopeDisables: true,
    rules: {
        // Sorting must not move declarations past $variables, @mixin and @include (breaks compilation or the winner)
        'order/order': ['dollar-variables', 'custom-properties', { type: 'at-rule', name: 'mixin' }, { type: 'at-rule', name: 'function' }, { type: 'at-rule', name: 'include', hasBlock: false }, 'declarations'],
        'scss/dollar-variable-empty-line-before': ['always', { except: ['first-nested'], ignore: ['after-comment', 'after-dollar-variable'] }],
        'block-no-empty': true,
        'declaration-block-no-duplicate-properties': true,
        'font-family-no-missing-generic-family-keyword': true,
        'selector-pseudo-element-colon-notation': 'double',
        'selector-attribute-quotes': 'always',
        'selector-no-qualifying-type': true,
        'shorthand-property-no-redundant-values': true,
        'declaration-no-important': true,
        'function-url-quotes': 'never',
        'length-zero-no-unit': true,
        'color-hex-length': 'short',
        'color-named': 'never',
        'font-weight-notation': 'numeric',
        'font-family-name-quotes': 'always-unless-keyword',
        'no-duplicate-selectors': true,
        'rule-empty-line-before': ['always', { except: ['first-nested'], ignore: ['after-comment'] }],
        'comment-whitespace-inside': 'always',
        // first-nested matches rule-empty-line-before and oxfmt, which drops the blank line after `{`
        'comment-empty-line-before': ['always', { except: ['first-nested'] }],
        'function-calc-no-unspaced-operator': true,
        // Prefixes still needed by the target browsers (Chrome 120 / Firefox 125 / Safari 17.2): Safari < 18 needs -webkit-backdrop-filter
        'property-no-vendor-prefix': [true, { ignoreProperties: ['line-clamp', 'box-orient', 'text-fill-color', 'user-drag', 'font-smoothing', '-webkit-backdrop-filter'] }],
        'value-no-vendor-prefix': [true, { ignoreValues: ['box', 'inline-box'] }],
        // ::-webkit-scrollbar is the fallback where scrollbar-width / scrollbar-color are unsupported (Chrome < 121, Safari < 18.2 / 26.2)
        'selector-no-vendor-prefix': [true, { ignoreSelectors: ['::-webkit-search-cancel-button', '::-webkit-media-controls', '/^::-webkit-scrollbar/'] }],
    },
    overrides: [
        {
            // The docs site keeps component styles in .astro <style> blocks; postcss-html extracts them
            files: ['**/*.astro'],
            customSyntax: 'postcss-html',
        },
        {
            // Physical left/right is an RTL regression here; excluded ones and semi-ai-foundation await decision L3
            files: ['packages/semi-foundation/src/!(cropper|video-player|code-highlight|resizable|markdown-render|audio-player|float-button)/*.scss'],
            rules: {
                'property-disallowed-list': [/^(margin|padding|border)-(left|right)(-|$)/, /^border-(top|bottom)-(left|right)-radius$/, /^(left|right)$/],
                'declaration-property-value-disallowed-list': {
                    '/^(text-align|float|clear)$/': [/^(left|right)$/],
                    // Four values set left and right separately; use the -block and -inline longhands
                    '/^(margin|padding|inset|border-width|border-style|border-color)$/': [/^\S+\s+\S+\s+\S+\s+\S+$/],
                    // Two or more radii pin corners to physical sides (a math expression like `$h * 0.5` is one value)
                    'border-radius': [/^[^\s(]+\s+(?![-+*/]\s)\S/],
                },
            },
        },
        {
            // The class prefix is configurable (prefixCls); selectors use $prefix / $module
            files: ['packages/{semi-foundation,semi-ai-foundation}/**/*.scss'],
            rules: { 'selector-disallowed-list': [/\.semi-/] },
        },
    ],
} satisfies Config;
