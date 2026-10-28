import { StrictMode, createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { mockMatchMedia } from '@test/utils/react';
import { Layout } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-layout`;
const hasSiderCls = `${prefixCls}-has-sider`;

const media = { xs: '(max-width: 575px)', md: '(min-width: 768px)', lg: '(min-width: 992px)' };

describe('layout', () => {
    it('显式传入 undefined 的 tagName、type 不覆盖内置值', () => {
        const { container } = render(
            <>
                <Layout.Header type={undefined} tagName={undefined} />
                <Layout.Footer type={undefined} tagName={undefined} />
                <Layout.Content type={undefined} tagName={undefined} />
            </>
        );
        expect(Array.from(container.children, (el) => `${el.tagName} ${el.className}`)).toEqual([`HEADER ${prefixCls}-header`, `FOOTER ${prefixCls}-footer`, `MAIN ${prefixCls}-content`]);
    });

    it('自定义 className 与 style 的 layout', () => {
        const props = {
            className: 'test',
            style: {
                color: 'red',
            },
        };
        const cases = [
            [<Layout key="layout" {...props} hasSider />, 'section'],
            [<Layout.Header key="header" {...props} />, 'header'],
            [<Layout.Sider key="sider" {...props} />, 'aside'],
            [<Layout.Content key="content" {...props} />, 'main'],
            [<Layout.Footer key="footer" {...props} />, 'footer'],
        ];
        for (const [element, tag] of cases) {
            const { container, unmount } = render(element);
            const node = container.firstChild as HTMLElement;
            expect(node.tagName.toLowerCase()).toBe(tag);
            expect(node).toHaveClass('test');
            expect(node).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            unmount();
        }
    });

    it('带 sider 的 layout', () => {
        const { container } = render(
            <Layout>
                <Layout.Sider />
            </Layout>
        );
        expect(container.querySelector(`section.${BASE_CLASS_PREFIX}-layout-has-sider`)).not.toBeNull();
    });

    it('各部分拥有各自的类名，并包裹 sider 的子元素', () => {
        const { container } = render(
            <Layout>
                <Layout.Header>h</Layout.Header>
                <Layout.Content>c</Layout.Content>
                <Layout.Footer>f</Layout.Footer>
            </Layout>
        );
        const root = container.firstChild as HTMLElement;
        expect(root).toHaveClass(prefixCls);
        expect(root).not.toHaveClass(hasSiderCls);
        expect(root.querySelector('header')).toHaveClass(`${prefixCls}-header`);
        expect(root.querySelector('main')).toHaveClass(`${prefixCls}-content`);
        expect(root.querySelector('footer')).toHaveClass(`${prefixCls}-footer`);
        expect(root.textContent).toBe('hcf');

        const { container: sider } = render(<Layout.Sider>menu</Layout.Sider>);
        const aside = sider.firstChild;
        expect(aside).toHaveClass(`${prefixCls}-sider`);
        expect(aside.firstChild).toHaveClass(`${prefixCls}-sider-children`);
        expect(aside.firstChild.textContent).toBe('menu');
    });

    it('tagName、type 与 prefixCls 可替换默认值', () => {
        const { container } = render(
            <Layout prefixCls="my" tagName="div">
                <Layout.Header type="top" tagName="nav" />
                <Layout.Content prefixCls="x" />
            </Layout>
        );
        const root = container.firstChild as HTMLElement;
        expect(root.tagName).toBe('DIV');
        expect(root).toHaveClass('my');
        expect(root).not.toHaveClass(prefixCls);
        expect((root.firstChild as HTMLElement).tagName).toBe('NAV');
        expect(root.firstChild).toHaveClass(`${prefixCls}-top`);
        expect(root.lastChild).toHaveClass('x-content');
    });

    it('只强制添加 sider 类名：hasSider 为 false 时，Sider 子元素仍保留该类名', () => {
        const { container, rerender } = render(<Layout hasSider />);
        expect(container.firstChild).toHaveClass(hasSiderCls);
        rerender(<Layout hasSider={false} />);
        expect(container.firstChild).not.toHaveClass(hasSiderCls);
        rerender(
            <Layout hasSider={false}>
                <Layout.Sider />
            </Layout>
        );
        expect(container.firstChild).toHaveClass(hasSiderCls);
    });

    it('Sider 嵌套较深时 layout 被标记；Sider 卸载时取消标记', () => {
        const App = ({ show }: { show?: boolean }) => (
            <Layout>
                <div>{show && <Layout.Sider />}</div>
            </Layout>
        );
        const { container, rerender } = render(<App show />);
        expect(container.firstChild).toHaveClass(hasSiderCls);
        rerender(<App show={false} />);
        expect(container.firstChild).not.toHaveClass(hasSiderCls);
        rerender(<App show />);
        expect(container.firstChild).toHaveClass(hasSiderCls);
    });

    it('Sider 只注册到最近的 Layout', () => {
        const { container } = render(
            <Layout>
                <Layout>
                    <div>
                        <Layout.Sider />
                    </div>
                </Layout>
            </Layout>
        );
        const outer = container.firstChild;
        expect(outer).not.toHaveClass(hasSiderCls);
        expect(outer.firstChild).toHaveClass(hasSiderCls);
    });

    it('StrictMode 下保留 sider 类名，Sider 卸载后移除', () => {
        const App = ({ show }: { show?: boolean }) => (
            <StrictMode>
                <Layout>
                    <div>{show && <Layout.Sider />}</div>
                </Layout>
            </StrictMode>
        );
        const { container, rerender } = render(<App show />);
        expect(container.firstChild).toHaveClass(hasSiderCls);
        rerender(<App show={false} />);
        expect(container.firstChild).not.toHaveClass(hasSiderCls);
    });

    it('aria-label、role 与 data-* 透传经过 Layout、Header、Content 与 Footer', () => {
        render(
            <Layout id="root" data-testid="layout" aria-label="app">
                <Layout.Header data-testid="header" aria-label="top" role="toolbar" />
                <Layout.Content data-testid="content" aria-label="body" />
                <Layout.Footer data-testid="footer" role="note" />
            </Layout>
        );
        expect(screen.getByTestId('layout')).toHaveAttribute('aria-label', 'app');
        expect(screen.getByTestId('layout')).toHaveAttribute('id', 'root');
        expect(screen.getByTestId('header')).toHaveAttribute('role', 'toolbar');
        expect(screen.getByTestId('header')).toHaveAttribute('aria-label', 'top');
        expect(screen.getByTestId('content')).toHaveAttribute('aria-label', 'body');
        expect(screen.getByTestId('footer')).toHaveAttribute('role', 'note');
    });

    it('aria-label 与 data-* 透传到 sider 的 aside', () => {
        render(<Layout.Sider data-testid="sider" aria-label="nav" />);
        const aside = screen.getByTestId('sider');
        expect(aside.tagName).toBe('ASIDE');
        expect(aside).toHaveAttribute('aria-label', 'nav');
        expect(aside).not.toHaveAttribute('breakpoint');
    });

    describe('Sider 断点', () => {
        it('挂载时按 xs 到 xxl 的顺序报告各断点，变化时同样报告', () => {
            const mm = mockMatchMedia([media.md]);
            const onBreakpoint = vi.fn<(breakpoint: string, matches: boolean) => void>();
            render(<Layout.Sider breakpoint={['lg', 'xs', 'md']} onBreakpoint={onBreakpoint} />);
            expect(onBreakpoint.mock.calls).toEqual([
                ['xs', false],
                ['md', true],
                ['lg', false],
            ]);
            onBreakpoint.mockClear();
            mm.fire(media.lg, true);
            expect(onBreakpoint.mock.calls).toEqual([['lg', true]]);
        });

        it('挂载时只读取一次断点，并调用最新的 onBreakpoint', () => {
            const mm = mockMatchMedia([]);
            const first = vi.fn<(breakpoint: string, matches: boolean) => void>();
            const second = vi.fn<(breakpoint: string, matches: boolean) => void>();
            const { rerender } = render(<Layout.Sider breakpoint={['md']} onBreakpoint={first} />);
            expect(first).toHaveBeenCalledTimes(1);
            rerender(<Layout.Sider breakpoint={['md', 'lg']} onBreakpoint={second} />);
            expect(window.matchMedia).toHaveBeenCalledTimes(1);
            expect(second).not.toHaveBeenCalled();
            mm.fire(media.md, true);
            expect(first).toHaveBeenCalledTimes(1);
            expect(second.mock.calls).toEqual([['md', true]]);
        });

        it('卸载时移除 media 监听', () => {
            const mm = mockMatchMedia([]);
            const onBreakpoint = vi.fn<(breakpoint: string, matches: boolean) => void>();
            const { unmount } = render(<Layout.Sider breakpoint={['xs', 'lg']} onBreakpoint={onBreakpoint} />);
            unmount();
            const lists = Object.values(mm.lists).flat();
            expect(lists).toHaveLength(2);
            lists.forEach((list) => expect(list.handlers).toHaveLength(0));
            mm.fire(media.lg, true);
            expect(onBreakpoint).toHaveBeenCalledTimes(2);
        });

        it('StrictMode 下每个断点只保留一个监听', () => {
            const mm = mockMatchMedia([]);
            const { unmount } = render(
                <StrictMode>
                    <Layout.Sider breakpoint={['md']} />
                </StrictMode>
            );
            expect(mm.handlerCount(media.md)).toBe(1);
            unmount();
            expect(mm.handlerCount(media.md)).toBe(0);
        });
    });

    it('各部分的 ref 指向各自的根元素', () => {
        const refs = [createRef<HTMLElement>(), createRef<HTMLElement>(), createRef<HTMLElement>(), createRef<HTMLElement>(), createRef<HTMLElement>()];
        render(
            <Layout ref={refs[0]}>
                <Layout.Header ref={refs[1]} />
                <Layout.Sider ref={refs[2]} />
                <Layout.Content ref={refs[3]} />
                <Layout.Footer ref={refs[4]} />
            </Layout>
        );
        expect(refs.map((ref) => ref.current.tagName)).toEqual(['SECTION', 'HEADER', 'ASIDE', 'MAIN', 'FOOTER']);
    });

    it('role、id 与其他未知属性透传到 sider 的 aside', () => {
        const onClick = vi.fn<() => void>();
        render(<Layout.Sider id="side" data-testid="sider" role="menu" title="t" onClick={onClick} />);
        const aside = screen.getByTestId('sider');
        expect(aside).toHaveAttribute('role', 'menu');
        expect(aside).toHaveAttribute('id', 'side');
        expect(aside).toHaveAttribute('title', 't');
        aside.click();
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('只为 Layout 读取 semiGlobal overrideDefaultProps，显式属性优先', () => {
        const before = semiGlobal.config.overrideDefaultProps;
        semiGlobal.config.overrideDefaultProps = { Layout: { tagName: 'div' } };
        try {
            const { container, rerender } = render(
                <Layout>
                    <Layout.Header />
                </Layout>
            );
            const root = () => container.firstChild as HTMLElement;
            expect(root().tagName).toBe('DIV');
            expect((root().firstChild as HTMLElement).tagName).toBe('HEADER');
            rerender(<Layout tagName="article" />);
            expect(root().tagName).toBe('ARTICLE');
        } finally {
            semiGlobal.config.overrideDefaultProps = before;
        }
    });
});
