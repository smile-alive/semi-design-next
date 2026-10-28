/** @jsxImportSource vue */
import { defineComponent, h, KeepAlive, nextTick, ref, type Component, type VNodeChild } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, within } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import {
    FormAutoComplete,
    FormCascader,
    FormCheckbox,
    FormCheckboxGroup,
    FormDatePicker,
    FormInput,
    FormInputNumber,
    FormPinCode,
    FormRadio,
    FormRadioGroup,
    FormRating,
    FormSelect,
    FormSlider,
    FormSwitch,
    FormTagInput,
    FormTextArea,
    FormTimePicker,
    FormTreeSelect,
    FormUpload,
    type FieldHandle,
    type FormApi,
} from '..';
import type { CheckboxHandle } from '../../checkbox';
import type { RadioHandle } from '../../radio';
import { renderForm } from './fixtures/fields';
import SelectOptions from './fixtures/select-options.vue';

const settle = () => new Promise((resolve) => setTimeout(resolve));
const act = async (run: () => unknown) => {
    await run();
    await settle();
};
const click = (element: Element | null) => act(() => userEvent.click(element as Element));
const typeInto = (element: Element, text: string) => act(() => userEvent.type(element, text));
const update = (element: Element, text: string) => act(() => fireEvent.update(element, text));
const byClass = <E extends Element = HTMLElement>(name: string) => document.querySelector<E>(`.${BASE_CLASS_PREFIX}-${name}`) as E;
const options = [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
];
const treeData = [
    { label: 'A', value: 'a', key: 'a' },
    { label: 'B', value: 'b', key: 'b' },
];
const file = () => new File(['semi'], 'semi.txt', { type: 'text/plain' });
const uploaded = { uid: '1', name: 'init.txt', status: 'success', url: '' };

interface FieldCase {
    component: Component;
    props?: Record<string, unknown>;
    slots?: Record<string, () => VNodeChild>;
    /** A value to start from, other than the one `change` produces */
    init: unknown;
    /** Makes the control report a new value through its own change */
    change: () => Promise<unknown>;
    /** The form value the change leaves without an initValue */
    value: unknown;
}

