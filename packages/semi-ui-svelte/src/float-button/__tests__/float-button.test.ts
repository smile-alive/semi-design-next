import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal, { SemiGlobal } from '../../_utils/semi-global';
import type { FloatButtonGroupItem, FloatButtonGroupProps, FloatButtonProps } from '../interface';
import DynamicGroup from './dynamic-group.svelte';
import FloatButtonFixture from './float-button-fixture.svelte';
import GroupFixture from './float-button-group-fixture.svelte';
import GlobalContext from './global-context.svelte';
import Prevent from './prevent.svelte';

const prefixCls = 'semi-floatButton';
const groupCls = 'semi-floatButtonGroup';

const items: FloatButtonGroupItem[] = [
    { content: 'Editor', value: 'editor' },
    { content: 'Search', value: 'search', badge: { count: 5 } },
];
const firstChild = (container: Element) => container.firstElementChild as HTMLElement;

function setup(props: FloatButtonProps = {}, flags: { icon?: boolean; badgeCount?: boolean } = {}) {
    const store = createStore<{ props: FloatButtonProps; icon?: boolean; badgeCount?: boolean }>({ props, ...flags });
    const view = render(FloatButtonFixture, { props: { store } });
    return { store, container: view.container };
}

function setupGroup(props: FloatButtonGroupProps, flags: { icon?: boolean; content?: boolean; badgeCount?: boolean } = {}) {
    const store = createStore<{ props: FloatButtonGroupProps; icon?: boolean; content?: boolean; badgeCount?: boolean }>({ props, ...flags });
    const view = render(GroupFixture, { props: { store } });
    return { store, container: view.container };
}

