import { createRawSnippet } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import FormSlot from '../slot.svelte';
import ASlotFixture, { type SlotStore } from './a-slot-fixture.svelte';
import { errorSelector, prefix } from './helpers';

const slotSelector = `.${prefix}-slot`;
const labelTextSelector = `.${prefix}-field-label-text`;

const node = (testId: string, content: string, tag = 'div') => createRawSnippet(() => ({ render: () => `<${tag} data-testid="${testId}">${content}</${tag}>` }));
const errorNode = (testId: string) =>
    createRawSnippet<[{ error: unknown }]>((arg) => ({
        render: () => `<div data-testid="${testId}">${String(arg().error)}!</div>`,
    }));

const renderSlots = (slots: Record<string, unknown>[], formProps: Record<string, unknown> = {}) => render(ASlotFixture, { props: { store: createStore<SlotStore>({ slots, formProps }) } });
const renderSlot = (slotProps: Record<string, unknown>, formProps: Record<string, unknown> = {}) => renderSlots([slotProps], formProps);

describe('FormSlot', () => {
    it('class 与 style', () => {
        const { container } = renderSlot({ class: 'slot-test', style: 'color: red' });
        const slot = container.querySelector(`${slotSelector}.slot-test`);
        expect(slot).not.toBeNull();
        expect(slot).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('label：对象、字符串、数字与 fieldLabel snippet', () => {
        const labelText = (props: Record<string, unknown>) => {
            const view = renderSlot(props);
            // the label template leaves a collapsible trailing space after the text
            const text = view.container.querySelector(labelTextSelector)?.textContent?.trim();
            view.unmount();
            return text;
        };
        expect(labelText({ label: { required: true, text: 'semi' } })).toEqual('semi');
        expect(labelText({ label: 'semi' })).toEqual('semi');
        expect(labelText({ label: 888 })).toEqual('888');

        renderSlot({ fieldLabel: node('node-label', 'hahaha') });
        expect(document.querySelector(labelTextSelector)).toContainElement(screen.getByTestId('node-label'));
        expect(screen.getByTestId('node-label')).toHaveTextContent('hahaha');
    });

    it('error：字符串、布尔值与 errorContent snippet', () => {
        const errorText = (props: Record<string, unknown>, selector: string) => {
            const view = renderSlot(props);
            const text = view.container.querySelector(selector)?.textContent;
            view.unmount();
            return text;
        };
        expect(errorText({ error: 'semi' }, `${errorSelector} span`)).toEqual('semi');
        expect(errorText({ error: true }, errorSelector)).toEqual('');

        renderSlot({ error: 'help', errorContent: errorNode('node-error') });
        expect(document.querySelector(errorSelector)).toContainElement(screen.getByTestId('node-error'));
        expect(screen.getByTestId('node-error')).toHaveTextContent('help!');
    });

    it('默认内容', () => {
        const { container } = renderSlot({ children: createRawSnippet(() => ({ render: () => '<div class="slot-child">semi</div>' })) });
        const child = container.querySelector(`${slotSelector} .slot-child`);
        expect(child).not.toBeNull();
        expect(child).toHaveTextContent('semi');
    });

    it('继承 Form 的 labelWidth、labelPosition', () => {
        const { container } = renderSlot({ label: 'slot' }, { labelWidth: 200, labelPosition: 'left' });
        expect(container.querySelector(`.${prefix}-field-label-left`)).not.toBeNull();
        expect(container.querySelector(`${slotSelector} .${prefix}-field-label`)).toHaveStyle({ width: '200px' });
    });

    it('其他属性透传到根 div', () => {
        const { container } = renderSlot({ 'data-testid': 'slot' });
        expect(container.querySelector(slotSelector)).toHaveAttribute('data-testid', 'slot');
    });

    it('使用 Form 的 labelCol 与 wrapperCol 布局', () => {
        const { container } = renderSlot({ label: 'slot', children: createRawSnippet(() => ({ render: () => '<span>content</span>' })) }, { labelCol: { span: 6 }, wrapperCol: { span: 18 }, labelAlign: 'right' });
        const label = container.querySelector(`${slotSelector} .semi-col-6`);
        expect(label).toHaveClass(`${prefix}-col-right`);
        expect(label?.parentElement).toHaveStyle({ overflow: 'hidden' });
    });

    it('栅格布局下内容列使用 wrapperCol 并带 slot-main 类，noLabel 时不渲染 Label', () => {
        const { container } = renderSlot({ label: 'slot', noLabel: true, children: createRawSnippet(() => ({ render: () => '<span class="slot-child">content</span>' })) }, { labelCol: { span: 6 }, wrapperCol: { span: 18 } });
        const main = container.querySelector(`${slotSelector} .semi-col-18 > .${prefix}-slot-main`);
        expect(main).toContainElement(container.querySelector('.slot-child'));
        expect(container.querySelector(`${slotSelector} .${prefix}-field-label`)).toBeNull();
        expect(container.querySelector(`${slotSelector} .semi-col-6`)).not.toBeNull();
        expect(container.querySelector(`.${prefix}-col-undefined`)).toBeNull();
    });

    it('被 aria-label 或 aria-labelledby 命名时根元素为 role="group"，使用方的 role 优先', () => {
        renderSlot({ 'aria-label': 'Contact' });
        expect(screen.getByRole('group', { name: 'Contact' })).toHaveClass(`${prefix}-slot`);
        const { container } = renderSlot({ 'aria-label': 'Area', role: 'region' });
        expect(container.querySelector(slotSelector)).toHaveAttribute('role', 'region');
        const { container: plain } = renderSlot({});
        expect(plain.querySelector(slotSelector)).not.toHaveAttribute('role');
    });

    it('有 label 时根元素为 role="group"，以 Label 命名，与使用方的 aria-labelledby 合并', () => {
        const content = createRawSnippet(() => ({ render: () => '<span>custom</span>' }));
        renderSlots([
            { label: '头像', children: content },
            { label: { text: '附件' }, 'aria-labelledby': 'own', children: content },
            { label: '隐藏', noLabel: true, children: content },
            { fieldLabel: node('slot-label', '插槽', 'span'), children: content },
        ]);
        expect(screen.getByRole('group', { name: '头像' })).toHaveClass(`${prefix}-slot`);
        expect(screen.getByRole('group', { name: 'Own 附件' }).getAttribute('aria-labelledby')).toMatch(/^own \S+$/);
        expect(screen.getByRole('group', { name: '插槽' })).toBeInTheDocument();
        expect(screen.getAllByRole('group')).toHaveLength(3);
    });

    it('label 或 label.text 为 null 时根元素不是 group', () => {
        // null is outside the declared label type; a caller from untyped code can still pass it
        renderSlots([{ label: null }, { label: { text: null } }]);
        expect(screen.queryAllByRole('group')).toHaveLength(0);
    });

    it('在 Form 之外渲染', () => {
        const { container } = render(FormSlot, { props: { label: 'slot', children: createRawSnippet(() => ({ render: () => '<span>content</span>' })) } });
        expect(container.querySelector(slotSelector)).toHaveAttribute('x-label-pos', 'top');
        expect(container.querySelector(labelTextSelector)).toHaveTextContent('slot');
    });
});
