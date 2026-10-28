/** @jsxImportSource vue */
import { type VNodeChild } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { Form, FormInputGroup } from '..';
import { FormInput } from './fixtures/fields';

interface GroupOptions {
    formProps?: Record<string, unknown>;
    inputGroupProps?: Record<string, unknown>;
    fieldAProps?: Record<string, unknown>;
    fieldBProps?: Record<string, unknown>;
    slots?: Record<string, () => VNodeChild>;
}

function renderFormGroup({ formProps = {}, inputGroupProps = {}, fieldAProps = {}, fieldBProps = {}, slots = {} }: GroupOptions = {}) {
    return render(() => (
        <Form {...formProps}>
            {() => (
                <FormInputGroup {...inputGroupProps}>
                    {{
                        ...slots,
                        default: () => (
                            <>
                                <FormInput field="a" {...fieldAProps} />
                                <FormInput field="b" {...fieldBProps} />
                            </>
                        ),
                    }}
                </FormInputGroup>
            )}
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
        const { container } = renderFormGroup({ inputGroupProps: { label: { text: 'semi', required: true } } });
        expect(container.querySelector('.semi-form-field-label-text')).toHaveTextContent(/^semi$/);
        expect(container.querySelector('.semi-form-field-label-required')).not.toBeNull();
    });

    it('#label 插槽作为文本渲染并为分组命名', () => {
        const { container } = renderFormGroup({ slots: { label: () => <span>semi</span> } });
        expect(container.querySelector('.semi-form-field-label-text')).toHaveTextContent(/^semi$/);
        expect(screen.getByRole('group', { name: 'semi' })).toBeInTheDocument();
    });

    it('labelPosition', () => {
        const { container } = renderFormGroup({ inputGroupProps: { label: 'semi', labelPosition: 'left' } });
        expect(container.querySelector('.semi-form-field-group')).toHaveAttribute('x-label-pos', 'left');
        expect(container.querySelector('.semi-form-field-label-left')).not.toBeNull();
    });

    it('只有设置组 label 时外层才是 role="group"', () => {
        const { container } = renderFormGroup();
        const group = container.querySelector('.semi-form-field-group');
        expect(group).not.toHaveAttribute('role');
        expect(group).not.toHaveAttribute('aria-labelledby');

        const { container: labelled } = renderFormGroup({ inputGroupProps: { label: 'semi' } });
        expect(labelled.querySelector('.semi-form-field-group')).toHaveAttribute('role', 'group');
    });

    it('默认插槽', () => {
        const { container } = renderFormGroup();
        expect(container.querySelectorAll('.semi-input-group input')).toHaveLength(2);
        expect(container.querySelector('.semi-input-group .semi-form-field-label')).toBeNull();
    });

    it('通过 Form 属性声明 labelPosition、labelWidth', () => {
        const { container } = renderFormGroup({
            formProps: { labelPosition: 'left', labelWidth: 300 },
            inputGroupProps: { label: { text: 'semi' } },
        });
        expect(container.querySelector('.semi-form-field-label-left')).not.toBeNull();
        expect(container.querySelector('.semi-form-field-label')).toHaveStyle({ width: '300px' });
    });

    it('label 为分组及其中的输入框命名', () => {
        renderFormGroup({ inputGroupProps: { label: 'Full name' } });
        expect(screen.getByRole('group', { name: 'Full name' })).toBeInTheDocument();
        expect(screen.getAllByRole('textbox', { name: 'Full name' })).toHaveLength(2);
    });

    it('extraText 带 id 并描述组内的每个输入框，非字段子项被丢弃', () => {
        render(() => (
            <Form>
                {() => (
                    <FormInputGroup label="Full name">
                        {{
                            default: () => (
                                <>
                                    <FormInput field="a" />
                                    <span data-testid="plain">x</span>
                                </>
                            ),
                            extraText: () => 'hint',
                        }}
                    </FormInputGroup>
                )}
            </Form>
        ));
        const textbox = screen.getByRole('textbox', { name: 'Full name' });
        expect(textbox).toHaveAccessibleDescription('hint');
        expect(screen.queryByTestId('plain')).toBeNull();
    });

    it('使用方的 aria-labelledby、aria-describedby 在前，与组生成的 id 合并；aria-errormessage 指向组的错误', async () => {
        render(() => (
            <>
                <span id="own-name">Own</span>
                <span id="own-desc">Note</span>
                <Form>
                    {() => (
                        <FormInputGroup label="Full name" aria-labelledby="own-name" aria-describedby="own-desc" aria-errormessage="own-desc">
                            {{
                                default: () => <FormInput field="a" validator={() => 'bad'} trigger="mount" />,
                                extraText: () => 'hint',
                            }}
                        </FormInputGroup>
                    )}
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
                <Form>{() => <FormInputGroup label="手机">{() => <FormInput field="phone" aria-labelledby="own-name" aria-describedby="phone-hint" />}</FormInputGroup>}</Form>
            </>
        ));
        const textbox = screen.getByRole('textbox', { name: 'Own 手机' });
        expect(textbox).toHaveAccessibleDescription('Hint');
    });

    it('不传 disabled 时沿用 Form 的 disabled', () => {
        const { container } = renderFormGroup({ formProps: { disabled: true } });
        container.querySelectorAll('input').forEach((input) => expect(input).toBeDisabled());
    });

    it('字段传 disabled 为 undefined 时沿用 Form 的 disabled', () => {
        const { container } = renderFormGroup({ formProps: { disabled: true }, inputGroupProps: { disabled: undefined } });
        container.querySelectorAll('input').forEach((input) => expect(input).toBeDisabled());
    });

    it('在 Form 之外渲染时警告且不渲染', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { container } = render(FormInputGroup, { props: { label: 'semi' } });
        expect(container.querySelector('.semi-form-field-group')).toBeNull();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('FormInputGroup must be used inside the Form'));
        warn.mockRestore();
    });
});
