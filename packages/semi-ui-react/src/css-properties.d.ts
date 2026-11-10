// Semi reads CSS custom properties from `style` (theme tokens, Grid); React's types reject `--*` keys. Internal only:
// .d.ts files are not emitted, so consumers keep React's own CSSProperties.
declare module 'react' {
    interface CSSProperties {
        [key: `--${string}`]: string | number | undefined;
    }
}

export {};
