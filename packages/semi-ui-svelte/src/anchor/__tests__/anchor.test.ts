import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { countLiveListeners } from '@test/utils/dom/common';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { AnchorClickEvent, AnchorProps } from '../interface';
import AnchorFixture from './anchor-fixture.svelte';
import { collapsible, flat, nested, type Fixture } from './fixture-data';

type ClickHandler = (event: AnchorClickEvent, link: string) => void;
type ChangeHandler = (current: string, previous: string) => void;

const prefix = 'semi-anchor';
const activeCls = `${prefix}-link-title-active`;

const link = (name: string) => screen.getByRole('link', { name });
const activeLinks = () => document.querySelectorAll(`.${activeCls}`);

function setup(props: AnchorProps = {}, extra: Partial<Fixture> = {}) {
    const store = createStore<Fixture>({ props, sections: ['a', 'b'], ...extra });
    const view = render(AnchorFixture, { props: { store } });
    return { store, view };
}

// jsdom does not lay out: section positions are stubbed per element, relative to the viewport
const setTop = (id: string, top: number) => vi.spyOn(document.getElementById(id) as HTMLElement, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, top, 100, 100));
// the scroll handler is throttled (leading call) and the end of a scroll is debounced, both at 100ms
function scroll(target: Window | Element = window) {
    target.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(200);
    flushSync();
}
function click(element: HTMLElement) {
    element.click();
    flushSync();
}

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    semiGlobal.config = {};
});

