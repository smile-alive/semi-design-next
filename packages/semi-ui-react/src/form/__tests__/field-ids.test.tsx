import { cloneElement, type ReactElement, type ReactNode } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { Form } from '@fibrae/semi-ui-react';
import { misplacedAriaRequired } from '@test/utils/dom/common';
import type { FormApi } from '../interface';

interface Harness {
    getApi: () => FormApi;
}

function renderForm(children: ReactNode, props: Record<string, unknown> = {}): Harness & { container: HTMLElement } {
    let api: FormApi;
    const { container } = render(
        <Form
            getFormApi={(formApi) => {
                api = formApi;
            }}
            {...props}
        >
            {children}
        </Form>
    );
    return { container, getApi: () => api };
}

// every id an input points to through aria-errormessage / aria-describedby / aria-labelledby must exist
function expectReferencesExist(input: Element) {
    for (const attr of ['aria-errormessage', 'aria-describedby', 'aria-labelledby']) {
        const ids = input.getAttribute(attr)?.split(/\s+/).filter(Boolean) ?? [];
        ids.forEach((id) => {
            expect(document.getElementById(id), `${attr} -> ${id}`).not.toBeNull();
        });
    }
}

describe('Form 字段 id', () => {
    it('两个 Form 有同名字段时，控件 id 不重复，label 各自指向本表单的控件', () => {
        const { container } = render(
            <>
                <Form>
                    <Form.Input field="name" label="Name" />
                </Form>
                <Form>
                    <Form.Input field="name" label="Name" />
                </Form>
            </>
        );
        const inputs = [...container.querySelectorAll('input')];
        const labels = [...container.querySelectorAll('label')];
        expect(new Set(inputs.map((input) => input.id)).size).toBe(2);
        labels.forEach((label, i) => {
            expect(label.htmlFor).toBe(inputs[i].id);
        });
    });

    it('字段显式传入 id 时使用该 id', () => {
        const { container } = render(
            <Form>
                <Form.Input id="custom-id" field="name" label="Name" />
            </Form>
        );
        expect(container.querySelector('input')).toHaveAttribute('id', 'custom-id');
        expect(container.querySelector('label')).toHaveAttribute('for', 'custom-id');
    });
});

describe('Form 字段 memo', () => {
    it('Form 重新渲染并修改 labelWidth 后，字段立即更新 label 宽度', () => {
        const { container, rerender } = render(
            <Form labelWidth={100}>
                <Form.Input field="name" label="Name" />
            </Form>
        );
        expect(container.querySelector('label')).toHaveStyle({ width: '100px' });
        rerender(
            <Form labelWidth={200}>
                <Form.Input field="name" label="Name" />
            </Form>
        );
        expect(container.querySelector('label')).toHaveStyle({ width: '200px' });
    });

    it('Form 重新渲染并修改 showValidateIcon 后，错误图标立即更新', () => {
        let api: FormApi;
        const getFormApi = (formApi: FormApi) => {
            api = formApi;
        };
        const { container, rerender } = render(
            <Form getFormApi={getFormApi} showValidateIcon>
                <Form.Input field="name" />
            </Form>
        );
        act(() => api.setError('name', 'bad'));
        expect(container.querySelector('.semi-form-field-validate-status-icon')).not.toBeNull();
        rerender(
            <Form getFormApi={getFormApi} showValidateIcon={false}>
                <Form.Input field="name" />
            </Form>
        );
        expect(container.querySelector('.semi-form-field-validate-status-icon')).toBeNull();
    });
});

