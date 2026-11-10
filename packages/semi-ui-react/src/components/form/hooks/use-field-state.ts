import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import type { FormState } from '../interface';
import useFormState from './use-form-state';

function buildFieldState(formState: FormState, field: string) {
    return {
        value: ObjectUtil.get(formState.values, field),
        error: ObjectUtil.get(formState.errors, field),
        touched: ObjectUtil.get(formState.touched, field),
    };
}

export default function useFieldState(field: string) {
    const formState = useFormState();
    const fieldState = buildFieldState(formState, field);
    return fieldState;
}
