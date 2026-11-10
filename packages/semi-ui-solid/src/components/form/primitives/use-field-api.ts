import type { Accessor } from 'solid-js';
import type { FieldErrorInput } from '../interface';
import useFormApi from './use-form-api';

export type FieldPath = string | Accessor<string>;

export const readPath = (field: FieldPath) => (typeof field === 'function' ? field() : field);

/** The formApi methods of one field; an accessor path follows its changes */
export default function useFieldApi(field: FieldPath) {
    const formApi = useFormApi();

    return {
        getError: () => formApi.getError(readPath(field)),
        setError: (error: FieldErrorInput) => formApi.setError(readPath(field), error),
        getTouched: () => formApi.getTouched(readPath(field)),
        setTouched: (isTouched: boolean) => formApi.setTouched(readPath(field), isTouched),
        getValue: () => formApi.getValue(readPath(field)),
        setValue: (value: unknown) => formApi.setValue(readPath(field), value),
    };
}
