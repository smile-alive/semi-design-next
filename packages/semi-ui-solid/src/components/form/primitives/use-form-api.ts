import { useFormContext } from '../context';
import type { FormApi } from '../interface';

/** The formApi of the enclosing Form; an empty object outside one */
export default function useFormApi<Values extends Record<string, any> = any>(): FormApi<Values> {
    return useFormContext()?.formApi ?? ({} as FormApi<Values>);
}
