import type { ComputedRef } from 'vue';
import { requireFormContext } from '../context';
import type { FormState } from '../interface';

export default function useFormState<Values extends Record<string, any> = any>(): ComputedRef<FormState<Values>> {
    return requireFormContext('useFormState').formState;
}
