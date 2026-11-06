import { untrack } from 'svelte';
import { FIELD_PROP_KEYS } from '@fibrae/semi-foundation/form/constants';
import { errorMessages } from '@fibrae/semi-foundation/form/errors';
import { cloneFormValue } from '@fibrae/semi-foundation/form/utils';
import type { CommonFieldProps, FieldLabel } from './interface.js';

const fieldOnlyKeys = new Set<string>([...FIELD_PROP_KEYS, 'error', 'fieldLabel', 'labelExtra'] satisfies (keyof CommonFieldProps)[]);

export function omitFieldProps(props: Record<string, unknown>) {
    return Object.fromEntries(Object.entries(props).filter(([key]) => !fieldOnlyKeys.has(key)));
}

/** Deep clone that keeps functions, DOM nodes and errors as they are; the server has no DOM nodes to keep */
export function cloneDeep<T>(value: T) {
    return cloneFormValue(value, (item) => typeof Node !== 'undefined' && item instanceof Node);
}

export function hasErrorContent(error: unknown) {
    return errorMessages(error).length > 0;
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