describe('Form 字段的 aria 引用', () => {
    it('错误是 React 元素时，aria-errormessage 指向已渲染的元素', () => {
        const { container, getApi } = renderForm(<Form.Input field="name" />);
        act(() => getApi().setError('name', <b data-testid="jsx-error">bad</b>));
        const input = container.querySelector('input');
        expect(input).toHaveAttribute('aria-errormessage');
        expectReferencesExist(input);
        expect(document.getElementById(input.getAttribute('aria-errormessage'))).toContainElement(screen.getByTestId('jsx-error'));
    });

    it('错误是元素数组时，逐项渲染而不是 [object Object]', () => {
        const { container, getApi } = renderForm(<Form.Input field="name" />);
        act(() => getApi().setError('name', [<b key="a">first</b>, <i key="b">second</i>]));
        const message = container.querySelector('.semi-form-field-error-message');
        expect(message).toHaveTextContent('first, second');
        expectReferencesExist(container.querySelector('input'));
    });

    it('错误态下带 helpText，aria-describedby 不引用未渲染的 helpText', () => {
        const { container, getApi } = renderForm(<Form.Input field="name" helpText="help" />);
        act(() => getApi().setError('name', 'bad'));
        const input = container.querySelector('input');
        expect(screen.queryByText('help')).toBeNull();
        expectReferencesExist(input);
        expect(input.getAttribute('aria-describedby') ?? '').not.toContain('helpText');
    });

    it('noErrorMessage 时不设置 aria-errormessage', () => {
        const { container, getApi } = renderForm(<Form.Input field="name" noErrorMessage />);
        act(() => getApi().setError('name', 'bad'));
        const input = container.querySelector('input');
        expect(input).not.toHaveAttribute('aria-errormessage');
        expectReferencesExist(input);
    });

    it('InputGroup 内的字段出错，aria-errormessage 指向组级错误信息', () => {
        const { container, getApi } = renderForm(
            <Form.InputGroup label={{ text: 'group' }}>
                <Form.Input field="a" />
                <Form.Input field="b" />
            </Form.InputGroup>
        );
        act(() => getApi().setError('a', 'bad'));
        const [first, second] = container.querySelectorAll('input');
        expect(first).toHaveAttribute('aria-errormessage');
        expectReferencesExist(first);
        expect(document.getElementById(first.getAttribute('aria-errormessage'))).toHaveTextContent('bad');
        expect(second).not.toHaveAttribute('aria-errormessage');
    });

    it('label 对象 required 为真时控件设置 aria-required，同时 optional 时不设置', () => {
        const { container } = renderForm(
            <>
                <Form.Input field="a" label={{ text: 'A', required: true }} />
                <Form.Input field="b" label={{ text: 'B', required: true, optional: true }} />
            </>
        );
        const [a, b] = container.querySelectorAll('input');
        expect(a).toHaveAttribute('aria-required', 'true');
        expect(b).not.toHaveAttribute('aria-required', 'true');
    });

    it('使用方传入的 aria-labelledby、aria-describedby 在前，Form 生成的 id 在后', () => {
        const { container } = renderForm(
            <>
                <span id="x">X</span>
                <span id="y">Y</span>
                <Form.Input id="a" aria-describedby="y" aria-labelledby="x" extraText="e" field="a" label="A" />
            </>
        );
        const input = container.querySelector('input');
        expect(input).toHaveAttribute('aria-labelledby', 'x a-label');
        expect(input).toHaveAttribute('aria-describedby', 'y a-extraText');
        expectReferencesExist(input);
    });
});

