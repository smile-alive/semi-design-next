import { useState } from 'react';
import { createFormApiProxy, EMPTY_FORM_STATE } from '@fibrae/semi-foundation/form/form-api-proxy';
import type { FormState } from '@fibrae/semi-foundation/form/interface';

/**
 * Creates a FormApi usable outside the Form component:
 * `const [formApi, formState, formValues] = Form.useForm();` then `<Form form={formApi}>`
 */
export default function useForm<T extends Record<string, any> = any>() {
    const [formState, setFormState] = useState<FormState<T>>(EMPTY_FORM_STATE as FormState<T>);
    const [proxy] = useState(() => createFormApiProxy<T>(setFormState));
    const values = formState.values as T;
    return [proxy, formState, values] as const;
}
