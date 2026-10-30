import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal, { SemiGlobal } from '../../_utils/semi-global';
import type { BannerProps, BannerType } from '../interface';
import BannerFixture from './banner-fixture.svelte';
import BannerGlobal from './banner-global.svelte';
import BannerLocale from './banner-locale.svelte';

type Part = 'default' | 'custom' | 'none';
interface Store {
    props: BannerProps;
    titleSnippet?: boolean;
    description?: boolean;
    extra?: boolean;
    icon?: Part;
    closeIcon?: Part;
    neighbors?: boolean;
}

const prefix = 'semi-banner';
const closeButton = () => screen.getByRole('button', { name: zh_CN.Banner.close });

function setup(store: Store = { props: {} }) {
    const state = createStore(store);
    const view = render(BannerFixture, { props: { store: state } });
    return { store: state, view, root: () => view.container.querySelector<HTMLElement>(`.${prefix}`) };
}

describe('Svelte Banner', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('关闭按钮持焦时关闭，焦点交给文档顺序里的下一个可聚焦元素', async () => {
        setup({ props: { title: 't' }, neighbors: true });
        const button = closeButton();
        button.focus();
        await fireEvent.click(button);
        await tick();
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('不同 type 的 Banner', () => {
        const { store, root } = setup();
        expect(root()).toHaveClass(`${prefix}-info`);
        for (const type of ['danger', 'success', 'warning', 'info'] as const) {
            store.props.type = type;
            flushSync();
            expect(root()).toHaveClass(`${prefix}-${type}`);
        }
    });

    it('class 与 style 落在根元素', () => {
        const { view, root } = setup({ props: { class: 'test', style: 'color: red' } });
        expect(view.container.querySelector('div.test')).toBe(root());
        expect(root()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('点击关闭按钮调用 onClose，之后根元素消失', async () => {
        const onClose = vi.fn<(event: MouseEvent) => void>();
        const { root } = setup({ props: { onClose } });
        const button = closeButton();
        await fireEvent.click(button);
        expect(onClose).toHaveBeenCalledTimes(1);
        const [event] = onClose.mock.calls[0] as [MouseEvent];
        expect(event.type).toBe('click');
        expect(event.target).toBe(button);
        expect(root()).toBeNull();
    });

    it('onClose 返回之前根元素仍在，返回之后才消失', async () => {
        let presentInCallback = false;
        const { root } = setup({
            props: {
                onClose: () => {
                    presentInCallback = document.querySelector(`.${prefix}`) !== null;
                },
            },
        });
        await fireEvent.click(closeButton());
        expect(presentInCallback).toBe(true);
        expect(root()).toBeNull();
    });

    it('根元素为 alert，每种 type 在 icon 区域显示带名称的默认图标', () => {
        const { store, view, root } = setup();
        for (const type of ['info', 'success', 'danger', 'warning'] as const satisfies BannerType[]) {
            store.props.type = type;
            flushSync();
            expect(screen.getByRole('alert')).toBe(root());
            const slot = view.container.querySelector('[x-semi-prop="icon"]');
            expect(slot).toHaveClass(`${prefix}-icon`);
            expect(slot?.parentElement).toHaveClass(`${prefix}-content`);
            const icon = screen.getByRole('img', { name: zh_CN.Banner[type] });
            expect(slot).toContainElement(icon);
            expect(icon).toHaveClass('semi-icon-large');
        }
    });

    it('fullMode 与 bordered 类名', () => {
        const { store, root } = setup({ props: { bordered: true } });
        expect(root()).toHaveClass(`${prefix}-full`);
        expect(root()).not.toHaveClass(`${prefix}-in-container`, `${prefix}-bordered`);

        store.props.bordered = false;
        store.props.fullMode = false;
        flushSync();
        expect(root()).toHaveClass(`${prefix}-in-container`);
        expect(root()).not.toHaveClass(`${prefix}-full`, `${prefix}-bordered`);

        store.props.bordered = true;
        flushSync();
        expect(root()).toHaveClass(`${prefix}-in-container`, `${prefix}-bordered`);
    });

    it('title、description 与 children 组成的结构', () => {
        const { view, root } = setup({ props: {}, titleSnippet: true, description: true, extra: true });
        const rootEl = root() as HTMLElement;
        expect(rootEl.children).toHaveLength(2);
        expect(rootEl.firstElementChild).toHaveClass(`${prefix}-content-wrapper`);
        const body = view.container.querySelector(`.${prefix}-content-body`) as HTMLElement;
        const title = view.container.querySelector('[x-semi-prop="title"]') as HTMLElement;
        const description = view.container.querySelector('[x-semi-prop="description"]') as HTMLElement;
        expect(title.tagName).toBe('DIV');
        expect(title).toHaveClass(`${prefix}-title`, 'semi-typography');
        expect(title).toHaveTextContent(/^slotted$/);
        expect(description.tagName).toBe('DIV');
        expect(description).toHaveClass(`${prefix}-description`, 'semi-typography');
        expect(description).toHaveTextContent(/^D$/);
        expect([...body.children]).toEqual([title, description]);
        const extra = view.container.querySelector('[x-semi-prop="children"]');
        expect(extra).toHaveClass(`${prefix}-extra`);
        expect(rootEl.lastElementChild).toBe(extra);
        expect(extra).toHaveTextContent(/^extra$/);
    });

    it('没有内容时 content-body 为空且没有 extra', () => {
        const { view, root } = setup();
        expect(view.container.querySelector(`.${prefix}-content-body`)?.children).toHaveLength(0);
        expect(view.container.querySelector(`.${prefix}-extra`)).toBeNull();
        expect(root()?.children).toHaveLength(1);
    });

    it('title 字符串渲染标题，不成为原生 tooltip', () => {
        const { view, root } = setup({ props: { title: 'plain' } });
        expect(view.container.querySelector('[x-semi-prop="title"]')).toHaveTextContent(/^plain$/);
        expect(root()).not.toHaveAttribute('title');
    });

    it('icon snippet 替换默认图标，null 隐藏图标区域', () => {
        const custom = setup({ props: { type: 'danger' }, icon: 'custom' });
        expect(custom.view.container.querySelector('[x-semi-prop="icon"]')).toContainElement(screen.getByTestId('my-icon'));
        expect(screen.queryByRole('img', { name: zh_CN.Banner.danger })).toBeNull();
        custom.view.unmount();

        const none = setup({ props: { type: 'danger' }, icon: 'none' });
        expect(none.view.container.querySelector(`.${prefix}-icon`)).toBeNull();
        expect(screen.queryByRole('img', { name: zh_CN.Banner.danger })).toBeNull();
    });

    it('默认关闭按钮：可访问名称与默认图标', () => {
        const { view } = setup();
        const button = closeButton();
        expect(button).toHaveClass(`${prefix}-close`);
        expect(button.parentElement).toBe(view.container.querySelector(`.${prefix}-content-wrapper`));
        const icon = button.querySelector('[x-semi-prop="closeIcon"]');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(icon).toHaveClass('semi-icon-close');
    });

    it('closeIcon snippet 替换按钮内的图标，null 移除按钮', () => {
        const custom = setup({ props: {}, closeIcon: 'custom' });
        expect(closeButton()).toContainElement(screen.getByTestId('my-close'));
        expect(closeButton().querySelector('[x-semi-prop="closeIcon"]')).toBeNull();
        custom.view.unmount();

        const none = setup({ props: {}, closeIcon: 'none' });
        expect(screen.queryByRole('button')).toBeNull();
        expect(none.view.container.querySelector(`.${prefix}-close`)).toBeNull();
    });

    it('关闭时点击不冒泡到祖先元素，重渲染后保持关闭', async () => {
        const onBodyClick = vi.fn<() => void>();
        document.body.addEventListener('click', onBodyClick);
        try {
            const { store, root } = setup();
            await fireEvent.click(closeButton());
            expect(onBodyClick).not.toHaveBeenCalled();
            expect(root()).toBeNull();

            store.props.title = 'again';
            flushSync();
            expect(root()).toBeNull();
        } finally {
            document.body.removeEventListener('click', onBodyClick);
        }
    });

    it('卸载后再挂载，关闭状态复位', async () => {
        const first = setup();
        await fireEvent.click(closeButton());
        expect(first.root()).toBeNull();
        first.view.unmount();

        const second = setup();
        expect(second.root()).not.toBeNull();
    });

    it('没有 onClose 也能关闭', async () => {
        const { root } = setup();
        await fireEvent.click(closeButton());
        expect(root()).toBeNull();
    });

    it('data-* 属性落在根元素', () => {
        const { root } = setup({ props: { 'data-foo': 'bar', 'data-testid': 'b' } as BannerProps });
        expect(screen.getByTestId('b')).toBe(root());
        expect(root()).toHaveAttribute('data-foo', 'bar');
    });

    it('未声明的属性落在根元素，role 固定为 alert', () => {
        const onmouseenter = vi.fn<() => void>();
        const { root } = setup({ props: { id: 'b', 'aria-live': 'polite', role: 'status', onmouseenter } as BannerProps });
        const rootEl = root() as HTMLElement;
        expect(rootEl).toHaveAttribute('id', 'b');
        expect(rootEl).toHaveAttribute('aria-live', 'polite');
        expect(rootEl).toHaveAttribute('role', 'alert');
        rootEl.dispatchEvent(new MouseEvent('mouseenter'));
        expect(onmouseenter).toHaveBeenCalledTimes(1);
    });

    it('读取 app 的全局默认值，显式属性优先', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Banner: { type: 'danger', fullMode: false, bordered: true } };
        const view = render(BannerGlobal, { props: { semi } });
        const [fromGlobal, explicit] = view.container.querySelectorAll(`.${prefix}`);
        expect(fromGlobal).toHaveClass(`${prefix}-danger`, `${prefix}-in-container`, `${prefix}-bordered`);
        expect(explicit).toHaveClass(`${prefix}-success`, `${prefix}-full`);
    });

    it('关闭按钮和图标名称跟随语言包', () => {
        const zh = setup();
        expect(closeButton()).toBeInTheDocument();
        zh.view.unmount();

        render(BannerLocale, { props: { locale: en_US } });
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: en_US.Banner.success })).toBeInTheDocument();
    });

    it('onClose 的参数类型是原生 MouseEvent', () => {
        expectTypeOf<NonNullable<BannerProps['onClose']>>().parameters.toEqualTypeOf<[event: MouseEvent]>();
    });
});