describe('Form labelPosition="inset"', () => {
    const options = [{ label: 'One', value: 1 }];
    const treeData = [{ label: 'One', value: 'one', key: 'one' }];
    const fields: Record<string, ReactElement<Record<string, unknown>>> = {
        FormInput: <Form.Input field="FormInput" />,
        FormInputNumber: <Form.InputNumber field="FormInputNumber" />,
        FormTextArea: <Form.TextArea field="FormTextArea" />,
        FormSelect: <Form.Select field="FormSelect" optionList={options} />,
        FormCheckboxGroup: <Form.CheckboxGroup field="FormCheckboxGroup" options={options} />,
        FormCheckbox: <Form.Checkbox field="FormCheckbox">Agree</Form.Checkbox>,
        FormRadioGroup: <Form.RadioGroup field="FormRadioGroup" options={options} />,
        FormRadio: <Form.Radio field="FormRadio">Pick</Form.Radio>,
        FormDatePicker: <Form.DatePicker field="FormDatePicker" />,
        FormSwitch: <Form.Switch field="FormSwitch" />,
        FormSlider: <Form.Slider field="FormSlider" />,
        FormTimePicker: <Form.TimePicker field="FormTimePicker" />,
        FormTreeSelect: <Form.TreeSelect field="FormTreeSelect" treeData={treeData} />,
        FormCascader: <Form.Cascader field="FormCascader" treeData={treeData} />,
        FormTransfer: <Form.Transfer dataSource={[{ label: 'One', value: 1, key: 1 }]} field="FormTransfer" />,
        FormRating: <Form.Rating field="FormRating" />,
        FormAutoComplete: <Form.AutoComplete field="FormAutoComplete" />,
        FormUpload: <Form.Upload action="/upload" field="FormUpload" />,
        FormTagInput: <Form.TagInput field="FormTagInput" />,
        FormPinCode: <Form.PinCode field="FormPinCode" />,
    };
    const inset = ['FormInput', 'FormInputNumber', 'FormSelect', 'FormDatePicker', 'FormTimePicker', 'FormTreeSelect', 'FormCascader', 'FormAutoComplete', 'FormTagInput'];

    it('不支持内嵌标签的字段按 top 布局并警告，aria-labelledby 不悬空', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const names = Object.keys(fields);
        renderForm(
            names.map((name) => cloneElement(fields[name], { key: name, fieldClassName: name, label: name })),
            { labelPosition: 'inset' }
        );
        const layout = (name: string) => document.querySelector(`.${name}`)?.getAttribute('x-label-pos');
        const warned = (name: string) => warn.mock.calls.some(([message]) => String(message).includes(`has no inset label, so Field "${name}" is laid out with labelPosition 'top'`));
        expect(Object.fromEntries(names.map((name) => [name, [layout(name), warned(name)]]))).toEqual(Object.fromEntries(names.map((name) => [name, inset.includes(name) ? ['inset', false] : ['top', true]])));
        const references = [...document.querySelectorAll('[aria-labelledby]')].flatMap((element) => element.getAttribute('aria-labelledby').split(' '));
        expect(references.length).toBeGreaterThanOrEqual(names.length);
        expect(references.filter((id) => !document.getElementById(id))).toEqual([]);
        warn.mockRestore();
    });

    it('必填字段的 aria-required 只落在支持它的角色上', () => {
        const names = Object.keys(fields);
        renderForm(names.map((name) => cloneElement(fields[name], { key: name, fieldClassName: name, label: name, rules: [{ required: true }] })));
        expect(document.querySelectorAll('[aria-required="true"]').length).toBeGreaterThan(0);
        expect(Object.fromEntries(names.map((name) => [name, misplacedAriaRequired(document.querySelector(`.${name}`) as Element)]))).toEqual(Object.fromEntries(names.map((name) => [name, []])));
    });

    it('不支持内嵌标签的字段以渲染出的 top label 命名控件', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        renderForm(
            <>
                <Form.Switch field="on" label="Notify" />
                <Form.Slider field="level" label="Level" />
                <Form.PinCode field="code" label="Code" />
            </>,
            { labelPosition: 'inset' }
        );
        expect(screen.getByRole('switch', { name: 'Notify' })).toBeInTheDocument();
        expect(screen.getByRole('slider', { name: 'Level' })).toBeInTheDocument();
        expect(screen.getByRole('group', { name: 'Code' })).toBeInTheDocument();
        warn.mockRestore();
    });

    it('字段带 prefix 或 triggerRender 时按 top 布局渲染 Label，控件以它命名且引用不悬空', () => {
        renderForm(
            <>
                <Form.Input field="a" label="Alpha" prefix={<span>$</span>} />
                <Form.Select field="b" label="Beta" optionList={options} triggerRender={() => <span>pick</span>} />
            </>,
            { labelPosition: 'inset' }
        );
        expect(document.querySelector('[x-field-id="a"]')).toHaveAttribute('x-label-pos', 'top');
        expect(document.querySelector('[x-field-id="b"]')).toHaveAttribute('x-label-pos', 'top');
        expect(screen.getByRole('textbox', { name: 'Alpha' })).toBeInTheDocument();
        const references = [...document.querySelectorAll('[aria-labelledby]')].flatMap((element) => element.getAttribute('aria-labelledby').split(' '));
        expect(references.filter((id) => !document.getElementById(id))).toEqual([]);
        expect(references.map((id) => document.getElementById(id).textContent)).toEqual(expect.arrayContaining(['Alpha', 'Beta']));
    });
});

