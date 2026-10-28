import type { Accessor } from 'solid-js';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import { useFormContext } from './context';
import type { FieldError, FormApi, FormState } from './interface';

type FieldPath = string | Accessor<string>;

const readPath = (field: FieldPath) => (typeof field === 'function' ? field() : field);

/** The formApi of the enclosing Form; an empty object outside one */
export function useFormApi<Values extends Record<string, any> = any>(): FormApi<Values> {
    return useFormContext()?.formApi ?? ({} as FormApi<Values>);
}

/** The form state of the enclosing Form; an empty object outside one */
export function useFormState<Values extends Record<string, any> = any>(): Accessor<FormState<Values>> {
    const form = useFormContext();
    return () => form?.formState() ?? {};
}

/** The formApi methods of one field; an accessor path follows its changes */
export function useFieldApi(field: FieldPath) {
    const formApi = useFormApi();

    return {
        getError: () => formApi.getError(readPath(field)),
        setError: (error: FieldError) => formApi.setError(readPath(field), error),
        getTouched: () => formApi.getTouched(readPath(field)),
        setTouched: (isTouched: boolean) => formApi.setTouched(readPath(field), isTouched),
        getValue: () => formApi.getValue(readPath(field)),
        setValue: (value: unknown) => formApi.setValue(readPath(field), value),
    };
}

export function useFieldState(field: FieldPath): Accessor<{ value: any; error: FieldError; touched: boolean | undefined }> {
    const formState = useFormState();

    return () => {
        const path = readPath(field);
        const state = formState();
        return {
            value: ObjectUtil.get(state.values ?? {}, path),
            error: ObjectUtil.get(state.errors ?? {}, path),
            touched: ObjectUtil.get(state.touched ?? {}, path),
        };
    };
}
