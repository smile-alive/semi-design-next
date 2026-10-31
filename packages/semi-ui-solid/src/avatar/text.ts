import type { ResolvedChildren } from 'solid-js';

export function getAvatarText(resolved: ResolvedChildren) {
    const nodes = (Array.isArray(resolved) ? resolved : [resolved]).filter((node) => node != null && typeof node !== 'boolean');
    return nodes.length > 0 && nodes.every((node) => typeof node === 'string' || typeof node === 'number') ? nodes.join('') : undefined;
}
