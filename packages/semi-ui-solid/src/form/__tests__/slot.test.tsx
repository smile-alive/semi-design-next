import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { type FormProps, type SlotProps, Form } from '..';

const Slot = Form.Slot;
const slotSelector = `.${BASE_CLASS_PREFIX}-form-slot`;
const labelTextSelector = `.${BASE_CLASS_PREFIX}-form-field-label-text`;
const emSelector = `.${BASE_CLASS_PREFIX}-form-field-error-message`;

function renderSlot(slotProps: SlotProps | Record<string, unknown>, formProps: FormProps = {}) {
    return render(() => (
        <Form {...formProps}>
            <Slot {...slotProps} />
        </Form>
    ));
}

describe('Form-slot', () => {
    it('class 与 style', () => {
        const { container } = renderSlot({ class: 'slot-test', style: { color: 'red' } });
        const slot = container.querySelector(`${slotSelector}.slot-test`);
        expect(slot).not.toBeNull();
        expect(slot).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('label：对象、字符串、数字、节点', () => {
        const labelText = (props: SlotProps) => {
            const { container, unmount } = renderSlot(props);
            const text = container.querySelector(labelTextSelector)?.textContent;
            unmount();
            return text;
        };
        expect(labelText({ label: { required: true, text: 'semi' } })).toEqual('semi');
        expect(labelText({ label: 'semi' })).toEqual('semi');
        expect(labelText({ label: 888 })).toEqual('888');

        renderSlot({ label: <div data-testid="node-label">hahaha</div> });
        expect(document.querySelector(labelTextSelector)).toContainElement(screen.getByTestId('node-label'));
        expect(screen.getByTestId('node-label')).toHaveTextContent(/^hahaha$/);
    });

    it('error：对象、字符串、数字、节点', () => {
        const errorText = (props: SlotProps, selector: string) => {
            const { container, unmount } = renderSlot(props);
            const text = container.querySelector(selector)?.textContent;
            unmount();
            return text;
        };
        expect(errorText({ error: { error: 'semi' } }, `${emSelector} span`)).toEqual('semi');
        expect(errorText({ error: 'semi' }, `${emSelector} span`)).toEqual('semi');
        expect(errorText({ error: 888 }, emSelector)).toEqual('');

        renderSlot({ error: <div data-testid="node-error">hahaha</div> });
        expect(document.querySelector(emSelector)).toContainElement(screen.getByTestId('node-error'));
        expect(screen.getByTestId('node-error')).toHaveTextContent(/^hahaha$/);
    });

    it('children', () => {
        const { container } = renderSlot({ children: <div class="slot-child">semi</div> });
        const child = container.querySelector(`${slotSelector} .slot-child`);
        expect(child).not.toBeNull();
        expect(child).toHaveTextContent(/^semi$/);
    });

    it('继承 Form.labelWidth、Form.labelPosition', () => {
        const { container } = renderSlot({}, { labelWidth: 200, labelPosition: 'left' });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-left`)).not.toBeNull();
        expect(container.querySelector(`${slotSelector} .${BASE_CLASS_PREFIX}-form-field-label`)).toHaveStyle({ width: '200px' });
    });

    it('其他属性与 ref 透传到根 div', () => {
        let ref: HTMLDivElement | undefined;
        const { container } = renderSlot({ ref: (el: HTMLDivElement) => (ref = el), 'data-testid': 'slot' });
        expect(ref).toBe(container.querySelector(slotSelector));
        expect(ref).toHaveAttribute('data-testid', 'slot');
    });

    it('使用 Form 的 labelCol 与 wrapperCol 布局', () => {
        const { container } = renderSlot({ label: 'slot', children: 'content' }, { labelCol: { span: 6 }, wrapperCol: { span: 18 }, labelAlign: 'right' });
        const label = container.querySelector(`${slotSelector} .${BASE_CLASS_PREFIX}-col-6`);
        expect(label).toHaveClass(`${BASE_CLASS_PREFIX}-form-col-right`);
        expect(label?.parentElement).toHaveStyle({ overflow: 'hidden' });
    });

    it('栅格布局下内容列使用 wrapperCol 并带 slot-main 类，noLabel 时不渲染 Label', () => {
        const { container } = renderSlot({ label: 'slot', noLabel: true, children: <span class="slot-child">content</span> }, { labelCol: { span: 6 }, wrapperCol: { span: 18 } });
        const main = container.querySelector(`${slotSelector} .${BASE_CLASS_PREFIX}-col-18 > .${BASE_CLASS_PREFIX}-form-slot-main`);
        expect(main).toContainElement(container.querySelector('.slot-child') as HTMLElement);
        expect(container.querySelector(`${slotSelector} .${BASE_CLASS_PREFIX}-form-field-label`)).toBeNull();
        expect(container.querySelector(`${slotSelector} .${BASE_CLASS_PREFIX}-col-6`)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-col-undefined`)).toBeNull();
    });

    it('数组形式的 label 是 Label 的内容', () => {
        const { container } = renderSlot({ label: ['a', 'b'] });
        expect(container.querySelector(labelTextSelector)).toHaveTextContent(/^ab$/);
    });

    it('被 aria-label 或 aria-labelledby 命名时根元素为 role="group"，使用方的 role 优先', () => {
        renderSlot({ 'aria-label': 'Contact' });
        expect(screen.getByRole('group', { name: 'Contact' })).toHaveClass(`${BASE_CLASS_PREFIX}-form-slot`);
        const { container } = renderSlot({ 'aria-label': 'Area', role: 'region' });
        expect(container.querySelector(slotSelector)).toHaveAttribute('role', 'region');
        const { container: plain } = renderSlot({});
        expect(plain.querySelector(slotSelector)).not.toHaveAttribute('role');
    });

    it('有 label 时根元素为 role="group"，以 Label 命名，与使用方的 aria-labelledby 合并', () => {
        render(() => (
            <>
                <span id="own">Own</span>
                <Form>
                    <Slot label="头像">custom</Slot>
                    <Slot aria-labelledby="own" label={{ text: '附件', id: 'files' }}>
                        custom
                    </Slot>
                    <Slot label="隐藏" noLabel>
                        custom
                    </Slot>
                </Form>
            </>
        ));
        expect(screen.getByRole('group', { name: '头像' })).toHaveClass(`${BASE_CLASS_PREFIX}-form-slot`);
        expect(screen.getByRole('group', { name: 'Own 附件' })).toHaveAttribute('aria-labelledby', 'own files');
        expect(screen.getAllByRole('group')).toHaveLength(2);
    });

    it('在 Form 之外渲染', () => {
        const { container } = render(() => <Slot label="slot">content</Slot>);
        expect(container.querySelector(slotSelector)).toHaveAttribute('x-label-pos', 'top');
        expect(container.querySelector(labelTextSelector)).toHaveTextContent('slot');
    });
});
