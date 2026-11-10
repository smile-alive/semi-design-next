import { getFormContext } from '../context.js';
import type { FormApi } from '../interface.js';

/** The formApi of the enclosing Form; an empty object outside one. Call it during component initialisation. */
export default function useFormApi<Values extends Record<string, any> = any>(): FormApi<Values> {
    return getFormContext()?.formApi ?? ({} as FormApi<Values>);
}
