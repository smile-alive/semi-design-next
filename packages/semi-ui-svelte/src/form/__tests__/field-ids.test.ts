import { createRawSnippet, flushSync } from 'svelte';
import { screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { renderAnyFields, renderGroup } from './b-helpers';
import { errorSelector, input, renderForm, settle } from './helpers';

function expectReferencesExist(control: Element) {
    for (const attr of ['aria-errormessage', 'aria-describedby', 'aria-labelledby']) {
        const ids = control.getAttribute(attr)?.split(/\s+/).filter(Boolean) ?? [];
        for (const id of ids) {
            expect(document.getElementById(id), `${attr} -> ${id}`).not.toBeNull();
        }
    }
}

const firstInput = (container: Element) => container.querySelector('input') as HTMLInputElement;
const scoped = (field: string) => `[x-field-id="${field}"]`;
const treeData = [{ label: 'One', value: 'one', key: 'one' }];

describe('Svelte Form 属性更新', () => {
    it('修改 Form 的 showValidateIcon 后，错误图标立即更新', async () => {
        const { api, container, store } = renderForm({ showValidateIcon: true }, [input('name')]);
        api().setError('name', 'bad');
        await settle();
        expect(container.querySelector('.semi-form-field-validate-status-icon')).not.toBeNull();
        store.form.showValidateIcon = false;
        flushSync();
        expect(container.querySelector('.semi-form-field-validate-status-icon')).toBeNull();
    });
});

describe('Svelte Form 字段的 aria 引用', () => {
    it('error snippet 渲染错误时，aria-errormessage 指向已渲染的元素', async () => {
        const errorContent = createRawSnippet<[{ error: unknown }]>((props) => ({ render: () => `<b data-testid="slot-error">${String(props().error)}</b>` }));
        const { api, container } = renderForm({}, [input('name', { error: errorContent })]);
        api().setError('name', 'bad');
        await settle();
        const control = firstInput(container);
        expect(control).toHaveAttribute('aria-errormessage');
        expectReferencesExist(control);
        expect(document.getElementById(control.getAttribute('aria-errormessage') ?? '')).toContainElement(screen.getByTestId('slot-error'));
    });

    it('错误是字符串数组时逐项连接渲染，引用的元素都存在', async () => {
        const { api, container } = renderForm({}, [input('name')]);
        api().setError('name', ['first', 'second']);
        await settle();
        expect(container.querySelector(errorSelector)).toHaveTextContent('first, second');
        expectReferencesExist(firstInput(container));
    });

    it('错误态下带 helpText，aria-describedby 不引用未渲染的 helpText', async () => {
        const help = createRawSnippet(() => ({ render: () => '<span>help</span>' }));
        const { api, container } = renderForm({}, [input('name', { helpText: help })]);
        api().setError('name', 'bad');
        await settle();
        const control = firstInput(container);
        expect(screen.queryByText('help')).toBeNull();
        expectReferencesExist(control);
        expect(control.getAttribute('aria-describedby') ?? '').not.toContain('helpText');
    });

    it('noErrorMessage 时不设置 aria-errormessage，其余引用仍然存在', async () => {
        const { api, container } = renderForm({}, [input('name', { noErrorMessage: true })]);
        api().setError('name', 'bad');
        await settle();
        const control = firstInput(container);
        expect(control).not.toHaveAttribute('aria-errormessage');
        expectReferencesExist(control);
    });

    it('InputGroup 内的字段出错，aria-errormessage 指向组级错误信息，没有错误的字段不引用它', async () => {
        const { api, container } = renderGroup({
            form: {},
            group: { label: { text: 'group' } },
            fields: [{ props: { field: 'a' } }, { props: { field: 'b' } }],
        });
        api().setError('a', 'bad');
        await settle();
        const [first, second] = container.querySelectorAll('input');
        expect(first).toHaveAttribute('aria-errormessage');
        expectReferencesExist(first);
        expect(document.getElementById(first.getAttribute('aria-errormessage') ?? '')).toHaveTextContent('bad');
        expect(second).not.toHaveAttribute('aria-errormessage');
    });

    it('InputGroup 内字段的错误为空串时不设置 aria-errormessage', async () => {
        const { api, container } = renderGroup({
            form: {},
            group: { label: 'G' },
            fields: [{ props: { field: 'a', rules: [{ required: true, message: '' }] } }],
        });
        await api()
            .validate()
            .catch(() => undefined);
        await settle();
        const control = firstInput(container);
        expect(control).toHaveAttribute('aria-invalid', 'true');
        expect(control).not.toHaveAttribute('aria-errormessage');
        expectReferencesExist(control);
    });
});

describe('Svelte Form 字段的注入属性', () => {
    it('label 对象里多出的 id、name 不断开控件与 label 的关联', () => {
        const { container } = renderForm({}, [input('a', { id: 'ctl', label: { text: 'A', id: 'other-id', name: 'other' } })]);
        const control = firstInput(container);
        expect(container.querySelector('label')).toHaveAttribute('for', 'ctl');
        expect(screen.getByRole('textbox', { name: 'A' })).toBe(control);
        expectReferencesExist(control);
    });

    it('撤掉挂载时传入的 validateStatus="error" 后，字段回到自身的校验状态', () => {
        const { store } = renderForm({}, [input('a', { validateStatus: 'error' })]);
        expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
        store.fields[0].props.validateStatus = undefined;
        flushSync();
        expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
        expect(document.querySelector('.semi-input-wrapper-error')).toBeNull();
    });

    it('validateStatus="error" 时各类控件都带 aria-invalid', () => {
        renderAnyFields({}, [
            { type: 'input', props: { field: 'a', validateStatus: 'error' } },
            { type: 'select', props: { field: 'b', optionList: treeData, validateStatus: 'error' } },
            { type: 'cascader', props: { field: 'c', treeData, validateStatus: 'error' } },
            { type: 'treeSelect', props: { field: 'd', treeData, validateStatus: 'error' } },
            { type: 'datePicker', props: { field: 'e', type: 'dateRange', validateStatus: 'error' } },
        ]);
        const invalid = ['a', 'b', 'c', 'd'].filter((field) => document.querySelector(`${scoped(field)} [aria-invalid="true"]`));
        expect(invalid).toEqual(['a', 'b', 'c', 'd']);
        expect(document.querySelectorAll(`${scoped('e')} input[aria-invalid="true"]`)).toHaveLength(2);
    });

    it('校验失败时 validateStatus 覆盖为 warning，显示错误的控件仍带 aria-invalid', async () => {
        const { api } = renderAnyFields({}, [
            { type: 'input', props: { field: 'a', validateStatus: 'warning' } },
            { type: 'select', props: { field: 'b', optionList: treeData, validateStatus: 'warning' } },
        ]);
        api().setError('a', 'bad');
        api().setError('b', 'bad');
        await settle();
        for (const field of ['a', 'b']) {
            expect(document.querySelector(`${scoped(field)} [aria-errormessage]`)).toHaveAttribute('aria-invalid', 'true');
        }
    });

    it('字段传 disabled 为 undefined 时沿用 Form 的 disabled；使用方的 aria-required 不被覆盖', () => {
        const { container } = renderForm({ disabled: true }, [input('a', { disabled: undefined }), input('b', { 'aria-required': true })]);
        const [a, b] = container.querySelectorAll('input');
        expect(a).toBeDisabled();
        expect(b).toHaveAttribute('aria-required', 'true');
    });

    it('labelPosition="inset" 时字段带 prefix snippet，label 按 top 布局渲染并命名控件', () => {
        const prefix = createRawSnippet(() => ({ render: () => '<span>P</span>' }));
        renderAnyFields({ labelPosition: 'inset' }, [{ type: 'input', props: { field: 'a', label: 'Name', prefix } }]);
        expect(document.querySelector(scoped('a'))).toHaveAttribute('x-label-pos', 'top');
        expectReferencesExist(screen.getByRole('textbox', { name: 'Name' }));
        const references = [...document.querySelectorAll('[aria-labelledby]')].flatMap((element) => element.getAttribute('aria-labelledby')?.split(' ') ?? []);
        expect(references.filter((id) => !document.getElementById(id))).toEqual([]);
        expect(references.map((id) => document.getElementById(id)?.textContent?.trim())).toContain('Name');
    });
});
