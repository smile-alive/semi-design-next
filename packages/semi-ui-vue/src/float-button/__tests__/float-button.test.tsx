/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { fireEvent, screen } from '@testing-library/vue';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import FloatButtonGroup from '../float-button-group.vue';
import FloatButton from '../float-button.vue';
import type { FloatButtonEmits, FloatButtonGroupEmits, FloatButtonGroupItem, FloatButtonGroupSlots, FloatButtonSlots } from '../interface';
import DynamicGroup from './fixtures/dynamic-group.vue';
import Prevent from './fixtures/prevent.vue';
import RootRef from './fixtures/root-ref.vue';

const prefixCls = 'semi-floatButton';
const groupCls = 'semi-floatButtonGroup';

const icon = () => <i data-testid="icon" />;
const items: FloatButtonGroupItem[] = [
    { content: 'Editor', value: 'editor' },
    { content: 'Search', value: 'search', badge: { count: 5 } },
];
const iconSlot = ({ item }: { item: FloatButtonGroupItem }) => <i data-testid={`icon-${item.value}`} />;
const firstChild = (container: Element) => container.firstElementChild as HTMLElement;
function globalWith(overrideDefaultProps: SemiGlobal['config']['overrideDefaultProps']) {
    const semi = new SemiGlobal();
    semi.config.overrideDefaultProps = overrideDefaultProps;
    return { provide: { [semiGlobalKey]: semi } };
}

