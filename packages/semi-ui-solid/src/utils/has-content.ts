import type { ResolvedChildren } from 'solid-js';

/** Whether resolved children render anything: `null`, `undefined`, booleans and `''` render nothing, `0` does */
export default function hasContent(node: ResolvedChildren) {
    return Array.isArray(node) ? node.some(hasContent) : node != null && typeof node !== 'boolean' && node !== '';
}
