import { type JSX, For, Show, createRoot, createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import {
    type FormApi,
    type FormProps,
    Form,
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
    FormTransfer,
    FormTreeSelect,
    FormUpload,
} from '..';

function renderForm(children: () => JSX.Element, props: FormProps = {}) {
    let api: FormApi | undefined;
    const { container } = render(() => (
        <Form getFormApi={(formApi) => (api = formApi)} {...props}>
            {children()}
        </Form>
    ));
    return { container, getApi: () => api as FormApi };
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

const labelledbyReferences = () => [...document.querySelectorAll('[aria-labelledby]')].flatMap((element) => (element.getAttribute('aria-labelledby') ?? '').split(' '));

describe('Form 字段 id', () => {
    it('两个 Form 有同名字段时，控件 id 不重复，label 各自指向本表单的控件', () => {
        const { container } = render(() => (
            <>
                <Form>
                    <FormInput field="name" label="Name" />
                </Form>
                <Form>
                    <FormInput field="name" label="Name" />
                </Form>
            </>
        ));
        const inputs = [...container.querySelectorAll('input')];
        const labels = [...container.querySelectorAll('label')];
        expect(new Set(inputs.map((input) => input.id)).size).toBe(2);
        labels.forEach((label, i) => {
            expect(label.htmlFor).toBe(inputs[i].id);
        });
    });

    it('字段显式传入 id 时使用该 id', () => {
        const { container } = render(() => (
            <Form>
                <FormInput id="custom-id" field="name" label="Name" />
            </Form>
        ));
        expect(container.querySelector('input')).toHaveAttribute('id', 'custom-id');
        expect(container.querySelector('label')).toHaveAttribute('for', 'custom-id');
    });
});

describe('Form 属性变化', () => {
    it('Form 修改 labelWidth 后，字段立即更新 label 宽度', () => {
        const [labelWidth, setLabelWidth] = createSignal(100);
        const { container } = render(() => (
            <Form labelWidth={labelWidth()}>
                <FormInput field="name" label="Name" />
            </Form>
        ));
        expect(container.querySelector('label')).toHaveStyle({ width: '100px' });
        setLabelWidth(200);
        expect(container.querySelector('label')).toHaveStyle({ width: '200px' });
    });

    it('Form 修改 showValidateIcon 后，错误图标立即更新', () => {
        const [showValidateIcon, setShowValidateIcon] = createSignal(true);
        let api: FormApi | undefined;
        const { container } = render(() => (
            <Form getFormApi={(formApi) => (api = formApi)} showValidateIcon={showValidateIcon()}>
                <FormInput field="name" />
            </Form>
        ));
        api?.setError('name', 'bad');
        expect(container.querySelector('.semi-form-field-validate-status-icon')).not.toBeNull();
        setShowValidateIcon(false);
        expect(container.querySelector('.semi-form-field-validate-status-icon')).toBeNull();
    });
});

describe('Form 字段的 aria 引用', () => {
    it('错误是节点时，aria-errormessage 指向已渲染的元素', () => {
        const { container, getApi } = renderForm(() => <FormInput field="name" />);
        const node = document.createElement('b');
        node.dataset.testid = 'node-error';
        node.textContent = 'bad';
        getApi().setError('name', node);
        const input = container.querySelector('input') as HTMLInputElement;
        expect(input).toHaveAttribute('aria-errormessage');
        expectReferencesExist(input);
        expect(document.getElementById(input.getAttribute('aria-errormessage') ?? '')).toContainElement(screen.getByTestId('node-error'));
    });

    it('错误是编译为访问器的 JSX（Show）时，字段标为错误，aria-errormessage 指向已渲染的元素', () => {
        const { container, getApi } = renderForm(() => <FormInput field="name" />);
        const error = createRoot(() => (
            <Show when>
                <b data-testid="accessor-error">bad</b>
            </Show>
        ));
        getApi().setError('name', error);
        const input = container.querySelector('input') as HTMLInputElement;
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-errormessage');
        expect(document.getElementById(input.getAttribute('aria-errormessage') ?? '')).toContainElement(screen.getByTestId('accessor-error'));
    });

    it('错误是节点数组时，逐项渲染而不是 [object Object]', () => {
        const { container, getApi } = renderForm(() => <FormInput field="name" />);
        const first = document.createElement('b');
        first.textContent = 'first';
        const second = document.createElement('i');
        second.textContent = 'second';
        getApi().setError('name', [first, second]);
        expect(container.querySelector('.semi-form-field-error-message')).toHaveTextContent('first, second');
        expectReferencesExist(container.querySelector('input') as HTMLInputElement);
    });

    it('错误态下带 helpText，aria-describedby 不引用未渲染的 helpText', () => {
        const { container, getApi } = renderForm(() => <FormInput field="name" helpText="help" />);
        getApi().setError('name', 'bad');
        const input = container.querySelector('input') as HTMLInputElement;
        expect(screen.queryByText('help')).toBeNull();
        expectReferencesExist(input);
        expect(input.getAttribute('aria-describedby') ?? '').not.toContain('helpText');
    });

    it('noErrorMessage 时不设置 aria-errormessage', () => {
        const { container, getApi } = renderForm(() => <FormInput field="name" noErrorMessage />);
        getApi().setError('name', 'bad');
        const input = container.querySelector('input') as HTMLInputElement;
        expect(input).not.toHaveAttribute('aria-errormessage');
        expectReferencesExist(input);
    });

    it('InputGroup 内的字段出错，aria-errormessage 指向组级错误信息', () => {
        const { container, getApi } = renderForm(() => (
            <Form.InputGroup label={{ text: 'group' }}>
                <FormInput field="a" />
                <FormInput field="b" />
            </Form.InputGroup>
        ));
        getApi().setError('a', 'bad');
        const [first, second] = container.querySelectorAll('input');
        expect(first).toHaveAttribute('aria-errormessage');
        expectReferencesExist(first);
        expect(document.getElementById(first.getAttribute('aria-errormessage') ?? '')).toHaveTextContent('bad');
        expect(second).not.toHaveAttribute('aria-errormessage');
    });

    it('label 对象 required 为真时控件设置 aria-required，同时 optional 时不设置', () => {
        const { container } = renderForm(() => (
            <>
                <FormInput field="a" label={{ text: 'A', required: true }} />
                <FormInput field="b" label={{ text: 'B', required: true, optional: true }} />
            </>
        ));
        const [a, b] = container.querySelectorAll('input');
        expect(a).toHaveAttribute('aria-required', 'true');
        expect(b).not.toHaveAttribute('aria-required', 'true');
    });

    it('使用方传入的 aria-labelledby、aria-describedby 在前，Form 生成的 id 在后', () => {
        const { container } = renderForm(() => (
            <>
                <span id="x">X</span>
                <span id="y">Y</span>
                <FormInput id="a" aria-describedby="y" aria-labelledby="x" extraText="e" field="a" label="A" />
            </>
        ));
        const input = container.querySelector('input') as HTMLInputElement;
        expect(input).toHaveAttribute('aria-labelledby', 'x a-label');
        expect(input).toHaveAttribute('aria-describedby', 'y a-extraText');
        expectReferencesExist(input);
    });
});

describe('Form labelPosition="inset"', () => {
    const options = [{ label: 'One', value: 1 }];
    const treeData = [{ label: 'One', value: 'one', key: 'one' }];
    const fields: Record<string, (name: string) => JSX.Element> = {
        FormInput: (name) => <FormInput field={name} fieldClassName={name} label={name} />,
        FormInputNumber: (name) => <FormInputNumber field={name} fieldClassName={name} label={name} />,
        FormTextArea: (name) => <FormTextArea field={name} fieldClassName={name} label={name} />,
        FormSelect: (name) => <FormSelect field={name} fieldClassName={name} label={name} optionList={options} />,
        FormCheckboxGroup: (name) => <FormCheckboxGroup field={name} fieldClassName={name} label={name} options={options} />,
        FormCheckbox: (name) => (
            <FormCheckbox field={name} fieldClassName={name} label={name}>
                Agree
            </FormCheckbox>
        ),
        FormRadioGroup: (name) => <FormRadioGroup field={name} fieldClassName={name} label={name} options={options} />,
        FormRadio: (name) => (
            <FormRadio field={name} fieldClassName={name} label={name}>
                Pick
            </FormRadio>
        ),
        FormDatePicker: (name) => <FormDatePicker field={name} fieldClassName={name} label={name} />,
        FormSwitch: (name) => <FormSwitch field={name} fieldClassName={name} label={name} />,
        FormSlider: (name) => <FormSlider field={name} fieldClassName={name} label={name} />,
        FormTimePicker: (name) => <FormTimePicker field={name} fieldClassName={name} label={name} />,
        FormTreeSelect: (name) => <FormTreeSelect field={name} fieldClassName={name} label={name} treeData={treeData} />,
        FormCascader: (name) => <FormCascader field={name} fieldClassName={name} label={name} treeData={treeData} />,
        FormTransfer: (name) => <FormTransfer dataSource={[{ label: 'One', value: 1, key: 1 }]} field={name} fieldClassName={name} label={name} />,
        FormRating: (name) => <FormRating field={name} fieldClassName={name} label={name} />,
        FormAutoComplete: (name) => <FormAutoComplete field={name} fieldClassName={name} label={name} />,
        FormUpload: (name) => <FormUpload action="/upload" field={name} fieldClassName={name} label={name} />,
        FormTagInput: (name) => <FormTagInput field={name} fieldClassName={name} label={name} />,
        FormPinCode: (name) => <FormPinCode field={name} fieldClassName={name} label={name} />,
    };
    const inset = ['FormInput', 'FormInputNumber', 'FormSelect', 'FormDatePicker', 'FormTimePicker', 'FormTreeSelect', 'FormCascader', 'FormAutoComplete', 'FormTagInput'];

    it('不支持内嵌标签的字段按 top 布局并警告，aria-labelledby 不悬空', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const names = Object.keys(fields);
        renderForm(() => <For each={names}>{(name) => fields[name](name)}</For>, { labelPosition: 'inset' });
        const layout = (name: string) => document.querySelector(`.${name}`)?.getAttribute('x-label-pos');
        const warned = (name: string) => warn.mock.calls.some(([message]) => String(message).includes(`has no inset label, so Field "${name}" is laid out with labelPosition 'top'`));
        expect(Object.fromEntries(names.map((name) => [name, [layout(name), warned(name)]]))).toEqual(Object.fromEntries(names.map((name) => [name, inset.includes(name) ? ['inset', false] : ['top', true]])));
        const references = labelledbyReferences();
        expect(references.length).toBeGreaterThanOrEqual(names.length);
        expect(references.filter((id) => !document.getElementById(id))).toEqual([]);
        warn.mockRestore();
    });

    it('不支持内嵌标签的字段以渲染出的 top label 命名控件', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        renderForm(
            () => (
                <>
                    <FormSwitch field="on" label="Notify" />
                    <FormSlider field="level" label="Level" />
                    <FormPinCode field="code" label="Code" />
                </>
            ),
            { labelPosition: 'inset' }
        );
        expect(screen.getByRole('switch', { name: 'Notify' })).toBeInTheDocument();
        expect(screen.getByRole('slider', { name: 'Level' })).toBeInTheDocument();
        expect(screen.getByRole('group', { name: 'Code' })).toBeInTheDocument();
        warn.mockRestore();
    });

    it('字段带 prefix 或 triggerRender 时按 top 布局渲染 Label，控件以它命名且引用不悬空', () => {
        renderForm(
            () => (
                <>
                    <FormInput field="a" label="Alpha" prefix={<span>$</span>} />
                    <FormSelect field="b" label="Beta" optionList={options} triggerRender={() => <span>pick</span>} />
                </>
            ),
            { labelPosition: 'inset' }
        );
        expect(document.querySelector('[x-field-id="a"]')).toHaveAttribute('x-label-pos', 'top');
        expect(document.querySelector('[x-field-id="b"]')).toHaveAttribute('x-label-pos', 'top');
        expect(screen.getByRole('textbox', { name: 'Alpha' })).toBeInTheDocument();
        const references = labelledbyReferences();
        expect(references.filter((id) => !document.getElementById(id))).toEqual([]);
        expect(references.map((id) => document.getElementById(id)?.textContent)).toEqual(expect.arrayContaining(['Alpha', 'Beta']));
    });
});

