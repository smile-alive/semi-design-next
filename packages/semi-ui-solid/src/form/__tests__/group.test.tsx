import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { type FormProps, type InputGroupProps, Form, FormInput } from '..';

interface GroupOptions {
    inputGroupProps?: Partial<InputGroupProps>;
    fieldAProps?: Record<string, unknown>;
    fieldBProps?: Record<string, unknown>;
    formProps?: FormProps;
}

function renderFormGroup({ inputGroupProps = {}, fieldAProps = {}, fieldBProps = {}, formProps = {} }: GroupOptions = {}) {
    return render(() => (
        <Form {...formProps}>
            <Form.InputGroup {...inputGroupProps}>
                <FormInput field="a" {...fieldAProps} />
                <FormInput field="b" {...fieldBProps} />
            </Form.InputGroup>
        </Form>
    ));
}

describe('Form-group', () => {
    it('错误聚合', async () => {
        const { container } = renderFormGroup({
            fieldAProps: { validator: () => 'fieldAError', trigger: 'mount' },
            fieldBProps: { validator: () => 'fieldBError', trigger: 'mount' },
        });
        const groupError = () => container.querySelector('.semi-form-field-group > div > .semi-form-field-error-message');
        await waitFor(() => expect(groupError()).toHaveTextContent(/^fieldAError, fieldBError$/));
    });

    it('label 字符串', () => {
        const { container } = renderFormGroup({ inputGroupProps: { label: 'semi' } });
        expect(container.querySelector('.semi-form-field-label-text')).toHaveTextContent(/^semi$/);
    });

    it('label 对象', () => {
        const { container } = renderFormGroup({ inputGroupProps: { label: { text: <span>semi</span>, required: true } } });
        expect(container.querySelector('.semi-form-field-label-text')).toHaveTextContent(/^semi$/);
        expect(container.querySelector('.semi-form-field-label-required')).not.toBeNull();
    });

    it('label 为节点时作为文本渲染', () => {
        const { container } = renderFormGroup({ inputGroupProps: { label: <span>semi</span> } });
        expect(container.querySelector('.semi-form-field-label-text')).toHaveTextContent(/^semi$/);
        expect(screen.getByRole('group', { name: 'semi' })).toBeInTheDocument();
    });

    it('labelPosition', () => {
        const { container } = renderFormGroup({ inputGroupProps: { label: 'semi', labelPosition: 'left' } });
        expect(container.querySelector('.semi-form-field-group')).toHaveAttribute('x-label-pos', 'left');
        expect(container.querySelector('.semi-form-field-label-left')).not.toBeNull();
    });

    it('children', () => {
        const { container } = renderFormGroup();
        expect(container.querySelectorAll('.semi-input-group input')).toHaveLength(2);
        expect(container.querySelector('.semi-input-group .semi-form-field-label')).toBeNull();
    });

    it('通过 Form 属性声明 labelPosition、labelWidth', () => {
        const { container } = renderFormGroup({ formProps: { labelPosition: 'left', labelWidth: 300 }, inputGroupProps: { label: { text: 'semi' } } });
        expect(container.querySelector('.semi-form-field-label-left')).not.toBeNull();
        expect(container.querySelector('.semi-form-field-label')).toHaveStyle({ width: '300px' });
    });

    it('label 为分组及其中的输入框命名', () => {
        renderFormGroup({ inputGroupProps: { label: 'Full name' } });
        expect(screen.getByRole('group', { name: 'Full name' })).toBeInTheDocument();
        expect(screen.getAllByRole('textbox', { name: 'Full name' })).toHaveLength(2);
    });

    it('组的 size、disabled 作用于字段，字段自己的 disabled={false} 优先，data-* 只落在组根元素', () => {
        renderFormGroup({
            inputGroupProps: { disabled: true, size: 'large', 'data-group': '1' } as Partial<InputGroupProps>,
            fieldBProps: { disabled: false, size: 'small' },
        });
        const [a, b] = screen.getAllByRole('textbox');
        expect(a).toBeDisabled();
        expect(a).toHaveClass('semi-input-large');
        expect(b).toBeEnabled();
        expect(b).toHaveClass('semi-input-small');
        expect(document.querySelectorAll('[data-group]')).toHaveLength(1);
        expect(document.querySelector('[data-group]')).toHaveAttribute('role', 'group');
    });

    it('Form 外渲染时警告且不渲染', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { container } = render(() => (
            <Form.InputGroup label="G">
                <FormInput field="a" />
            </Form.InputGroup>
        ));
        expect(container).toBeEmptyDOMElement();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Semi Form]'));
        warn.mockRestore();
    });

    it('组级 extraText 带 id，组内控件的 aria-describedby 引用它', () => {
        renderFormGroup({ inputGroupProps: { label: 'G', extraText: 'tip' } });
        for (const input of screen.getAllByRole('textbox')) {
            const ids = input.getAttribute('aria-describedby')?.split(' ') ?? [];
            expect(ids.map((id) => document.getElementById(id)?.textContent)).toContain('tip');
        }
    });

    it('使用方的 aria-labelledby、aria-describedby 在前，与组生成的 id 合并；aria-errormessage 指向组的错误', async () => {
        render(() => (
            <>
                <span id="own-name">Own</span>
                <span id="own-desc">Note</span>
                <Form>
                    <Form.InputGroup aria-describedby="own-desc" aria-errormessage="own-desc" aria-labelledby="own-name" extraText="hint" label="Full name">
                        <FormInput field="a" trigger="mount" validator={() => 'bad'} />
                    </Form.InputGroup>
                </Form>
            </>
        ));
        const textbox = screen.getByRole('textbox', { name: 'Own Full name' });
        expect(textbox).toHaveAccessibleDescription('Note hint');
        await waitFor(() => expect(textbox).toHaveAttribute('aria-invalid', 'true'));
        const errorId = textbox.getAttribute('aria-errormessage') as string;
        expect(document.getElementById(errorId)).toHaveTextContent(/^bad$/);
    });

    it('组内字段上使用方的 aria-labelledby、aria-describedby 保留在前，组生成的 id 追加在后', () => {
        render(() => (
            <>
                <span id="own-name">Own</span>
                <span id="phone-hint">Hint</span>
                <Form>
                    <Form.InputGroup label="手机">
                        <FormInput aria-describedby="phone-hint" aria-labelledby="own-name" field="phone" />
                    </Form.InputGroup>
                </Form>
            </>
        ));
        const textbox = screen.getByRole('textbox', { name: 'Own 手机' });
        expect(textbox).toHaveAccessibleDescription('Hint');
    });

    it('组内字段已经只渲染控件，pure 不再加 pure 类', () => {
        const { container } = renderFormGroup({ fieldAProps: { pure: true, class: 'field-a' } });
        expect(container.querySelector('.field-a')).not.toHaveClass('semi-form-field-pure');
    });

    it('没有 label 时外层不设置 role="group"', () => {
        const { container } = renderFormGroup();
        expect(container.querySelector('.semi-form-field-group')).not.toHaveAttribute('role');
    });

    it('组内不是字段的子元素照常渲染', () => {
        render(() => (
            <Form>
                <Form.InputGroup label="G">
                    <FormInput field="a" />
                    <span data-testid="unit">kg</span>
                </Form.InputGroup>
            </Form>
        ));
        expect(screen.getByTestId('unit')).toHaveTextContent('kg');
    });
});
