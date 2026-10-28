import type { ReactFieldError as FieldError } from '../error-message';
import type { FormApi } from '../interface';
import useFormApi from './use-form-api';

function buildFieldApi(formApi: FormApi, field: string) {
    return {
        getError: () => formApi.getError(field),
        setError: (error: FieldError) => formApi.setError(field, error),
        getTouched: () => formApi.getTouched(field),
        setTouched: (isTouched: boolean) => formApi.setTouched(field, isTouched),
        getValue: () => formApi.getValue(field),
        setValue: (value: any) => formApi.setValue(field, value),
    };
}

export default function useFieldApi(field: string) {
    const formApi = useFormApi();
    const fieldApi = buildFieldApi(formApi, field);
    return fieldApi;
}
