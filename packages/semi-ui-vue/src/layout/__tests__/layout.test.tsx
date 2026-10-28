/** @jsxImportSource vue */
import { createSSRApp, nextTick, type Component, type VNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { fireEvent } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { mockMatchMedia, render } from '@test/utils/vue';
import elementType from '../../_base/element-type';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Layout, { LayoutContent, LayoutFooter, LayoutHeader, LayoutSider } from '../index';
import DeepSider from './fixtures/deep-sider.vue';
import DirectSiders from './fixtures/direct-siders.vue';
import Nested from './fixtures/nested.vue';
import Parts from './fixtures/parts.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-layout`;
const hasSiderCls = `${prefixCls}-has-sider`;
const media = { xs: '(max-width: 575px)', md: '(min-width: 768px)', lg: '(min-width: 992px)' };
const breakpointHandler = () => vi.fn<(screen: string, matches: boolean) => void>();

describe('Layout', () => {
    it('显式传入 undefined 的 tagName、type 不覆盖内置值', () => {
        const view = render(() => (
            <>
                <Layout.Header type={undefined} tagName={undefined} />
                <Layout.Footer type={undefined} tagName={undefined} />
                <Layout.Content type={undefined} tagName={undefined} />
            </>
        ));
        expect(Array.from(view.container.children, (el) => `${el.tagName} ${el.className}`)).toEqual([`HEADER ${prefixCls}-header`, `FOOTER ${prefixCls}-footer`, `MAIN ${prefixCls}-content`]);
    });

    it('自定义 class 与 style 的 layout', () => {
        const cases = [
            [Layout, { hasSider: true }, 'section'],
            [Layout.Header, {}, 'header'],
            [Layout.Sider, {}, 'aside'],
            [Layout.Content, {}, 'main'],
            [Layout.Footer, {}, 'footer'],
        ] as const;
        for (const [Part, props, tag] of cases) {
            const view = render(Part, { attrs: { class: 'test', style: 'color: red' }, props });
            const node = view.container.firstChild as HTMLElement;
            expect(node.tagName.toLowerCase()).toBe(tag);
            expect(node).toHaveClass('test');
            expect(node).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            view.unmount();
        }
    });

    it('具名导出与静态成员是同一组件', () => {
        expect(LayoutHeader).toBe(Layout.Header);
        expect(LayoutFooter).toBe(Layout.Footer);
        expect(LayoutContent).toBe(Layout.Content);
        expect(LayoutSider).toBe(Layout.Sider);
    });

    it('带 sider 的 layout', () => {
        const view = render(Layout, { slots: { default: () => <Layout.Sider /> } });
        expect(view.container.querySelector(`section.${hasSiderCls}`)).not.toBeNull();
    });

    it('各部分拥有各自的类名，并包裹 sider 的子元素', () => {
        const view = render(Layout, {
            slots: {
                default: () => (
                    <>
                        <Layout.Header>{() => 'h'}</Layout.Header>
                        <Layout.Content>{() => 'c'}</Layout.Content>
                        <Layout.Footer>{() => 'f'}</Layout.Footer>
                    </>
                ),
            },
        });
        const root = view.container.firstChild as HTMLElement;
        expect(root).toHaveClass(prefixCls);
        expect(root).not.toHaveClass(hasSiderCls);
        expect(root.querySelector('header')).toHaveClass(`${prefixCls}-header`);
        expect(root.querySelector('main')).toHaveClass(`${prefixCls}-content`);
        expect(root.querySelector('footer')).toHaveClass(`${prefixCls}-footer`);
        expect(root.textContent).toBe('hcf');

        const sider = render(Layout.Sider, { slots: { default: () => 'menu' } });
        const aside = sider.container.firstChild as HTMLElement;
        expect(aside).toHaveClass(`${prefixCls}-sider`);
        expect(aside.firstChild).toHaveClass(`${prefixCls}-sider-children`);
        expect(aside.firstChild?.textContent).toBe('menu');
    });

    it('tagName、type 与 prefixCls 可替换默认值', () => {
        const view = render(Layout, {
            props: { prefixCls: 'my', tagName: 'div' },
            slots: {
                default: () => (
                    <>
                        <Layout.Header type="top" tagName="nav" />
                        <Layout.Content prefixCls="x" />
                    </>
                ),
            },
        });
        const root = view.container.firstChild as HTMLElement;
        expect(root.tagName).toBe('DIV');
        expect(root).toHaveClass('my');
        expect(root).not.toHaveClass(prefixCls);
        expect(root.firstElementChild?.tagName).toBe('NAV');
        expect(root.firstElementChild).toHaveClass(`${prefixCls}-top`);
        expect(root.lastElementChild).toHaveClass('x-content');
    });

    it('只强制添加 sider 类名：hasSider 为 false 时，Sider 子元素仍保留该类名', async () => {
        const view = render(Layout, { props: { hasSider: true } });
        expect(view.container.firstChild).toHaveClass(hasSiderCls);
        await view.rerender({ hasSider: false });
        expect(view.container.firstChild).not.toHaveClass(hasSiderCls);
        const withSider = render(Layout, { props: { hasSider: false }, slots: { default: () => <Layout.Sider /> } });
        expect(withSider.container.firstChild).toHaveClass(hasSiderCls);
    });

    it('Sider 嵌套较深时 layout 被标记；Sider 卸载时取消标记', async () => {
        // The Sider registers after mount, so the class lands in the next flush, before the browser paints.
        const view = render(DeepSider, { props: { show: true } });
        await nextTick();
        expect(view.container.firstChild).toHaveClass(hasSiderCls);
        await view.rerender({ show: false });
        expect(view.container.firstChild).not.toHaveClass(hasSiderCls);
        await view.rerender({ show: true });
        await nextTick();
        expect(view.container.firstChild).toHaveClass(hasSiderCls);
    });

    it('反复挂载与卸载 Sider 后不留下标记', async () => {
        const view = render(DeepSider, { props: { show: false } });
        for (let i = 0; i < 5; i++) {
            await view.rerender({ show: true });
            await nextTick();
            await view.rerender({ show: false });
        }
        expect(view.container.firstChild).not.toHaveClass(hasSiderCls);
    });

    it('Sider 只注册到最近的 Layout', async () => {
        const view = render(Nested);
        await nextTick();
        const outer = view.container.firstChild as HTMLElement;
        expect(outer).not.toHaveClass(hasSiderCls);
        expect(outer.firstElementChild).toHaveClass(hasSiderCls);
    });

    it('直接子项的 Sider 经 v-if、v-for、template 展开后仍被识别', async () => {
        const view = render(DirectSiders, { props: { mode: 'none' } });
        expect(view.container.firstChild).not.toHaveClass(hasSiderCls);
        for (const mode of ['v-if', 'v-for', 'template'] as const) {
            const shown = render(DirectSiders, { props: { mode } });
            expect(shown.container.firstChild).toHaveClass(hasSiderCls);
            shown.unmount();
        }
    });

    it('Sider 的 elementType 为 Layout.Sider', () => {
        expect(elementType(<Layout.Sider />)).toBe('Layout.Sider');
        expect(elementType(<Layout.Header />)).toBeUndefined();
    });

    it('Sider 单独使用时不报错', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const view = render(Layout.Sider);
        expect(view.container.querySelector('aside')).not.toBeNull();
        expect(warn).not.toHaveBeenCalled();
    });

    describe('服务端渲染', () => {
        const ssr = (component: Component, props: Record<string, unknown>) => renderToString(createSSRApp(component, props));

        it('直接子项的 Sider 输出 has-sider，嵌套较深的没有，传 hasSider 后有', async () => {
            expect(await ssr(DirectSiders, { mode: 'v-if' })).toContain(hasSiderCls);
            expect(await ssr(DeepSider, { show: true })).not.toContain(hasSiderCls);
            expect(await ssr(Layout, { hasSider: true })).toContain(hasSiderCls);
        });
    });

    it('aria-label、role 与 data-* 透传经过 Layout、Header、Content 与 Footer', () => {
        const view = render(Parts);
        expect(view.getByTestId('layout')).toHaveAttribute('aria-label', 'app');
        expect(view.getByTestId('layout')).toHaveAttribute('id', 'root');
        expect(view.getByTestId('header')).toHaveAttribute('role', 'toolbar');
        expect(view.getByTestId('header')).toHaveAttribute('aria-label', 'top');
        expect(view.getByTestId('content')).toHaveAttribute('aria-label', 'body');
        expect(view.getByTestId('footer')).toHaveAttribute('role', 'note');
    });

    it('aria-label 与 data-* 透传到 sider 的 aside', () => {
        const view = render(Layout.Sider, { attrs: { 'data-testid': 'sider', 'aria-label': 'nav' } });
        const aside = view.getByTestId('sider');
        expect(aside.tagName).toBe('ASIDE');
        expect(aside).toHaveAttribute('aria-label', 'nav');
        expect(aside).not.toHaveAttribute('breakpoint');
    });

    describe('Sider 断点', () => {
        it('挂载时按 xs 到 xxl 的顺序报告各断点，变化时同样报告', async () => {
            const mm = mockMatchMedia([media.md]);
            const onBreakpoint = breakpointHandler();
            render(Layout.Sider, { props: { breakpoint: ['lg', 'xs', 'md'], onBreakpoint } });
            expect(onBreakpoint.mock.calls).toEqual([
                ['xs', false],
                ['md', true],
                ['lg', false],
            ]);
            onBreakpoint.mockClear();
            await mm.fire(media.lg, true);
            expect(onBreakpoint.mock.calls).toEqual([['lg', true]]);
        });

        it('挂载时只读取一次断点，并调用最新的监听', async () => {
            const mm = mockMatchMedia([]);
            const first = breakpointHandler();
            const second = breakpointHandler();
            const view = render(Layout.Sider, { props: { breakpoint: ['md'], onBreakpoint: first } });
            expect(first).toHaveBeenCalledTimes(1);
            await view.rerender({ breakpoint: ['md', 'lg'], onBreakpoint: second });
            expect(window.matchMedia).toHaveBeenCalledTimes(1);
            expect(second).not.toHaveBeenCalled();
            await mm.fire(media.md, true);
            expect(first).toHaveBeenCalledTimes(1);
            expect(second.mock.calls).toEqual([['md', true]]);
        });

        it('卸载时移除 media 监听', async () => {
            const mm = mockMatchMedia([]);
            const onBreakpoint = breakpointHandler();
            const view = render(Layout.Sider, { props: { breakpoint: ['xs', 'lg'], onBreakpoint } });
            view.unmount();
            const lists = Object.values(mm.lists).flat();
            expect(lists).toHaveLength(2);
            lists.forEach((list) => expect(list.handlers).toHaveLength(0));
            await mm.fire(media.lg, true);
            expect(onBreakpoint).toHaveBeenCalledTimes(2);
        });

        it('反复挂载与卸载后每个断点只保留一个监听', () => {
            const mm = mockMatchMedia([]);
            const first = render(Layout.Sider, { props: { breakpoint: ['md'] } });
            first.unmount();
            const second = render(Layout.Sider, { props: { breakpoint: ['md'] } });
            expect(mm.handlerCount(media.md)).toBe(1);
            second.unmount();
            expect(mm.handlerCount(media.md)).toBe(0);
        });
    });

    it('各部分的组件 ref 的 $el 指向各自的根元素', () => {
        const instances: Array<{ $el: Element } | undefined> = [];
        const capture = (index: number) => (value: unknown) => {
            instances[index] = value as { $el: Element };
        };
        render(() => (
            <Layout ref={capture(0)}>
                {() => (
                    <>
                        <Layout.Header ref={capture(1)} />
                        <Layout.Sider ref={capture(2)} />
                        <Layout.Content ref={capture(3)} />
                        <Layout.Footer ref={capture(4)} />
                    </>
                )}
            </Layout>
        ));
        expect(instances.map((instance) => instance?.$el.tagName)).toEqual(['SECTION', 'HEADER', 'ASIDE', 'MAIN', 'FOOTER']);
    });

    it('role、id 与其他未知属性透传到 sider 的 aside', async () => {
        const onClick = vi.fn<() => void>();
        const view = render(Layout.Sider, {
            attrs: { id: 'side', 'data-testid': 'sider', role: 'menu', title: 't', onClick },
        });
        const aside = view.getByTestId('sider');
        expect(aside).toHaveAttribute('role', 'menu');
        expect(aside).toHaveAttribute('id', 'side');
        expect(aside).toHaveAttribute('title', 't');
        await fireEvent.click(aside);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('默认插槽最多求值两次', () => {
        const slot = vi.fn<() => VNode>(() => <Layout.Content />);
        render(Layout, { slots: { default: slot } });
        expect(slot.mock.calls.length).toBeLessThanOrEqual(2);
    });

    it('应用把 LayoutHeader 等注册为别名 Header 时不自递归', () => {
        const components = { Content: LayoutContent, Footer: LayoutFooter, Header: LayoutHeader, Section: Layout };
        const view = render(Layout, {
            global: { components },
            slots: {
                default: () => (
                    <>
                        <LayoutHeader />
                        <LayoutContent />
                        <LayoutFooter />
                    </>
                ),
            },
        });
        expect(Array.from(view.container.querySelectorAll('section > *'), (el) => el.tagName)).toEqual(['HEADER', 'MAIN', 'FOOTER']);
    });

    it('只为 Layout 读取 app 的全局默认值，显式属性优先', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Layout: { tagName: 'div' } };
        const global = { provide: { [semiGlobalKey]: semi } };
        const view = render(Layout, { global, slots: { default: () => <Layout.Header /> } });
        const root = () => view.container.firstChild as HTMLElement;
        expect(root().tagName).toBe('DIV');
        expect(root().firstElementChild?.tagName).toBe('HEADER');
        await view.rerender({ tagName: 'article' });
        expect(root().tagName).toBe('ARTICLE');
    });
});
