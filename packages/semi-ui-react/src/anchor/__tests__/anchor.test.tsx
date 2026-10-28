import { StrictMode, createRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import type { AnchorAdapter } from '@fibrae/semi-foundation/anchor/foundation';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import ConfigProvider from '@fibrae/semi-ui-react/config-provider';
import type { TooltipProps } from '@fibrae/semi-ui-react/tooltip';
import Anchor, { type AnchorProps } from '../index';

const { Link } = Anchor;
const activeCls = `${BASE_CLASS_PREFIX}-anchor-link-title-active`;

function renderAnchor(props: AnchorProps = {}) {
    return render(
        <Anchor {...props}>
            <Link title="welcome" href="#welcome" />
            <Link title="api too much to show" href="#api">
                <Link title="docs" href="#docs">
                    <Link title="doc1" href="#doc1" />
                    <Link title="doc2" href="#doc2" />
                </Link>
            </Link>
            <Link title="contact" href="#contact" />
        </Anchor>
    );
}

const link = (name) => screen.getByRole('link', { name });
const linkTitles = (container) => [...container.querySelectorAll(`.${BASE_CLASS_PREFIX}-anchor-link-title`)].map((el) => el.textContent);

// jsdom does not lay out: section positions are stubbed per element, relative to the viewport
const setTop = (id, top) => vi.spyOn(document.getElementById(id), 'getBoundingClientRect').mockReturnValue(new DOMRect(0, top, 100, 100));

// the scroll handler is throttled (leading call) and the end of a scroll is debounced, both at 100ms
const scroll = (target: Window | Element = window) =>
    act(() => {
        fireEvent.scroll(target);
        vi.advanceTimersByTime(200);
    });

const scrollListeners = (spy) => spy.mock.calls.filter(([type]) => type === 'scroll').length;

describe('Anchor', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('anchor 小尺寸', () => {
        render(<Anchor size="small" />);
        expect(screen.getByRole('navigation')).toHaveClass(`${BASE_CLASS_PREFIX}-anchor-size-small`);
    });

    it('anchor rail 主题', () => {
        const { container } = render(<Anchor railTheme="primary" />);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-anchor-slide-bar-primary`)).toHaveLength(1);
    });

    it('anchor 自定义 className 与 style', () => {
        render(<Anchor className="test" style={{ color: 'red' }} />);
        const anchor = screen.getByRole('navigation');
        expect(anchor).toHaveClass('test');
        expect(anchor).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('模拟点击事件', async () => {
        const { container } = renderAnchor({ autoCollapse: true });
        expect(container.querySelectorAll(`.${activeCls}`)).toHaveLength(0);
        expect(screen.queryByRole('link', { name: 'docs' })).toBeNull();

        await userEvent.click(screen.getByRole('link', { name: 'api too much to show' }));
        expect(container.querySelectorAll(`.${activeCls}`)).toHaveLength(1);
        expect(screen.getByRole('link', { name: 'api too much to show' })).toHaveClass(activeCls);
        expect(screen.getByRole('link', { name: 'docs' })).toBeInTheDocument();

        await userEvent.click(screen.getByRole('link', { name: 'welcome' }));
        expect(container.querySelectorAll(`.${activeCls}`)).toHaveLength(1);
        expect(screen.getByRole('link', { name: 'welcome' })).toHaveClass(activeCls);
        expect(screen.queryByRole('link', { name: 'docs' })).toBeNull();
    });

    it('anchor 最大高度与最大宽度', () => {
        renderAnchor({ maxHeight: 50, maxWidth: 100 });
        expect(screen.getByRole('navigation')).toHaveStyle({ maxHeight: '50px', maxWidth: '100px' });
    });

    it('为导航添加标签，并把 data-* 属性传给根元素', () => {
        const { rerender } = render(<Anchor data-testid="toc" />);
        expect(screen.getByTestId('toc')).toBe(screen.getByRole('navigation', { name: zh_CN.Anchor.label }));
        rerender(<Anchor data-testid="toc" aria-label="Contents" />);
        expect(screen.getByRole('navigation', { name: 'Contents' })).toBe(screen.getByTestId('toc'));
    });

    it('onClick、onChange 显式为 null 时点击链接不抛错', () => {
        renderAnchor({ onClick: null, onChange: null });
        fireEvent.click(link('docs'));
        expect(link('docs')).toHaveClass(activeCls);
    });

    it('点击时以链接调用 onClick 与 onChange，且不修改 hash', () => {
        const onClick = vi.fn<NonNullable<AnchorProps['onClick']>>();
        const onChange = vi.fn<NonNullable<AnchorProps['onChange']>>();
        renderAnchor({ onClick, onChange });

        fireEvent.click(link('docs'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), '#docs');
        expect(onChange).toHaveBeenCalledExactlyOnceWith('#docs', '');
        expect(link('docs')).toHaveClass(activeCls);
        expect(link('docs')).toHaveAttribute('aria-current', 'location');
        expect(link('docs')).not.toHaveAttribute('aria-details');
        expect(link('contact')).not.toHaveAttribute('aria-current');
        expect(window.location.hash).toBe('');

        fireEvent.click(link('contact'));
        expect(onClick).toHaveBeenLastCalledWith(expect.anything(), '#contact');
        expect(onChange).toHaveBeenLastCalledWith('#contact', '#docs');

        fireEvent.click(link('contact'));
        expect(onClick).toHaveBeenCalledTimes(3);
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('不传 href 的链接点击时不抛错，仍调用 onClick', () => {
        const onClick = vi.fn<NonNullable<AnchorProps['onClick']>>();
        render(
            <Anchor onClick={onClick}>
                <Link title="no href" />
            </Anchor>
        );
        fireEvent.click(link('no href'));
        expect(onClick).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: 'click' }), '#');
    });

    it('href 以数字开头时可作为 defaultAnchor 挂载并激活', () => {
        render(
            <>
                <h2 id="1-intro">intro</h2>
                <Anchor defaultAnchor="#1-intro">
                    <Link title="intro" href="#1-intro" />
                </Anchor>
            </>
        );
        expect(link('intro')).toHaveClass(activeCls);
    });

    it('焦点在链接上时按 Enter 激活，禁用的链接忽略点击', () => {
        const onClick = vi.fn<NonNullable<AnchorProps['onClick']>>();
        render(
            <Anchor onClick={onClick}>
                <Link title="a" href="#a" />
                <Link title="b" disabled href="#b" />
            </Anchor>
        );
        fireEvent.keyDown(link('a'), { key: 'Tab', code: 'Tab' });
        expect(onClick).not.toHaveBeenCalled();
        fireEvent.keyDown(link('a'), { key: 'Enter', code: 'Enter' });
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'keydown' }), '#a');
        expectTypeOf<Parameters<NonNullable<AnchorProps['onClick']>>[0]>().toEqualTypeOf<React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>>();
        expect(link('a')).toHaveClass(activeCls);

        fireEvent.click(link('b'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(link('b')).toHaveAttribute('aria-disabled', 'true');
        expect(link('b')).toHaveClass(`${BASE_CLASS_PREFIX}-anchor-link-title-disabled`);
        expect(link('b')).not.toHaveClass(activeCls);
    });

    it('defaultAnchor 挂载时激活链接，且不调用 onChange 或 onClick', () => {
        const onClick = vi.fn<NonNullable<AnchorProps['onClick']>>();
        const onChange = vi.fn<NonNullable<AnchorProps['onChange']>>();
        const { container } = renderAnchor({ defaultAnchor: '#contact', onClick, onChange });
        expect(link('contact')).toHaveClass(activeCls);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-anchor-slide-bar`)).toHaveClass(`${BASE_CLASS_PREFIX}-anchor-slide-bar-active`);
        expect(onChange).not.toHaveBeenCalled();
        expect(onClick).not.toHaveBeenCalled();
    });

    it('autoCollapse 只展开包含当前激活链接的分支', () => {
        const { container } = render(
            <Anchor autoCollapse defaultAnchor="#g1">
                <Link title="p1" href="#p1">
                    <Link title="c1" href="#c1">
                        <Link title="g1" href="#g1" />
                        <Link title="g2" href="#g2" />
                    </Link>
                    <Link title="c2" href="#c2" />
                </Link>
                <Link title="p2" href="#p2">
                    <Link title="d1" href="#d1" />
                    <Link title="d2" href="#d2" />
                </Link>
            </Anchor>
        );
        expect(linkTitles(container)).toEqual(['p1', 'c1', 'g1', 'g2', 'c2', 'p2']);
    });

    it('未设置 showTooltip 时字符串标题作为原生 title；设置后标题显示为省略文本', () => {
        const { container, rerender } = render(
            <Anchor size="small">
                <Link title="alpha" href="#a" />
            </Anchor>
        );
        expect(link('alpha')).toHaveAttribute('title', 'alpha');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-anchor-link-tooltip`)).toBeNull();

        rerender(
            <Anchor showTooltip size="small">
                <Link title="alpha" href="#a" />
            </Anchor>
        );
        expect(link('alpha')).not.toHaveAttribute('title');
        fireEvent.click(link('alpha'));
        const text = container.querySelector(`.${BASE_CLASS_PREFIX}-anchor-link-tooltip`);
        expect(text).toHaveTextContent('alpha');
        expect(text).toHaveClass(`${BASE_CLASS_PREFIX}-anchor-link-tooltip-small`, `${BASE_CLASS_PREFIX}-anchor-link-tooltip-active`);
    });

    it('未传 title 或 title 为空字符串时不输出空的原生 title', () => {
        render(
            <Anchor>
                <Link href="#a" />
                <Link title="" href="#b" />
            </Anchor>
        );
        for (const el of screen.getAllByRole('link')) {
            expect(el).not.toHaveAttribute('title');
        }
    });

    it('嵌套链接每级缩进 8px，RTL 下由 CSS 方向决定', () => {
        const { rerender } = renderAnchor();
        expect(link('welcome')).toHaveStyle({ paddingInlineStart: '8px' });
        expect(link('docs')).toHaveStyle({ paddingInlineStart: '16px' });
        expect(link('doc1')).toHaveStyle({ paddingInlineStart: '24px' });

        rerender(
            <ConfigProvider direction="rtl">
                <Anchor>
                    <Link title="api" href="#api">
                        <Link title="docs" href="#docs" />
                    </Link>
                </Anchor>
            </ConfigProvider>
        );
        expect(link('api')).toHaveStyle({ paddingInlineStart: '8px' });
        expect(link('docs')).toHaveStyle({ paddingInlineStart: '16px' });
    });

    it('外层 dir="rtl" 且没有 ConfigProvider 时，缩进同样走逻辑属性', () => {
        render(
            <div dir="rtl">
                <Anchor>
                    <Link title="api" href="#api" />
                </Anchor>
            </div>
        );
        expect(link('api').style.paddingInlineStart).toBe('8px');
        expect(link('api').style.paddingLeft).toBe('');
    });

    it('Link 把 className 与 style 传给其列表项', () => {
        render(
            <Anchor>
                <Link className="mine" style={{ color: 'red' }} title="a" href="#a" />
            </Anchor>
        );
        const item = screen.getByRole('listitem');
        expect(item).toHaveClass(`${BASE_CLASS_PREFIX}-anchor-link`, 'mine');
        expect(item).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('点击链接后，滑块移动到其位置', () => {
        vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function () {
            return this.textContent === 'contact' ? 120 : 0;
        });
        const { container } = renderAnchor();
        fireEvent.click(link('contact'));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-anchor-slide-bar`)).toHaveStyle({ top: '120px' });
    });

    it('当前链接上方的链接增加后，滑块跟随当前链接的新位置', () => {
        let contactTop = 120;
        vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function () {
            return this.textContent === 'contact' ? contactTop : 0;
        });
        const { container, rerender } = render(
            <Anchor>
                <Link title="contact" href="#contact" />
            </Anchor>
        );
        fireEvent.click(link('contact'));
        const bar = container.querySelector(`.${BASE_CLASS_PREFIX}-anchor-slide-bar`);
        expect(bar).toHaveStyle({ top: '120px' });

        contactTop = 150;
        rerender(
            <Anchor>
                <Link title="extra" href="#extra" />
                <Link title="contact" href="#contact" />
            </Anchor>
        );
        expect(bar).toHaveStyle({ top: '150px' });
    });

    describe('滚动', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        const Sections = () => (
            <>
                <h2 id="a">A</h2>
                <h2 id="b">B</h2>
            </>
        );

        it('激活位于顶部之上的最后一个区块，并上报变化', () => {
            const onChange = vi.fn<NonNullable<AnchorProps['onChange']>>();
            render(
                <>
                    <Anchor onChange={onChange}>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    <Sections />
                </>
            );
            setTop('a', -50);
            setTop('b', 40);
            scroll();
            expect(link('a')).toHaveClass(activeCls);
            expect(onChange).toHaveBeenLastCalledWith('#a', '');

            setTop('b', -10);
            scroll();
            expect(link('b')).toHaveClass(activeCls);
            expect(onChange).toHaveBeenLastCalledWith('#b', '#a');

            setTop('a', 10);
            setTop('b', 40);
            scroll();
            expect(screen.queryByRole('link', { name: 'b' })).not.toHaveClass(activeCls);
            expect(document.querySelector(`.${activeCls}`)).toBeNull();
        });

        it('所有区块都在顶部以下时滚动，不上报变化；回到顶部时上报清空', () => {
            const onChange = vi.fn<NonNullable<AnchorProps['onChange']>>();
            render(
                <>
                    <Anchor onChange={onChange}>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    <Sections />
                </>
            );
            setTop('a', 10);
            setTop('b', 40);
            scroll();
            expect(onChange).not.toHaveBeenCalled();

            setTop('a', -50);
            scroll();
            expect(onChange).toHaveBeenLastCalledWith('#a', '');

            setTop('a', 10);
            scroll();
            expect(onChange).toHaveBeenLastCalledWith('', '#a');
            expect(onChange).toHaveBeenCalledTimes(2);
        });

        it('点击未引起滚动时，下一次滚动仍更新高亮', () => {
            render(
                <>
                    <Anchor>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    <Sections />
                </>
            );
            setTop('a', -50);
            setTop('b', 40);
            fireEvent.click(link('b'));
            expect(link('b')).toHaveClass(activeCls);
            act(() => {
                vi.advanceTimersByTime(200);
            });

            scroll();
            expect(link('a')).toHaveClass(activeCls);
        });

        it('稳定的 getContainer 在容器晚出现时迁移监听', () => {
            const getContainer = () => document.getElementById('late-box');
            const Demo = ({ showBox }) => (
                <>
                    <Anchor data-show={showBox} getContainer={getContainer}>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    {showBox && (
                        <div id="late-box">
                            <Sections />
                        </div>
                    )}
                </>
            );
            const { rerender } = render(<Demo showBox={false} />);
            rerender(<Demo showBox />);
            setTop('a', -50);
            setTop('b', 40);
            scroll(document.getElementById('late-box'));
            expect(link('a')).toHaveClass(activeCls);
        });

        it('以 getContainer 返回的容器与 offsetTop 计算位置', () => {
            render(
                <>
                    <Anchor getContainer={() => document.getElementById('box')} offsetTop={30}>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    <div id="box">
                        <Sections />
                    </div>
                </>
            );
            const box = document.getElementById('box');
            vi.spyOn(box, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 100, 100, 500));
            setTop('a', 60);
            setTop('b', 120);
            scroll(window);
            expect(document.querySelector(`.${activeCls}`)).toBeNull();

            scroll(box);
            expect(link('b')).toHaveClass(activeCls);
        });

        it('点击引起的滚动在稳定前忽略', () => {
            render(
                <>
                    <Anchor>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    <Sections />
                </>
            );
            setTop('a', -50);
            setTop('b', 40);
            fireEvent.click(link('b'));
            scroll();
            expect(link('b')).toHaveClass(activeCls);
            scroll();
            expect(link('a')).toHaveClass(activeCls);
        });

        it.each([
            ['', (children) => children],
            ['under StrictMode', (children) => <StrictMode>{children}</StrictMode>],
        ])('注册已挂载的链接，并忘记已卸载的链接 %s', (_, wrap) => {
            const Demo = ({ showB }) =>
                wrap(
                    <>
                        <Anchor>
                            <Link title="a" href="#a" />
                            {showB && <Link title="b" href="#b" />}
                        </Anchor>
                        <Sections />
                    </>
                );
            const { rerender } = render(<Demo showB />);
            setTop('a', -50);
            setTop('b', -10);
            scroll();
            expect(link('b')).toHaveClass(activeCls);

            rerender(<Demo showB={false} />);
            scroll();
            expect(link('a')).toHaveClass(activeCls);

            rerender(<Demo showB />);
            scroll();
            expect(link('b')).toHaveClass(activeCls);
        });

        it('卸载时移除滚动监听', () => {
            const add = vi.spyOn(window, 'addEventListener');
            const remove = vi.spyOn(window, 'removeEventListener');
            const { unmount } = renderAnchor();
            expect(scrollListeners(add)).toBeGreaterThan(0);
            unmount();
            expect(scrollListeners(remove)).toBe(scrollListeners(add));
        });

        it('getContainer 返回其他元素时迁移监听', () => {
            const Demo = ({ id }) => (
                <>
                    <Anchor getContainer={() => document.getElementById(id)}>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    <div id="one" />
                    <div id="two" />
                    <Sections />
                </>
            );
            const { rerender } = render(<Demo id="one" />);
            const one = document.getElementById('one');
            const two = document.getElementById('two');
            const removeFromOne = vi.spyOn(one, 'removeEventListener');
            setTop('a', -50);
            setTop('b', 40);

            rerender(<Demo id="two" />);
            expect(scrollListeners(removeFromOne)).toBeGreaterThan(0);
            scroll(one);
            expect(document.querySelector(`.${activeCls}`)).toBeNull();
            scroll(two);
            expect(link('a')).toHaveClass(activeCls);
        });

        it('卸载时取消待执行的滚动更新', () => {
            const onChange = vi.fn<NonNullable<AnchorProps['onChange']>>();
            const { unmount } = render(
                <>
                    <Anchor onChange={onChange}>
                        <Link title="a" href="#a" />
                    </Anchor>
                    <Sections />
                </>
            );
            setTop('a', -50);
            act(() => {
                fireEvent.scroll(window);
            });
            expect(onChange).toHaveBeenCalledTimes(1);
            setTop('a', 50);
            act(() => {
                fireEvent.scroll(window);
            });
            unmount();
            void act(() => vi.advanceTimersByTime(200));
            expect(onChange).toHaveBeenCalledTimes(1);
        });
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Anchor: { size: 'small', railTheme: 'muted' } };
        try {
            const { container } = render(<Anchor />);
            expect(screen.getByRole('navigation')).toHaveClass(`${BASE_CLASS_PREFIX}-anchor-size-small`);
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-anchor-slide-bar`)).toHaveClass(`${BASE_CLASS_PREFIX}-anchor-slide-bar-muted`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('ref 指向导航根元素，其他属性透传', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Anchor ref={ref} id="toc" title="Contents" />);
        expect(ref.current).toBe(screen.getByRole('navigation'));
        expect(ref.current).toHaveAttribute('id', 'toc');
        expect(ref.current).toHaveAttribute('title', 'Contents');
    });

    it('Link 的 ref 指向其列表项，其他属性透传', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <Anchor>
                <Link ref={ref} data-testid="item" title="a" href="#a" />
            </Anchor>
        );
        expect(ref.current).toBe(screen.getByRole('listitem'));
        expect(ref.current).toBe(screen.getByTestId('item'));
    });

    it('激活时，唯一的子链接保持展开', () => {
        const { container } = renderAnchor({ autoCollapse: true, defaultAnchor: '#docs' });
        expect(linkTitles(container)).toEqual(['welcome', 'api too much to show', 'docs', 'doc1', 'doc2', 'contact']);

        fireEvent.click(link('doc1'));
        expect(link('doc1')).toHaveClass(activeCls);
    });

    it('fragment 或包装元素内的链接，嵌套方式与直接子节点相同', () => {
        const { container } = render(
            <Anchor autoCollapse>
                <>
                    <Link title="p" href="#p">
                        <div className="group">
                            <Link title="c1" href="#c1" />
                            <Link title="c2" href="#c2" />
                        </div>
                    </Link>
                    <Link title="q" href="#q" />
                </>
            </Anchor>
        );
        expect(link('p')).toHaveStyle({ paddingInlineStart: '8px' });
        fireEvent.click(link('p'));
        expect(link('c1')).toHaveStyle({ paddingInlineStart: '16px' });
        expect(container.querySelector('.group').getAttributeNames()).toEqual(['class']);

        fireEvent.click(link('c1'));
        expect(linkTitles(container)).toEqual(['p', 'c1', 'c2', 'q']);
    });

    it('不把 anchor 位置写入传入的 showTooltip 对象', () => {
        const showTooltip = { opts: { content: 'tip' } };
        render(
            <Anchor position="right" showTooltip={showTooltip}>
                <Link title="a" href="#a" />
            </Anchor>
        );
        expect(showTooltip).toEqual({ opts: { content: 'tip' } });
    });

    it('position 接受 Tooltip 的全部位置', () => {
        expectTypeOf<NonNullable<AnchorProps['position']>>().toEqualTypeOf<NonNullable<TooltipProps['position']>>();
    });

    it('adapter 查找节点的返回类型包含 null', () => {
        expectTypeOf<ReturnType<AnchorAdapter['getAnchorNode']>>().toEqualTypeOf<HTMLElement | null>();
        expectTypeOf<ReturnType<AnchorAdapter['getContentNode']>>().toEqualTypeOf<HTMLElement | null>();
    });

    it('在 StrictMode 下正常工作', () => {
        const add = vi.spyOn(window, 'addEventListener');
        const remove = vi.spyOn(window, 'removeEventListener');
        const onChange = vi.fn<NonNullable<AnchorProps['onChange']>>();
        render(
            <StrictMode>
                <Anchor onChange={onChange}>
                    <Link title="a" href="#a" />
                </Anchor>
            </StrictMode>
        );
        expect(scrollListeners(add) - scrollListeners(remove)).toBe(2);
        fireEvent.click(link('a'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('#a', '');
    });
});
