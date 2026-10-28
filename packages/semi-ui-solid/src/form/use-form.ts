import { createSignal } from 'solid-js';
import { createFormApiProxy, EMPTY_FORM_STATE } from '@fibrae/semi-foundation/form/form-api-proxy';
import type { FormState } from './interface';

/**
 * A formApi usable outside the Form: `const [formApi, formState, values] = Form.useForm()`, then
 * `<Form form={formApi}>`. The Form binds it on mount and pushes every form state into `formState`.
 */
export default function useForm<Values extends Record<string, any> = any>() {
    const [formState, setFormState] = createSignal(EMPTY_FORM_STATE as FormState<Values>);

    const formApi = createFormApiProxy<Values>((state) => setFormState(() => state));

    const values = () => formState().values as Values;

    return [formApi, formState, values] as const;
}
