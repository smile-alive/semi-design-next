import type { FieldErrorInput } from '@fibrae/semi-foundation/components/form/interface';
import type { FormApi } from '../interface';
import useFormApi from './use-form-api';

function buildFieldApi(formApi: FormApi, field: string) {
    return {
        getError: () => formApi.getError(field),
        setError: (error: FieldErrorInput) => formApi.setError(field, error),
        getTouched: () => formApi.getTouched(field),
        setTouched: (isTouched: boolean) => formApi.setTouched(field, isTouched),
        getValue: () => formApi.getValue(field),
        setValue: (value: any) => formApi.setValue(field, value),
    };
}

export default function useFieldApi(field: string) {
    const formApi = useFormApi();
    return buildFieldApi(formApi, field);
}
