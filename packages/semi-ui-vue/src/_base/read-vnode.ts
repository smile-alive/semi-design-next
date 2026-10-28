import { camelize, createTextVNode, isVNode, type VNode, type VNodeChild } from 'vue';

/** The slots of a child vnode as raw functions: called outside a template they may return text or nested arrays */
export type RawSlots = Record<string, ((...args: unknown[]) => VNodeChild) | undefined>;

const vnodeKeys = new Set(['key', 'ref', 'ref_for', 'ref_key']);

/** The result of a raw slot call as vnodes, with strings and numbers turned into text vnodes */
export const toVNodes = (value: VNodeChild): VNode[] =>
    (Array.isArray(value) ? value : [value]).flatMap((item): VNode[] => {
        if (Array.isArray(item)) return toVNodes(item);
        if (isVNode(item)) return [item];
        return item == null || typeof item === 'boolean' ? [] : [createTextVNode(String(item))];
    });

export const childSlots = (node: VNode) => (node.children && typeof node.children === 'object' && !Array.isArray(node.children) ? node.children : {}) as RawSlots;

/**
 * The props of a child vnode read as data. Template keys arrive as written (`show-tick`) and the boolean shorthand as
 * '' or the attribute name; this applies the casting Vue's own props would, for the keys listed in `booleanKeys`.
 * The vnode key and ref are not data and are left out.
 */
export function normalizeVNodeProps(raw: Record<string, unknown> | null, booleanKeys: ReadonlySet<string>) {
    const result: Record<string, unknown> = {};
    for (const [rawKey, value] of Object.entries(raw ?? {})) {
        if (vnodeKeys.has(rawKey)) continue;
        const key = rawKey.startsWith('data-') || rawKey.startsWith('aria-') ? rawKey : camelize(rawKey);
        const shorthand = value === '' || (typeof value === 'string' && camelize(value) === key);
        result[key] = booleanKeys.has(key) && shorthand ? true : value;
    }
    return result;
}
