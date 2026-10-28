import type { ResolvedChildren } from 'solid-js';

/** The joined text when every resolved child is a string or a number, else undefined */
export function getAvatarText(resolved: ResolvedChildren) {
    const nodes = (Array.isArray(resolved) ? resolved : [resolved]).filter((node) => node != null && typeof node !== 'boolean');
    return nodes.length > 0 && nodes.every((node) => typeof node === 'string' || typeof node === 'number') ? nodes.join('') : undefined;
}
