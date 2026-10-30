import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import { getFormContext } from './context.js';
import type { FieldError, FormApi, FormState } from './interface.js';

type FieldPath = string | (() => string);

const readPath = (field: FieldPath) => (typeof field === 'function' ? field() : field);

/** The formApi of the enclosing Form; an empty object outside one. Call it during component initialisation. */
export function useFormApi<Values extends Record<string, any> = any>(): FormApi<Values> {
    return getFormContext()?.formApi ?? ({} as FormApi<Values>);
}

/** Reads the form state of the enclosing Form, an empty object outside one; call the result in the template to follow it */
export function useFormState<Values extends Record<string, any> = any>(): () => FormState<Values> {
    const form = getFormContext();
    return () => form?.formState ?? {};
}

/** The formApi methods of one field; a getter path follows its changes */
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

export function useFieldState(field: FieldPath): () => { value: any; error: FieldError; touched: boolean | undefined } {
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