// Runs after the component's own listener; it also stops jsdom from navigating.
async function clickAndObservePrevented(target: Element) {
    let prevented: boolean | undefined;
    const listener = (event: Event) => {
        prevented = event.defaultPrevented;
        event.preventDefault();
    };
    document.addEventListener('click', listener);
    try {
        await fireEvent.click(target);
    } finally {
        document.removeEventListener('click', listener);
    }
    return prevented;
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte FloatButton', () => {
    it('默认在根元素与 body 上渲染 round 与 default 尺寸类名', () => {
        const { container } = setup({}, { icon: true });
        const root = firstChild(container);
        expect(root).toHaveClass(prefixCls, `${prefixCls}-round`, `${prefixCls}-default`);
        const body = root.querySelector(`.${prefixCls}-body`);
        expect(body).toHaveClass(`${prefixCls}-round`, `${prefixCls}-default`);
        expect(body).not.toHaveClass(`${prefixCls}-colorful`);
        expect(body).not.toHaveClass(`${prefixCls}-disabled`);
        expect(body?.querySelector('[data-testid="icon"]')).not.toBeNull();
    });

    it('应用 shape、size、colorful 与 disabled 类名', () => {
        const { container } = setup({ disabled: true, colorful: true, shape: 'square', size: 'large' });
        const root = firstChild(container);
        expect(root).toHaveClass(`${prefixCls}-square`, `${prefixCls}-large`);
        expect(root).not.toHaveClass(`${prefixCls}-round`);
        expect(root.querySelector(`.${prefixCls}-body`)).toHaveClass(`${prefixCls}-square`, `${prefixCls}-large`, `${prefixCls}-colorful`, `${prefixCls}-disabled`);
    });

    it('class 与 style 作用于根元素', () => {
        const { container } = setup({ class: 'custom', style: 'bottom: 20px' });
        const root = firstChild(container);
        expect(root).toHaveClass(prefixCls, 'custom');
        expect(root).toHaveStyle({ bottom: '20px' });
    });

    it('设置 badge 时用 Badge 包裹 body', () => {
        const count = setup({ badge: { count: 1000, overflowCount: 999 } }).container;
        const dot = setup({ badge: { dot: true, type: 'danger' } }).container;
        const plain = setup().container;
        const countBadge = count.querySelector('.semi-badge');
        expect(countBadge?.querySelector(`.${prefixCls}-body`)).not.toBeNull();
        expect(countBadge?.querySelector('.semi-badge-count')).toHaveTextContent('999+');
        expect(dot.querySelector('.semi-badge-dot')).toHaveClass('semi-badge-danger');
        expect(plain.querySelector('.semi-badge')).toBeNull();
        expect(plain.querySelector(`.${prefixCls}`)?.firstElementChild).toHaveClass(`${prefixCls}-body`);
    });

    it('badgeCount snippet 渲染到 Badge 的计数位置', () => {
        const { container } = setup({ badge: {} }, { badgeCount: true });
        expect(container.querySelector('.semi-badge-custom')).toContainElement(screen.getByTestId('count'));
        expect(container.querySelector(`.${prefixCls}-body`)?.parentElement).toHaveClass('semi-badge');
    });

    it('点击调用 onclick，参数是原生 MouseEvent', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const { container } = setup({ onclick });
        await fireEvent.click(container.querySelector(`.${prefixCls}-body`) as Element);
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(onclick.mock.calls[0][0].type).toBe('click');
    });

    it('无 href 时渲染 type 为 button 的原生按钮', () => {
        setup({ 'aria-label': 'Edit' }, { icon: true });
        const root = screen.getByRole('button', { name: 'Edit' });
        expect(root.tagName).toBe('BUTTON');
        expect(root).toHaveAttribute('type', 'button');
        expect(root).not.toBeDisabled();
        expect(root).not.toHaveAttribute('aria-disabled');
        expect(root.querySelector(`.${prefixCls}-body`)?.tagName).toBe('SPAN');
    });

    it('渲染带 href、target 与 rel 的原生链接', () => {
        setup({ 'aria-label': 'Semi', href: 'https://semi.design', rel: 'noreferrer', target: '_blank' });
        const link = screen.getByRole('link', { name: 'Semi' });
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', 'https://semi.design');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noreferrer');
        expect(link).not.toHaveAttribute('type');
    });

    it('链接上调用 onclick，且不阻止原生跳转', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        setup({ 'aria-label': 'Anchor', href: '#float-button', onclick });
        const prevented = await clickAndObservePrevented(screen.getByRole('link', { name: 'Anchor' }));
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(prevented).toBe(false);
    });

    it('onclick 里 preventDefault 阻止链接跳转', async () => {
        const view = render(Prevent);
        const prevented = await clickAndObservePrevented(screen.getByRole('link', { name: 'Anchor' }));
        expect(view.getByLabelText('clicks')).toHaveTextContent('1');
        expect(prevented).toBe(true);
    });

    it('原生禁用按钮，不调用 onclick，内部元素冒泡的点击也不调用', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const { container } = setup({ 'aria-label': 'Edit', disabled: true, onclick });
        const root = screen.getByRole('button', { name: 'Edit' });
        expect(root).toBeDisabled();
        expect(root).toHaveAttribute('aria-disabled', 'true');
        await fireEvent.click(container.querySelector(`.${prefixCls}-body`) as Element);
        expect(onclick).not.toHaveBeenCalled();
    });

    it('禁用链接变为不可跳转的链接，带 aria-disabled，不调用 onclick', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        setup({ 'aria-label': 'Semi', disabled: true, href: 'https://semi.design', target: '_blank', onclick });
        const link = screen.getByRole('link', { name: 'Semi' });
        expect(link.tagName).toBe('A');
        expect(link).not.toHaveAttribute('href');
        expect(link).not.toHaveAttribute('target');
        expect(link).toHaveAttribute('aria-disabled', 'true');
        expect(link).not.toHaveAttribute('tabindex');
        await fireEvent.click(link);
        expect(onclick).not.toHaveBeenCalled();
    });

    it('type、aria-disabled 等属性不能破坏按钮语义', () => {
        setup({ 'aria-label': 'Edit', ...({ type: 'submit' } as object), 'aria-disabled': 'false' });
        expect(screen.getByRole('button', { name: 'Edit' })).toHaveAttribute('type', 'button');

        setup({ 'aria-label': 'Off', 'aria-disabled': 'false', disabled: true });
        expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-disabled', 'true');
    });

    it('链接丢弃 type 属性', () => {
        setup({ 'aria-label': 'Semi', ...({ type: 'submit' } as object), href: '#top' });
        expect(screen.getByRole('link', { name: 'Semi' })).not.toHaveAttribute('type');
    });

    it('data-*、id 与 aria-label 落在根元素', () => {
        const { container } = setup({ id: 'fb-id', 'data-testid': 'fb', 'aria-label': 'Edit' });
        const root = firstChild(container);
        expect(root).toHaveAttribute('data-testid', 'fb');
        expect(root).toHaveAttribute('id', 'fb-id');
        expect(root).toHaveAttribute('aria-label', 'Edit');
        expect(root).not.toHaveAttribute('href');
        expect(root).not.toHaveAttribute('target');
    });

    it('读取全局默认值，显式属性优先，undefined 视为未设置', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { FloatButton: { shape: 'square', size: 'small' }, FloatButtonGroup: { disabled: true } };
        const scoped = render(GlobalContext, { props: { semi } });
        const [fromGlobal, explicit, undefinedShape] = scoped.container.querySelectorAll(`.${prefixCls}`);
        expect(fromGlobal).toHaveClass(`${prefixCls}-square`, `${prefixCls}-small`);
        expect(explicit).toHaveClass(`${prefixCls}-round`, `${prefixCls}-small`);
        expect(undefinedShape).toHaveClass(`${prefixCls}-square`);
        const [groupFromGlobal, groupExplicit] = scoped.container.querySelectorAll(`.${groupCls}`);
        expect(groupFromGlobal).toHaveClass(`${groupCls}-disabled`);
        expect(groupExplicit).not.toHaveClass(`${groupCls}-disabled`);
    });

    it('模块单例的全局默认值在没有 context 时生效', () => {
        semiGlobal.config.overrideDefaultProps = { FloatButton: { shape: 'square' } };
        const { container } = setup();
        expect(firstChild(container)).toHaveClass(`${prefixCls}-square`);
    });

    it('disabled 由使用方切换，没有本地状态', async () => {
        const { store } = setup({ 'aria-label': 'Edit' });
        const root = screen.getByRole('button', { name: 'Edit' });
        await fireEvent.click(root);
        expect(root).not.toBeDisabled();
        store.props.disabled = true;
        flushSync();
        expect(root).toBeDisabled();
        store.props.disabled = false;
        flushSync();
        expect(root).not.toBeDisabled();
    });
});

