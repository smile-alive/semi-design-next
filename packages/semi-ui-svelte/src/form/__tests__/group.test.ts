import { createRawSnippet } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import FormInputGroup from '../input-group.svelte';
import AGroupFixture, { type GroupStore } from './a-group-fixture.svelte';

const text = (content: string) => createRawSnippet(() => ({ render: () => `<span>${content}</span>` }));

function renderFormGroup({ onlyA = false, ...rest }: GroupStore & { onlyA?: boolean } = {}) {
    const store = createStore<GroupStore>({ fieldB: onlyA ? undefined : {}, ...rest });
    return render(AGroupFixture, { props: { store } });
}

describe('FormInputGroup', () => {
    it('错误聚合', async () => {
        const { container } = renderFormGroup({
            fieldA: { validator: () => 'fieldAError', trigger: 'mount' },
            fieldB: { validator: () => 'fieldBError', trigger: 'mount' },
        });
        const groupError = () => container.querySelector('.semi-form-field-group .semi-form-field-error-message');
        await waitFor(() => expect(groupError()).toHaveTextContent('fieldAError, fieldBError'));
    });

    it('label 字符串', () => {
        const { container } = renderFormGroup({ groupProps: { label: 'semi' } });
        expect(container.querySelector('.semi-form-field-label-text')).toHaveTextContent('semi');
    });

    it('label 对象', () => {
        const { container } = renderFormGroup({ groupProps: { label: { text: 'semi', required: true } } });
        expect(container.querySelector('.semi-form-field-label-text')).toHaveTextContent('semi');
        expect(container.querySelector('.semi-form-field-label-required')).not.toBeNull();
    });

    it('fieldLabel snippet 作为文本渲染并为分组命名', () => {
        const { container } = renderFormGroup({ groupProps: { fieldLabel: text('semi') } });
        expect(container.querySelector('.semi-form-field-label-text')).toHaveTextContent('semi');
        expect(screen.getByRole('group', { name: 'semi' })).toBeInTheDocument();
    });

    it('labelPosition', () => {
        const { container } = renderFormGroup({ groupProps: { label: 'semi', labelPosition: 'left' } });
        expect(container.querySelector('.semi-form-field-group')).toHaveAttribute('x-label-pos', 'left');
        expect(container.querySelector('.semi-form-field-label-left')).not.toBeNull();
    });

    it('只有设置组 label 时 role="group" 才由 label 命名', () => {
        const { container } = renderFormGroup();
        expect(container.querySelector('.semi-form-field-group')).not.toHaveAttribute('role');
        expect(container.querySelector('.semi-input-group')).not.toHaveAttribute('aria-labelledby');
        renderFormGroup({ groupProps: { label: 'semi' } });
        expect(screen.getByRole('group', { name: 'semi' })).toHaveClass('semi-input-group');
    });

    it('组内的字段渲染在 InputGroup 里，且不带自己的标签', () => {
        const { container } = renderFormGroup();
        expect(container.querySelectorAll('.semi-input-group input')).toHaveLength(2);
        expect(container.querySelector('.semi-input-group .semi-form-field-label')).toBeNull();
    });

    it('通过 Form 属性声明 labelPosition、labelWidth', () => {
        const { container } = renderFormGroup({
            formProps: { labelPosition: 'left', labelWidth: 300 },
            groupProps: { label: { text: 'semi' } },
        });
        expect(container.querySelector('.semi-form-field-label-left')).not.toBeNull();
        expect(container.querySelector('.semi-form-field-label')).toHaveStyle({ width: '300px' });
    });

    it('label 为分组及其中的输入框命名', () => {
        renderFormGroup({ groupProps: { label: 'Full name' } });
        expect(screen.getByRole('group', { name: 'Full name' })).toBeInTheDocument();
        expect(screen.getAllByRole('textbox', { name: 'Full name' })).toHaveLength(2);
    });

    it('extraText 带 id 并描述组内的每个输入框', () => {
        renderFormGroup({ groupProps: { label: 'Full name', extraText: text('hint') }, onlyA: true });
        const textbox = screen.getByRole('textbox', { name: 'Full name' });
        expect(textbox).toHaveAccessibleDescription('hint');
    });

    it('使用方的 aria-labelledby、aria-describedby 在前，与组生成的 id 合并；aria-errormessage 指向组的错误', async () => {
        renderFormGroup({
            groupProps: { label: 'Full name', 'aria-labelledby': 'own-name', 'aria-describedby': 'own-desc', 'aria-errormessage': 'own-desc', extraText: text('hint') },
            fieldA: { validator: () => 'bad', trigger: 'mount' },
            onlyA: true,
        });
        const textbox = screen.getByRole('textbox', { name: 'Own Full name' });
        expect(textbox).toHaveAccessibleDescription('Note hint');
        await waitFor(() => expect(textbox).toHaveAttribute('aria-invalid', 'true'));
        const errorId = textbox.getAttribute('aria-errormessage') as string;
        expect(document.getElementById(errorId)).toHaveTextContent('bad');
    });

    it('组内字段上使用方的 aria-labelledby、aria-describedby 保留在前，组生成的 id 追加在后', () => {
        renderFormGroup({
            groupProps: { label: '手机' },
            fieldA: { 'aria-labelledby': 'own-name', 'aria-describedby': 'phone-hint' },
            onlyA: true,
        });
        const textbox = screen.getByRole('textbox', { name: 'Own 手机' });
        expect(textbox).toHaveAccessibleDescription('Hint');
    });

    it('不传 disabled 时沿用 Form 的 disabled', () => {
        const { container } = renderFormGroup({ formProps: { disabled: true } });
        container.querySelectorAll('input').forEach((input) => expect(input).toBeDisabled());
    });

    it('组的 size 传给组内字段，字段自己的 size 与 disabled 优先', () => {
        renderFormGroup({ groupProps: { size: 'large', disabled: true }, fieldB: { size: 'small', disabled: false } });
        const [a, b] = screen.getAllByRole('textbox');
        expect(a).toHaveClass('semi-input-large');
        expect(a).toBeDisabled();
        expect(b).toHaveClass('semi-input-small');
        expect(b).toBeEnabled();
    });

    it('组上的 data-* 只落在组根元素，不下发给组内字段', () => {
        const { container } = renderFormGroup({ groupProps: { 'data-group': '1' } });
        expect(container.querySelectorAll('[data-group]')).toHaveLength(1);
        expect(container.querySelector('.semi-input-group')).toHaveAttribute('data-group', '1');
    });

    it('传 disabled 为 undefined 时沿用 Form 的 disabled', () => {
        const { container } = renderFormGroup({ formProps: { disabled: true }, groupProps: { disabled: undefined } });
        container.querySelectorAll('input').forEach((input) => expect(input).toBeDisabled());
    });

    it('在 Form 之外渲染时警告且不渲染', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { container } = render(FormInputGroup, { props: { label: 'semi' } });
        expect(container.querySelector('.semi-form-field-group')).toBeNull();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('FormInputGroup must be used inside the Form'));
    });
});
