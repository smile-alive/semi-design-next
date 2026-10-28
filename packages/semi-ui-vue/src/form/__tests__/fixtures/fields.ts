import { h, type VNodeChild } from 'vue';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import { Form, type FormApi, type FormDefaultSlotProps } from '../..';
import Select from '../../../select';
import { FormSelect } from '../../field';

export { FormCheckbox, FormInput, FormSelect, FormSwitch } from '../../field';
export const Option = Select.Option;

export const prefix = `${BASE_CLASS_PREFIX}-form`;
export const fieldSelector = `.${prefix}-field`;
export const labelSelector = `.${prefix}-field-label`;
export const errorSelector = `.${prefix}-field-error-message`;

export const getInput = (scope = '') => document.querySelector<HTMLInputElement>(`${scope} .${BASE_CLASS_PREFIX}-input`) as HTMLInputElement;
export const getInputs = () => Array.from(document.querySelectorAll<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-input`));

export const flush = () => new Promise((resolve) => setTimeout(resolve));

type Content = (scope: FormDefaultSlotProps) => VNodeChild;

/** Renders a Form with `content` as its default slot; the returned `api()` is the Form's formApi */
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
        api: () => formApi as FormApi,
        rerender: (next: Record<string, unknown>) => view.rerender(next),
        unmount: () => view.unmount(),
    };
}

export const selectWithOptions = (props: Record<string, unknown> = {}) => h(FormSelect, { field: 'business', label: 'business', ...props }, () => [h(Option, { value: 'abc' }, () => 'Abc'), h(Option, { value: 'hotsoon' }, () => 'Hotsoon'), h(Option, { value: 'topbuzz' }, () => 'TopBuzz')]);
