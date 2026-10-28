/** @jsxImportSource vue */
import { nextTick, ref } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { Form, FormCascader, FormDatePicker, FormInputGroup, FormTreeSelect, type FieldError } from '..';
import { FormInput, FormSelect, renderForm } from './fixtures/fields';

function expectReferencesExist(input: Element) {
    for (const attr of ['aria-errormessage', 'aria-describedby', 'aria-labelledby']) {
        const ids = input.getAttribute(attr)?.split(/\s+/).filter(Boolean) ?? [];
        ids.forEach((id) => {
            expect(document.getElementById(id), `${attr} -> ${id}`).not.toBeNull();
        });
    }
}

const firstInput = (container: Element) => container.querySelector('input') as HTMLInputElement;

describe('Form 字段 id', () => {
    it('两个 Form 有同名字段时，控件 id 不重复，label 各自指向本表单的控件', () => {
        const { container } = render(() => (
            <>
                <Form>{() => <FormInput field="name" label="Name" />}</Form>
                <Form>{() => <FormInput field="name" label="Name" />}</Form>
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
        const { container } = renderForm({}, () => <FormInput id="custom-id" field="name" label="Name" />);
        expect(firstInput(container)).toHaveAttribute('id', 'custom-id');
        expect(container.querySelector('label')).toHaveAttribute('for', 'custom-id');
    });
});

describe('Form 属性更新', () => {
    it('修改 Form 的 labelWidth 后，字段立即更新 label 宽度', async () => {
        const { container, rerender } = renderForm({ labelWidth: 100 }, () => <FormInput field="name" label="Name" />);
        expect(container.querySelector('label')).toHaveStyle({ width: '100px' });
        await rerender({ labelWidth: 200 });
        expect(container.querySelector('label')).toHaveStyle({ width: '200px' });
    });

    it('修改 Form 的 showValidateIcon 后，错误图标立即更新', async () => {
        const { api, container, rerender } = renderForm({ showValidateIcon: true }, () => <FormInput field="name" />);
        api().setError('name', 'bad');
        await nextTick();
        expect(container.querySelector('.semi-form-field-validate-status-icon')).not.toBeNull();
        await rerender({ showValidateIcon: false });
        expect(container.querySelector('.semi-form-field-validate-status-icon')).toBeNull();
    });
});

describe('Form 字段的 aria 引用', () => {
    it('#error 插槽渲染错误时，aria-errormessage 指向已渲染的元素', async () => {
        const { api, container } = renderForm({}, () => (
            <FormInput field="name">
                {{
                    error: ({ error }: { error: FieldError }) => <b data-testid="slot-error">{String(error)}</b>,
                }}
            </FormInput>
        ));
        api().setError('name', 'bad');
        await nextTick();
        const input = firstInput(container);
        expect(input).toHaveAttribute('aria-errormessage');
        expectReferencesExist(input);
        expect(document.getElementById(input.getAttribute('aria-errormessage') ?? '')).toContainElement(screen.getByTestId('slot-error'));
    });

    it('错误是字符串数组时逐项连接渲染', async () => {
        const { api, container } = renderForm({}, () => <FormInput field="name" />);
        api().setError('name', ['first', 'second']);
        await nextTick();
        expect(container.querySelector('.semi-form-field-error-message')).toHaveTextContent('first, second');
        expectReferencesExist(firstInput(container));
    });

    it('错误态下带 #helpText，aria-describedby 不引用未渲染的 helpText', async () => {
        const { api, container } = renderForm({}, () => <FormInput field="name">{{ helpText: () => 'help' }}</FormInput>);
        api().setError('name', 'bad');
        await nextTick();
        const input = firstInput(container);
        expect(screen.queryByText('help')).toBeNull();
        expectReferencesExist(input);
        expect(input.getAttribute('aria-describedby') ?? '').not.toContain('helpText');
    });

    it('noErrorMessage 时不设置 aria-errormessage', async () => {
        const { api, container } = renderForm({}, () => <FormInput field="name" noErrorMessage />);
        api().setError('name', 'bad');
        await nextTick();
        const input = firstInput(container);
        expect(input).not.toHaveAttribute('aria-errormessage');
        expectReferencesExist(input);
    });

    it('InputGroup 内的字段出错，aria-errormessage 指向组级错误信息', async () => {
        const { api, container } = renderForm({}, () => (
            <FormInputGroup label={{ text: 'group' }}>
                {() => (
                    <>
                        <FormInput field="a" />
                        <FormInput field="b" />
                    </>
                )}
            </FormInputGroup>
        ));
        api().setError('a', 'bad');
        await nextTick();
        const [first, second] = container.querySelectorAll('input');
        expect(first).toHaveAttribute('aria-errormessage');
        expectReferencesExist(first);
        expect(document.getElementById(first.getAttribute('aria-errormessage') ?? '')).toHaveTextContent('bad');
        expect(second).not.toHaveAttribute('aria-errormessage');
    });
});

describe('Form 字段的注入属性', () => {
    it('label 对象里多出的 id、name 不断开控件与 label 的关联', () => {
        const { container } = renderForm({}, () => <FormInput id="ctl" field="a" label={{ text: 'A', id: 'other-id', name: 'other' } as never} />);
        const input = firstInput(container);
        expect(container.querySelector('label')).toHaveAttribute('for', 'ctl');
        expect(screen.getByRole('textbox', { name: 'A' })).toBe(input);
        expectReferencesExist(input);
    });

    it('撤掉挂载时传入的 validateStatus="error" 后，字段回到自身的校验状态', async () => {
        const status = ref<'error' | undefined>('error');
        render(() => <Form>{() => <FormInput field="a" validateStatus={status.value} />}</Form>);
        status.value = undefined;
        await nextTick();
        expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
        expect(document.querySelector('.semi-input-wrapper-error')).toBeNull();
    });

    it('validateStatus="error" 时各类控件都带 aria-invalid', () => {
        const treeData = [{ label: 'One', value: 'one', key: 'one' }];
        renderForm({}, () => (
            <>
                <FormInput field="a" validateStatus="error" />
                <FormSelect field="b" optionList={treeData} validateStatus="error" />
                <FormCascader field="c" treeData={treeData} validateStatus="error" />
                <FormTreeSelect field="d" treeData={treeData} validateStatus="error" />
                <FormDatePicker field="e" type="dateRange" validateStatus="error" />
            </>
        ));
        const invalid = ['a', 'b', 'c', 'd'].filter((field) => document.querySelector(`[x-field-id="${field}"] [aria-invalid="true"]`));
        expect(invalid).toEqual(['a', 'b', 'c', 'd']);
        expect(document.querySelectorAll('[x-field-id="e"] input[aria-invalid="true"]')).toHaveLength(2);
    });

    it('校验失败时 validateStatus 覆盖为 warning，显示错误的控件仍带 aria-invalid', async () => {
        const treeData = [{ label: 'One', value: 'one', key: 'one' }];
        const { api } = renderForm({}, () => (
            <>
                <FormInput field="a" validateStatus="warning" />
                <FormSelect field="b" optionList={treeData} validateStatus="warning" />
            </>
        ));
        api().setError('a', 'bad');
        api().setError('b', 'bad');
        await nextTick();
        for (const field of ['a', 'b']) {
            const control = document.querySelector(`[x-field-id="${field}"] [aria-errormessage]`);
            expect(control).toHaveAttribute('aria-invalid', 'true');
        }
    });

    it('字段传 disabled 为 undefined 时沿用 Form 的 disabled；使用方的 aria-required 不被覆盖', () => {
        const { container } = renderForm({ disabled: true }, () => (
            <>
                <FormInput field="a" disabled={undefined} />
                <FormInput field="b" aria-required />
            </>
        ));
        const [a, b] = container.querySelectorAll('input');
        expect(a).toBeDisabled();
        expect(b).toHaveAttribute('aria-required', 'true');
    });

    it('labelPosition="inset" 时字段带 #prefix 或 #trigger 插槽，label 按 top 布局渲染并命名控件', () => {
        renderForm({ labelPosition: 'inset' }, () => (
            <>
                <FormInput field="a" label="Name">
                    {{ prefix: () => 'P' }}
                </FormInput>
                <FormSelect field="b" label="Beta" optionList={[]}>
                    {{
                        trigger: () => <span>pick</span>,
                    }}
                </FormSelect>
            </>
        ));
        expect(document.querySelector('[x-field-id="a"]')).toHaveAttribute('x-label-pos', 'top');
        expect(document.querySelector('[x-field-id="b"]')).toHaveAttribute('x-label-pos', 'top');
        const input = screen.getByRole('textbox', { name: 'Name' });
        expectReferencesExist(input);
        const references = [...document.querySelectorAll('[aria-labelledby]')].flatMap((element) => element.getAttribute('aria-labelledby')?.split(' ') ?? []);
        expect(references.filter((id) => !document.getElementById(id))).toEqual([]);
        expect(references.map((id) => document.getElementById(id)?.textContent)).toEqual(expect.arrayContaining(['Name', 'Beta']));
    });

    it('InputGroup 内字段的错误为空串时不设置 aria-errormessage', async () => {
        const { api, container } = renderForm({}, () => <FormInputGroup label="G">{() => <FormInput field="a" rules={[{ required: true, message: '' }]} />}</FormInputGroup>);
        await api()
            .validate()
            .catch(() => undefined);
        await nextTick();
        const input = firstInput(container);
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).not.toHaveAttribute('aria-errormessage');
        expectReferencesExist(input);
    });
});
