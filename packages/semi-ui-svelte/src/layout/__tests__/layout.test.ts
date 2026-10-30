import { flushSync } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { mockMatchMediaCore } from '@test/utils/dom/match-media-core';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { LayoutProps } from '../interface';
import Sider from '../sider.svelte';
import LayoutFixture from './layout-fixture.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-layout`;
const hasSiderCls = `${prefixCls}-has-sider`;
const media = { xs: '(max-width: 575px)', md: '(min-width: 768px)', lg: '(min-width: 992px)' };

function setup(props: LayoutProps = {}, sider: 'direct' | 'deep' | 'nested' | 'none' = 'none', parts = false) {
    const store = createStore({ props, sider, parts });
    const view = render(LayoutFixture, { props: { store } });
    const root = () => view.container.firstElementChild as HTMLElement;
    return { store, view, root };
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
    vi.unstubAllGlobals();
});

describe('Svelte Layout', () => {
    it('各部分拥有各自的类名与默认标签', () => {
        const { root } = setup({}, 'none', true);
        expect(root().tagName).toBe('SECTION');
        expect(root()).toHaveClass(prefixCls);
        expect(root()).not.toHaveClass(hasSiderCls);
        expect(root().querySelector('header')).toHaveClass(`${prefixCls}-header`);
        expect(root().querySelector('main')).toHaveClass(`${prefixCls}-content`);
        expect(root().querySelector('footer')).toHaveClass(`${prefixCls}-footer`);
        expect(root().textContent?.replace(/\s/g, '')).toBe('hcf');
    });

    it('Sider 渲染 aside 并包裹子内容', () => {
        const { root } = setup({}, 'direct');
        const aside = root().querySelector('aside') as HTMLElement;
        expect(aside).toHaveClass(`${prefixCls}-sider`);
        expect(aside.firstElementChild).toHaveClass(`${prefixCls}-sider-children`);
    });

    it('自定义 class 与 style 落在根元素', () => {
        const { root } = setup({ class: 'test', style: 'color: red' });
        expect(root()).toHaveClass('test', prefixCls);
        expect(root()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('带 sider 的 layout 加 has-sider 类', async () => {
        const { root } = setup({}, 'direct');
        await Promise.resolve();
        expect(root()).toHaveClass(hasSiderCls);
    });

    it('tagName 与 prefixCls 可替换默认值', () => {
        const { root, store } = setup({ prefixCls: 'my', tagName: 'div' });
        expect(root().tagName).toBe('DIV');
        expect(root()).toHaveClass('my');
        expect(root()).not.toHaveClass(prefixCls);
        store.props.tagName = 'article';
        flushSync();
        expect(root().tagName).toBe('ARTICLE');
    });

    it('hasSider 只强制添加类名：为 false 时，Sider 仍使 has-sider 保留', async () => {
        const { root, store } = setup({ hasSider: true });
        expect(root()).toHaveClass(hasSiderCls);
        store.props.hasSider = false;
        flushSync();
        expect(root()).not.toHaveClass(hasSiderCls);
        const withSider = setup({ hasSider: false }, 'direct');
        await Promise.resolve();
        expect(withSider.root()).toHaveClass(hasSiderCls);
    });

    it('Sider 嵌套较深时 layout 被标记；Sider 卸载时取消标记', async () => {
        const { root, store } = setup({}, 'deep');
        await Promise.resolve();
        expect(root()).toHaveClass(hasSiderCls);
        store.sider = 'none';
        flushSync();
        expect(root()).not.toHaveClass(hasSiderCls);
        store.sider = 'deep';
        flushSync();
        await Promise.resolve();
        expect(root()).toHaveClass(hasSiderCls);
    });

    it('反复挂载与卸载 Sider 后不留下标记', async () => {
        const { root, store } = setup({}, 'none');
        for (let i = 0; i < 5; i++) {
            store.sider = 'deep';
            flushSync();
            store.sider = 'none';
            flushSync();
        }
        await Promise.resolve();
        expect(root()).not.toHaveClass(hasSiderCls);
    });

    it('Sider 只注册到最近的 Layout', async () => {
        const { root } = setup({}, 'nested');
        await Promise.resolve();
        expect(root()).not.toHaveClass(hasSiderCls);
        expect(root().firstElementChild).toHaveClass(hasSiderCls);
    });

    it('Sider 单独使用时不报错', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const view = render(Sider);
        expect(view.container.querySelector('aside')).not.toBeNull();
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('aria-*、role、data-* 透传到各部分的根元素', () => {
        const { view } = setup({ id: 'root', 'aria-label': 'app' } as LayoutProps, 'none', true);
        expect(view.container.firstElementChild).toHaveAttribute('aria-label', 'app');
        expect(view.container.firstElementChild).toHaveAttribute('id', 'root');
        expect(view.getByTestId('header')).toHaveAttribute('role', 'toolbar');
        expect(view.getByTestId('content')).toBeInTheDocument();
    });

    it('role、id、监听器透传到 sider 的 aside', async () => {
        const onclick = vi.fn<() => void>();
        const view = render(Sider, { props: { id: 'side', 'data-testid': 'sider', role: 'menu', title: 't', onclick } as never });
        const aside = view.getByTestId('sider');
        expect(aside.tagName).toBe('ASIDE');
        expect(aside).toHaveAttribute('role', 'menu');
        expect(aside).toHaveAttribute('id', 'side');
        expect(aside).not.toHaveAttribute('breakpoint');
        await fireEvent.click(aside);
        expect(onclick).toHaveBeenCalledTimes(1);
    });

    it('读取 Layout 的全局默认值，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Layout: { tagName: 'div' } };
        const { root, store } = setup({}, 'none', true);
        expect(root().tagName).toBe('DIV');
        expect(root().querySelector('header')).not.toBeNull();
        store.props.tagName = 'article';
        flushSync();
        expect(root().tagName).toBe('ARTICLE');
    });

    describe('Sider 断点', () => {
        it('挂载时按 xs 到 xxl 的顺序报告各断点，变化时同样报告', () => {
            const mm = mockMatchMediaCore([media.md]);
            const onBreakpoint = vi.fn<(screen: string, matches: boolean) => void>();
            render(Sider, { props: { breakpoint: ['lg', 'xs', 'md'], onBreakpoint } });
            expect(onBreakpoint.mock.calls).toEqual([
                ['xs', false],
                ['md', true],
                ['lg', false],
            ]);
            onBreakpoint.mockClear();
            mm.fire(media.lg, true);
            expect(onBreakpoint.mock.calls).toEqual([['lg', true]]);
        });

        it('卸载时移除 media 监听', () => {
            const mm = mockMatchMediaCore([]);
            const view = render(Sider, { props: { breakpoint: ['xs', 'lg'] } });
            expect(mm.totalHandlers()).toBe(2);
            view.unmount();
            expect(mm.totalHandlers()).toBe(0);
        });

        it('反复挂载与卸载后每个断点只保留一个监听', () => {
            const mm = mockMatchMediaCore([]);
            const first = render(Sider, { props: { breakpoint: ['md'] } });
            first.unmount();
            const second = render(Sider, { props: { breakpoint: ['md'] } });
            expect(mm.handlerCount(media.md)).toBe(1);
            second.unmount();
            expect(mm.handlerCount(media.md)).toBe(0);
        });
    });
});