const cases: Record<string, FieldCase> = {
    FormInput: {
        component: FormInput,
        init: 'init',
        change: () => typeInto(screen.getByRole('textbox'), 'abc'),
        value: 'abc',
    },
    FormInputNumber: {
        component: FormInputNumber,
        init: 5,
        change: () => typeInto(screen.getByRole('spinbutton'), '12'),
        value: 12,
    },
    FormTextArea: {
        component: FormTextArea,
        init: 'init',
        change: () => typeInto(screen.getByRole('textbox'), 'abc'),
        value: 'abc',
    },
    FormSelect: {
        component: FormSelect,
        slots: {
            default: () => (
                <>
                    <FormSelect.Option value="a">{() => 'A'}</FormSelect.Option>
                    <FormSelect.Option value="b">{() => 'B'}</FormSelect.Option>
                </>
            ),
        },
        init: 'a',
        change: async () => {
            await click(screen.getByRole('combobox'));
            await click(screen.getByRole('option', { name: 'B' }));
        },
        value: 'b',
    },
    FormCheckboxGroup: {
        component: FormCheckboxGroup,
        props: { options },
        init: ['a'],
        change: () => click(screen.getByRole('checkbox', { name: 'B' })),
        value: ['b'],
    },
    FormCheckbox: {
        component: FormCheckbox,
        slots: { default: () => 'Agree' },
        init: true,
        change: () => click(screen.getByRole('checkbox')),
        value: true,
    },
    FormRadioGroup: {
        component: FormRadioGroup,
        props: { options },
        init: 'a',
        change: () => click(screen.getByRole('radio', { name: 'B' })),
        value: 'b',
    },
    FormRadio: {
        component: FormRadio,
        slots: { default: () => 'Yes' },
        init: false,
        change: () => click(screen.getByRole('radio')),
        value: true,
    },
    FormDatePicker: {
        component: FormDatePicker,
        props: { motion: false },
        init: new Date(2019, 7, 1),
        change: () => update(byClass('input'), '2019-08-10'),
        value: new Date(2019, 7, 10),
    },
    FormSwitch: {
        component: FormSwitch,
        init: true,
        change: () => click(screen.getByRole('switch')),
        value: true,
    },
    FormSlider: {
        component: FormSlider,
        init: 50,
        change: () => update(screen.getByRole('slider'), '30'),
        value: 30,
    },
    FormTimePicker: {
        component: FormTimePicker,
        props: { motion: false },
        init: new Date(2019, 7, 8, 9, 0, 0),
        change: () => update(byClass('input'), '10:24:18'),
        value: new Date(2019, 7, 8, 10, 24, 18),
    },
    FormTreeSelect: {
        component: FormTreeSelect,
        props: { treeData, motion: false },
        init: 'a',
        change: async () => {
            await click(byClass('tree-select'));
            await click([...document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tree-option`)].find((node) => node.textContent === 'B') as Element);
        },
        value: 'b',
    },
    FormCascader: {
        component: FormCascader,
        props: { treeData, motion: false },
        init: ['a'],
        change: async () => {
            await click(byClass('cascader'));
            await click(screen.getByText('B', { selector: `.${BASE_CLASS_PREFIX}-cascader-option-label > span` }).closest('li'));
        },
        value: ['b'],
    },
    FormRating: {
        component: FormRating,
        init: 1,
        change: () => click(screen.getAllByRole('radio')[2]),
        value: 3,
    },
    FormAutoComplete: {
        component: FormAutoComplete,
        props: { motion: false },
        init: 'init',
        change: () => typeInto(screen.getByRole('combobox'), 'abc'),
        value: 'abc',
    },
    FormUpload: {
        component: FormUpload,
        props: { action: 'https://semi.design/upload', customRequest: () => undefined },
        slots: { default: () => 'Upload' },
        init: [uploaded],
        change: () => {
            // jsdom has no object URLs for the file preview
            vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:semi');
            return act(() => fireEvent.change(byClass('upload-hidden-input'), { target: { files: [file()] } }));
        },
        value: [expect.objectContaining({ name: 'semi.txt' })],
    },
    FormTagInput: {
        component: FormTagInput,
        init: ['init'],
        change: () => typeInto(screen.getByRole('textbox'), 'x{Enter}'),
        value: ['x'],
    },
    FormPinCode: {
        component: FormPinCode,
        props: { count: 4 },
        init: '9999',
        change: async () => {
            await click(screen.getAllByRole('textbox')[0]);
            await act(() => userEvent.keyboard('1234'));
        },
        value: '1234',
    },
};
const names = Object.keys(cases);

function renderField(name: string, props: Record<string, unknown> = {}) {
    const { component, props: own, slots } = cases[name];
    const view = renderForm({}, () => h(component, { field: 'f', ...own, ...props }, slots));
    return { ...view, field: () => view.container.querySelector(`.${BASE_CLASS_PREFIX}-form-field`) as HTMLElement };
}

const shown = (root: Element) =>
    JSON.stringify([root.textContent, [...root.querySelectorAll<HTMLInputElement>('input, textarea')].map((input) => [input.value, input.checked]), [...root.querySelectorAll('[aria-checked], [aria-valuenow]')].map((element) => [element.getAttribute('aria-checked'), element.getAttribute('aria-valuenow')])]);

// A user leaves the control to press reset, and an InputNumber keeps the typed text while it is focused
const reset = (api: FormApi) =>
    act(() => {
        (document.activeElement as HTMLElement | null)?.blur();
        api.reset();
    });

describe('Form 字段', () => {
    it('FormSelect 承接 Select 的 Option 与 OptGroup', async () => {
        const { api } = renderForm({ initValues: { city: 'sh' } }, () => <FormSelect field="city">{() => <FormSelect.OptGroup label="cn">{() => <FormSelect.Option value="sh">{() => 'Shanghai'}</FormSelect.Option>}</FormSelect.OptGroup>}</FormSelect>);
        await settle();
        expect(api().getValue('city')).toBe('sh');
        expect(document.body).toHaveTextContent('Shanghai');
    });

    it.each(names)('%s 经被包装组件的 change 写入表单值', async (name) => {
        const { api } = renderField(name);
        await settle();
        await cases[name].change();
        expect(api().getValue('f')).toEqual(cases[name].value);
    });

    it.each(names)('%s 在 reset 后显示回到空值', async (name) => {
        const { api, field } = renderField(name);
        await settle();
        const before = shown(field());
        await cases[name].change();
        expect(shown(field())).not.toBe(before);
        await reset(api());
        expect(api().getValue('f')).toBeUndefined();
        expect(shown(field())).toBe(before);
    });

    it.each(names)('%s 在 reset 后显示回到 initValue', async (name) => {
        const { api, field } = renderField(name, { initValue: cases[name].init });
        await settle();
        const before = shown(field());
        await cases[name].change();
        expect(shown(field())).not.toBe(before);
        await reset(api());
        expect(api().getValue('f')).toEqual(cases[name].init);
        expect(shown(field())).toBe(before);
    });

    it('19 个字段的 DOM 上都没有 validatestatus、insetlabelid 属性；不支持内嵌标签的字段按 top 布局并警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        renderForm({ labelPosition: 'inset' }, () =>
            names.map((name) =>
                h(cases[name].component, {
                    field: name,
                    label: name,
                    validateStatus: 'error',
                    fieldClassName: name,
                    ...cases[name].props,
                })
            )
        );
        await settle();
        const attributes = [...document.querySelectorAll('*')].flatMap((element) => element.getAttributeNames());
        expect(attributes.filter((key) => /^(validate-?status|inset-?label-?id)$/i.test(key))).toEqual([]);

        const group = document.querySelector(`.FormCheckboxGroup`) as HTMLElement;
        const checkboxes = within(group).getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
        expect(checkboxes.map((input) => input.getAttribute('aria-invalid'))).toEqual(checkboxes.map(() => 'true'));
        expect(group.querySelector('[role="group"]')?.hasAttribute('aria-invalid')).toBe(false);

        const inset = ['FormInput', 'FormInputNumber', 'FormSelect', 'FormDatePicker', 'FormTimePicker', 'FormTreeSelect', 'FormCascader', 'FormAutoComplete', 'FormTagInput'];
        const layout = (name: string) => document.querySelector(`.${name}`)?.getAttribute('x-label-pos');
        const warned = (name: string) => warn.mock.calls.some(([message]) => String(message).includes(`${name} has no inset label`));
        expect(Object.fromEntries(names.map((name) => [name, [layout(name), warned(name)]]))).toEqual(Object.fromEntries(names.map((name) => [name, inset.includes(name) ? ['inset', false] : ['top', true]])));
        const references = [...document.querySelectorAll('[aria-labelledby]')].flatMap((element) => (element.getAttribute('aria-labelledby') as string).split(' '));
        expect(references.length).toBeGreaterThanOrEqual(names.length);
        expect(references.filter((id) => !document.getElementById(id))).toEqual([]);
        warn.mockRestore();
    });

    it('labelPosition="inset" 时，不支持内嵌标签的字段以渲染出的 top label 命名控件', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        renderForm({ labelPosition: 'inset' }, () => (
            <>
                <FormSwitch field="on" label="Notify" />
                <FormSlider field="level" label="Level" />
                <FormPinCode field="code" label="Code" />
            </>
        ));
        await settle();
        expect(screen.getByRole('switch', { name: 'Notify' })).toBeInTheDocument();
        expect(screen.getByRole('slider', { name: 'Level' })).toBeInTheDocument();
        expect(screen.getByRole('group', { name: 'Code' })).toBeInTheDocument();
    });

    it.each([
        ['FormSelect', { modelValue: 'b' }, () => screen.queryByText('B')],
        ['FormSwitch', { modelValue: true }, () => screen.queryByRole('switch', { checked: true })],
        ['FormCheckbox', { defaultChecked: true }, () => screen.queryByRole('checkbox', { checked: true })],
        ['FormUpload', { fileList: [uploaded], defaultFileList: [uploaded] }, () => screen.queryByText('init.txt')],
    ] as const)('%s 剔除值属性 %o 并警告，被包装组件收不到', async (name, props, find) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { api } = renderField(name, props);
        await settle();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(`${name} takes its value from the Form`));
        expect(api().getValue('f')).toBeUndefined();
        expect(find()).toBeNull();
        warn.mockRestore();
    });

    it('FormInput 剔除 onUpdate:modelValue 并警告，值仍按 change 写入', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const onUpdate = vi.fn<(value: string) => void>();
        const { api } = renderField('FormInput', { 'onUpdate:modelValue': onUpdate });
        await settle();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('FormInput takes its value from the Form'));
        await typeInto(screen.getByRole('textbox'), 'abc');
        expect(onUpdate).not.toHaveBeenCalled();
        expect(api().getValue('f')).toBe('abc');
        warn.mockRestore();
    });

    it('FormSelect.Option 用模板与 h() 增删时，下拉选项随之更新；模板写法无告警', async () => {
        const warn = vi.spyOn(console, 'warn');
        const view = render(SelectOptions, { props: { options: ['A', 'B'] } });
        await settle();
        await click(screen.getByRole('combobox'));
        expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['A', 'B']);
        await view.rerender({ options: ['A', 'C', 'D'] });
        await settle();
        expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['A', 'C', 'D']);
        view.unmount();
        expect(warn).not.toHaveBeenCalled();

        const labels = ref(['X']);
        renderForm({}, () => (
            <FormSelect field="h" defaultOpen>
                {() =>
                    labels.value.map((label) => (
                        <FormSelect.Option key={label} value={label}>
                            {() => label}
                        </FormSelect.Option>
                    ))
                }
            </FormSelect>
        ));
        await settle();
        expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['X']);
        labels.value = ['X', 'Y'];
        await settle();
        expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['X', 'Y']);
    });

    it('FormCheckbox、FormRadio 无 field 时透明：属性、插槽与经 control 取到的句柄同普通组件', async () => {
        const checkbox = ref<FieldHandle<CheckboxHandle>>();
        const radio = ref<FieldHandle<RadioHandle>>();
        const { api } = renderForm({}, () => (
            <>
                <FormCheckboxGroup field="group">
                    {() => (
                        <FormCheckbox ref={checkbox} value="a" class="own" data-testid="a">
                            {() => 'A'}
                        </FormCheckbox>
                    )}
                </FormCheckboxGroup>
                <FormRadioGroup field="pick">
                    {() => (
                        <FormRadio ref={radio} value="r">
                            {() => 'R'}
                        </FormRadio>
                    )}
                </FormRadioGroup>
            </>
        ));
        await settle();
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field`)).toHaveLength(2);
        expect(screen.getByTestId('a')).toHaveClass('own');
        expect(typeof checkbox.value?.control?.focus).toBe('function');
        expect(typeof radio.value?.control?.focus).toBe('function');

        await click(screen.getByRole('checkbox', { name: 'A' }));
        await click(screen.getByRole('radio', { name: 'R' }));
        expect(api().getValues()).toEqual({ group: ['a'], pick: 'r' });
    });

    it('FormCheckbox、FormRadio 无 field 时，id 与 name 落到控件上', async () => {
        renderForm({}, () => (
            <>
                <FormCheckboxGroup field="group">
                    {() => (
                        <FormCheckbox value="a" id="own-checkbox">
                            {() => 'A'}
                        </FormCheckbox>
                    )}
                </FormCheckboxGroup>
                <FormRadioGroup field="pick">
                    {() => (
                        <FormRadio value="r" id="own-radio" name="own-name">
                            {() => 'R'}
                        </FormRadio>
                    )}
                </FormRadioGroup>
            </>
        ));
        await settle();
        expect(screen.getByRole('checkbox', { name: 'A' })).toHaveAttribute('id', 'own-checkbox');
        expect(screen.getByRole('radio', { name: 'R' })).toHaveAttribute('id', 'own-radio');
        expect(screen.getByRole('radio', { name: 'R' })).toHaveAttribute('name', 'own-name');
    });

    it.each(names)('%s 的 @change 末参是最新的表单值', async (name) => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderField(name, { onChange });
        await settle();
        await cases[name].change();
        expect(onChange).toHaveBeenCalled();
        expect(onChange.mock.lastCall?.at(-1)).toEqual(api().getValues());
        expect(onChange.mock.lastCall?.at(-1)).toEqual({ f: cases[name].value });
    });

    it('声明 blur emit 的字段与经 attrs 收到 onBlur 的字段都触发 blur 校验与 touched', async () => {
        const validator = () => 'required';
        const { api } = renderForm({ trigger: 'blur' }, () => (
            <>
                <FormInput field="input" validator={validator} />
                <FormTimePicker field="time" validator={validator} motion={false} />
                <FormCheckbox field="checkbox" validator={validator}>
                    {() => 'Agree'}
                </FormCheckbox>
                <FormSwitch field="switch" validator={validator} />
            </>
        ));
        await settle();
        const timeInput = byClass<HTMLInputElement>('timepicker input');
        for (const control of [screen.getByRole('textbox'), screen.getByRole('checkbox'), screen.getByRole('switch')]) {
            await act(() => {
                control.focus();
                control.blur();
            });
        }
        await act(() => timeInput.focus());
        await act(() => fireEvent.mouseDown(document.body));
        const fields = ['input', 'time', 'checkbox', 'switch'];
        expect(fields.map((field) => [field, api().getTouched(field), api().getError(field)])).toEqual(fields.map((field) => [field, true, 'required']));
    });

    it('字段在 KeepAlive 停用时注销，再激活时带回值；keepState 的字段经 v-if 重新挂载后恢复值', async () => {
        const shownTab = ref<'select' | 'none'>('select');
        const mounted = ref(true);
        const None = defineComponent(() => () => null);
        const { api } = renderForm({}, () => (
            <>
                <KeepAlive>
                    {() =>
                        shownTab.value === 'select' ? (
                            <FormSelect key="select" field="city">
                                {() => <FormSelect.Option value="sh">{() => 'Shanghai'}</FormSelect.Option>}
                            </FormSelect>
                        ) : (
                            <None />
                        )
                    }
                </KeepAlive>
                {mounted.value ? <FormCheckboxGroup field="tags" keepState options={options} /> : null}
            </>
        ));
        await settle();
        await act(() => api().setValues({ city: 'sh', tags: ['b'] }));

        shownTab.value = 'none';
        mounted.value = false;
        await act(nextTick);
        expect(api().getFieldExist('city')).toBe(false);
        expect(api().getFieldExist('tags')).toBe(false);

        shownTab.value = 'select';
        mounted.value = true;
        await act(nextTick);
        expect(api().getValues()).toEqual({ city: 'sh', tags: ['b'] });
        expect(within(document.body).getByText('Shanghai')).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'B' })).toBeChecked();
    });
});
