import { type ComputedRef, type MaybeRefOrGetter, computed, toValue } from 'vue';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import { type ArrayFieldContextValue, useArrayFieldContext, useFormContext } from './context';
import type { FieldError, FormApi, FormState } from './interface';

export function requireFormContext(caller: string) {
    const context = useFormContext();
    if (!context) {
        throw new Error(`[Semi Form] ${caller} must be called inside <Form>`);
    }
    return context;
}

export function useFormApi<Values extends Record<string, any> = any>(): FormApi<Values> {
    return requireFormContext('useFormApi').formApi;
}

export function useFormState<Values extends Record<string, any> = any>(): ComputedRef<FormState<Values>> {
    return requireFormContext('useFormState').formState;
}

export function useFieldApi(field: MaybeRefOrGetter<string>) {
    const { formApi } = requireFormContext('useFieldApi');

    return {
        getError: () => formApi.getError(toValue(field)),
        setError: (error: FieldError) => formApi.setError(toValue(field), error),
        getTouched: () => formApi.getTouched(toValue(field)),
        setTouched: (isTouched: boolean) => formApi.setTouched(toValue(field), isTouched),
        getValue: () => formApi.getValue(toValue(field)),
        setValue: (value: unknown) => formApi.setValue(toValue(field), value),
    };
}

export function useFieldState(field: MaybeRefOrGetter<string>): ComputedRef<{
    value: any;
    error: FieldError;
    touched: boolean | undefined;
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

/** Internal: whether the caller renders inside an ArrayField, and the values its rows start from */
export function useArrayFieldState(): ComputedRef<ArrayFieldContextValue & { inArrayField: boolean }> {
    const context = useArrayFieldContext();

    return computed(() => (context ? { ...context.value, inArrayField: true } : { shouldUseInitValue: true, inArrayField: false }));
}
