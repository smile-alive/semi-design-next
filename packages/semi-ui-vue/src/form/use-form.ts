import { type ShallowRef, computed, shallowRef } from 'vue';
import { createFormApiProxy, EMPTY_FORM_STATE } from '@fibrae/semi-foundation/form/form-api-proxy';
import type { FormState } from './interface';

/**
 * A formApi usable outside the Form: `const { formApi, values } = useForm()`, then `<Form :form="formApi">`.
 * The Form binds it on mount and pushes every form state into `formState`.
 */
export default function useForm<Values extends Record<string, any> = any>() {
    const formState = shallowRef(EMPTY_FORM_STATE as FormState<Values>);

    const formApi = createFormApiProxy<Values>((state) => {
        formState.value = state;
    });

    const values = computed(() => formState.value.values as Values);

    return { formApi, formState: formState as Readonly<ShallowRef<FormState<Values>>>, values };
}