describe('Svelte Anchor', () => {
    it('小尺寸与 rail 主题输出对应类名', () => {
        setup({ size: 'small', railTheme: 'tertiary' });
        expect(screen.getByRole('navigation')).toHaveClass(`${prefix}-size-small`);
        expect(document.querySelectorAll(`.${prefix}-slide-bar-tertiary`)).toHaveLength(1);
        expect(document.querySelector(`.${prefix}-slide`)).toHaveClass(`${prefix}-slide-tertiary`);
    });

    it('自定义 class、style 与其他属性落在根元素', () => {
        setup({ class: 'test', style: 'color: red', id: 'toc', 'data-x': 'y' } as AnchorProps);
        const anchor = screen.getByRole('navigation');
        expect(anchor).toHaveClass('test', prefix);
        expect(anchor).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(anchor).toHaveAttribute('id', 'toc');
        expect(anchor).toHaveAttribute('data-x', 'y');
    });

    it('最大高度与最大宽度，数字补 px，使用方 style 中的 max-width 优先', () => {
        const first = setup({ links: nested, maxHeight: 50, maxWidth: '10em' });
        const { style } = screen.getByRole('navigation');
        expect([style.maxHeight, style.maxWidth]).toEqual(['50px', '10em']);
        first.view.unmount();

        setup({ maxWidth: 100, style: 'max-width: 300px' });
        expect(screen.getByRole('navigation')).toHaveStyle({ maxWidth: '300px' });
    });

    it('导航带语言包标签，aria-label 可覆盖', () => {
        const { store } = setup({ 'data-testid': 'toc' } as AnchorProps);
        expect(screen.getByTestId('toc')).toBe(screen.getByRole('navigation', { name: zh_CN.Anchor.label }));
        store.props['aria-label'] = 'Contents';
        flushSync();
        expect(screen.getByRole('navigation', { name: 'Contents' })).toBe(screen.getByTestId('toc'));
    });

    it('链接按嵌套层级缩进 8px，叶子链接不输出空列表', () => {
        setup({ links: nested });
        const pads = [...document.querySelectorAll<HTMLElement>(`.${prefix}-link-title`)].map((el) => [el.textContent, el.style.paddingInlineStart]);
        expect(pads).toEqual([
            ['welcome', '8px'],
            ['api too much to show', '8px'],
            ['docs', '16px'],
            ['doc1', '24px'],
            ['doc2', '24px'],
            ['contact', '8px'],
        ]);
        expect(link('welcome').parentElement?.querySelector('[role="list"]')).toBeNull();
    });

    it('点击展开与收起 autoCollapse 的分支', () => {
        setup({ links: nested, autoCollapse: true });
        expect(activeLinks()).toHaveLength(0);
        expect(screen.queryByRole('link', { name: 'docs' })).toBeNull();

        click(link('api too much to show'));
        expect(activeLinks()).toHaveLength(1);
        expect(link('api too much to show')).toHaveClass(activeCls);
        expect(link('docs')).toBeInTheDocument();

        click(link('welcome'));
        expect(activeLinks()).toHaveLength(1);
        expect(link('welcome')).toHaveClass(activeCls);
        expect(screen.queryByRole('link', { name: 'docs' })).toBeNull();
    });

    it('激活嵌套更深的链接时，其祖先分支保持展开；不折叠时子孙全部显示', () => {
        const collapse = setup({ links: collapsible, autoCollapse: true, defaultAnchor: '#头像' });
        expect(link('1.1.1 Avatar')).toBeInTheDocument();
        expect(link('1.1 组件')).toBeInTheDocument();
        collapse.view.unmount();

        setup({ links: collapsible });
        expect([...document.querySelectorAll(`.${prefix}-link-title`)].map((el) => el.textContent)).toEqual(expect.arrayContaining(['1.1 组件', '1.1.1 Avatar', '1.1.2 Button', '1.1.3 Icon']));
    });

    it('点击时以链接触发 click 与 change，且不修改 hash', () => {
        const onClick = vi.fn<ClickHandler>();
        const onChange = vi.fn<ChangeHandler>();
        setup({ links: nested, onClick, onChange });

        click(link('docs'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith(expect.any(MouseEvent), '#docs');
        expect(onChange).toHaveBeenCalledExactlyOnceWith('#docs', '');
        expect(link('docs')).toHaveClass(activeCls);
        expect(link('docs')).toHaveAttribute('aria-current', 'location');
        expect(link('contact')).not.toHaveAttribute('aria-current');
        expect(window.location.hash).toBe('');

        click(link('contact'));
        expect(onClick).toHaveBeenLastCalledWith(expect.anything(), '#contact');
        expect(onChange).toHaveBeenLastCalledWith('#contact', '#docs');

        click(link('contact'));
        expect(onClick).toHaveBeenCalledTimes(3);
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('click 只在激活链接时触发，点击根元素其他位置不触发', () => {
        const onClick = vi.fn<ClickHandler>();
        setup({ links: flat('a'), onClick });
        click(screen.getByRole('navigation'));
        click(screen.getByRole('listitem'));
        expect(onClick).not.toHaveBeenCalled();
        click(link('a'));
        expect(onClick).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent), '#a');
    });

    it('不传 href 的链接点击时不抛错，仍触发 click，href 视为 #', () => {
        const onClick = vi.fn<ClickHandler>();
        setup({ links: [{ title: 'bare' }], onClick });
        click(link('bare'));
        expect(onClick).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent), '#');
    });

    it('焦点在链接上时按 Enter 激活，禁用的链接忽略点击与 Enter', () => {
        const onClick = vi.fn<ClickHandler>();
        setup({
            links: [
                { href: '#a', title: 'a' },
                { href: '#b', title: 'b', disabled: true },
            ],
            onClick,
        });
        const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
        link('a').dispatchEvent(enter);
        flushSync();
        expect(enter.defaultPrevented).toBe(true);
        expect(onClick).toHaveBeenCalledExactlyOnceWith(expect.any(KeyboardEvent), '#a');

        const other = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
        link('a').dispatchEvent(other);
        expect(onClick).toHaveBeenCalledTimes(1);

        click(link('b'));
        link('b').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(link('b')).toHaveAttribute('aria-disabled', 'true');
        expect(link('b')).toHaveClass(`${prefix}-link-title-disabled`);
        expect(link('a')).toHaveAttribute('tabindex', '0');
    });

    it('defaultAnchor 挂载时激活链接，且不触发 change 或 click；以数字开头的 href 也可以', () => {
        const onClick = vi.fn<ClickHandler>();
        const onChange = vi.fn<ChangeHandler>();
        const target = document.createElement('div');
        target.id = '1-intro';
        document.body.append(target);
        setup({ links: [{ href: '#1-intro', title: 'intro' }], defaultAnchor: '#1-intro', onClick, onChange });
        expect(link('intro')).toHaveClass(activeCls);
        expect(onClick).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
        target.remove();
    });

    it('未设置 showTooltip 时字符串标题作为原生 title，空标题不输出；设置后标题显示为省略文本', () => {
        const plain = setup({ links: [{ href: '#a', title: 'Alpha' }, { href: '#b', title: '' }, { href: '#c' }] });
        const titles = [...document.querySelectorAll(`.${prefix}-link-title`)].map((el) => el.getAttribute('title'));
        expect(titles).toEqual(['Alpha', null, null]);
        plain.view.unmount();

        setup({ links: [{ href: '#a', title: 'Alpha' }], showTooltip: true });
        expect(link('Alpha')).not.toHaveAttribute('title');
        expect(link('Alpha').querySelector(`.${prefix}-link-tooltip.semi-typography-ellipsis`)).toBeInTheDocument();
        expect(link('Alpha').querySelector(`.${prefix}-link-tooltip`)).toHaveAttribute('tabindex', '-1');
    });

    it('title snippet 渲染节点标题，且不输出原生 title', () => {
        setup({ links: flat('a') }, { nodeTitles: true });
        const title = document.querySelector(`.${prefix}-link-title`) as HTMLElement;
        expect(title.querySelector('b')).toHaveTextContent('a');
        expect(title).not.toHaveAttribute('title');
    });

    it('点击链接后，滑块移动到其位置', () => {
        vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
            return this.textContent === 'contact' ? 120 : 0;
        });
        setup({ links: nested });
        click(link('contact'));
        expect(document.querySelector(`.${prefix}-slide-bar`)).toHaveStyle({ top: '120px' });
        expect(document.querySelector(`.${prefix}-slide-bar`)).toHaveClass(`${prefix}-slide-bar-active`);
    });

    it('当前链接上方的链接增加后，滑块跟随当前链接的新位置', () => {
        let contactTop = 120;
        vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
            return this.textContent === 'contact' ? contactTop : 0;
        });
        const { store } = setup({ links: flat('contact') });
        click(link('contact'));
        const bar = document.querySelector(`.${prefix}-slide-bar`);
        expect(bar).toHaveStyle({ top: '120px' });

        contactTop = 150;
        store.props.links = flat('extra', 'contact');
        flushSync();
        expect(bar).toHaveStyle({ top: '150px' });
    });

    describe('滚动', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        it('激活位于顶部之上的最后一个区块，并上报变化', () => {
            const onChange = vi.fn<ChangeHandler>();
            setup({ links: flat('a', 'b'), onChange });
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
            expect(activeLinks()).toHaveLength(0);
        });

        it('所有区块都在顶部以下时滚动，不上报变化；回到顶部时上报清空', () => {
            const onChange = vi.fn<ChangeHandler>();
            setup({ links: flat('a', 'b'), onChange });
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
            setup({ links: flat('a', 'b') });
            setTop('a', -50);
            setTop('b', 40);
            click(link('b'));
            expect(link('b')).toHaveClass(activeCls);
            // the target was already in place: the click scrolled nothing
            vi.advanceTimersByTime(200);

            scroll();
            expect(link('a')).toHaveClass(activeCls);
        });

        it('点击引起的滚动在稳定前忽略', () => {
            setup({ links: flat('a', 'b') });
            setTop('a', -50);
            setTop('b', 40);
            click(link('b'));
            // the first scroll after the click is the click's own
            scroll();
            expect(link('b')).toHaveClass(activeCls);
            scroll();
            expect(link('a')).toHaveClass(activeCls);
        });

        it('getContainer 读取的响应式值晚出现时迁移监听', () => {
            const holder = createStore<{ el: HTMLElement | null }>({ el: null });
            setup({ links: flat('a', 'b'), getContainer: () => holder.el });
            const box = document.createElement('div');
            document.body.append(box);
            setTop('a', -50);
            setTop('b', 40);
            // until the box exists the container is the window
            scroll(box);
            expect(activeLinks()).toHaveLength(0);

            holder.el = box;
            flushSync();
            scroll(box);
            expect(link('a')).toHaveClass(activeCls);
            box.remove();
        });

        it('以 getContainer 返回的容器与 offsetTop 计算位置', () => {
            setup({ links: flat('a', 'b'), getContainer: () => document.getElementById('box'), offsetTop: 30 }, { boxId: 'box', showBox: true });
            const box = document.getElementById('box') as HTMLElement;
            vi.spyOn(box, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 100, 100, 500));
            setTop('a', 60);
            setTop('b', 120);
            scroll(window);
            expect(activeLinks()).toHaveLength(0);

            scroll(box);
            expect(link('b')).toHaveClass(activeCls);
        });

        it('links 增删后，只有现存的链接参与高亮', () => {
            const { store } = setup({ links: flat('a', 'b') });
            setTop('a', -50);
            setTop('b', -10);
            scroll();
            expect(link('b')).toHaveClass(activeCls);

            store.props.links = flat('a');
            flushSync();
            scroll();
            expect(link('a')).toHaveClass(activeCls);

            store.props.links = flat('a', 'b');
            flushSync();
            scroll();
            expect(link('b')).toHaveClass(activeCls);
        });

        it('href 变化后，旧 href 不再参与高亮，新 href 参与', () => {
            const { store } = setup({ links: [{ href: '#a', title: 'x' }] });
            setTop('a', -50);
            setTop('b', -10);
            scroll();
            expect(link('x')).toHaveClass(activeCls);

            store.props.links = [{ href: '#b', title: 'x' }];
            flushSync();
            setTop('a', -5);
            setTop('b', 40);
            scroll();
            // only #b is a link now, and it is below the top
            expect(link('x')).not.toHaveClass(activeCls);
            setTop('b', -10);
            scroll();
            expect(link('x')).toHaveClass(activeCls);
        });

        it('卸载时移除滚动监听', () => {
            const add = vi.spyOn(window, 'addEventListener');
            const remove = vi.spyOn(window, 'removeEventListener');
            const { view } = setup({ links: nested });
            expect(countLiveListeners(add, remove, 'scroll')).toBe(2);
            view.unmount();
            expect(countLiveListeners(add, remove, 'scroll')).toBe(0);
        });

        it('getContainer 返回其他元素时迁移监听', () => {
            const byId = (id: string) => () => document.getElementById(id);
            const { store } = setup({ links: flat('a', 'b'), getContainer: byId('one') }, { extraBoxes: true });
            const one = document.getElementById('one') as HTMLElement;
            const two = document.getElementById('two') as HTMLElement;
            const addToOne = vi.spyOn(one, 'addEventListener');
            const removeFromOne = vi.spyOn(one, 'removeEventListener');
            setTop('a', -50);
            setTop('b', 40);

            store.props.getContainer = byId('two');
            flushSync();
            expect(countLiveListeners(addToOne, removeFromOne, 'scroll')).toBe(0);
            expect(removeFromOne).toHaveBeenCalled();
            scroll(one);
            expect(activeLinks()).toHaveLength(0);
            scroll(two);
            expect(link('a')).toHaveClass(activeCls);
        });

        it('卸载时取消待执行的滚动更新', () => {
            const onChange = vi.fn<ChangeHandler>();
            const { view } = setup({ links: flat('a'), onChange });
            setTop('a', -50);
            window.dispatchEvent(new Event('scroll'));
            flushSync();
            expect(onChange).toHaveBeenCalledTimes(1);
            setTop('a', 50);
            // inside the throttle window: the update is deferred to the trailing call
            window.dispatchEvent(new Event('scroll'));
            view.unmount();
            vi.advanceTimersByTime(200);
            expect(onChange).toHaveBeenCalledTimes(1);
        });
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，传入的 prop 优先', () => {
        semiGlobal.config.overrideDefaultProps = { Anchor: { size: 'small', railTheme: 'muted', getContainer: () => document.getElementById('global-box') } };
        const view = setup();
        expect(screen.getByRole('navigation')).toHaveClass(`${prefix}-size-small`);
        expect(document.querySelector(`.${prefix}-slide-bar`)).toHaveClass(`${prefix}-slide-bar-muted`);
        view.view.unmount();

        setup({ size: 'default' });
        expect(screen.getByRole('navigation')).toHaveClass(`${prefix}-size-default`);
    });

    it('全局 getContainer 在未传时生效，传入时优先', () => {
        vi.useFakeTimers();
        const globalBox = document.createElement('div');
        const ownBox = document.createElement('div');
        document.body.append(globalBox, ownBox);
        semiGlobal.config.overrideDefaultProps = { Anchor: { getContainer: () => globalBox } };
        const first = setup({ links: flat('a') });
        setTop('a', -50);
        scroll(window);
        expect(activeLinks()).toHaveLength(0);
        scroll(globalBox);
        expect(link('a')).toHaveClass(activeCls);
        first.view.unmount();

        setup({ links: flat('a'), getContainer: () => ownBox });
        setTop('a', -50);
        scroll(globalBox);
        expect(activeLinks()).toHaveLength(0);
        scroll(ownBox);
        expect(link('a')).toHaveClass(activeCls);
        globalBox.remove();
        ownBox.remove();
    });

    it('不把 anchor 位置写入传入的 showTooltip 对象', () => {
        const showTooltip = { opts: { content: 'x' } } as NonNullable<AnchorProps['showTooltip']>;
        setup({ links: flat('a'), position: 'right', showTooltip });
        expect(showTooltip).toEqual({ opts: { content: 'x' } });
    });
});
