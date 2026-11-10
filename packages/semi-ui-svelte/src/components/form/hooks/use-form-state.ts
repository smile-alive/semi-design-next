import { getFormContext } from '../context.js';
import type { FormState } from '../interface.js';

/** An empty object outside a Form; call the result in the template to follow the state */
export default function useFormState<Values extends Record<string, any> = any>(): () => FormState<Values> {
    const form = getFormContext();
    return () => form?.formState ?? {};
}
