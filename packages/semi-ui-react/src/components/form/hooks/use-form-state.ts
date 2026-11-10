import type { FormState } from '@fibrae/semi-foundation/components/form/interface';
import { useFormStateContext } from '../context';

export default function useFormState<T extends Record<string, any> = any>() {
    return useFormStateContext() as FormState<T>;
}
