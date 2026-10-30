import { Show, createSignal } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import type { AnchorAdapter } from '@fibrae/semi-foundation/anchor/foundation';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import Anchor, { type AnchorProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import type { TooltipProps } from '../../tooltip';

const { Link } = Anchor;
const activeCls = `${BASE_CLASS_PREFIX}-anchor-link-title-active`;

function renderAnchor(props: AnchorProps = {}) {
    return render(() => (
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
    ));
}

const link = (name: string) => screen.getByRole('link', { name });
const linkTitles = (container: HTMLElement) => [...container.querySelectorAll(`.${BASE_CLASS_PREFIX}-anchor-link-title`)].map((el) => el.textContent);

// jsdom does not lay out: section positions are stubbed per element, relative to the viewport
const setTop = (id: string, top: number) => vi.spyOn(document.getElementById(id) as HTMLElement, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, top, 100, 100));

// the scroll handler is throttled (leading call) and the end of a scroll is debounced, both at 100ms
function scroll(target: Window | Element = window) {
    fireEvent.scroll(target);
    vi.advanceTimersByTime(200);
}

const scrollListeners = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([type]) => type === 'scroll').length;

describe('Anchor', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('anchor 小尺寸', () => {
        render(() => <Anchor size="small" />);
        expect(screen.getByRole('navigation')).toHaveClass(`${BASE_CLASS_PREFIX}-anchor-size-small`);
    });

    it('anchor rail 主题', () => {
        const { container } = render(() => <Anchor railTheme="primary" />);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-anchor-slide-bar-primary`)).toHaveLength(1);
    });

    it('anchor 自定义 class 与 style', () => {
        render(() => <Anchor class="test" style={{ color: 'red' }} />);
        const anchor = screen.getByRole('navigation');
        expect(anchor).toHaveClass('test');
        expect(anchor).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('style 为字符串时与最大宽高合并', () => {
        render(() => <Anchor style="color: red" maxWidth={120} />);
        const anchor = screen.getByRole('navigation');
        expect(anchor).toHaveStyle({ color: 'rgb(255, 0, 0)', maxWidth: '120px' });
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
        const [label, setLabel] = createSignal<string>();
        render(() => <Anchor data-testid="toc" aria-label={label()} />);
        expect(screen.getByTestId('toc')).toBe(screen.getByRole('navigation', { name: zh_CN.Anchor.label }));
        setLabel('Contents');
        expect(screen.getByRole('navigation', { name: 'Contents' })).toBe(screen.getByTestId('toc'));
    });

    it('onClick、onChange 显式为 null 时点击链接不抛错', () => {
        renderAnchor({ onClick: null as never, onChange: null as never });
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
        render(() => (
            <Anchor onClick={onClick}>
                <Link title="no href" />
            </Anchor>
        ));
        fireEvent.click(link('no href'));
        expect(onClick).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: 'click' }), '#');
    });

    it('href 以数字开头时可作为 defaultAnchor 挂载并激活', () => {
        render(() => (
            <>
                <h2 id="1-intro">intro</h2>
                <Anchor defaultAnchor="#1-intro">
                    <Link title="intro" href="#1-intro" />
                </Anchor>
            </>
        ));
        expect(link('intro')).toHaveClass(activeCls);
    });

    it('焦点在链接上时按 Enter 激活，禁用的链接忽略点击', () => {
        const onClick = vi.fn<NonNullable<AnchorProps['onClick']>>();
        render(() => (
            <Anchor onClick={onClick}>
                <Link title="a" href="#a" />
                <Link title="b" disabled href="#b" />
            </Anchor>
        ));
        fireEvent.keyDown(link('a'), { key: 'Tab', code: 'Tab' });
        expect(onClick).not.toHaveBeenCalled();
        fireEvent.keyDown(link('a'), { key: 'Enter', code: 'Enter' });
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'keydown' }), '#a');
        expectTypeOf<Parameters<NonNullable<AnchorProps['onClick']>>[0]>().toEqualTypeOf<MouseEvent | KeyboardEvent>();
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
        const { container } = render(() => (
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
        ));
        expect(linkTitles(container)).toEqual(['p1', 'c1', 'g1', 'g2', 'c2', 'p2']);
    });

    it('未设置 showTooltip 时字符串标题作为原生 title；设置后标题显示为省略文本', () => {
        const [showTooltip, setShowTooltip] = createSignal(false);
        const { container } = render(() => (
            <Anchor showTooltip={showTooltip()} size="small">
                <Link title="alpha" href="#a" />
            </Anchor>
        ));
        expect(link('alpha')).toHaveAttribute('title', 'alpha');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-anchor-link-tooltip`)).toBeNull();

        setShowTooltip(true);
        expect(link('alpha')).not.toHaveAttribute('title');
        fireEvent.click(link('alpha'));
        const text = container.querySelector(`.${BASE_CLASS_PREFIX}-anchor-link-tooltip`);
        expect(text).toHaveTextContent('alpha');
        expect(text).toHaveClass(`${BASE_CLASS_PREFIX}-anchor-link-tooltip-small`, `${BASE_CLASS_PREFIX}-anchor-link-tooltip-active`);
    });

    it('未传 title 或 title 为空字符串时不输出空的原生 title', () => {
        render(() => (
            <Anchor>
                <Link href="#a" />
                <Link title="" href="#b" />
            </Anchor>
        ));
        for (const el of screen.getAllByRole('link')) {
            expect(el).not.toHaveAttribute('title');
        }
    });

    it('title 可以是节点', () => {
        render(() => (
            <Anchor>
                <Link title={<b>bold</b>} href="#a" />
            </Anchor>
        ));
        expect(link('bold').querySelector('b')).not.toBeNull();
    });

    it('嵌套链接每级缩进 8px，RTL 下由 CSS 方向决定', () => {
        renderAnchor();
        expect(link('welcome')).toHaveStyle({ paddingInlineStart: '8px' });
        expect(link('docs')).toHaveStyle({ paddingInlineStart: '16px' });
        expect(link('doc1')).toHaveStyle({ paddingInlineStart: '24px' });
    });

    it('ConfigProvider 的 direction 为 rtl 时，缩进同样走逻辑属性', () => {
        render(() => (
            <ConfigProvider direction="rtl">
                <Anchor>
                    <Link title="api" href="#api">
                        <Link title="docs" href="#docs" />
                    </Link>
                </Anchor>
            </ConfigProvider>
        ));
        expect(link('api')).toHaveStyle({ paddingInlineStart: '8px' });
        expect(link('docs')).toHaveStyle({ paddingInlineStart: '16px' });
    });

    it('外层 dir="rtl" 且没有 ConfigProvider 时，缩进同样走逻辑属性', () => {
        render(() => (
            <div dir="rtl">
                <Anchor>
                    <Link title="api" href="#api" />
                </Anchor>
            </div>
        ));
        expect(link('api').style.paddingInlineStart).toBe('8px');
        expect(link('api').style.paddingLeft).toBe('');
    });

    it('Link 把 class 与 style 传给其列表项', () => {
        render(() => (
            <Anchor>
                <Link class="mine" style={{ color: 'red' }} title="a" href="#a" />
            </Anchor>
        ));
        const item = screen.getByRole('listitem');
        expect(item).toHaveClass(`${BASE_CLASS_PREFIX}-anchor-link`, 'mine');
        expect(item).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('点击链接后，滑块移动到其位置', () => {
        vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
            return this.textContent === 'contact' ? 120 : 0;
        });
        const { container } = renderAnchor();
        fireEvent.click(link('contact'));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-anchor-slide-bar`)).toHaveStyle({ top: '120px' });
    });

    it('当前链接上方的链接增加后，滑块跟随当前链接的新位置', () => {
        let contactTop = 120;
        vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
            return this.textContent === 'contact' ? contactTop : 0;
        });
        const [showExtra, setShowExtra] = createSignal(false);
        const { container } = render(() => (
            <Anchor>
                <Show when={showExtra()}>
                    <Link title="extra" href="#extra" />
                </Show>
                <Link title="contact" href="#contact" />
            </Anchor>
        ));
        fireEvent.click(link('contact'));
        const bar = container.querySelector(`.${BASE_CLASS_PREFIX}-anchor-slide-bar`);
        expect(bar).toHaveStyle({ top: '120px' });

        contactTop = 150;
        setShowExtra(true);
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
            render(() => (
                <>
                    <Anchor onChange={onChange}>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    <Sections />
                </>
            ));
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
            render(() => (
                <>
                    <Anchor onChange={onChange}>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    <Sections />
                </>
            ));
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
            render(() => (
                <>
                    <Anchor>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    <Sections />
                </>
            ));
            setTop('a', -50);
            setTop('b', 40);
            fireEvent.click(link('b'));
            expect(link('b')).toHaveClass(activeCls);
            vi.advanceTimersByTime(200);

            scroll();
            expect(link('a')).toHaveClass(activeCls);
        });

        it('getContainer 读取信号时，容器晚出现后迁移监听', () => {
            const [box, setBox] = createSignal<HTMLElement | null>(null);
            render(() => (
                <>
                    <Anchor getContainer={box}>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    <div id="late-box">
                        <Sections />
                    </div>
                </>
            ));
            setBox(document.getElementById('late-box'));
            setTop('a', -50);
            setTop('b', 40);
            scroll(document.getElementById('late-box') as HTMLElement);
            expect(link('a')).toHaveClass(activeCls);
        });

        it('以 getContainer 返回的容器与 offsetTop 计算位置', () => {
            render(() => (
                <>
                    <Anchor getContainer={() => document.getElementById('box')} offsetTop={30}>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    <div id="box">
                        <Sections />
                    </div>
                </>
            ));
            const box = document.getElementById('box') as HTMLElement;
            vi.spyOn(box, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 100, 100, 500));
            setTop('a', 60);
            setTop('b', 120);
            scroll(window);
            expect(document.querySelector(`.${activeCls}`)).toBeNull();

            scroll(box);
            expect(link('b')).toHaveClass(activeCls);
        });

        it('点击引起的滚动在稳定前忽略', () => {
            render(() => (
                <>
                    <Anchor>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    <Sections />
                </>
            ));
            setTop('a', -50);
            setTop('b', 40);
            fireEvent.click(link('b'));
            scroll();
            expect(link('b')).toHaveClass(activeCls);
            scroll();
            expect(link('a')).toHaveClass(activeCls);
        });

        it('注册已挂载的链接，并忘记已卸载的链接', () => {
            const [showB, setShowB] = createSignal(true);
            render(() => (
                <>
                    <Anchor>
                        <Link title="a" href="#a" />
                        <Show when={showB()}>
                            <Link title="b" href="#b" />
                        </Show>
                    </Anchor>
                    <Sections />
                </>
            ));
            setTop('a', -50);
            setTop('b', -10);
            scroll();
            expect(link('b')).toHaveClass(activeCls);

            setShowB(false);
            scroll();
            expect(link('a')).toHaveClass(activeCls);

            setShowB(true);
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
            const [id, setId] = createSignal('one');
            render(() => (
                <>
                    <Anchor getContainer={() => document.getElementById(id())}>
                        <Link title="a" href="#a" />
                        <Link title="b" href="#b" />
                    </Anchor>
                    <div id="one" />
                    <div id="two" />
                    <Sections />
                </>
            ));
            const one = document.getElementById('one') as HTMLElement;
            const two = document.getElementById('two') as HTMLElement;
            const removeFromOne = vi.spyOn(one, 'removeEventListener');
            setTop('a', -50);
            setTop('b', 40);

            setId('two');
            expect(scrollListeners(removeFromOne)).toBeGreaterThan(0);
            scroll(one);
            expect(document.querySelector(`.${activeCls}`)).toBeNull();
            scroll(two);
            expect(link('a')).toHaveClass(activeCls);
        });

        it('卸载时取消待执行的滚动更新', () => {
            const onChange = vi.fn<NonNullable<AnchorProps['onChange']>>();
            const { unmount } = render(() => (
                <>
                    <Anchor onChange={onChange}>
                        <Link title="a" href="#a" />
                    </Anchor>
                    <Sections />
                </>
            ));
            setTop('a', -50);
            fireEvent.scroll(window);
            expect(onChange).toHaveBeenCalledTimes(1);
            setTop('a', 50);
            fireEvent.scroll(window);
            unmount();
            vi.advanceTimersByTime(200);
            expect(onChange).toHaveBeenCalledTimes(1);
        });
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Anchor: { size: 'small', railTheme: 'muted' } };
        const { container } = render(() => <Anchor />);
        expect(screen.getByRole('navigation')).toHaveClass(`${BASE_CLASS_PREFIX}-anchor-size-small`);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-anchor-slide-bar`)).toHaveClass(`${BASE_CLASS_PREFIX}-anchor-slide-bar-muted`);
    });

    it('不把 scrollIntoViewOptions 传给根元素', () => {
        renderAnchor({ scrollIntoViewOptions: { block: 'center' } });
        expect(screen.getByRole('navigation').getAttributeNames()).not.toContain('scrollintoviewoptions');
    });

    it('ref 指向导航根元素，其他属性透传', () => {
        let ref: HTMLDivElement | undefined;
        render(() => <Anchor ref={(el) => (ref = el)} id="toc" title="Contents" />);
        expect(ref).toBe(screen.getByRole('navigation'));
        expect(ref).toHaveAttribute('id', 'toc');
        expect(ref).toHaveAttribute('title', 'Contents');
    });

    it('Link 的 ref 指向其列表项，其他属性透传', () => {
        let ref: HTMLDivElement | undefined;
        render(() => (
            <Anchor>
                <Link ref={(el) => (ref = el)} data-testid="item" title="a" href="#a" />
            </Anchor>
        ));
        expect(ref).toBe(screen.getByRole('listitem'));
        expect(ref).toBe(screen.getByTestId('item'));
    });

    it('激活时，唯一的子链接保持展开', () => {
        const { container } = renderAnchor({ autoCollapse: true, defaultAnchor: '#docs' });
        expect(linkTitles(container)).toEqual(['welcome', 'api too much to show', 'docs', 'doc1', 'doc2', 'contact']);

        fireEvent.click(link('doc1'));
        expect(link('doc1')).toHaveClass(activeCls);
    });

    it('fragment 与条件包裹内的链接，嵌套方式与直接子节点相同', () => {
        const [show, setShow] = createSignal(true);
        const { container } = render(() => (
            <Anchor autoCollapse>
                <>
                    <Link title="p" href="#p">
                        <Show when={show()}>
                            <Link title="c1" href="#c1" />
                            <Link title="c2" href="#c2" />
                        </Show>
                    </Link>
                    <Link title="q" href="#q" />
                </>
            </Anchor>
        ));
        expect(link('p')).toHaveStyle({ paddingInlineStart: '8px' });
        fireEvent.click(link('p'));
        expect(link('c1')).toHaveStyle({ paddingInlineStart: '16px' });

        fireEvent.click(link('c1'));
        expect(linkTitles(container)).toEqual(['p', 'c1', 'c2', 'q']);

        setShow(false);
        expect(linkTitles(container)).toEqual(['p', 'q']);
    });

    it('Link 之外的子节点原样渲染在列表中', () => {
        render(() => (
            <Anchor>
                <Link title="a" href="#a" />
                <span data-testid="extra">extra</span>
            </Anchor>
        ));
        expect(screen.getByTestId('extra').parentElement).toHaveAttribute('role', 'list');
    });

    it('不把 anchor 位置写入传入的 showTooltip 对象', () => {
        const showTooltip = { opts: { content: 'tip' } };
        render(() => (
            <Anchor position="right" showTooltip={showTooltip}>
                <Link title="a" href="#a" />
            </Anchor>
        ));
        expect(showTooltip).toEqual({ opts: { content: 'tip' } });
    });

    it('position 接受 Tooltip 的全部位置', () => {
        expectTypeOf<NonNullable<AnchorProps['position']>>().toEqualTypeOf<NonNullable<TooltipProps['position']>>();
    });

    it('adapter 查找节点的返回类型包含 null', () => {
        expectTypeOf<ReturnType<AnchorAdapter['getAnchorNode']>>().toEqualTypeOf<HTMLElement | null>();
        expectTypeOf<ReturnType<AnchorAdapter['getContentNode']>>().toEqualTypeOf<HTMLElement | null>();
    });

    it('展开信号对象传入时，无关属性变化不重建链接，也不丢失已激活链接', () => {
        const [props, setProps] = createSignal<AnchorProps & { 'data-n': number }>({ 'data-n': 0, autoCollapse: true });
        const onChange = vi.fn<NonNullable<AnchorProps['onChange']>>();
        render(() => (
            <Anchor {...props()} onChange={onChange}>
                <Link title="a" href="#a">
                    <Link title="a1" href="#a1" />
                </Link>
                <Link title="b" href="#b" />
            </Anchor>
        ));
        fireEvent.click(link('a'));
        const item = link('a');
        const child = link('a1');
        setProps({ 'data-n': 1, autoCollapse: true });
        expect(screen.getByRole('navigation')).toHaveAttribute('data-n', '1');
        expect(link('a')).toBe(item);
        expect(link('a1')).toBe(child);
        expect(link('a')).toHaveClass(activeCls);
        expect(onChange).toHaveBeenCalledTimes(1);
    });
});
