import { flushSync } from 'svelte';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { misplacedAriaRequired } from '@test/utils/dom/common';
import type { FormApi } from '../interface';
import BareControls from './b-bare-controls.svelte';
import { renderAnyFields } from './b-helpers';
import { errorSelector, labelSelector, renderForm, settle, typeInto } from './helpers';

const options = [
    { label: '甲', value: 'a' },
    { label: '乙', value: 'b' },
];

describe('Svelte Form 各类字段', () => {
    it('FormCheckbox：点击写入 checked，setValue 与 reset 同步到控件；不把 Form 注入的属性落到 DOM', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { api, container } = renderForm({}, [{ type: 'checkbox', props: { field: 'agree', label: '同意', onChange } }]);
        const box = screen.getByRole('checkbox', { name: '同意' }) as HTMLInputElement;
        await fireEvent.click(box);
        flushSync();
        expect(api().getValue('agree')).toBe(true);
        expect(box.checked).toBe(true);
        expect(onChange.mock.calls[0].at(-1)).toEqual({ agree: true });
        api().setValue('agree', false);
        await settle();
        expect(box.checked).toBe(false);
        expect(container.querySelector('[validatestatus], [insetlabel]')).toBeNull();
    });

    it('FormCheckboxGroup 写入数组值，setValue 同步勾选', async () => {
        const { api } = renderForm({}, [{ type: 'checkboxGroup', props: { field: 'list', label: '列表', options } }]);
        await fireEvent.click(screen.getByRole('checkbox', { name: '乙' }));
        flushSync();
        expect(api().getValue('list')).toEqual(['b']);
        api().setValue('list', ['a']);
        await settle();
        expect((screen.getByRole('checkbox', { name: '甲' }) as HTMLInputElement).checked).toBe(true);
        expect((screen.getByRole('checkbox', { name: '乙' }) as HTMLInputElement).checked).toBe(false);
    });

    it('FormRadioGroup 从事件的 target.value 取值', async () => {
        const { api } = renderForm({}, [{ type: 'radioGroup', props: { field: 'r', label: '单选', options, initValue: 'a' } }]);
        expect((screen.getByRole('radio', { name: '甲' }) as HTMLInputElement).checked).toBe(true);
        await fireEvent.click(screen.getByRole('radio', { name: '乙' }));
        flushSync();
        expect(api().getValue('r')).toBe('b');
        api().reset();
        await settle();
        expect((screen.getByRole('radio', { name: '甲' }) as HTMLInputElement).checked).toBe(true);
    });

    it('FormSwitch 写入 checked，失焦后标记 touched', async () => {
        const { api } = renderForm({}, [{ type: 'switch', props: { field: 'on', label: '开关' } }]);
        const control = screen.getByRole('switch', { name: '开关' }) as HTMLInputElement;
        await fireEvent.click(control);
        flushSync();
        expect(api().getValue('on')).toBe(true);
        await fireEvent.blur(control);
        flushSync();
        expect(api().getTouched('on')).toBe(true);
        api().setValue('on', false);
        await settle();
        expect(control.checked).toBe(false);
    });

    it('FormTextArea 与 FormInputNumber 输入同步到表单', async () => {
        const { api } = renderForm({}, [
            { type: 'textArea', props: { field: 'desc', label: '描述' } },
            { type: 'inputNumber', props: { field: 'count', label: '数量' } },
        ]);
        await typeInto(screen.getByRole('textbox', { name: '描述' }) as HTMLTextAreaElement, 'hello');
        expect(api().getValue('desc')).toBe('hello');
        api().setValue('count', 3);
        await settle();
        expect(screen.getByRole('spinbutton', { name: '数量' })).toHaveValue('3');
    });

    it('FormSelect、FormRating、FormSlider、FormTagInput、FormPinCode 显示表单值', async () => {
        const { api, container } = renderForm({}, [
            { type: 'select', props: { field: 's', label: '选择', optionList: options, initValue: 'b' } },
            { type: 'rating', props: { field: 'rate', label: '评分', initValue: 2 } },
            { type: 'slider', props: { field: 'level', label: '等级', initValue: 30 } },
            { type: 'tagInput', props: { field: 'tags', label: '标签', initValue: ['x', 'y'] } },
            { type: 'pinCode', props: { field: 'pin', label: '验证码', initValue: '123456' } },
        ]);
        expect(container.querySelector('.semi-select-selection')).toHaveTextContent('乙');
        expect(screen.getByRole('slider', { name: '等级' })).toHaveValue('30');
        expect(container.querySelectorAll('.semi-tag')).toHaveLength(2);
        expect(
            Array.from(container.querySelectorAll<HTMLInputElement>('.semi-pincode-wrapper input'))
                .map((item) => item.value)
                .join('')
        ).toBe('123456');
        api().setValue('s', 'a');
        api().setValue('tags', ['z']);
        await settle();
        expect(container.querySelector('.semi-select-selection')).toHaveTextContent('甲');
        expect(container.querySelectorAll('.semi-tag')).toHaveLength(1);
        expect(api().getValues()).toEqual({ s: 'a', rate: 2, level: 30, tags: ['z'], pin: '123456' });
        expect(container.querySelectorAll(labelSelector)).toHaveLength(5);
    });

    it('FormCascader 显示初值，选中叶子后写入表单，setValue 同步到选择框', async () => {
        const treeData = [
            { label: '亚洲', value: 'Asia', children: [{ label: '中国', value: 'China' }] },
            { label: '北美洲', value: 'NA', children: [{ label: '美国', value: 'US' }] },
        ];
        const { api, container } = renderForm({}, [{ type: 'cascader', props: { field: 'area', label: '地区', treeData, initValue: ['Asia', 'China'] } }]);
        const combobox = screen.getByRole('combobox', { name: '地区' });
        const selection = () => container.querySelector('.semi-cascader-selection')?.textContent?.trim();
        expect(selection()).toBe('亚洲 / 中国');
        await fireEvent.click(combobox);
        flushSync();
        await fireEvent.click(screen.getByText('北美洲', { selector: '.semi-cascader-option-label > span' }));
        flushSync();
        await fireEvent.click(screen.getByText('美国', { selector: '.semi-cascader-option-label > span' }));
        await settle();
        expect(api().getValue('area')).toEqual(['NA', 'US']);
        api().setValue('area', ['Asia', 'China']);
        await settle();
        expect(selection()).toBe('亚洲 / 中国');
    });

    it('FormTreeSelect 显示初值，setValue 同步到选择框', async () => {
        const treeData = [
            { label: '亚洲', value: 'Asia', key: 'asia', children: [{ label: '中国', value: 'China', key: 'china' }] },
            { label: '北美洲', value: 'NA', key: 'na' },
        ];
        const { api, container } = renderForm({}, [{ type: 'treeSelect', props: { field: 'area', label: '地区', treeData, initValue: 'China' } }]);
        expect(screen.getByRole('combobox', { name: '地区' })).toBeInTheDocument();
        const selection = () => container.querySelector('.semi-tree-select-selection')?.textContent?.trim();
        expect(selection()).toBe('中国');
        api().setValue('area', 'NA');
        await settle();
        expect(selection()).toBe('北美洲');
    });

    it('单选组校验失败时控件组带 aria-invalid 与错误信息', async () => {
        const { api, container } = renderForm({}, [{ type: 'radioGroup', props: { field: 'r', label: '单选', options, rules: [{ required: true, message: '请选择' }] } }]);
        await api()
            .validate()
            .catch(() => undefined);
        await settle();
        expect(container.querySelector(errorSelector)).toHaveTextContent('请选择');
        expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
    });
});