describe('Form 字段的注入属性', () => {
    it('label 对象带 id 时控件的 aria-labelledby 指向该 id，label.name 不覆盖 for', () => {
        const { container } = renderForm(<Form.Input id="ctl" field="a" label={{ text: 'A', id: 'my-label', name: 'other' }} />);
        const input = container.querySelector('input');
        expect(input).toHaveAttribute('aria-labelledby', 'my-label');
        expect(document.getElementById('my-label')).toHaveAttribute('for', 'ctl');
        expect(screen.getByRole('textbox', { name: 'A' })).toBe(input);
    });

    it('label 对象没有 text 时以 field 为标签文本，inset 布局同样如此', () => {
        renderForm(
            <>
                <Form.Input field="a" label={{ required: true }} />
                <Form.Input field="b" label={{ required: true }} labelPosition="inset" />
            </>
        );
        expect(screen.getByRole('textbox', { name: 'a' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'b' })).toBeInTheDocument();
    });

    it('撤掉挂载时传入的 validateStatus="error" 后，字段回到自身的校验状态', () => {
        const { rerender } = render(
            <Form>
                <Form.Input field="a" validateStatus="error" />
            </Form>
        );
        rerender(
            <Form>
                <Form.Input field="a" />
            </Form>
        );
        expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
        expect(document.querySelector('.semi-input-wrapper-error')).toBeNull();
    });

    it('validateStatus="error" 时各类控件都带 aria-invalid', () => {
        const options = [{ label: 'One', value: 'one', key: 'one' }];
        renderForm(
            <>
                <Form.Input field="a" validateStatus="error" />
                <Form.Select field="b" optionList={options} validateStatus="error" />
                <Form.Cascader field="c" treeData={options} validateStatus="error" />
                <Form.TreeSelect field="d" treeData={options} validateStatus="error" />
                <Form.DatePicker type="dateRange" field="e" validateStatus="error" />
            </>
        );
        const invalid = ['a', 'b', 'c', 'd'].filter((field) => document.querySelector(`[x-field-id="${field}"] [aria-invalid="true"]`));
        expect(invalid).toEqual(['a', 'b', 'c', 'd']);
        expect(document.querySelectorAll('[x-field-id="e"] input[aria-invalid="true"]')).toHaveLength(2);
    });

    it('校验失败时 validateStatus 覆盖为 warning，显示错误的控件仍带 aria-invalid', () => {
        const options = [{ label: 'One', value: 'one', key: 'one' }];
        const { getApi } = renderForm(
            <>
                <Form.Input field="a" validateStatus="warning" />
                <Form.Select field="b" optionList={options} validateStatus="warning" />
            </>
        );
        act(() => {
            getApi().setError('a', 'bad');
            getApi().setError('b', 'bad');
        });
        for (const field of ['a', 'b']) {
            const control = document.querySelector(`[x-field-id="${field}"] [aria-errormessage]`);
            expect(control).toHaveAttribute('aria-invalid', 'true');
        }
    });

    it('字段传 disabled={undefined} 时沿用 Form 的 disabled；使用方的 aria-required 不被覆盖', () => {
        const { container } = renderForm(
            <>
                <Form.Input disabled={undefined} field="a" />
                <Form.Input aria-required field="b" />
            </>,
            { disabled: true }
        );
        const [a, b] = container.querySelectorAll('input');
        expect(a).toBeDisabled();
        expect(b).toHaveAttribute('aria-required', 'true');
    });

    it('CheckboxGroup 内不带 field 的 Form.Checkbox 保留自身的 onChange 与 id', async () => {
        const onChange = vi.fn<(e: unknown) => void>();
        renderForm(
            <Form.CheckboxGroup field="roles">
                <Form.Checkbox id="admin" value="admin" onChange={onChange}>
                    Admin
                </Form.Checkbox>
            </Form.CheckboxGroup>
        );
        await userEvent.click(screen.getByRole('checkbox', { name: 'Admin' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(document.getElementById('admin')).not.toBeNull();
    });

    it('InputGroup 内字段的错误为空串时不设置 aria-errormessage', async () => {
        const { container, getApi } = renderForm(
            <Form.InputGroup label="G">
                <Form.Input field="a" rules={[{ required: true, message: '' }]} />
            </Form.InputGroup>
        );
        await act(() =>
            getApi()
                .validate()
                .catch(() => undefined)
        );
        const input = container.querySelector('input');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).not.toHaveAttribute('aria-errormessage');
        expectReferencesExist(input);
    });
});