describe('FloatButton', () => {
    it('默认在根元素与 body 上渲染 round 与 default 尺寸类名', () => {
        const view = render(FloatButton, { slots: { icon } });
        const root = firstChild(view.container);
        expect(root).toHaveClass(prefixCls, `${prefixCls}-round`, `${prefixCls}-default`);
        const body = root.querySelector(`.${prefixCls}-body`);
        expect(body).toHaveClass(`${prefixCls}-round`, `${prefixCls}-default`);
        expect(body).not.toHaveClass(`${prefixCls}-colorful`);
        expect(body).not.toHaveClass(`${prefixCls}-disabled`);
        expect(body?.querySelector('[data-testid="icon"]')).not.toBeNull();
    });

    it('应用 shape、size、colorful 与 disabled 类名', () => {
        const view = render(FloatButton, { props: { disabled: true, colorful: true, shape: 'square', size: 'large' } });
        const root = firstChild(view.container);
        expect(root).toHaveClass(`${prefixCls}-square`, `${prefixCls}-large`);
        expect(root).not.toHaveClass(`${prefixCls}-round`);
        expect(root.querySelector(`.${prefixCls}-body`)).toHaveClass(`${prefixCls}-square`, `${prefixCls}-large`, `${prefixCls}-colorful`, `${prefixCls}-disabled`);
    });

    it('class 与 style 作用于根元素', () => {
        const view = render(FloatButton, { attrs: { class: 'custom', style: { bottom: '20px' } } });
        const root = firstChild(view.container);
        expect(root).toHaveClass(prefixCls, 'custom');
        expect(root).toHaveStyle({ bottom: '20px' });
    });

    it('设置 badge 时用 Badge 包裹 body', () => {
        const view = render(() => (
            <div>
                <FloatButton badge={{ count: 1000, overflowCount: 999 }} />
                <FloatButton badge={{ dot: true, type: 'danger' }} />
                <FloatButton />
            </div>
        ));
        const [count, dot, plain] = view.container.querySelectorAll(`.${prefixCls}`);
        const countBadge = count.querySelector('.semi-badge');
        expect(countBadge?.querySelector(`.${prefixCls}-body`)).not.toBeNull();
        expect(countBadge?.querySelector('.semi-badge-count')).toHaveTextContent('999+');
        expect(dot.querySelector('.semi-badge-dot')).toHaveClass('semi-badge-danger');
        expect(plain.querySelector('.semi-badge')).toBeNull();
        expect(plain.firstElementChild).toHaveClass(`${prefixCls}-body`);
    });

    it('#badgeCount 渲染到 Badge 的计数位置', () => {
        const view = render(FloatButton, {
            props: { badge: {} },
            slots: { badgeCount: () => <b data-testid="count">new</b> },
        });
        expect(view.container.querySelector('.semi-badge-custom')).toContainElement(screen.getByTestId('count'));
        expect(view.container.querySelector(`.${prefixCls}-body`)?.parentElement).toHaveClass('semi-badge');
    });

    it('点击发出 click 事件，载荷是原生 MouseEvent', async () => {
        const view = render(FloatButton);
        await fireEvent.click(view.container.querySelector(`.${prefixCls}-body`) as Element);
        expect(view.emitted().click).toEqual([[expect.any(MouseEvent)]]);
        expect((view.emitted().click[0] as [MouseEvent])[0].type).toBe('click');
    });

    it('无 href 时渲染 type 为 button 的原生按钮', () => {
        render(FloatButton, { attrs: { 'aria-label': 'Edit' }, slots: { icon: () => <i /> } });
        const root = screen.getByRole('button', { name: 'Edit' });
        expect(root.tagName).toBe('BUTTON');
        expect(root).toHaveAttribute('type', 'button');
        expect(root).not.toBeDisabled();
        expect(root).not.toHaveAttribute('aria-disabled');
        expect(root.querySelector(`.${prefixCls}-body`)?.tagName).toBe('SPAN');
    });

    it('渲染带 href、target 与 rel 的原生链接', () => {
        render(FloatButton, {
            attrs: { 'aria-label': 'Semi' },
            props: { href: 'https://semi.design', rel: 'noreferrer', target: '_blank' },
        });
        const link = screen.getByRole('link', { name: 'Semi' });
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', 'https://semi.design');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noreferrer');
        expect(link).not.toHaveAttribute('type');
    });

    it('链接上发出 click，且不阻止原生跳转', async () => {
        const view = render(FloatButton, { attrs: { 'aria-label': 'Anchor' }, props: { href: '#float-button' } });
        let prevented: boolean | undefined;
        // Runs after the component's own listener; it also stops jsdom from navigating.
        const listener = (event: Event) => {
            prevented = event.defaultPrevented;
            event.preventDefault();
        };
        document.addEventListener('click', listener);
        try {
            await fireEvent.click(screen.getByRole('link', { name: 'Anchor' }));
        } finally {
            document.removeEventListener('click', listener);
        }
        expect(view.emitted().click).toHaveLength(1);
        expect(prevented).toBe(false);
    });

    it('@click.prevent 阻止链接跳转', async () => {
        const view = render(Prevent);
        let prevented: boolean | undefined;
        const listener = (event: Event) => {
            prevented = event.defaultPrevented;
            event.preventDefault();
        };
        document.addEventListener('click', listener);
        try {
            await fireEvent.click(screen.getByRole('link', { name: 'Anchor' }));
        } finally {
            document.removeEventListener('click', listener);
        }
        expect(view.getByLabelText('clicks')).toHaveTextContent('1');
        expect(prevented).toBe(true);
    });

    it('原生禁用按钮，不发出 click，内部元素冒泡的点击也不发出', async () => {
        const view = render(FloatButton, { attrs: { 'aria-label': 'Edit' }, props: { disabled: true } });
        const root = screen.getByRole('button', { name: 'Edit' });
        expect(root).toBeDisabled();
        expect(root).toHaveAttribute('aria-disabled', 'true');
        await fireEvent.click(root.querySelector(`.${prefixCls}-body`) as Element);
        expect(view.emitted().click).toBeUndefined();
    });

    it('禁用链接变为不可跳转的链接，带 aria-disabled，不发出 click', async () => {
        const view = render(FloatButton, {
            attrs: { 'aria-label': 'Semi' },
            props: { disabled: true, href: 'https://semi.design', target: '_blank' },
        });
        const link = screen.getByRole('link', { name: 'Semi' });
        expect(link.tagName).toBe('A');
        expect(link).not.toHaveAttribute('href');
        expect(link).not.toHaveAttribute('target');
        expect(link).toHaveAttribute('aria-disabled', 'true');
        expect(link).not.toHaveAttribute('tabindex');
        await fireEvent.click(link);
        expect(view.emitted().click).toBeUndefined();
    });

    it('type、aria-disabled 等属性不能破坏按钮语义', () => {
        render(FloatButton, { attrs: { 'aria-label': 'Edit', type: 'submit', 'aria-disabled': 'false' } });
        const root = screen.getByRole('button', { name: 'Edit' });
        expect(root).toHaveAttribute('type', 'button');

        render(FloatButton, {
            attrs: { 'aria-label': 'Off', 'aria-disabled': 'false' },
            props: { disabled: true },
        });
        expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-disabled', 'true');
    });

    it('链接丢弃 type 属性', () => {
        render(FloatButton, { attrs: { 'aria-label': 'Semi', type: 'submit' }, props: { href: '#top' } });
        expect(screen.getByRole('link', { name: 'Semi' })).not.toHaveAttribute('type');
    });

    it('data-*、id 与 aria-label 落在根元素', () => {
        const view = render(FloatButton, { attrs: { id: 'fb-id', 'data-testid': 'fb', 'aria-label': 'Edit' } });
        const root = firstChild(view.container);
        expect(root).toHaveAttribute('data-testid', 'fb');
        expect(root).toHaveAttribute('id', 'fb-id');
        expect(root).toHaveAttribute('aria-label', 'Edit');
        expect(root).not.toHaveAttribute('href');
        expect(root).not.toHaveAttribute('target');
    });

    it('组件 ref 的 $el 是根按钮、链接或 div', async () => {
        const view = render(RootRef);
        await nextTick();
        expect(view.getByLabelText('tags')).toHaveTextContent('BUTTON,A,DIV');
    });

    it('读取 app 的全局默认值，显式属性优先', () => {
        const view = render(
            () => (
                <div>
                    <FloatButton />
                    <FloatButton shape="round" />
                    <FloatButton shape={undefined} />
                </div>
            ),
            {
                global: globalWith({ FloatButton: { shape: 'square', size: 'small' } }),
            }
        );
        const [fromGlobal, explicit, undefinedShape] = view.container.querySelectorAll(`.${prefixCls}`);
        expect(fromGlobal).toHaveClass(`${prefixCls}-square`, `${prefixCls}-small`);
        expect(explicit).toHaveClass(`${prefixCls}-round`, `${prefixCls}-small`);
        expect(undefinedShape).toHaveClass(`${prefixCls}-square`);
    });

    it('disabled 由使用方切换，没有本地状态', async () => {
        const view = render(FloatButton, { attrs: { 'aria-label': 'Edit' } });
        const root = screen.getByRole('button', { name: 'Edit' });
        await fireEvent.click(root);
        expect(root).not.toBeDisabled();
        await view.rerender({ disabled: true });
        expect(root).toBeDisabled();
        await view.rerender({ disabled: false });
        expect(root).not.toBeDisabled();
    });

    it('类型：click 载荷是 MouseEvent，插槽不含 default', () => {
        expectTypeOf<FloatButtonEmits['click']>().toEqualTypeOf<[event: MouseEvent]>();
        expectTypeOf<FloatButtonSlots>().not.toHaveProperty('default');
        expectTypeOf<FloatButtonGroupSlots>().not.toHaveProperty('default');
    });
});

