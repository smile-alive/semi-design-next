/** @jsxImportSource vue */
import { createSSRApp, defineComponent, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import type { AnchorAdapter } from '@fibrae/semi-foundation/anchor/foundation';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { countLiveListeners, render } from '@test/utils/vue';
import elementType from '../../_base/element-type';
import semiGlobal, { semiGlobalKey } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider/config-provider.vue';
import type { TooltipProps } from '../../tooltip/interface';
import Anchor, { AnchorLink } from '../index';
import type { AnchorEmits, AnchorProps } from '../interface';
import CollapseTree from './fixtures/collapse-tree.vue';
import Nested from './fixtures/nested.vue';
import RefBox from './fixtures/ref-box.vue';
import Refs from './fixtures/refs.vue';
import Sections from './fixtures/sections.vue';
import Wrapped from './fixtures/wrapped.vue';

type ClickHandler = (...args: AnchorEmits['click']) => void;
type ChangeHandler = (...args: AnchorEmits['change']) => void;

const prefix = 'semi-anchor';
const activeCls = `${prefix}-link-title-active`;

const link = (name: string) => screen.getByRole('link', { name });
const linkTitles = (root: ParentNode = document) => [...root.querySelectorAll(`.${prefix}-link-title`)].map((el) => el.textContent);
const links = (list: [title: string, href: string][]) => () => list.map(([title, href]) => <AnchorLink title={title} href={href} />);
// jsdom does not lay out: section positions are stubbed per element, relative to the viewport
const setTop = (id: string, top: number) => vi.spyOn(document.getElementById(id) as HTMLElement, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, top, 100, 100));
// the scroll handler is throttled (leading call) and the end of a scroll is debounced, both at 100ms
async function scroll(target: Window | Element = window) {
    target.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(200);
    await nextTick();
}
async function click(element: HTMLElement) {
    element.click();
    await nextTick();
}

afterEach(() => {
    vi.useRealTimers();
    semiGlobal.config = {};
});

