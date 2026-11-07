import { isVNode } from 'vue';
import { cloneFormValue } from '@fibrae/semi-foundation/components/form/utils';
import type { FieldLabel } from './interface';

/** Deep clone that keeps functions, VNodes and errors as they are */
export function cloneDeep<T>(value: T) {
    return cloneFormValue(value, isVNode);
}

export function isLabelConfig<L extends FieldLabel>(label?: string | number | L): label is L {
    return label != null && typeof label === 'object';
}
