export { BASE_CLASS_PREFIX } from './env';

export const VALIDATE_STATUS = ['default', 'error', 'warning', 'success'] as const;

// Every instance needs its own value, and ARIA references (aria-controls, aria-labelledby) point at these ids, so a
// global default would make instances share an id. Components never read them from the global config.
const instanceIdKeyList = ['id', 'insetLabelId', 'wrapperId', 'addonId', 'extraId'] as const;
export type InstanceIdKey = (typeof instanceIdKeyList)[number];
const instanceIdKeys: ReadonlySet<string> = new Set(instanceIdKeyList);

// Distributes over union props (Select, Cascader), which a plain Omit would collapse to their common keys
export type GlobalDefaults<P> = P extends unknown ? Partial<Omit<P, InstanceIdKey>> : never;

/**
 * Drops the per-instance ids from a global defaults object, which a caller that bypasses the types may still have
 * set. Readers that spread the global config go through this, so no entry can hand two instances one id.
 */
export function omitInstanceIds<T extends object>(defaults?: T) {
    return Object.fromEntries(Object.entries(defaults ?? {}).filter(([key]) => !instanceIdKeys.has(key))) as Partial<T>;
}
