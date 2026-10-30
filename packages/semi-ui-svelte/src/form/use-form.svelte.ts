import { createFormApiProxy, EMPTY_FORM_STATE } from '@fibrae/semi-foundation/form/form-api-proxy';
import type { FormState } from './interface.js';

/**
 * A formApi usable outside the Form: `const { formApi, values } = useForm()`, then `<Form form={formApi}>`. The Form
 * binds it on mount and pushes every form state into `formState`; read both fields in the template to follow them.
 */
export default function useForm<Values extends Record<string, any> = any>() {
    // raw: the Form replaces the state on every change and never mutates it
    let formState = $state.raw(EMPTY_FORM_STATE as FormState<Values>);

    const formApi = createFormApiProxy<Values>((next) => {
        formState = next;
    });

    return {
        formApi,
        get formState() {
            return formState;
        },
        get values() {
            return formState.values as Values;
        },
    };
}
