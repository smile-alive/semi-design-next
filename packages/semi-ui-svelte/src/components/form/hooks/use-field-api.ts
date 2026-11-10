import type { FieldErrorInput } from '../interface.js';
import { type FieldPath, readPath } from '../utils.js';
import useFormApi from './use-form-api.js';

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