describe('FloatButtonGroup', () => {
    it('每个条目渲染一项，包含 value、icon 与 content', () => {
        const view = render(FloatButtonGroup, { props: { items }, slots: { icon: iconSlot } });
        const root = firstChild(view.container);
        expect(root).toHaveClass(groupCls);
        expect(root).not.toHaveClass(`${groupCls}-disabled`);
        const rendered = root.querySelectorAll(`.${groupCls}-item`);
        expect(rendered).toHaveLength(2);
        expect(rendered[0]).toHaveAttribute('data-value', 'editor');
        expect(rendered[0]).toHaveTextContent('Editor');
        expect(rendered[0].querySelector('[data-testid="icon-editor"]')).not.toBeNull();
        expect(rendered[1]).toHaveAttribute('data-value', 'search');
    });

    it('带 badge 的项用 Badge 包裹', () => {
        const view = render(FloatButtonGroup, { props: { items } });
        const badges = view.container.querySelectorAll('.semi-badge');
        expect(badges).toHaveLength(1);
        expect(badges[0].parentElement).toHaveClass(groupCls);
        expect(badges[0].querySelector(`.${groupCls}-item`)).toHaveAttribute('data-value', 'search');
        expect(badges[0].querySelector('.semi-badge-count')).toHaveTextContent('5');
    });

    it('class、style 与 disabled 类名', () => {
        const view = render(FloatButtonGroup, {
            attrs: { class: 'custom', style: { bottom: '50px' } },
            props: { disabled: true, items },
        });
        const root = firstChild(view.container);
        expect(root).toHaveClass(groupCls, 'custom', `${groupCls}-disabled`);
        expect(root).toHaveStyle({ bottom: '50px' });
    });

    it('点击发出被点击项的 value 与事件', async () => {
        const view = render(FloatButtonGroup, { props: { items } });
        await fireEvent.click(view.container.querySelector('[data-value="search"]') as Element);
        expect(view.emitted().click).toEqual([['search', expect.any(MouseEvent)]]);
    });

    it('点击落在项内部元素上时，上报该项的 value', async () => {
        const view = render(FloatButtonGroup, { props: { items }, slots: { icon: iconSlot } });
        await fireEvent.click(screen.getByTestId('icon-editor'));
        expect((view.emitted().click as [string, MouseEvent][]).map(([value]) => value)).toEqual(['editor']);
    });

    it('没有 value 的项上报 undefined', async () => {
        const view = render(FloatButtonGroup, { props: { items: [{ content: 'Plain' }] } });
        await fireEvent.click(screen.getByRole('button', { name: 'Plain' }));
        expect(view.emitted().click).toEqual([[undefined, expect.any(MouseEvent)]]);
    });

    it('忽略项以外的点击', async () => {
        const view = render(FloatButtonGroup, { props: { items } });
        await fireEvent.click(firstChild(view.container));
        await fireEvent.click(view.container.querySelector('.semi-badge-count') as Element);
        expect(view.emitted().click).toBeUndefined();
    });

    it('每项渲染为以 content 命名的原生按钮', () => {
        render(FloatButtonGroup, { props: { items } });
        const buttons = screen.getAllByRole('button');
        expect(buttons.map((button) => button.textContent)).toEqual(['Editor', 'Search']);
        buttons.forEach((button) => {
            expect(button.tagName).toBe('BUTTON');
            expect(button).toHaveAttribute('type', 'button');
            expect(button).not.toBeDisabled();
        });
    });

    it('分组禁用时禁用每一项', async () => {
        const itemClick = vi.fn<(event: MouseEvent) => void>();
        const view = render(FloatButtonGroup, {
            props: {
                disabled: true,
                items: [...items, { content: 'Docs', value: 'docs', href: '#docs', onClick: itemClick }],
            },
        });
        for (const button of screen.getAllByRole('button')) {
            expect(button).toBeDisabled();
            expect(button).toHaveAttribute('aria-disabled', 'true');
            expect(button).toHaveClass(`${groupCls}-item-disabled`);
            await fireEvent.click(button);
        }
        const link = screen.getByRole('link', { name: 'Docs' });
        expect(link).not.toHaveAttribute('href');
        expect(link).toHaveAttribute('aria-disabled', 'true');
        await fireEvent.click(link);
        expect(view.emitted().click).toBeUndefined();
        expect(itemClick).not.toHaveBeenCalled();
    });

    it('每项处理 href、disabled、onClick、shape、size、class、style 与 aria-label', async () => {
        const editorClick = vi.fn<(event: MouseEvent) => void>();
        const searchClick = vi.fn<(event: MouseEvent) => void>();
        const view = render(FloatButtonGroup, {
            props: {
                items: [
                    {
                        'aria-label': 'Editor',
                        value: 'editor',
                        onClick: editorClick,
                        shape: 'square',
                        size: 'large',
                        colorful: true,
                        class: 'item-custom',
                        style: { color: 'red' },
                    },
                    { content: 'Search', value: 'search', disabled: true, onClick: searchClick },
                    { content: 'Docs', value: 'docs', href: 'https://semi.design', target: '_blank', rel: 'noopener' },
                ],
            },
        });
        const editor = screen.getByRole('button', { name: 'Editor' });
        expect(editor).toHaveClass(`${groupCls}-item`, `${prefixCls}-square`, `${prefixCls}-large`, `${prefixCls}-colorful`, 'item-custom');
        expect(editor).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        await fireEvent.click(editor);
        expect(editorClick).toHaveBeenCalledTimes(1);
        expect(view.emitted().click).toEqual([['editor', expect.any(MouseEvent)]]);
        const itemEvent = editorClick.mock.calls[0][0];
        expect((view.emitted().click[0] as [string, MouseEvent])[1]).toBe(itemEvent);

        const search = screen.getByRole('button', { name: 'Search' });
        expect(search).toBeDisabled();
        expect(search).not.toHaveClass(`${prefixCls}-square`, `${prefixCls}-colorful`);
        await fireEvent.click(search);
        expect(searchClick).not.toHaveBeenCalled();
        expect(view.emitted().click).toHaveLength(1);

        const docs = screen.getByRole('link', { name: 'Docs' });
        expect(docs).toHaveClass(`${groupCls}-item`);
        expect(docs).toHaveAttribute('href', 'https://semi.design');
        expect(docs).toHaveAttribute('target', '_blank');
        expect(docs).toHaveAttribute('rel', 'noopener');
        expect(docs).toHaveAttribute('data-value', 'docs');
    });

    it('item 的 onClick 先于 group 的 click 调用', async () => {
        const order: string[] = [];
        render(FloatButtonGroup, {
            props: {
                items: [{ content: 'Editor', value: 'editor', onClick: () => order.push('item') }],
                onClick: () => order.push('group'),
            },
        });
        await fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
        expect(order).toEqual(['item', 'group']);
    });

    it('item 的 id、title 与 data-* 落在项的元素上', () => {
        render(FloatButtonGroup, {
            props: { items: [{ content: 'Editor', id: 'ed', title: 'Open editor', 'data-extra': 'x' }] },
        });
        const button = screen.getByRole('button', { name: 'Editor' });
        expect(button).toHaveAttribute('id', 'ed');
        expect(button).toHaveAttribute('title', 'Open editor');
        expect(button).toHaveAttribute('data-extra', 'x');
    });

    it('分组可通过 aria-label 命名，role 可以被覆盖', () => {
        const named = render(FloatButtonGroup, { attrs: { 'aria-label': 'Quick actions' }, props: { items } });
        expect(screen.getByRole('group', { name: 'Quick actions' })).toHaveClass(groupCls);
        named.unmount();

        const toolbar = render(FloatButtonGroup, { attrs: { role: 'toolbar' }, props: { items } });
        expect(toolbar.getByRole('toolbar')).toHaveClass(groupCls);
    });

    it('不渲染默认插槽', () => {
        const view = render(FloatButtonGroup, {
            props: { items },
            slots: { default: () => <span data-testid="child" /> } as never,
        });
        expect(view.queryByTestId('child')).toBeNull();
    });

    it('data-* 与 id 落在根 div', () => {
        const view = render(FloatButtonGroup, { attrs: { id: 'group-id', 'data-testid': 'group' }, props: { items } });
        const root = firstChild(view.container);
        expect(root).toHaveAttribute('data-testid', 'group');
        expect(root).toHaveAttribute('id', 'group-id');
    });

    it('读取 app 的全局默认值，显式属性优先', () => {
        const view = render(
            () => (
                <div>
                    <FloatButtonGroup items={items} />
                    <FloatButtonGroup disabled={false} items={items} />
                </div>
            ),
            { global: globalWith({ FloatButtonGroup: { disabled: true } }) }
        );
        const [fromGlobal, explicit] = view.container.querySelectorAll(`.${groupCls}`);
        expect(fromGlobal).toHaveClass(`${groupCls}-disabled`);
        expect(explicit).not.toHaveClass(`${groupCls}-disabled`);
    });

    it('#content 与 #badgeCount 作用域插槽接收 item 与 index', () => {
        const view = render(FloatButtonGroup, {
            props: { items },
            slots: {
                content: ({ item, index }: { item: FloatButtonGroupItem; index: number }) => <b data-testid={`content-${index}`}>{`${item.value}!`}</b>,
                badgeCount: ({ item, index }: { item: FloatButtonGroupItem; index: number }) => <i data-testid="count">{`${index}:${item.value}`}</i>,
            },
        });
        expect(screen.getByTestId('content-0')).toHaveTextContent('editor!');
        expect(screen.getByTestId('content-1')).toHaveTextContent('search!');
        expect(screen.getByRole('button', { name: 'editor!' })).toBeInTheDocument();
        expect(view.container.querySelector('.semi-badge-custom')).toContainElement(screen.getByTestId('count'));
        expect(screen.getByTestId('count')).toHaveTextContent('1:search');
    });

    it('#icon 渲染在项内、content 之前', () => {
        render(FloatButtonGroup, { props: { items }, slots: { icon: iconSlot } });
        const button = screen.getByRole('button', { name: 'Editor' });
        expect(button.firstElementChild).toBe(screen.getByTestId('icon-editor'));
        expect(button).toHaveTextContent(/^Editor$/);
    });

    it('items 追加、删除与禁用后 DOM 同步', async () => {
        const view = render(DynamicGroup);
        const itemsOf = () => [...view.container.querySelectorAll<HTMLElement>(`.${groupCls}-item`)];
        expect(itemsOf().map((node) => node.dataset.value)).toEqual(['editor']);

        await fireEvent.click(view.getByRole('button', { name: 'add' }));
        expect(itemsOf().map((node) => node.dataset.value)).toEqual(['editor', 'search']);
        expect(view.container.querySelector('[data-icon="1:search"]')).not.toBeNull();

        await fireEvent.click(view.getByRole('button', { name: 'disable' }));
        expect(itemsOf()[0]).toBeDisabled();
        expect(itemsOf()[1]).not.toBeDisabled();

        await fireEvent.click(view.getByRole('button', { name: 'remove' }));
        expect(itemsOf().map((node) => node.dataset.value)).toEqual(['search']);
        expect(itemsOf()[0]).not.toBeDisabled();
        expect(view.container.querySelector('[data-icon="0:search"]')).not.toBeNull();
    });

    it('类型：click 载荷为 value 与 MouseEvent', () => {
        expectTypeOf<FloatButtonGroupEmits['click']>().toEqualTypeOf<[value: string | undefined, event: MouseEvent]>();
    });
});
