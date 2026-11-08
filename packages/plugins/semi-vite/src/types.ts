export interface SemiVitePluginOptions {
    /**
     * Wrap final CSS with `@layer semi { ... }`. Default is `true`; pass `false` to emit unlayered CSS.
     */
    cssLayer?: boolean;
    /**
     * Prefix of the CSS selector. Default is `semi`.
     */
    prefixCls?: string;
    /**
     * Omit the `import xxx.css` statements emitted from semi packages.
     * Use it with a single import of `styles.css` instead of per-component styles; dev pre-bundling honors it too.
     */
    omitCss?: boolean;
}
