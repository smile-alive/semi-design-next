import { useState } from 'react';
import { createFormApiProxy, EMPTY_FORM_STATE } from '@fibrae/semi-foundation/form/form-api-proxy';
import type { FormState } from '@fibrae/semi-foundation/form/interface';

export default function useForm<T extends Record<string, any> = any, O = T>() {
    const [formState, setFormState] = useState<FormState<T>>(EMPTY_FORM_STATE as FormState<T>);
    const [proxy] = useState(() => createFormApiProxy<T, O>(setFormState));
    const values = formState.values as T;
    return [proxy, formState, values] as const;
}
