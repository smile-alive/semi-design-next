import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { Form } from '@fibrae/semi-ui-react';

function renderFormGroup(props: Record<string, Record<string, unknown>> = {}) {
    let { inputGroupProps = {}, fieldAProps = {}, fieldBProps = {}, formProps = {} } = props;

    return render(
        <Form {...formProps}>
            <Form.InputGroup {...inputGroupProps}>
                <Form.Input field="a" {...fieldAProps} />
                <Form.Input field="b" {...fieldBProps} />
            </Form.InputGroup>
        </Form>
    );
}

describe('Form-group', () => {
    it('错误聚合', async () => {
        let errorA = 'fieldAError';
        let errorB = 'fieldBError';
        let props = {
            fieldAProps: {
                validator: () => errorA,
                trigger: 'mount',
            },
            fieldBProps: {
                validator: () => errorB,
                trigger: 'mount',
            },
        };
        const { container } = renderFormGroup(props);
        const groupError = () => container.querySelector('.semi-form-field-group > div > .semi-form-field-error-message');
        await waitFor(() => expect(groupError()).toHaveTextContent(new RegExp(`^${errorA}, ${errorB}$`)));
    });

    it('label 字符串', () => {
        let props = {
            inputGroupProps: {
                label: 'semi',
            },
        };
        const { container } = renderFormGroup(props);
        expect(container.querySelector('.semi-form-field-label-text')).toHaveTextContent(/^semi$/);
    });

    it('label 对象', () => {
        let props = {
            inputGroupProps: {
                label: {
                    text: <span>semi</span>,
                    required: true,
                },
            },
        };
        const { container } = renderFormGroup(props);
        expect(container.querySelector('.semi-form-field-label-text')).toHaveTextContent(/^semi$/);
        expect(container.querySelector('.semi-form-field-label-required')).not.toBeNull();
    });

    it('label 为 React 元素时作为文本渲染', () => {
        const { container } = renderFormGroup({ inputGroupProps: { label: <span>semi</span> } });
        expect(container.querySelector('.semi-form-field-label-text')).toHaveTextContent(/^semi$/);
        expect(screen.getByRole('group', { name: 'semi' })).toBeInTheDocument();
    });

    it('labelPosition', () => {
        let props = {
            inputGroupProps: {
                label: 'semi',
                labelPosition: 'left',
            },
        };
        const { container } = renderFormGroup(props);
        expect(container.querySelector('.semi-form-field-group')).toHaveAttribute('x-label-pos', 'left');
        expect(container.querySelector('.semi-form-field-label-left')).not.toBeNull();
    });

    it('children', () => {
        const { container } = renderFormGroup();
        expect(container.querySelectorAll('.semi-input-group input')).toHaveLength(2);
        expect(container.querySelector('.semi-input-group .semi-form-field-label')).toBeNull();
    });

    it('通过 Form 属性声明 labelPosition、labelWidth', () => {
        let props = {
            formProps: {
                labelPosition: 'left',
                labelWidth: 300,
            },
            inputGroupProps: {
                label: {
                    text: 'semi',
                },
            },
        };
        const { container } = renderFormGroup(props);
        expect(container.querySelector('.semi-form-field-label-left')).not.toBeNull();
        expect(container.querySelector('.semi-form-field-label')).toHaveStyle({ width: '300px' });
    });

    it('label 为分组及其中的输入框命名', () => {
        renderFormGroup({ inputGroupProps: { label: 'Full name' } });
        expect(screen.getByRole('group', { name: 'Full name' })).toBeInTheDocument();
        expect(screen.getAllByRole('textbox', { name: 'Full name' })).toHaveLength(2);
    });

    it('Form 外渲染时警告且不渲染', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(
            <Form.InputGroup label="G">
                <Form.Input field="a" />
            </Form.InputGroup>
        );
        expect(container).toBeEmptyDOMElement();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Semi Form]'));
    });

    it('组级 extraText 带 id，组内控件的 aria-describedby 引用它', () => {
        renderFormGroup({ inputGroupProps: { label: 'G', extraText: 'tip' } });
        for (const input of screen.getAllByRole('textbox')) {
            const ids = input.getAttribute('aria-describedby')?.split(' ') ?? [];
            expect(ids.map((id) => document.getElementById(id)?.textContent)).toContain('tip');
        }
    });

    it('使用方的 aria-labelledby、aria-describedby 在前，与组生成的 id 合并；aria-errormessage 指向组的错误', async () => {
        render(
            <>
                <span id="own-name">Own</span>
                <span id="own-desc">Note</span>
                <Form>
                    <Form.InputGroup aria-describedby="own-desc" aria-errormessage="own-desc" aria-labelledby="own-name" extraText="hint" label="Full name">
                        <Form.Input field="a" trigger="mount" validator={() => 'bad'} />
                    </Form.InputGroup>
                </Form>
            </>
        );
        const textbox = screen.getByRole('textbox', { name: 'Own Full name' });
        expect(textbox).toHaveAccessibleDescription('Note hint');
        await waitFor(() => expect(textbox).toHaveAttribute('aria-invalid', 'true'));
        const errorId = textbox.getAttribute('aria-errormessage') as string;
        expect(document.getElementById(errorId)).toHaveTextContent(/^bad$/);
    });

    it('组内字段上使用方的 aria-labelledby、aria-describedby 保留在前，组生成的 id 追加在后', () => {
        render(
            <>
                <span id="own-name">Own</span>
                <span id="phone-hint">Hint</span>
                <Form>
                    <Form.InputGroup label="手机">
                        <Form.Input aria-describedby="phone-hint" aria-labelledby="own-name" field="phone" />
                    </Form.InputGroup>
                </Form>
            </>
        );
        const textbox = screen.getByRole('textbox', { name: 'Own 手机' });
        expect(textbox).toHaveAccessibleDescription('Hint');
    });

    it('size、disabled 经 InputGroup 下发给字段，字段自己的值优先；其他属性只落在分组上', () => {
        const { container } = renderFormGroup({ inputGroupProps: { disabled: true, size: 'small', 'data-group': '1' }, fieldBProps: { disabled: false, size: 'large' } });
        const [a, b] = screen.getAllByRole('textbox');
        expect(a).toBeDisabled();
        expect(a).toHaveClass('semi-input-small');
        expect(b).toBeEnabled();
        expect(b).toHaveClass('semi-input-large');
        expect(container.querySelectorAll('[data-group]')).toHaveLength(1);
        expect(container.querySelector('.semi-input-group')).toHaveAttribute('data-group', '1');
    });

    it('Form 级 disabled 下字段显式传 disabled={false} 优先于 InputGroup', () => {
        renderFormGroup({ formProps: { disabled: true }, fieldAProps: { disabled: false } });
        const [a, b] = screen.getAllByRole('textbox');
        expect(a).toBeEnabled();
        expect(b).toBeDisabled();
    });

    it('没有 label 时外层不设置 role="group"', () => {
        const { container } = renderFormGroup();
        expect(container.querySelector('.semi-form-field-group')).not.toHaveAttribute('role');
    });
});
