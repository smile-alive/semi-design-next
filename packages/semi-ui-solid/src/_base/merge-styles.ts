import type { JSX } from 'solid-js';

type Style = JSX.CSSProperties | string;

const toCssText = (style: JSX.CSSProperties) =>
    Object.entries(style)
        .filter(([, value]) => value != null && value !== '')
        .map(([name, value]) => `${name}: ${value}`)
        .join('; ');

/**
 * Merges a component's own style with the consumer's. Later styles win; Solid accepts a style as an object or as CSS
 * text, so one string among them turns the result into CSS text.
 */
export default function mergeStyles(...styles: (Style | undefined | null)[]): Style {
    const defined = styles.filter((style): style is Style => style != null && style !== '');
    if (defined.every((style) => typeof style === 'object')) {
        return Object.assign({}, ...defined);
    }
    return defined
        .map((style) => (typeof style === 'string' ? style : toCssText(style)))
        .filter(Boolean)
        .join('; ');
}
