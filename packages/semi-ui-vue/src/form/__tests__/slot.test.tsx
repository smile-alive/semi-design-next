/** @jsxImportSource vue */
import { type VNodeChild } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import { Form, FormSlot, type FieldError } from '..';
import { errorSelector } from './fixtures/fields';

const slotSelector = `.${BASE_CLASS_PREFIX}-form-slot`;
const labelTextSelector = `.${BASE_CLASS_PREFIX}-form-field-label-text`;

type Slots = Record<string, (scope: { error: FieldError }) => VNodeChild>;
const renderSlot = (slotProps: Record<string, unknown>, formProps: Record<string, unknown> = {}, slots: Slots = {}) => render(() => <Form {...formProps}>{() => <FormSlot {...slotProps}>{slots}</FormSlot>}</Form>);

describe('Form-slot', () => {
    it('class 与 style', () => {
        const { container } = renderSlot({ class: 'slot-test', style: { color: 'red' } });
        const slot = container.querySelector(`${slotSelector}.slot-test`);
        expect(slot).not.toBeNull();
        expect(slot).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('label：对象、字符串、数字与 #label 插槽', () => {
        const labelText = (props: Record<string, unknown>) => {
            const view = renderSlot(props);
            const text = view.container.querySelector(labelTextSelector)?.textContent;
            view.unmount();
            return text;
        };
        expect(labelText({ label: { required: true, text: 'semi' } })).toEqual('semi');
        expect(labelText({ label: 'semi' })).toEqual('semi');
        expect(labelText({ label: 888 })).toEqual('888');

        renderSlot({}, {}, { label: () => <div data-testid="node-label">hahaha</div> });
        expect(document.querySelector(labelTextSelector)).toContainElement(screen.getByTestId('node-label'));
        expect(screen.getByTestId('node-label')).toHaveTextContent(/^hahaha$/);
    });

    it('error：字符串、布尔值与 #error 插槽', () => {
        const errorText = (props: Record<string, unknown>, selector: string) => {
            const view = renderSlot(props);
            const text = view.container.querySelector(selector)?.textContent;
            view.unmount();
            return text;
        };
        expect(errorText({ error: 'semi' }, `${errorSelector} span`)).toEqual('semi');
        expect(errorText({ error: true }, errorSelector)).toEqual('');

        renderSlot({ error: 'help' }, {}, { error: ({ error }) => <div data-testid="node-error">{`${error}!`}</div> });
        expect(document.querySelector(errorSelector)).toContainElement(screen.getByTestId('node-error'));
        expect(screen.getByTestId('node-error')).toHaveTextContent(/^help!$/);
    });

    it('默认插槽', () => {
        const { container } = renderSlot({}, {}, { default: () => <div class="slot-child">semi</div> });
        const child = container.querySelector(`${slotSelector} .slot-child`);
        expect(child).not.toBeNull();
        expect(child).toHaveTextContent(/^semi$/);
    });

    it('继承 Form 的 labelWidth、labelPosition', () => {
        const { container } = renderSlot({}, { labelWidth: 200, labelPosition: 'left' });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-left`)).not.toBeNull();
        expect(container.querySelector(`${slotSelector} .${BASE_CLASS_PREFIX}-form-field-label`)).toHaveStyle({
            width: '200px',
        });
    });

    it('其他属性透传到根 div', () => {
        const { container } = renderSlot({ 'data-testid': 'slot' });
        expect(container.querySelector(slotSelector)).toHaveAttribute('data-testid', 'slot');
    });

    it('使用 Form 的 labelCol 与 wrapperCol 布局', () => {
        const { container } = renderSlot({ label: 'slot' }, { labelCol: { span: 6 }, wrapperCol: { span: 18 }, labelAlign: 'right' }, { default: () => 'content' });
        const label = container.querySelector(`${slotSelector} .${BASE_CLASS_PREFIX}-col-6`);
        expect(label).toHaveClass(`${BASE_CLASS_PREFIX}-form-col-right`);
        expect(label?.parentElement).toHaveStyle({ overflow: 'hidden' });
    });

    it('栅格布局下内容列使用 wrapperCol 并带 slot-main 类，noLabel 时不渲染 Label', () => {
        const { container } = renderSlot({ label: 'slot', noLabel: true }, { labelCol: { span: 6 }, wrapperCol: { span: 18 } }, { default: () => <span class="slot-child">content</span> });
        const main = container.querySelector(`${slotSelector} .${BASE_CLASS_PREFIX}-col-18 > .${BASE_CLASS_PREFIX}-form-slot-main`);
        expect(main).toContainElement(container.querySelector('.slot-child'));
        expect(container.querySelector(`${slotSelector} .${BASE_CLASS_PREFIX}-form-field-label`)).toBeNull();
        expect(container.querySelector(`${slotSelector} .${BASE_CLASS_PREFIX}-col-6`)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-col-undefined`)).toBeNull();
    });

    it('#label 插槽里的多个节点是 Label 的内容', () => {
        const { container } = renderSlot({}, {}, { label: () => ['a', 'b'] });
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
                    {() => (
                        <>
                            <FormSlot label="头像">{() => 'custom'}</FormSlot>
                            <FormSlot label={{ text: '附件' }} aria-labelledby="own">
                                {() => 'custom'}
                            </FormSlot>
                            <FormSlot label="隐藏" noLabel>
                                {() => 'custom'}
                            </FormSlot>
                            <FormSlot>{{ label: () => '插槽', default: () => 'custom' }}</FormSlot>
                        </>
                    )}
                </Form>
            </>
        ));
        expect(screen.getByRole('group', { name: '头像' })).toHaveClass(`${BASE_CLASS_PREFIX}-form-slot`);
        expect(screen.getByRole('group', { name: 'Own 附件' }).getAttribute('aria-labelledby')).toMatch(/^own \S+$/);
        expect(screen.getByRole('group', { name: '插槽' })).toBeInTheDocument();
        expect(screen.getAllByRole('group')).toHaveLength(3);
    });

    it('label 或 label.text 为 null 时根元素不是 group', () => {
        render(() => (
            <Form>
                {() => (
                    <>
                        <FormSlot label={null as never}>{() => 'custom'}</FormSlot>
                        <FormSlot label={{ text: null } as never}>{() => 'custom'}</FormSlot>
                    </>
                )}
            </Form>
        ));
        expect(screen.queryAllByRole('group')).toHaveLength(0);
    });

    it('在 Form 之外渲染', () => {
        const { container } = render(FormSlot, { props: { label: 'slot' }, slots: { default: () => 'content' } });
        expect(container.querySelector(slotSelector)).toHaveAttribute('x-label-pos', 'top');
        expect(container.querySelector(labelTextSelector)).toHaveTextContent('slot');
    });
});
