import type { JSX } from 'solid-js';

type StyleLayer = JSX.CSSProperties | string | undefined;

function serialize(layer: StyleLayer) {
    if (typeof layer === 'string') {
        return layer;
    }
    return Object.entries(layer ?? {})
        .filter(([, value]) => value != null)
        .map(([name, value]) => `${name}:${value}`)
        .join(';');
}

/**
 * Merges style layers, later ones winning. A consumer's style may be a string, and a string cannot be spread into an
 * object, so any string layer turns the whole result into a string.
 */
export function joinStyle(...layers: StyleLayer[]): JSX.CSSProperties | string {
    if (layers.some((layer) => typeof layer === 'string')) {
        return layers.map(serialize).filter(Boolean).join(';');
    }
    return Object.assign({}, ...layers);
}
