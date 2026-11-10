import { untrack } from 'svelte';
import { FIELD_PROP_KEYS } from '@fibrae/semi-foundation/components/form/constants';
import { cloneFormValue } from '@fibrae/semi-foundation/components/form/utils';
import type { CommonFieldProps, FieldLabel } from './interface.js';

export type FieldPath = string | (() => string);

export const readPath = (field: FieldPath) => (typeof field === 'function' ? field() : field);

const fieldOnlyKeys = new Set<string>([...FIELD_PROP_KEYS, 'error', 'fieldLabel', 'labelExtra'] satisfies (keyof CommonFieldProps)[]);

export function omitFieldProps(props: Record<string, unknown>) {
    return Object.fromEntries(Object.entries(props).filter(([key]) => !fieldOnlyKeys.has(key)));
}

/** Deep clone that keeps functions, DOM nodes and errors as they are; the server has no DOM nodes to keep */
export function cloneDeep<T>(value: T) {
    return cloneFormValue(value, (item) => typeof Node !== 'undefined' && item instanceof Node);
}

export function isLabelConfig<L extends FieldLabel>(label?: string | number | L): label is L {
    return typeof label === 'object' && label !== null;
}

/**
 * Runs every method of a foundation api untracked: a formApi call from an `$effect` reads the form state, which must
 * not make that effect rerun on every form change.
 */
export function untrackMethods<T extends object>(api: T) {
    return Object.fromEntries(Object.entries(api).map(([key, method]) => [key, typeof method === 'function' ? (...args: unknown[]) => untrack(() => method(...args)) : method])) as T;
}