describe('Form 字段的注入属性', () => {
    it('label 对象带 id 时控件的 aria-labelledby 指向该 id，label.name 不覆盖 for', () => {
        const { container } = renderForm(() => <FormInput id="ctl" field="a" label={{ text: 'A', id: 'my-label', name: 'other' }} />);
        const input = container.querySelector('input');
        expect(input).toHaveAttribute('aria-labelledby', 'my-label');
        expect(document.getElementById('my-label')).toHaveAttribute('for', 'ctl');
        expect(screen.getByRole('textbox', { name: 'A' })).toBe(input);
    });

    it('label 对象没有 text 时以 field 为标签文本，inset 布局同样如此', () => {
        renderForm(() => (
            <>
                <FormInput field="a" label={{ required: true }} />
                <FormInput field="b" label={{ required: true }} labelPosition="inset" />
            </>
        ));
        expect(screen.getByRole('textbox', { name: 'a' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'b' })).toBeInTheDocument();
    });

    it('撤掉挂载时传入的 validateStatus="error" 后，字段回到自身的校验状态', () => {
        const [status, setStatus] = createSignal<'error' | undefined>('error');
        render(() => (
            <Form>
                <FormInput field="a" validateStatus={status()} />
            </Form>
        ));
        setStatus(undefined);
        expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
        expect(document.querySelector('.semi-input-wrapper-error')).toBeNull();
    });

    it('validateStatus="error" 时各类控件都带 aria-invalid', () => {
        const options = [{ label: 'One', value: 'one', key: 'one' }];
        renderForm(() => (
            <>
                <FormInput field="a" validateStatus="error" />
                <FormSelect field="b" optionList={options} validateStatus="error" />
                <FormCascader field="c" treeData={options} validateStatus="error" />
                <FormTreeSelect field="d" treeData={options} validateStatus="error" />
                <FormDatePicker type="dateRange" field="e" validateStatus="error" />
            </>
        ));
        const invalid = ['a', 'b', 'c', 'd'].filter((field) => document.querySelector(`[x-field-id="${field}"] [aria-invalid="true"]`));
        expect(invalid).toEqual(['a', 'b', 'c', 'd']);
        expect(document.querySelectorAll('[x-field-id="e"] input[aria-invalid="true"]')).toHaveLength(2);
    });

    it('校验失败时 validateStatus 覆盖为 warning，显示错误的控件仍带 aria-invalid', () => {
        const options = [{ label: 'One', value: 'one', key: 'one' }];
        const { getApi } = renderForm(() => (
            <>
                <FormInput field="a" validateStatus="warning" />
                <FormSelect field="b" optionList={options} validateStatus="warning" />
            </>
        ));
        getApi().setError('a', 'bad');
        getApi().setError('b', 'bad');
        for (const field of ['a', 'b']) {
            const control = document.querySelector(`[x-field-id="${field}"] [aria-errormessage]`);
            expect(control).toHaveAttribute('aria-invalid', 'true');
        }
    });

    it('字段传 disabled={undefined} 时沿用 Form 的 disabled；使用方的 aria-required 不被覆盖', () => {
        const { container } = renderForm(
            () => (
                <>
                    <FormInput disabled={undefined} field="a" />
                    <FormInput aria-required field="b" />
                </>
            ),
            { disabled: true }
        );
        const [a, b] = container.querySelectorAll('input');
        expect(a).toBeDisabled();
        expect(b).toHaveAttribute('aria-required', 'true');
    });

    it('CheckboxGroup 内不带 field 的 FormCheckbox 保留自身的 onChange 与 id', async () => {
        const onChange = vi.fn<(e: unknown) => void>();
        renderForm(() => (
            <FormCheckboxGroup field="roles">
                <FormCheckbox id="admin" value="admin" onChange={onChange}>
                    Admin
                </FormCheckbox>
            </FormCheckboxGroup>
        ));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Admin' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(document.getElementById('admin')).not.toBeNull();
    });

    it('InputGroup 内字段的错误为空串时不设置 aria-errormessage', async () => {
        const { container, getApi } = renderForm(() => (
            <Form.InputGroup label="G">
                <FormInput field="a" rules={[{ required: true, message: '' }]} />
            </Form.InputGroup>
        ));
        await getApi()
            .validate()
            .catch(() => undefined);
        const input = container.querySelector('input') as HTMLInputElement;
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).not.toHaveAttribute('aria-errormessage');
        expectReferencesExist(input);
    });
});