describe('Svelte FloatButtonGroup', () => {
    it('每个条目渲染一项，包含 value、icon 与 content', () => {
        const { container } = setupGroup({ items }, { icon: true });
        const root = firstChild(container);
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
        const { container } = setupGroup({ items });
        const badges = container.querySelectorAll('.semi-badge');
        expect(badges).toHaveLength(1);
        expect(badges[0].parentElement).toHaveClass(groupCls);
        expect(badges[0].querySelector(`.${groupCls}-item`)).toHaveAttribute('data-value', 'search');
        expect(badges[0].querySelector('.semi-badge-count')).toHaveTextContent('5');
    });

    it('class、style 与 disabled 类名', () => {
        const { container } = setupGroup({ class: 'custom', style: 'bottom: 50px', disabled: true, items });
        const root = firstChild(container);
        expect(root).toHaveClass(groupCls, 'custom', `${groupCls}-disabled`);
        expect(root).toHaveStyle({ bottom: '50px' });
    });

    it('点击调用 onClick，参数是被点击项的 value 与事件', async () => {
        const onClick = vi.fn<(value: string | undefined, event: MouseEvent) => void>();
        const { container } = setupGroup({ items, onClick });
        await fireEvent.click(container.querySelector('[data-value="search"]') as Element);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith('search', expect.any(MouseEvent));
    });

    it('点击落在项内部元素上时，上报该项的 value', async () => {
        const onClick = vi.fn<(value: string | undefined, event: MouseEvent) => void>();
        setupGroup({ items, onClick }, { icon: true });
        await fireEvent.click(screen.getByTestId('icon-editor'));
        expect(onClick.mock.calls.map(([value]) => value)).toEqual(['editor']);
    });

    it('没有 value 的项上报 undefined', async () => {
        const onClick = vi.fn<(value: string | undefined, event: MouseEvent) => void>();
        setupGroup({ items: [{ content: 'Plain' }], onClick });
        await fireEvent.click(screen.getByRole('button', { name: 'Plain' }));
        expect(onClick).toHaveBeenCalledWith(undefined, expect.any(MouseEvent));
    });

    it('忽略项以外的点击', async () => {
        const onClick = vi.fn<(value: string | undefined, event: MouseEvent) => void>();
        const { container } = setupGroup({ items, onClick });
        await fireEvent.click(firstChild(container));
        await fireEvent.click(container.querySelector('.semi-badge-count') as Element);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('每项渲染为以 content 命名的原生按钮', () => {
        setupGroup({ items });
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
        const onClick = vi.fn<(value: string | undefined, event: MouseEvent) => void>();
        setupGroup({
            disabled: true,
            items: [...items, { content: 'Docs', value: 'docs', href: '#docs', onClick: itemClick }],
            onClick,
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
        expect(onClick).not.toHaveBeenCalled();
        expect(itemClick).not.toHaveBeenCalled();
    });

    it('每项处理 href、disabled、onClick、shape、size、class、style 与 aria-label', async () => {
        const editorClick = vi.fn<(event: MouseEvent) => void>();
        const searchClick = vi.fn<(event: MouseEvent) => void>();
        const onClick = vi.fn<(value: string | undefined, event: MouseEvent) => void>();
        setupGroup({
            onClick,
            items: [
                {
                    'aria-label': 'Editor',
                    value: 'editor',
                    onClick: editorClick,
                    shape: 'square',
                    size: 'large',
                    colorful: true,
                    class: 'item-custom',
                    style: 'color: red',
                },
                { content: 'Search', value: 'search', disabled: true, onClick: searchClick },
                { content: 'Docs', value: 'docs', href: 'https://semi.design', target: '_blank', rel: 'noopener' },
            ],
        });
        const editor = screen.getByRole('button', { name: 'Editor' });
        expect(editor).toHaveClass(`${groupCls}-item`, `${prefixCls}-square`, `${prefixCls}-large`, `${prefixCls}-colorful`, 'item-custom');
        expect(editor).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        await fireEvent.click(editor);
        expect(editorClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toBe('editor');
        expect(onClick.mock.calls[0][1]).toBe(editorClick.mock.calls[0][0]);

        const search = screen.getByRole('button', { name: 'Search' });
        expect(search).toBeDisabled();
        expect(search).not.toHaveClass(`${prefixCls}-square`, `${prefixCls}-colorful`);
        await fireEvent.click(search);
        expect(searchClick).not.toHaveBeenCalled();
        expect(onClick).toHaveBeenCalledTimes(1);

        const docs = screen.getByRole('link', { name: 'Docs' });
        expect(docs).toHaveClass(`${groupCls}-item`);
        expect(docs).toHaveAttribute('href', 'https://semi.design');
        expect(docs).toHaveAttribute('target', '_blank');
        expect(docs).toHaveAttribute('rel', 'noopener');
        expect(docs).toHaveAttribute('data-value', 'docs');
    });

    it('item 的 onClick 先于 group 的 onClick 调用', async () => {
        const order: string[] = [];
        setupGroup({
            items: [{ content: 'Editor', value: 'editor', onClick: () => order.push('item') }],
            onClick: () => order.push('group'),
        });
        await fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
        expect(order).toEqual(['item', 'group']);
    });

    it('item 的 id、title 与 data-* 落在项的元素上', () => {
        setupGroup({ items: [{ content: 'Editor', id: 'ed', title: 'Open editor', 'data-extra': 'x' }] });
        const button = screen.getByRole('button', { name: 'Editor' });
        expect(button).toHaveAttribute('id', 'ed');
        expect(button).toHaveAttribute('title', 'Open editor');
        expect(button).toHaveAttribute('data-extra', 'x');
    });

    it('分组可通过 aria-label 命名，role 固定为 group', () => {
        setupGroup({ 'aria-label': 'Quick actions', items });
        expect(screen.getByRole('group', { name: 'Quick actions' })).toHaveClass(groupCls);
    });

    it('data-* 与 id 落在根 div', () => {
        const { container } = setupGroup({ id: 'group-id', 'data-testid': 'group', items });
        const root = firstChild(container);
        expect(root).toHaveAttribute('data-testid', 'group');
        expect(root).toHaveAttribute('id', 'group-id');
    });

    it('content 与 badgeCount snippet 接收 item 与 index', () => {
        const { container } = setupGroup({ items }, { content: true, badgeCount: true });
        expect(screen.getByTestId('content-0')).toHaveTextContent('editor!');
        expect(screen.getByTestId('content-1')).toHaveTextContent('search!');
        expect(screen.getByRole('button', { name: 'editor!' })).toBeInTheDocument();
        expect(container.querySelector('.semi-badge-custom')).toContainElement(screen.getByTestId('count'));
        expect(screen.getByTestId('count')).toHaveTextContent('1:search');
    });

    it('icon 渲染在项内、content 之前', () => {
        setupGroup({ items }, { icon: true });
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
});
