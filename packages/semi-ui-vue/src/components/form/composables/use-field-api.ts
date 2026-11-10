import { type MaybeRefOrGetter, toValue } from 'vue';
import { requireFormContext } from '../context';
import type { FieldErrorInput } from '../interface';

export default function useFieldApi(field: MaybeRefOrGetter<string>) {
    const { formApi } = requireFormContext('useFieldApi');

    return {
        getError: () => formApi.getError(toValue(field)),
        setError: (error: FieldErrorInput) => formApi.setError(toValue(field), error),
        getTouched: () => formApi.getTouched(toValue(field)),
        setTouched: (isTouched: boolean) => formApi.setTouched(toValue(field), isTouched),
        getValue: () => formApi.getValue(toValue(field)),
        setValue: (value: unknown) => formApi.setValue(toValue(field), value),
    };
}
