import { untrack } from 'svelte';
import { cloneFormValue } from '@fibrae/semi-foundation/form/utils';
import type { CommonFieldProps, FieldError, FieldLabel } from './interface.js';

/** The props a field consumes itself; a bare Checkbox or Radio drops them, except id and name */
const fieldOnlyKeys = new Set<string>([
    'allowEmpty',
    'allowEmptyString',
    'convert',
    'emptyValue',
    'error',
    'extraText',
    'extraTextPosition',
    'field',
    'fieldClassName',
    'fieldLabel',
    'fieldStyle',
    'helpText',
    'initValue',
    'keepState',
    'label',
    'labelAlign',
    'labelCol',
    'labelExtra',
    'labelPosition',
    'labelWidth',
    'noErrorMessage',
    'noLabel',
    'pure',
    'rules',
    'stopValidateWithError',
    'transform',
    'trigger',
    'validateStatus',
    'validator',
    'wrapperCol',
] satisfies (keyof CommonFieldProps)[]);

export function omitFieldProps(props: Record<string, unknown>) {
    return Object.fromEntries(Object.entries(props).filter(([key]) => !fieldOnlyKeys.has(key)));
}

/** Deep clone that keeps functions, DOM nodes and errors as they are; the server has no DOM nodes to keep */
export function cloneDeep<T>(value: T) {
    return cloneFormValue(value, (item) => typeof Node !== 'undefined' && item instanceof Node);
}

/** Whether an error has content ErrorMessage renders; a number or a boolean does not */
export function hasErrorContent(error: unknown) {
    if (Array.isArray(error)) {
        return error.some(Boolean);
    }
    return typeof error === 'string' && error !== '';
}

export function errorText(error: FieldError) {
    return Array.isArray(error) ? error.filter(Boolean).join(', ') : String(error);
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
