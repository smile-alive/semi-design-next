import { isPlainObject } from 'es-toolkit';
import warning from '../../utils/warning';

/** A field's errors; undefined when valid. `['']` fails without a text, as a rule with `message: ''` does */
export type FieldError = string[];

/** What validators and setError may give; normalized to `FieldError | undefined` */
export type FieldErrorInput = string | readonly string[] | undefined | null;

export function isErrorLeaf(value: unknown): value is FieldError {
    return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string');
}

export function normalizeFieldError(input: unknown): FieldError | undefined {
    if (input == null || input === '') {
        return undefined;
    }
    if (typeof input === 'string') {
        return [input];
    }
    if (Array.isArray(input)) {
        if (!input.length) {
            return undefined;
        }
        if (isErrorLeaf(input)) {
            return [...input];
        }
    }
    if (input instanceof Error) {
        return [input.message];
    }
    warning(true, `[Semi Form] a field error must be a string or an array of strings, got ${Object.prototype.toString.call(input)}`);
    return [String(input)];
}

/** Whether a field error or an error tree holds any error; `['']` counts */
export function hasErrors(errors: unknown) {
    if (isErrorLeaf(errors)) {
        return true;
    }
    if (Array.isArray(errors)) {
        return errors.some(hasErrors);
    }
    if (errors !== null && typeof errors === 'object') {
        return Object.values(errors).some(hasErrors);
    }
    return false;
}

/**
 * An error tree from the Form validator, or from setError on a parent path. An array of strings is one field's
 * errors, not the errors of the items under it: those take a nested array (`[['a'], ['b']]`) or an object.
 */
export function normalizeFormErrors(input: unknown) {
    const normalize = (node: unknown): unknown => {
        if (typeof node === 'string' || isErrorLeaf(node)) {
            return normalizeFieldError(node);
        }
        if (Array.isArray(node)) {
            const items = node.map(normalize);
            return items.some((item) => item !== undefined) ? items : undefined;
        }
        if (isPlainObject(node)) {
            const entries = Object.entries(node).flatMap(([key, value]) => {
                const normalized = normalize(value);
                return normalized === undefined ? [] : [[key, normalized] as const];
            });
            return entries.length ? Object.fromEntries(entries) : undefined;
        }
        return undefined;
    };
    return (normalize(input) as Record<string, any> | undefined) ?? {};
}

/** The messages to show: `['']` fails without a text */
export function errorMessages(error: unknown) {
    return isErrorLeaf(error) ? error.filter((message) => message !== '') : [];
}
