import type { Accessor } from 'solid-js';
import { useFormContext } from '../context';
import type { FormState } from '../interface';

/** The form state of the enclosing Form; an empty object outside one */
export default function useFormState<Values extends Record<string, any> = any>(): Accessor<FormState<Values>> {
    const form = useFormContext();
    return () => form?.formState() ?? {};
}
