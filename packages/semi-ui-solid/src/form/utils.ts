import { batch } from 'solid-js';
import { isServer } from 'solid-js/web';
import { cloneFormValue } from '@fibrae/semi-foundation/form/utils';
import isMarkup from '../_base/is-markup';
import type { LabelProps } from './label';

/**
 * Runs every method of a foundation api in one Solid batch. A method writes the form state and then more bookkeeping
 * (setValue renews an ArrayField's updateKey after the write); outside a batch the effects reading the state would run
 * in between and see the bookkeeping half done.
 */
export function batchMethods<T extends Record<string, (...args: any[]) => unknown>>(api: T) {
    return Object.fromEntries(Object.entries(api).map(([key, method]) => [key, (...args: unknown[]) => batch(() => method(...args))])) as T;
}

/** Deep clone that keeps functions, DOM nodes and errors as they are; the server has no DOM nodes to keep */
export function cloneDeep<T>(value: T) {
    return cloneFormValue(value, (item) => !isServer && item instanceof Node);
}

/** Whether an error has content ErrorMessage renders; a number or a boolean does not */
export function hasErrorContent(error: unknown) {
    // JSX compiled to an accessor (Show, For) is a function, read as insert() reads function children
    if (typeof error === 'function') {
        return hasErrorContent((error as () => unknown)());
    }
    if (Array.isArray(error)) {
        return error.some(Boolean);
    }
    return (typeof error === 'string' && error !== '') || isMarkup(error);
}

/** A label given as props rather than as content */
export function isLabelConfig(label: unknown): label is LabelProps {
    return typeof label === 'object' && label !== null && !Array.isArray(label) && !isMarkup(label);
}

type Handler = ((...args: any[]) => unknown) | [(data: any, ...args: any[]) => unknown, unknown];

/** Calls a handler prop in either form Solid accepts: a function or a bound `[handler, data]` pair */
export function invoke(handler?: Handler | null, ...args: unknown[]) {
    if (typeof handler === 'function') {
        handler(...args);
    } else if (Array.isArray(handler)) {
        handler[0](handler[1], ...args);
    }
}
