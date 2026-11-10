import { type ComputedRef, type MaybeRefOrGetter, computed, toValue } from 'vue';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import { requireFormContext } from '../context';
import type { FieldError } from '../interface';

export default function useFieldState(field: MaybeRefOrGetter<string>): ComputedRef<{
    value: any;
    error?: FieldError;
    touched?: boolean;
}> {
    const { formState } = requireFormContext('useFieldState');

    return computed(() => {
        const path = toValue(field);
        return {
            value: ObjectUtil.get(formState.value.values ?? {}, path),
            error: ObjectUtil.get(formState.value.errors ?? {}, path),
            touched: ObjectUtil.get(formState.value.touched ?? {}, path),
        };
    });
}