describe('Anchor', () => {
    it('anchor 小尺寸', () => {
        render(Anchor, { props: { size: 'small' } });
        expect(screen.getByRole('navigation')).toHaveClass(`${prefix}-size-small`);
    });

    it('anchor rail 主题', () => {
        render(Anchor, { props: { railTheme: 'tertiary' } });
        expect(document.querySelectorAll(`.${prefix}-slide-bar-tertiary`)).toHaveLength(1);
        expect(document.querySelector(`.${prefix}-slide`)).toHaveClass(`${prefix}-slide-tertiary`);
    });

    it('anchor 自定义 class、style 与其他属性落在根元素', () => {
        render(Anchor, { attrs: { class: 'test', style: { color: 'red' }, id: 'toc', 'data-x': 'y' } });
        const anchor = screen.getByRole('navigation');
        expect(anchor).toHaveClass('test', prefix);
        expect(anchor).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(anchor).toHaveAttribute('id', 'toc');
        expect(anchor).toHaveAttribute('data-x', 'y');
    });

    it('点击展开与收起 autoCollapse 的分支', async () => {
        render(Nested, { attrs: { autoCollapse: true } });
        expect(document.querySelectorAll(`.${activeCls}`)).toHaveLength(0);
        expect(screen.queryByRole('link', { name: 'docs' })).toBeNull();

        await userEvent.click(link('api too much to show'));
        expect(document.querySelectorAll(`.${activeCls}`)).toHaveLength(1);
        expect(link('api too much to show')).toHaveClass(activeCls);
        expect(link('docs')).toBeInTheDocument();

        await userEvent.click(link('welcome'));
        expect(document.querySelectorAll(`.${activeCls}`)).toHaveLength(1);
        expect(link('welcome')).toHaveClass(activeCls);
        expect(screen.queryByRole('link', { name: 'docs' })).toBeNull();
    });

    it('anchor 最大高度与最大宽度，数字补 px', () => {
        render(Nested, { attrs: { maxHeight: 50, maxWidth: '10em' } });
        const { style } = screen.getByRole('navigation');
        expect([style.maxHeight, style.maxWidth]).toEqual(['50px', '10em']);
    });

    it('使用方 style 中的 max-width 优先于 maxWidth', () => {
        render(Anchor, { props: { maxWidth: 100 }, attrs: { style: { maxWidth: '300px' } } });
        expect(screen.getByRole('navigation')).toHaveStyle({ maxWidth: '300px' });
    });

    it('为导航添加标签，并把 data-* 属性传给根元素', async () => {
        const view = render(Anchor, { attrs: { 'data-testid': 'toc' } });
        expect(screen.getByTestId('toc')).toBe(screen.getByRole('navigation', { name: zh_CN.Anchor.label }));
        await view.rerender({ 'aria-label': 'Contents' });
        expect(screen.getByRole('navigation', { name: 'Contents' })).toBe(screen.getByTestId('toc'));
    });

    it('点击时以链接触发 click 与 change，且不修改 hash', async () => {
        const onClick = vi.fn<ClickHandler>();
        const onChange = vi.fn<ChangeHandler>();
        render(Nested, { attrs: { onClick, onChange } });

        await click(link('docs'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith(expect.any(MouseEvent), '#docs');
        expect(onChange).toHaveBeenCalledExactlyOnceWith('#docs', '');
        expect(link('docs')).toHaveClass(activeCls);
        expect(link('docs')).toHaveAttribute('aria-current', 'location');
        expect(link('contact')).not.toHaveAttribute('aria-current');
        expect(window.location.hash).toBe('');

        await click(link('contact'));
        expect(onClick).toHaveBeenLastCalledWith(expect.anything(), '#contact');
        expect(onChange).toHaveBeenLastCalledWith('#contact', '#docs');

        await click(link('contact'));
        expect(onClick).toHaveBeenCalledTimes(3);
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('click 只在激活链接时触发，点击根元素其他位置不触发', async () => {
        const onClick = vi.fn<ClickHandler>();
        render(Anchor, { attrs: { onClick }, slots: { default: links([['a', '#a']]) } });
        await click(screen.getByRole('navigation'));
        await click(screen.getByRole('listitem'));
        expect(onClick).not.toHaveBeenCalled();
        await click(link('a'));
        expect(onClick).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent), '#a');
    });

    it('不传 href 的链接点击时不抛错，仍触发 click', async () => {
        const onClick = vi.fn<ClickHandler>();
        render(Anchor, { attrs: { onClick }, slots: { default: () => <AnchorLink title="no href" /> } });
        await click(link('no href'));
        expect(onClick).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent), '#');
    });

    it('href 以数字开头时可作为 defaultAnchor 挂载并激活', async () => {
        render(Sections, {
            props: { links: ['1-intro'], sections: ['1-intro'] },
            attrs: { defaultAnchor: '#1-intro' },
        });
        await nextTick();
        expect(link('1-intro')).toHaveClass(activeCls);
    });

    it('焦点在链接上时按 Enter 激活，禁用的链接忽略点击', async () => {
        const onClick = vi.fn<ClickHandler>();
        render(Anchor, {
            attrs: { onClick },
            slots: {
                default: () => (
                    <>
                        <AnchorLink title="a" href="#a" />
                        <AnchorLink title="b" href="#b" disabled />
                    </>
                ),
            },
        });
        link('a').focus();
        await userEvent.keyboard('{Tab}');
        expect(onClick).not.toHaveBeenCalled();
        link('a').focus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'keydown' }), '#a');
        expect(onClick.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
        expectTypeOf<AnchorEmits['click'][0]>().toEqualTypeOf<MouseEvent | KeyboardEvent>();
        expect(link('a')).toHaveClass(activeCls);

        await click(link('b'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(link('b')).toHaveAttribute('aria-disabled', 'true');
        expect(link('a')).toHaveAttribute('aria-disabled', 'false');
        expect(link('b')).toHaveClass(`${prefix}-link-title-disabled`);
        expect(link('b')).not.toHaveClass(activeCls);
    });

    it('defaultAnchor 挂载时激活链接，且不触发 change 或 click', async () => {
        const onClick = vi.fn<ClickHandler>();
        const onChange = vi.fn<ChangeHandler>();
        render(Nested, { attrs: { defaultAnchor: '#contact', onClick, onChange } });
        await nextTick();
        expect(link('contact')).toHaveClass(activeCls);
        expect(document.querySelector(`.${prefix}-slide-bar`)).toHaveClass(`${prefix}-slide-bar-active`);
        expect(onChange).not.toHaveBeenCalled();
        expect(onClick).not.toHaveBeenCalled();
    });

    it('autoCollapse 只展开包含当前激活链接的分支', async () => {
        render(CollapseTree);
        await nextTick();
        expect(linkTitles()).toEqual(['p1', 'c1', 'g1', 'g2', 'c2', 'p2']);
    });

    it('未设置 showTooltip 时字符串标题作为原生 title；设置后标题显示为省略文本', async () => {
        const view = render(Anchor, { props: { size: 'small' }, slots: { default: links([['alpha', '#a']]) } });
        expect(link('alpha')).toHaveAttribute('title', 'alpha');
        expect(document.querySelector(`.${prefix}-link-tooltip`)).toBeNull();

        await view.rerender({ size: 'small', showTooltip: true });
        expect(link('alpha')).not.toHaveAttribute('title');
        await click(link('alpha'));
        const text = document.querySelector(`.${prefix}-link-tooltip`);
        expect(text).toHaveTextContent('alpha');
        expect(text).toHaveClass(`${prefix}-link-tooltip-small`, `${prefix}-link-tooltip-active`);
        expect(text).toHaveAttribute('tabindex', '-1');
    });

    it('未传 title 或 title 为空字符串时不输出空的原生 title', () => {
        render(Anchor, {
            slots: {
                default: () => (
                    <>
                        <AnchorLink href="#a" />
                        <AnchorLink href="#b" title="" />
                    </>
                ),
            },
        });
        for (const el of screen.getAllByRole('link')) {
            expect(el).not.toHaveAttribute('title');
        }
    });

    it('#title 插槽渲染节点标题，优先于 title prop，且不输出原生 title', async () => {
        const slots = {
            default: () => (
                <AnchorLink href="#a" title="plain">
                    {{
                        title: () => <b class="rich">Rich</b>,
                    }}
                </AnchorLink>
            ),
        };
        const view = render(Anchor, { slots });
        expect(link('Rich')).not.toHaveAttribute('title');
        expect(link('Rich').querySelector('.rich')).not.toBeNull();
        expect(screen.queryByText('plain')).toBeNull();
        view.unmount();
        render(Anchor, { props: { showTooltip: true }, slots });
        expect(document.querySelector(`.${prefix}-link-tooltip`)).toHaveTextContent('Rich');
        expect(link('Rich')).not.toHaveAttribute('title');
    });

    it('嵌套链接每级缩进 8px，RTL 下由 CSS 方向决定', () => {
        const view = render(Nested);
        expect(link('welcome')).toHaveStyle({ paddingInlineStart: '8px' });
        expect(link('docs')).toHaveStyle({ paddingInlineStart: '16px' });
        expect(link('doc1')).toHaveStyle({ paddingInlineStart: '24px' });
        view.unmount();

        render(ConfigProvider, {
            props: { direction: 'rtl' },
            slots: {
                default: () => (
                    <Anchor>
                        {{
                            default: () => (
                                <AnchorLink title="api" href="#api">
                                    {{ default: links([['docs', '#docs']]) }}
                                </AnchorLink>
                            ),
                        }}
                    </Anchor>
                ),
            },
        });
        expect(link('api').closest('[dir="rtl"]')).not.toBeNull();
        expect(link('api')).toHaveStyle({ paddingInlineStart: '8px' });
        expect(link('docs')).toHaveStyle({ paddingInlineStart: '16px' });
    });

    it('Link 把 class、style 与其他属性传给其列表项', () => {
        render(Anchor, {
            slots: {
                default: () => <AnchorLink class="mine" style={{ color: 'red' }} title="a" href="#a" data-testid="item" />,
            },
        });
        const item = screen.getByRole('listitem');
        expect(item).toHaveClass(`${prefix}-link`, 'mine');
        expect(item).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(item).toBe(screen.getByTestId('item'));
    });

    it('点击链接后，滑块移动到其位置', async () => {
        vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
            return this.textContent === 'contact' ? 120 : 0;
        });
        render(Nested);
        await click(link('contact'));
        await nextTick();
        expect(document.querySelector(`.${prefix}-slide-bar`)).toHaveStyle({ top: '120px' });
    });

    it('当前链接上方的链接增加后，滑块跟随当前链接的新位置', async () => {
        let contactTop = 120;
        vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
            return this.textContent === 'contact' ? contactTop : 0;
        });
        const extra = ref(false);
        render(() => (
            <Anchor>
                {{
                    default: () => (
                        <>
                            {extra.value ? <AnchorLink title="extra" href="#extra" /> : null}
                            <AnchorLink title="contact" href="#contact" />
                        </>
                    ),
                }}
            </Anchor>
        ));
        await click(link('contact'));
        await nextTick();
        const bar = document.querySelector(`.${prefix}-slide-bar`);
        expect(bar).toHaveStyle({ top: '120px' });

        contactTop = 150;
        extra.value = true;
        await nextTick();
        await nextTick();
        expect(bar).toHaveStyle({ top: '150px' });
    });

    describe('滚动', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        it('激活位于顶部之上的最后一个区块，并上报变化', async () => {
            const onChange = vi.fn<ChangeHandler>();
            render(Sections, { attrs: { onChange } });
            setTop('a', -50);
            setTop('b', 40);
            await scroll();
            expect(link('a')).toHaveClass(activeCls);
            expect(onChange).toHaveBeenLastCalledWith('#a', '');

            setTop('b', -10);
            await scroll();
            expect(link('b')).toHaveClass(activeCls);
            expect(onChange).toHaveBeenLastCalledWith('#b', '#a');

            setTop('a', 10);
            setTop('b', 40);
            await scroll();
            expect(document.querySelector(`.${activeCls}`)).toBeNull();
        });

        it('所有区块都在顶部以下时滚动，不上报变化；回到顶部时上报清空', async () => {
            const onChange = vi.fn<ChangeHandler>();
            render(Sections, { attrs: { onChange } });
            setTop('a', 10);
            setTop('b', 40);
            await scroll();
            expect(onChange).not.toHaveBeenCalled();

            setTop('a', -50);
            await scroll();
            expect(onChange).toHaveBeenLastCalledWith('#a', '');

            setTop('a', 10);
            await scroll();
            expect(onChange).toHaveBeenLastCalledWith('', '#a');
            expect(onChange).toHaveBeenCalledTimes(2);
        });

        it('点击未引起滚动时，下一次滚动仍更新高亮', async () => {
            render(Sections);
            setTop('a', -50);
            setTop('b', 40);
            await click(link('b'));
            expect(link('b')).toHaveClass(activeCls);
            // the target was already in place: the click scrolled nothing
            vi.advanceTimersByTime(200);

            await scroll();
            expect(link('a')).toHaveClass(activeCls);
        });

        it('稳定的 getContainer 在容器晚出现时迁移监听', async () => {
            const getContainer = () => document.getElementById('late-box');
            const view = render(Sections, { props: { boxId: 'late-box', showBox: false }, attrs: { getContainer } });
            await nextTick();
            await view.rerender({ boxId: 'late-box', showBox: true, 'data-show': 'true' });
            setTop('a', -50);
            setTop('b', 40);
            await scroll(document.getElementById('late-box') as HTMLElement);
            expect(link('a')).toHaveClass(activeCls);
        });

        it('getContainer 读取的模板 ref 晚出现时，不更新 Anchor 也迁移监听', async () => {
            const view = render(RefBox);
            // let the update from the links registering settle, so only the watch can see the box
            await nextTick();
            await view.rerender({ showBox: true });
            setTop('a', -50);
            setTop('b', 40);
            await scroll(document.getElementById('ref-box') as HTMLElement);
            expect(link('a')).toHaveClass(activeCls);
        });

        it('以 getContainer 返回的容器与 offsetTop 计算位置', async () => {
            render(Sections, {
                props: { boxId: 'box' },
                attrs: { getContainer: () => document.getElementById('box'), offsetTop: 30 },
            });
            const box = document.getElementById('box') as HTMLElement;
            vi.spyOn(box, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 100, 100, 500));
            setTop('a', 60);
            setTop('b', 120);
            await scroll(window);
            expect(document.querySelector(`.${activeCls}`)).toBeNull();

            await scroll(box);
            expect(link('b')).toHaveClass(activeCls);
        });

        it('点击引起的滚动在稳定前忽略', async () => {
            render(Sections);
            setTop('a', -50);
            setTop('b', 40);
            await click(link('b'));
            // the first scroll after the click is the click's own
            await scroll();
            expect(link('b')).toHaveClass(activeCls);
            await scroll();
            expect(link('a')).toHaveClass(activeCls);
        });

        it('注册已挂载的链接，并忘记已卸载的链接', async () => {
            const view = render(Sections);
            setTop('a', -50);
            setTop('b', -10);
            await scroll();
            expect(link('b')).toHaveClass(activeCls);

            await view.rerender({ links: ['a'] });
            await scroll();
            expect(link('a')).toHaveClass(activeCls);

            await view.rerender({ links: ['a', 'b'] });
            await scroll();
            expect(link('b')).toHaveClass(activeCls);
        });

        it('Link 的 href 变化后，旧 href 不再参与高亮，新 href 参与', async () => {
            const href = ref('#a');
            render(Anchor, { slots: { default: () => <AnchorLink title="x" href={href.value} /> } });
            render({
                render: () => (
                    <>
                        <h2 id="a">A</h2>
                        <h2 id="b">B</h2>
                    </>
                ),
            });
            setTop('a', -50);
            setTop('b', -10);
            await scroll();
            expect(link('x')).toHaveClass(activeCls);

            href.value = '#b';
            await nextTick();
            setTop('a', -5);
            setTop('b', 40);
            await scroll();
            // only #b is registered now, and it is below the top
            expect(link('x')).not.toHaveClass(activeCls);
            setTop('b', -10);
            await scroll();
            expect(link('x')).toHaveClass(activeCls);
        });

        it('卸载时移除滚动监听', () => {
            const add = vi.spyOn(window, 'addEventListener');
            const remove = vi.spyOn(window, 'removeEventListener');
            const view = render(Nested);
            expect(countLiveListeners(add, remove, 'scroll')).toBe(2);
            view.unmount();
            expect(countLiveListeners(add, remove, 'scroll')).toBe(0);
        });

        it('getContainer 返回其他元素时迁移监听', async () => {
            const byId = (id: string) => () => document.getElementById(id);
            const view = render(Sections, { props: { extraBoxes: true }, attrs: { getContainer: byId('one') } });
            const one = document.getElementById('one') as HTMLElement;
            const two = document.getElementById('two') as HTMLElement;
            const addToOne = vi.spyOn(one, 'addEventListener');
            const removeFromOne = vi.spyOn(one, 'removeEventListener');
            setTop('a', -50);
            setTop('b', 40);

            await view.rerender({ extraBoxes: true, getContainer: byId('two') });
            expect(countLiveListeners(addToOne, removeFromOne, 'scroll')).toBe(0);
            expect(removeFromOne).toHaveBeenCalled();
            await scroll(one);
            expect(document.querySelector(`.${activeCls}`)).toBeNull();
            await scroll(two);
            expect(link('a')).toHaveClass(activeCls);
        });

        it('卸载时取消待执行的滚动更新', async () => {
            const onChange = vi.fn<ChangeHandler>();
            const view = render(Sections, { props: { links: ['a'] }, attrs: { onChange } });
            setTop('a', -50);
            window.dispatchEvent(new Event('scroll'));
            await nextTick();
            expect(onChange).toHaveBeenCalledTimes(1);
            setTop('a', 50);
            // inside the throttle window: the update is deferred to the trailing call
            window.dispatchEvent(new Event('scroll'));
            view.unmount();
            vi.advanceTimersByTime(200);
            expect(onChange).toHaveBeenCalledTimes(1);
        });
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Anchor: { size: 'small', railTheme: 'muted' } };
        render(Anchor);
        expect(screen.getByRole('navigation')).toHaveClass(`${prefix}-size-small`);
        expect(document.querySelector(`.${prefix}-slide-bar`)).toHaveClass(`${prefix}-slide-bar-muted`);
    });

    it('全局 getContainer 在未传时生效，传入时优先；app 注入的配置优先于模块配置', async () => {
        vi.useFakeTimers();
        const box = document.createElement('div');
        document.body.append(box);
        semiGlobal.config.overrideDefaultProps = { Anchor: { getContainer: () => box } };
        const add = vi.spyOn(box, 'addEventListener');
        const remove = vi.spyOn(box, 'removeEventListener');
        const view = render(Anchor, { slots: { default: links([['a', '#a']]) } });
        expect(countLiveListeners(add, remove, 'scroll')).toBe(2);
        view.unmount();

        const own = document.createElement('div');
        const addOwn = vi.spyOn(own, 'addEventListener');
        const removeOwn = vi.spyOn(own, 'removeEventListener');
        const view2 = render(Anchor, { props: { getContainer: () => own } });
        expect(countLiveListeners(addOwn, removeOwn, 'scroll')).toBe(2);
        expect(countLiveListeners(add, remove, 'scroll')).toBe(0);
        view2.unmount();

        render(Anchor, {
            global: {
                provide: {
                    [semiGlobalKey as symbol]: { config: { overrideDefaultProps: { Anchor: { size: 'small' } } } },
                },
            },
        });
        expect(screen.getByRole('navigation')).toHaveClass(`${prefix}-size-small`);
        box.remove();
    });

    it('ref 的 $el 指向导航根元素与 Link 的列表项', () => {
        const ready = vi.fn<(anchor: Element, item: Element) => void>();
        render(Refs, { attrs: { onReady: ready } });
        expect(ready).toHaveBeenCalledWith(screen.getByRole('navigation'), screen.getByRole('listitem'));
    });

    it('Anchor.Link 即 AnchorLink，并以 elementType 识别', () => {
        expect(Anchor.Link).toBe(AnchorLink);
        expect(elementType(<AnchorLink />)).toBe('Anchor.Link');
    });

    it('激活时，唯一的子链接保持展开', async () => {
        render(Nested, { attrs: { autoCollapse: true, defaultAnchor: '#docs' } });
        await nextTick();
        expect(linkTitles()).toEqual(['welcome', 'api too much to show', 'docs', 'doc1', 'doc2', 'contact']);

        await click(link('doc1'));
        expect(link('doc1')).toHaveClass(activeCls);
    });

    it('fragment 或包装元素内的链接，嵌套方式与直接子节点相同', async () => {
        render(Wrapped);
        expect(link('p')).toHaveStyle({ paddingInlineStart: '8px' });
        expect(screen.queryByRole('link', { name: 'c1' })).toBeNull();
        await click(link('p'));
        expect(link('c1')).toHaveStyle({ paddingInlineStart: '16px' });
        expect((document.querySelector('.group') as HTMLElement).getAttributeNames()).toEqual(['class']);

        await click(link('c1'));
        expect(linkTitles()).toEqual(['p', 'c1', 'c2', 'q']);
    });

    it('自定义组件内的 Link 不参与展开判断', async () => {
        const Box = defineComponent((_, { slots }) => () => <section>{slots.default?.()}</section>);
        render(Anchor, {
            props: { autoCollapse: true, defaultAnchor: '#c' },
            slots: {
                default: () => (
                    <AnchorLink title="p" href="#p">
                        {{
                            default: () => <Box>{{ default: links([['c', '#c']]) }}</Box>,
                        }}
                    </AnchorLink>
                ),
            },
        });
        await nextTick();
        expect(linkTitles()).toEqual(['p']);
    });

    it('不把 anchor 位置写入传入的 showTooltip 对象', () => {
        const showTooltip = { opts: { mouseEnterDelay: 10 } };
        render(Anchor, { props: { position: 'right', showTooltip }, slots: { default: links([['a', '#a']]) } });
        expect(showTooltip).toEqual({ opts: { mouseEnterDelay: 10 } });
    });

    it('adapter 查找节点的返回类型包含 null', () => {
        expectTypeOf<ReturnType<AnchorAdapter['getAnchorNode']>>().toEqualTypeOf<HTMLElement | null>();
        expectTypeOf<ReturnType<AnchorAdapter['getContentNode']>>().toEqualTypeOf<HTMLElement | null>();
    });

    it('position 接受 Tooltip 的全部位置', () => {
        expectTypeOf<NonNullable<AnchorProps['position']>>().toEqualTypeOf<NonNullable<TooltipProps['position']>>();
    });

    it('Link 不在 Anchor 内时抛出明确错误', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(() => render(AnchorLink, { props: { title: 'a' } })).toThrow('Anchor.Link must be used inside Anchor');
    });

    it('服务端渲染无激活链接，折叠分支按初始状态不输出，与客户端首次渲染一致', async () => {
        const tree = () => (
            <Anchor autoCollapse>
                {{
                    default: () => (
                        <>
                            <AnchorLink title="p" href="#p">
                                {{ default: links([['c', '#c']]) }}
                            </AnchorLink>
                            <AnchorLink title="q" href="#q" />
                        </>
                    ),
                }}
            </Anchor>
        );
        const container = document.createElement('div');
        container.innerHTML = await renderToString(createSSRApp({ render: tree }));
        expect(container.querySelector(`.${activeCls}`)).toBeNull();
        expect(linkTitles(container)).toEqual(['p', 'q']);
        const view = render({ render: tree });
        expect(linkTitles(view.container)).toEqual(linkTitles(container));
    });
});
