import { h, type VNodeChild } from 'vue';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { render, getElement } from '@test/utils/vue';
import { Form, type FormApi, type FormDefaultSlotProps } from '../..';
import { FormSelect } from '../../field';

export { FormCheckbox, FormInput, FormSelect, FormSwitch } from '../../field';

export const prefix = `${BASE_CLASS_PREFIX}-form`;
export const fieldSelector = `.${prefix}-field`;
export const labelSelector = `.${prefix}-field-label`;
export const errorSelector = `.${prefix}-field-error-message`;

export const getInput = (scope = '') => getElement<HTMLInputElement>(`${scope} .${BASE_CLASS_PREFIX}-input`);
export const getInputs = () => Array.from(document.querySelectorAll<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-input`));

export const flush = () => new Promise((resolve) => setTimeout(resolve));

type Content = (scope: FormDefaultSlotProps) => VNodeChild;

export function renderForm(props: Record<string, unknown> = {}, content?: Content) {
    let formApi: FormApi | undefined;
    const view = render(Form, {
        props: {
            ...props,
            onGetFormApi: (api: FormApi) => {
                formApi = api;
                (props.onGetFormApi as ((api: FormApi) => void) | undefined)?.(api);
            },
        },
        slots: content ? { default: (scope: FormDefaultSlotProps) => content(scope) } : {},
    });
    return {
        ...view,
        api: () => formApi!,
        rerender: (next: Record<string, unknown>) => view.rerender(next),
        unmount: () => view.unmount(),
    };
}

export const selectWithOptions = (props: Record<string, unknown> = {}) =>
    h(FormSelect, { field: 'business', label: 'business', ...props }, () => [h(FormSelect.Option, { value: 'abc' }, () => 'Abc'), h(FormSelect.Option, { value: 'hotsoon' }, () => 'Hotsoon'), h(FormSelect.Option, { value: 'topbuzz' }, () => 'TopBuzz')]);