async function act(run: () => unknown) {
    await run();
    await settle();
}
const click = (element: Element | null) => act(() => userEvent.click(element as Element));
const typeText = (element: Element, content: string) => act(() => userEvent.type(element, content));
const byClass = <E extends Element = HTMLElement>(name: string) => document.querySelector<E>(`.semi-${name}`) as E;
const treeData = [
    { label: 'A', value: 'a', key: 'a' },
    { label: 'B', value: 'b', key: 'b' },
];
const transferData = [
    { label: 'A', value: 'a', key: 'a' },
    { label: 'B', value: 'b', key: 'b' },
];
const uploaded = { uid: '1', name: 'init.txt', status: 'success', url: '' };

interface FieldCase {
    type: string;
    props?: Record<string, unknown>;
    /** A value to start from, other than the one `change` produces */
    init: unknown;
    /** Makes the control report a new value through its own change */
    change: () => Promise<unknown>;
    /** The form value the change leaves without an initValue */
    value: unknown;
}

const cases: Record<string, FieldCase> = {
    FormInput: { type: 'input', init: 'init', change: () => typeText(screen.getByRole('textbox'), 'abc'), value: 'abc' },
    FormInputNumber: { type: 'inputNumber', init: 5, change: () => typeText(screen.getByRole('spinbutton'), '12'), value: 12 },
    FormTextArea: { type: 'textArea', init: 'init', change: () => typeText(screen.getByRole('textbox'), 'abc'), value: 'abc' },
    FormSelect: {
        type: 'select',
        props: { optionList: options.map(({ label, value }) => ({ label: label === '甲' ? 'A' : 'B', value })) },
        init: 'a',
        change: async () => {
            await click(screen.getByRole('combobox'));
            await click(screen.getByRole('option', { name: 'B' }));
        },
        value: 'b',
    },
    FormCheckboxGroup: {
        type: 'checkboxGroup',
        props: {
            options: [
                { label: 'A', value: 'a' },
                { label: 'B', value: 'b' },
            ],
        },
        init: ['a'],
        change: () => click(screen.getByRole('checkbox', { name: 'B' })),
        value: ['b'],
    },
    FormCheckbox: { type: 'checkbox', init: true, change: () => click(screen.getByRole('checkbox')), value: true },
    FormRadioGroup: {
        type: 'radioGroup',
        props: {
            options: [
                { label: 'A', value: 'a' },
                { label: 'B', value: 'b' },
            ],
        },
        init: 'a',
        change: () => click(screen.getByRole('radio', { name: 'B' })),
        value: 'b',
    },
    FormRadio: { type: 'radio', init: false, change: () => click(screen.getByRole('radio')), value: true },
    FormDatePicker: {
        type: 'datePicker',
        props: { motion: false },
        init: new Date(2019, 7, 1),
        change: async () => {
            await act(() => fireEvent.input(byClass('input'), { target: { value: '2019-08-10' } }));
            await act(() => fireEvent.keyDown(byClass('input'), { key: 'Enter' }));
        },
        value: new Date(2019, 7, 10),
    },
    FormSwitch: { type: 'switch', init: true, change: () => click(screen.getByRole('switch')), value: true },
    FormSlider: { type: 'slider', init: 50, change: () => act(() => fireEvent.input(screen.getByRole('slider'), { target: { value: '30' } })), value: 30 },
    FormTimePicker: {
        type: 'timePicker',
        props: { motion: false },
        init: new Date(2019, 7, 8, 9, 0, 0),
        change: async () => {
            await act(() => fireEvent.input(byClass('timepicker input'), { target: { value: '10:24:18' } }));
            await act(() => fireEvent.keyDown(byClass('timepicker input'), { key: 'Enter' }));
        },
        value: new Date(2019, 7, 8, 10, 24, 18),
    },
    FormTreeSelect: {
        type: 'treeSelect',
        props: { treeData, motion: false },
        init: 'a',
        change: async () => {
            await click(byClass('tree-select'));
            await click([...document.querySelectorAll('.semi-tree-option')].find((node) => node.textContent?.trim() === 'B') as Element);
        },
        value: 'b',
    },
    FormCascader: {
        type: 'cascader',
        props: { treeData, motion: false },
        init: ['a'],
        change: async () => {
            await click(byClass('cascader'));
            await click(screen.getByText('B', { selector: '.semi-cascader-option-label > span' }).closest('li'));
        },
        value: ['b'],
    },
    FormTransfer: {
        type: 'transfer',
        props: { dataSource: transferData },
        init: ['a'],
        change: () => click(within(screen.getByRole('list', { name: zh_CN.Transfer.optionList })).getByText('B')),
        value: ['b'],
    },
    FormRating: { type: 'rating', init: 1, change: () => click(screen.getAllByRole('radio')[2]), value: 3 },
    FormAutoComplete: { type: 'autoComplete', props: { motion: false }, init: 'init', change: () => typeText(screen.getByRole('combobox'), 'abc'), value: 'abc' },
    FormUpload: {
        type: 'upload',
        props: { action: 'https://semi.design/upload', customRequest: () => undefined },
        init: [uploaded],
        change: () => {
            // jsdom has no object URLs for the file preview
            vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:semi');
            return act(() => fireEvent.change(byClass('upload-hidden-input'), { target: { files: [new File(['semi'], 'semi.txt', { type: 'text/plain' })] } }));
        },
        value: [expect.objectContaining({ name: 'semi.txt' })],
    },
    FormTagInput: { type: 'tagInput', init: ['init'], change: () => typeText(screen.getByRole('textbox'), 'x{Enter}'), value: ['x'] },
    FormPinCode: {
        type: 'pinCode',
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
    const { type, props: own } = cases[name];
    const view = renderAnyFields({}, [{ type, props: { field: 'f', ...own, ...props } }]);
    return { ...view, field: () => view.container.querySelector('.semi-form-field') as HTMLElement };
}

const shown = (root: Element) =>
    JSON.stringify([root.textContent, [...root.querySelectorAll<HTMLInputElement>('input, textarea')].map((control) => [control.value, control.checked]), [...root.querySelectorAll('[aria-checked], [aria-valuenow]')].map((element) => [element.getAttribute('aria-checked'), element.getAttribute('aria-valuenow')])]);

// A user leaves the control to press reset, and an InputNumber keeps the typed text while it is focused
const reset = (api: FormApi) =>
    act(() => {
        (document.activeElement as HTMLElement | null)?.blur();
        api.reset();
    });

describe('Svelte Form 全部字段', () => {
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

    it.each(names)('%s 的 onChange 末参是最新的表单值', async (name) => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderField(name, { onChange });
        await settle();
        await cases[name].change();
        expect(onChange).toHaveBeenCalled();
        expect(onChange.mock.lastCall?.at(-1)).toEqual(api().getValues());
        expect(onChange.mock.lastCall?.at(-1)).toEqual({ f: cases[name].value });
    });

    it('FormTransfer 显示 initValue 的已选项并以 label 命名；校验失败显示错误，选择后消失；继承 Form 的 disabled', async () => {
        const { api, container } = renderAnyFields({ disabled: true }, [{ type: 'transfer', props: { field: 'members', label: 'Members', dataSource: transferData, initValue: ['b'], rules: [{ required: true, type: 'array', message: '请选择成员' }] } }]);
        await settle();
        expect(screen.getByRole('group', { name: 'Members' })).toBeInTheDocument();
        expect([...container.querySelectorAll('.semi-transfer-right-item-text')].map((item) => item.textContent)).toEqual(['B']);
        expect(container.querySelector('.semi-transfer')).toHaveClass('semi-transfer-disabled');
        api().setValue('members', []);
        await act(() =>
            api()
                .validate()
                .catch(() => undefined)
        );
        expect(container.querySelector(errorSelector)).toHaveTextContent('请选择成员');
        expect(screen.getByRole('group', { name: 'Members' })).toHaveAttribute('aria-invalid', 'true');
    });

    it('20 个字段的 DOM 上都没有 validatestatus、insetlabelid 属性；不支持内嵌标签的字段按 top 布局并警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        renderAnyFields(
            { labelPosition: 'inset' },
            names.map((name) => ({ type: cases[name].type, props: { field: name, label: name, validateStatus: 'error', fieldClassName: name, ...cases[name].props } }))
        );
        await settle();
        const attributes = [...document.querySelectorAll('*')].flatMap((element) => element.getAttributeNames());
        expect(attributes.filter((key) => /^(validate-?status|inset-?label-?id)$/i.test(key))).toEqual([]);

        const group = document.querySelector('.FormCheckboxGroup') as HTMLElement;
        const checkboxes = within(group).getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
        expect(checkboxes.map((control) => control.getAttribute('aria-invalid'))).toEqual(checkboxes.map(() => 'true'));
        expect(group.querySelector('[role="group"]')?.hasAttribute('aria-invalid')).toBe(false);

        const inset = ['FormInput', 'FormInputNumber', 'FormSelect', 'FormDatePicker', 'FormTimePicker', 'FormTreeSelect', 'FormCascader', 'FormAutoComplete', 'FormTagInput'];
        const layout = (name: string) => document.querySelector(`.${name}`)?.getAttribute('x-label-pos');
        const warned = (name: string) => warn.mock.calls.some(([message]) => String(message).includes(`Field "${name}" is laid out`));
        expect(Object.fromEntries(names.map((name) => [name, [layout(name), warned(name)]]))).toEqual(Object.fromEntries(names.map((name) => [name, inset.includes(name) ? ['inset', false] : ['top', true]])));
        const references = [...document.querySelectorAll('[aria-labelledby]')].flatMap((element) => (element.getAttribute('aria-labelledby') as string).split(' '));
        expect(references.length).toBeGreaterThanOrEqual(names.length);
        expect(references.filter((id) => !document.getElementById(id))).toEqual([]);
        warn.mockRestore();
    });

    it('必填字段的 aria-required 只落在支持它的角色上', async () => {
        renderAnyFields(
            {},
            names.map((name) => ({ type: cases[name].type, props: { field: name, label: name, fieldClassName: name, rules: [{ required: true }], ...cases[name].props } }))
        );
        await settle();
        expect(document.querySelectorAll('[aria-required="true"]').length).toBeGreaterThan(0);
        expect(Object.fromEntries(names.map((name) => [name, misplacedAriaRequired(document.querySelector(`.${name}`) as Element)]))).toEqual(Object.fromEntries(names.map((name) => [name, []])));
    });

    it('labelPosition="inset" 时，不支持内嵌标签的字段以渲染出的 top label 命名控件', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        renderAnyFields({ labelPosition: 'inset' }, [
            { type: 'switch', props: { field: 'on', label: 'Notify' } },
            { type: 'slider', props: { field: 'level', label: 'Level' } },
            { type: 'pinCode', props: { field: 'code', label: 'Code' } },
        ]);
        await settle();
        expect(screen.getByRole('switch', { name: 'Notify' })).toBeInTheDocument();
        expect(screen.getByRole('slider', { name: 'Level' })).toBeInTheDocument();
        expect(screen.getByRole('group', { name: 'Code' })).toBeInTheDocument();
    });

    it('FormCheckbox、FormRadio 无 field 时透明：属性与子内容同普通组件，id 与 name 落到控件上，值经所在的组写入表单', async () => {
        let api: FormApi | undefined;
        render(BareControls, { props: { onApi: (formApi: FormApi) => (api = formApi) } });
        await settle();
        expect(document.querySelectorAll('.semi-form-field')).toHaveLength(2);
        expect(screen.getByTestId('a')).toBeInTheDocument();
        expect(document.querySelector('.own')).not.toBeNull();
        expect(screen.getByRole('checkbox', { name: 'A' })).toHaveAttribute('id', 'own-checkbox');
        expect(screen.getByRole('radio', { name: 'R' })).toHaveAttribute('id', 'own-radio');
        expect(screen.getByRole('radio', { name: 'R' })).toHaveAttribute('name', 'own-name');
        await click(screen.getByRole('checkbox', { name: 'A' }));
        await click(screen.getByRole('radio', { name: 'R' }));
        expect(api?.getValues()).toEqual({ group: ['a'], pick: 'r' });
    });

    it('trigger 为 blur 时，各类字段失焦后都触发校验并标记 touched', async () => {
        const validator = () => 'required';
        const { api } = renderAnyFields({ trigger: 'blur' }, [
            { type: 'input', props: { field: 'input', validator } },
            { type: 'timePicker', props: { field: 'time', validator, motion: false } },
            { type: 'checkbox', props: { field: 'checkbox', validator, label: 'Agree' } },
            { type: 'switch', props: { field: 'switch', validator } },
        ]);
        await settle();
        const timeInput = byClass<HTMLInputElement>('timepicker input');
        for (const control of [screen.getByRole('textbox', { name: 'input' }), screen.getByRole('checkbox'), screen.getByRole('switch')]) {
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
});
