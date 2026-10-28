import { isVNode } from 'vue';
import { cloneFormValue } from '@fibrae/semi-foundation/form/utils';
import type { FieldError, FieldLabel } from './interface';

/** Deep clone that keeps functions, VNodes and errors as they are */
export function cloneDeep<T>(value: T) {
    return cloneFormValue(value, isVNode);
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
