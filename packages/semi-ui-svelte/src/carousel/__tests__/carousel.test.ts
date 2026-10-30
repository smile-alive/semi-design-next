import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { mockMatchMediaCore } from '@test/utils/dom/match-media-core';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import Arrows from './carousel-arrows.svelte';
import Fixture, { type FixtureStore } from './carousel-fixture.svelte';
import Rtl from './carousel-rtl.svelte';

type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

const prefix = `${BASE_CLASS_PREFIX}-carousel`;
const query = (container: Element, suffix: string) => container.querySelector<HTMLElement>(`.${prefix}-${suffix}`);
const getRoot = (container: Element) => container.querySelector<HTMLElement>(`.${prefix}`) as HTMLElement;
const getActive = (container: Element) => query(container, 'content-item-active');
const getIndicators = (container: Element) => [...container.querySelectorAll<HTMLElement>(`.${prefix}-indicator-item`)];
const activeTitle = (container: Element) => getActive(container)?.textContent;
function must<V>(value?: V | null): V {
    if (value == null) {
        throw new Error('expected a value');
    }
    return value;
}
const tabs = () => screen.getAllByRole('tab');

// Props and the slide count live in reactive state so a test can change them, as a parent re-render would.
function setup(props: FixtureStore['props'] = {}, { count = 3, mode = 'uncontrolled', activeIndex, accept = true }: { count?: number; mode?: Mode; activeIndex?: number; accept?: boolean } = {}) {
    const store = createStore<FixtureStore>({ count, activeIndex, accept, log: [], props: { autoPlay: false, ...props } });
    const ref: { current?: { play: () => void; stop: () => void; goTo: (index: number) => void; prev: () => void; next: () => void } } = {};
    const view = render(Fixture, { props: { mode, store, ref: ref as never } });
    const click = async (element: Element) => {
        await fireEvent.click(element);
        flushSync();
    };
    return { ...view, store, handle: () => must(ref.current), click, next: () => click(must(query(view.container, 'arrow-next'))), prev: () => click(must(query(view.container, 'arrow-prev'))) };
}

async function tick(ms: number) {
    await vi.advanceTimersByTimeAsync(ms);
    flushSync();
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte Carousel', () => {
    it('基础渲染', () => {
        const { container } = setup();
        expect(query(container, 'content')?.children).toHaveLength(3);
        expect(getActive(container)).toHaveTextContent(/^index0$/);
    });

    it('class、style 与 data-* 落在根元素', () => {
        const { container } = setup({ class: 'test', style: 'color: red', 'data-testid': 'carousel' });
        expect(getRoot(container)).toHaveClass('test');
        expect(getRoot(container)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getRoot(container)).toHaveAttribute('data-testid', 'carousel');
    });

    it('id、aria-label、aria-labelledby 落在根元素，控件不带', () => {
        const { container } = setup({ id: 'c1', 'aria-label': 'slides', 'aria-labelledby': 'heading', 'data-x': '1' } as FixtureStore['props']);
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'c1');
        expect(root).toHaveAttribute('aria-label', 'slides');
        expect(root).toHaveAttribute('aria-labelledby', 'heading');
        expect(root).toHaveAttribute('data-x', '1');
        for (const control of [...screen.getAllByRole('tab'), ...screen.getAllByRole('button')]) {
            expect(control).not.toHaveAttribute('data-x');
            expect(control).not.toHaveAttribute('id', 'c1');
        }
    });

    it('是 region 角色，描述为 carousel，名称由用户指定；用户的 role 与 aria-roledescription 覆盖默认值', () => {
        setup({ 'aria-label': 'news' } as FixtureStore['props']);
        expect(screen.getByRole('region', { name: 'news' })).toHaveAttribute('aria-roledescription', zh_CN.Carousel.carousel);
        const custom = setup({ role: 'group', 'aria-roledescription': 'gallery' });
        expect(getRoot(custom.container)).toHaveAttribute('role', 'group');
        expect(getRoot(custom.container)).toHaveAttribute('aria-roledescription', 'gallery');
    });

    it('使用方传入的 mouseenter、mouseleave、focusin、focusout 监听会被调用', async () => {
        const handlers = { onmouseenter: vi.fn<() => void>(), onmouseleave: vi.fn<() => void>(), onfocusin: vi.fn<() => void>(), onfocusout: vi.fn<() => void>() };
        const { container } = setup(handlers);
        const root = getRoot(container);
        await fireEvent.mouseEnter(root);
        await fireEvent.mouseLeave(root);
        const arrow = must(query(container, 'arrow-next'));
        arrow.focus();
        arrow.blur();
        for (const handler of Object.values(handlers)) {
            expect(handler).toHaveBeenCalledTimes(1);
        }
    });

    describe('外观类', () => {
        const present = (props: FixtureStore['props'], suffixes: string[]) => {
            const view = setup(props);
            const result = suffixes.filter((suffix) => query(view.container, suffix) !== null);
            view.unmount();
            return result;
        };

        it('theme、indicatorType、indicatorPosition、indicatorSize', () => {
            for (const theme of ['primary', 'light', 'dark'] as const) {
                expect(present({ theme }, [`arrow-${theme}`, `indicator-item-${theme}`])).toEqual([`arrow-${theme}`, `indicator-item-${theme}`]);
            }
            for (const indicatorType of ['dot', 'line', 'columnar'] as const) {
                expect(present({ indicatorType }, [`indicator-${indicatorType}`])).toEqual([`indicator-${indicatorType}`]);
            }
            for (const indicatorPosition of ['left', 'center', 'right'] as const) {
                expect(present({ indicatorPosition }, [`indicator-${indicatorPosition}`])).toEqual([`indicator-${indicatorPosition}`]);
            }
            for (const indicatorSize of ['small', 'medium'] as const) {
                expect(present({ indicatorSize }, [`indicator-item-${indicatorSize}`])).toEqual([`indicator-item-${indicatorSize}`]);
            }
        });

        it('showArrow、arrowType、showIndicator', () => {
            expect(present({ showArrow: false }, ['arrow', 'arrow-hover'])).toEqual([]);
            expect(present({ arrowType: 'hover' }, ['arrow', 'arrow-hover'])).toEqual(['arrow', 'arrow-hover']);
            const { container } = setup({ showIndicator: false });
            expect(query(container, 'indicator')).toBeNull();
            expect(query(container, 'arrow')).not.toBeNull();
        });

        it('单张幻灯片没有指示器与箭头', () => {
            const { container } = setup({}, { count: 1 });
            expect(query(container, 'indicator')).toBeNull();
            expect(query(container, 'arrow')).toBeNull();
        });
    });

    describe('切换', () => {
        it('箭头切换并通知 onChange(新索引, 旧索引)', async () => {
            const { container, store, next, prev } = setup();
            await prev();
            expect(store.log).toEqual(['change 2 0']);
            expect(activeTitle(container)).toBe('index2');
            await next();
            expect(store.log).toEqual(['change 2 0', 'change 0 2']);
            expect(activeTitle(container)).toBe('index0');
        });

        it('点击或 trigger 为 hover 时悬停指示点切换，另一种方式被忽略', async () => {
            const click = setup();
            await click.click(getIndicators(click.container)[2]);
            expect(click.store.log).toEqual(['change 2 0']);
            await fireEvent.mouseEnter(getIndicators(click.container)[1]);
            expect(click.store.log).toHaveLength(1);
            click.unmount();

            const hover = setup({ trigger: 'hover' });
            await hover.click(getIndicators(hover.container)[1]);
            expect(hover.store.log).toEqual([]);
            await fireEvent.mouseEnter(getIndicators(hover.container)[2]);
            flushSync();
            expect(hover.store.log).toEqual(['change 2 0']);
            expect(activeTitle(hover.container)).toBe('index2');
        });

        it('首次交互指向当前索引时不播放动画', async () => {
            const { container, click } = setup();
            await click(getIndicators(container)[0]);
            expect(query(container, 'content-item-slide-in')).toBeNull();
            expect(query(container, 'content-item-slide-out')).toBeNull();
        });

        it('标记幻灯片方向，以及进入与离开的项；fade 不加进出类', async () => {
            const { container, next, prev } = setup();
            const content = must(query(container, 'content'));
            await prev();
            expect(content).toHaveClass(`${prefix}-content-reverse`);
            expect(query(container, 'content-item-slide-in')).toHaveTextContent(/^index2$/);
            expect(query(container, 'content-item-slide-out')).toHaveTextContent(/^index0$/);
            await next();
            expect(content).not.toHaveClass(`${prefix}-content-reverse`);

            const fade = setup({ animation: 'fade', speed: 500 });
            expect(query(fade.container, 'content')).toHaveClass(`${prefix}-content-fade`);
            expect(getActive(fade.container)).toHaveStyle({ transitionDuration: '500ms' });
            await fade.next();
            expect(query(fade.container, 'content-item-slide-in')).toBeNull();
        });

        it('slideDirection 为 right 时反转方向类', async () => {
            const { container, next } = setup({ slideDirection: 'right' });
            await next();
            expect(query(container, 'content')).toHaveClass(`${prefix}-content-reverse`);
        });

        it('句柄方法切换轮播，越界索引回绕', () => {
            const { container, store, handle } = setup();
            handle().next();
            expect(store.log.at(-1)).toBe('change 1 0');
            handle().prev();
            expect(store.log.at(-1)).toBe('change 0 1');
            handle().goTo(5);
            expect(store.log.at(-1)).toBe('change 2 0');
            flushSync();
            expect(activeTitle(container)).toBe('index2');
            handle().goTo(-4);
            flushSync();
            expect(activeTitle(container)).toBe('index2');
            for (const name of ['play', 'stop', 'goTo', 'prev', 'next'] as const) {
                expect(handle()[name]).toBeTypeOf('function');
            }
        });

        it('没有幻灯片时 next 不抛错', () => {
            const { handle } = setup({}, { count: 0 });
            expect(() => handle().next()).not.toThrow();
        });
    });

    describe('activeIndex 受控值', () => {
        it('bind:activeIndex：切换写回父级，父级改值同步到组件', async () => {
            const { container, store, next } = setup({}, { mode: 'bind', activeIndex: 0 });
            await next();
            expect(store.activeIndex).toBe(1);
            expect(activeTitle(container)).toBe('index1');
            store.activeIndex = 2;
            flushSync();
            expect(activeTitle(container)).toBe('index2');
            expect(getIndicators(container)[2]).toHaveClass(`${prefix}-indicator-item-active`);
            await next();
            expect(store.log.at(-1)).toBe('change 0 2');
        });

        it('bind:activeIndex 重置为 undefined 后保留最后的索引，之后转为非受控运行', async () => {
            const { container, store, next } = setup({}, { mode: 'bind', activeIndex: 0 });
            store.activeIndex = 2;
            flushSync();
            store.activeIndex = undefined;
            flushSync();
            expect(activeTitle(container)).toBe('index2');
            await next();
            expect(store.log.at(-1)).toBe('change 0 2');
            expect(activeTitle(container)).toBe('index0');
        });

        it('函数绑定：setter 拒绝时显示不变，接受时跟随', async () => {
            const rejected = setup({}, { mode: 'function', activeIndex: 1, accept: false });
            await rejected.next();
            expect(rejected.store.log).toEqual(['set 2', 'change 2 1']);
            expect(activeTitle(rejected.container)).toBe('index1');
            await rejected.click(getIndicators(rejected.container)[0]);
            expect(activeTitle(rejected.container)).toBe('index1');
            rejected.unmount();

            const accepted = setup({}, { mode: 'function', activeIndex: 1 });
            await accepted.next();
            expect(accepted.store.activeIndex).toBe(2);
            expect(activeTitle(accepted.container)).toBe('index2');
        });

        it('单向传值：组件在本地覆盖，父级再推新值时以父级为准', async () => {
            const { container, store, next } = setup({}, { mode: 'one-way', activeIndex: 1 });
            expect(activeTitle(container)).toBe('index1');
            await next();
            expect(store.activeIndex).toBe(1);
            expect(activeTitle(container)).toBe('index2');
            store.activeIndex = 0;
            flushSync();
            expect(activeTitle(container)).toBe('index0');
        });

        it('不传 activeIndex 为非受控，初始为第一张', async () => {
            const { container, next } = setup();
            expect(activeTitle(container)).toBe('index0');
            await next();
            await next();
            expect(activeTitle(container)).toBe('index2');
        });
    });

    describe('幻灯片数量变化', () => {
        it('增加后指示点跟随', () => {
            const { container, store } = setup({}, { count: 2 });
            store.count = 3;
            flushSync();
            expect(getIndicators(container)).toHaveLength(3);
        });

        it('减少到当前索引之外时显示最后一张，指示点仍可 Tab 到达，下一步回到第一张', async () => {
            const { container, store, next } = setup({}, { mode: 'bind', activeIndex: 2 });
            expect(activeTitle(container)).toBe('index2');
            store.count = 2;
            flushSync();
            expect(activeTitle(container)).toBe('index1');
            expect(tabs().filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
            await next();
            expect(store.log.at(-1)).toBe('change 0 1');
            expect(activeTitle(container)).toBe('index0');
        });
    });

    describe('自动播放', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });
        afterEach(() => {
            vi.useRealTimers();
        });

        it('按 interval 与 speed 定时切换', async () => {
            const { container, store } = setup({ autoPlay: { interval: 1000 }, speed: 200 });
            await tick(1199);
            expect(store.log).toEqual([]);
            await tick(1);
            expect(store.log).toEqual(['change 1 0']);
            expect(activeTitle(container)).toBe('index1');
            await tick(1200);
            await tick(1200);
            expect(store.log).toHaveLength(3);
            expect(store.log.at(-1)).toBe('change 0 2');
        });

        it('autoPlay 为 true 时使用默认 interval，为 false 时不切换', async () => {
            const on = setup({ autoPlay: true });
            await tick(2300);
            expect(on.store.log).toHaveLength(1);
            const off = setup({ autoPlay: false });
            await tick(10000);
            expect(off.store.log).toEqual([]);
        });

        it('悬停经过防抖后暂停，离开后恢复；hoverToPause 为 false 时不暂停', async () => {
            const { container, store } = setup({ autoPlay: { interval: 1000, hoverToPause: true } });
            await fireEvent.mouseEnter(getRoot(container));
            await tick(400);
            await tick(5000);
            expect(store.log).toEqual([]);
            await fireEvent.mouseLeave(getRoot(container));
            await tick(400);
            await tick(1300);
            expect(store.log).toHaveLength(1);

            const free = setup({ autoPlay: { interval: 1000, hoverToPause: false } });
            await fireEvent.mouseEnter(getRoot(free.container));
            await tick(1300);
            expect(free.store.log).toHaveLength(1);
        });

        it('悬停暂停后点击箭头只切换一次，指针仍在时不恢复，离开后恢复', async () => {
            const { container, store, next } = setup({ autoPlay: { interval: 1000, hoverToPause: true } });
            await fireEvent.mouseEnter(getRoot(container));
            await tick(400);
            await next();
            expect(store.log).toHaveLength(1);
            await tick(5000);
            expect(store.log).toHaveLength(1);
            await fireEvent.mouseLeave(getRoot(container));
            await tick(400);
            await tick(1300);
            expect(store.log).toHaveLength(2);
        });

        it('手动切换后重新开始计时', async () => {
            const { store, next } = setup({ autoPlay: { interval: 1000 }, speed: 0 });
            await tick(800);
            await next();
            await tick(800);
            expect(store.log).toHaveLength(1);
            await tick(200);
            expect(store.log).toEqual(['change 1 0', 'change 2 1']);
        });

        it('卸载后停止', async () => {
            const { store, unmount } = setup({ autoPlay: true });
            unmount();
            await tick(10000);
            expect(store.log).toEqual([]);
        });

        it('卸载时丢弃待执行的悬停处理函数', async () => {
            const { container, store, unmount } = setup({ autoPlay: { interval: 1000, hoverToPause: true } });
            await fireEvent.mouseLeave(getRoot(container));
            unmount();
            await tick(5000);
            expect(store.log).toEqual([]);
        });

        it('autoPlay 关闭后立即停止；每次新建 autoPlay 对象不重新计时', async () => {
            const { store } = setup({ autoPlay: { interval: 1000 } });
            await tick(800);
            store.props.autoPlay = { interval: 1000 };
            flushSync();
            await tick(500);
            expect(store.log).toHaveLength(1);
            store.props.autoPlay = false;
            flushSync();
            await tick(10000);
            expect(store.log).toHaveLength(1);
        });

        it('换 speed 后按最新值运行', async () => {
            const { store } = setup({ autoPlay: { interval: 1000 }, speed: 300 });
            await tick(1300);
            expect(store.log).toHaveLength(1);
            store.props.speed = 1000;
            flushSync();
            // the timer already running keeps the old speed; the one it schedules uses the new one
            await tick(1300);
            expect(store.log).toHaveLength(2);
            await tick(1300);
            expect(store.log).toHaveLength(2);
            await tick(700);
            expect(store.log).toHaveLength(3);
        });

        it('受控时挂载不自动播放，通过 play() 播放，悬停后恢复', async () => {
            const idle = setup({ autoPlay: true }, { mode: 'bind', activeIndex: 0 });
            await tick(10000);
            expect(idle.store.log).toEqual([]);
            idle.unmount();

            const { container, store, handle } = setup({ autoPlay: true }, { mode: 'bind', activeIndex: 0 });
            handle().play();
            await tick(2300);
            expect(store.log).toHaveLength(1);
            await fireEvent.mouseEnter(getRoot(container));
            await tick(400 + 5000);
            expect(store.log).toHaveLength(1);
            await fireEvent.mouseLeave(getRoot(container));
            await tick(400);
            await tick(2300);
            expect(store.log).toHaveLength(2);
        });

        it('autoPlay 关闭下 play() 播放，悬停暂停，stop() 停止', async () => {
            const { container, store, handle } = setup();
            handle().play();
            await fireEvent.mouseEnter(getRoot(container));
            await tick(400 + 5000);
            expect(store.log).toEqual([]);
            await fireEvent.mouseLeave(getRoot(container));
            await tick(400);
            await tick(2300);
            expect(store.log).toHaveLength(1);
            handle().stop();
            await tick(10000);
            expect(store.log).toHaveLength(1);
        });

        it('离开时不会启动原本未播放的轮播', async () => {
            const { container, store } = setup({ autoPlay: true }, { mode: 'bind', activeIndex: 0 });
            await fireEvent.mouseEnter(getRoot(container));
            await tick(400);
            await fireEvent.mouseLeave(getRoot(container));
            await tick(400 + 10000);
            expect(store.log).toEqual([]);
        });

        it('stop() 之后手动切换不会重新开始播放，play() 才恢复', async () => {
            const { store, handle, next } = setup({ autoPlay: { interval: 1000 } });
            handle().stop();
            await next();
            handle().next();
            expect(store.log).toHaveLength(2);
            await tick(10000);
            expect(store.log).toHaveLength(2);
            handle().play();
            await tick(1300);
            expect(store.log).toHaveLength(3);
        });

        it('系统要求减少动态效果时不自动播放，play() 仍可播放', async () => {
            mockMatchMediaCore(['(prefers-reduced-motion: reduce)']);
            const { store, handle } = setup({ autoPlay: { interval: 1000 } });
            await tick(5000);
            expect(store.log).toEqual([]);
            handle().play();
            await tick(1300);
            expect(store.log).toHaveLength(1);
            vi.unstubAllGlobals();
        });

        it('幻灯片从一张增加到多张时按配置开始自动播放', async () => {
            const { store } = setup({ autoPlay: true }, { count: 1 });
            await tick(10000);
            expect(store.log).toEqual([]);
            store.count = 3;
            flushSync();
            await tick(2300);
            expect(store.log).toHaveLength(1);
        });

        it('幻灯片增加时，autoPlay 关闭、受控或悬停暂停中的轮播不会开始播放', async () => {
            const off = setup({ autoPlay: false }, { count: 1 });
            off.store.count = 3;
            flushSync();
            await tick(10000);
            expect(off.store.log).toEqual([]);
            off.unmount();

            const controlled = setup({ autoPlay: true }, { count: 1, mode: 'bind', activeIndex: 0 });
            controlled.store.count = 3;
            flushSync();
            await tick(10000);
            expect(controlled.store.log).toEqual([]);
            controlled.unmount();

            const hovering = setup({ autoPlay: true }, { count: 1 });
            await fireEvent.mouseEnter(getRoot(hovering.container));
            await tick(400);
            hovering.store.count = 3;
            flushSync();
            await tick(10000);
            expect(hovering.store.log).toEqual([]);
            await fireEvent.mouseLeave(getRoot(hovering.container));
            await tick(400);
            await tick(2300);
            expect(hovering.store.log).toHaveLength(1);
        });

        // jsdom guesses :focus-visible from the last event, so a Tab keydown makes the focus a keyboard one;
        // the mouse case is in the browser tests
        describe('键盘焦点', () => {
            const focus = async (element: HTMLElement) => {
                await fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Tab' });
                element.focus();
                flushSync();
            };
            const blur = (element: HTMLElement) => {
                element.blur();
                flushSync();
            };
            const getTab = () => screen.getByRole('tab', { selected: true });

            it('轮播暂停；键盘切换不会重新开始，离开后恢复', async () => {
                const { store } = setup({ autoPlay: { interval: 1000, hoverToPause: false } });
                await focus(getTab());
                await tick(5000);
                expect(store.log).toEqual([]);
                await fireEvent.keyDown(getTab(), { key: 'ArrowRight' });
                flushSync();
                expect(store.log).toHaveLength(1);
                await tick(5000);
                expect(store.log).toHaveLength(1);
                blur(getTab());
                await tick(1300);
                expect(store.log).toHaveLength(2);
            });

            it('焦点在轮播内移动不会恢复播放', async () => {
                const { store } = setup({ autoPlay: { interval: 1000 } });
                await focus(getTab());
                await focus(screen.getByRole('button', { name: zh_CN.Carousel.next }));
                await tick(5000);
                expect(store.log).toEqual([]);
            });

            it('获得焦点时调用 stop()，离开后不会被撤销', async () => {
                const { store, handle } = setup({ autoPlay: { interval: 1000 } });
                await focus(getTab());
                handle().stop();
                blur(getTab());
                await tick(5000);
                expect(store.log).toEqual([]);
            });

            it('获得焦点时悬停暂停结束，需等焦点离开后才恢复', async () => {
                const { container, store } = setup({ autoPlay: { interval: 1000 } });
                await fireEvent.mouseEnter(getRoot(container));
                await tick(400);
                await focus(getTab());
                await fireEvent.mouseLeave(getRoot(container));
                await tick(400 + 5000);
                expect(store.log).toEqual([]);
                blur(getTab());
                await tick(1300);
                expect(store.log).toHaveLength(1);
            });

            it('焦点暂停的时效长于一次悬停进出', async () => {
                const { container, store } = setup({ autoPlay: { interval: 1000 } });
                await focus(getTab());
                await fireEvent.mouseEnter(getRoot(container));
                await tick(400);
                await fireEvent.mouseLeave(getRoot(container));
                await tick(400 + 5000);
                expect(store.log).toEqual([]);
            });

            it('仅在轮播关闭时，幻灯片才是 live region', async () => {
                const { container } = setup({ autoPlay: { interval: 1000 } });
                const content = query(container, 'content');
                expect(content).toHaveAttribute('aria-live', 'off');
                await focus(getTab());
                expect(content).toHaveAttribute('aria-live', 'polite');
                blur(getTab());
                expect(content).toHaveAttribute('aria-live', 'off');
            });
        });
    });

    describe('无障碍', () => {
        it('只有当前幻灯片在焦点顺序与无障碍树中', () => {
            const { container } = setup({}, { mode: 'bind', activeIndex: 1 });
            const slides = [...(query(container, 'content')?.children ?? [])];
            // jsdom has no `inert` reflection, so Svelte leaves it as a plain property there
            expect(slides.map((item) => (item as HTMLElement & { inert: boolean }).inert)).toEqual([true, false, true]);
            expect(query(container, 'content')).toHaveAttribute('aria-live', 'polite');
        });

        it('有指示点时，每张幻灯片是对应 tab 的 panel', () => {
            setup();
            for (const tab of tabs()) {
                const panel = document.getElementById(tab.getAttribute('aria-controls') as string);
                expect(panel).toHaveAttribute('role', 'tabpanel');
                expect(panel).toHaveAccessibleName(tab.getAttribute('aria-label') as string);
            }
        });

        it('无指示点时，每张幻灯片是以位置命名的 group', () => {
            const { container } = setup({ showIndicator: false });
            const slides = [...(query(container, 'content')?.children ?? [])];
            expect(slides.map((item) => item.getAttribute('aria-label'))).toEqual([1, 2, 3].map((n) => zh_CN.Carousel.slideN.replace('${index}', String(n))));
            for (const item of slides) {
                expect(item).toHaveAttribute('role', 'group');
                expect(item).toHaveAttribute('aria-roledescription', zh_CN.Carousel.slide);
            }
        });
    });

    describe('全局默认值', () => {
        it('从 semiGlobal 读取，显式 prop 优先', () => {
            semiGlobal.config = { overrideDefaultProps: { Carousel: { indicatorType: 'line', autoPlay: false } } };
            const { container } = setup({ autoPlay: undefined });
            expect(query(container, 'indicator-line')).not.toBeNull();
            expect(query(setup({ indicatorType: 'columnar' }).container, 'indicator-columnar')).not.toBeNull();
        });

        it('全局 autoPlay 为 false 时不自动播放，arrowProps 的默认值生效', async () => {
            vi.useFakeTimers();
            try {
                semiGlobal.config = { overrideDefaultProps: { Carousel: { autoPlay: false, arrowProps: { leftArrow: { props: { 'aria-label': 'Before' } } } } } };
                const { store } = setup({ autoPlay: undefined });
                await tick(10000);
                expect(store.log).toEqual([]);
                expect(screen.getByRole('button', { name: 'Before' })).toBeInTheDocument();
            } finally {
                vi.useRealTimers();
            }
        });
    });

    describe('箭头 snippet', () => {
        it('不传 snippet 时有默认图标与语言包名称', () => {
            render(Arrows);
            expect(screen.getByRole('button', { name: zh_CN.Carousel.prev }).querySelector('svg')).not.toBeNull();
            expect(screen.getByRole('button', { name: zh_CN.Carousel.next }).querySelector('svg')).not.toBeNull();
        });

        it('文字与嵌套元素为按钮命名，不再设置 aria-label', () => {
            render(Arrows, { props: { left: 'nested', right: 'mixed' } });
            expect(screen.getByRole('button', { name: 'Back' })).not.toHaveAttribute('aria-label');
            expect(screen.getByRole('button', { name: 'Forward' })).not.toHaveAttribute('aria-label');
            expect(screen.queryByRole('button', { name: zh_CN.Carousel.prev })).toBeNull();
        });

        it('snippet 里带 aria-label 的元素为按钮命名', () => {
            render(Arrows, { props: { left: 'labelled' } });
            expect(screen.getByRole('button', { name: 'Back' })).not.toHaveAttribute('aria-label');
        });

        it('没有可读内容的 snippet 使用语言包名称；arrowProps 的 aria-label 优先', () => {
            render(Arrows, { props: { left: 'icon', right: 'mixed', arrowProps: { rightArrow: { props: { 'aria-label': 'Go on' } } } } });
            expect(screen.getByRole('button', { name: zh_CN.Carousel.prev })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Go on' })).toBeInTheDocument();
        });

        it('arrowProps 的 class 叠加、onclick 与内置切换都执行，且 onclick 在前', async () => {
            const calls: string[] = [];
            const { container } = render(Arrows, {
                props: { left: 'text', arrowProps: { leftArrow: { props: { class: 'custom-left' } }, rightArrow: { props: { onclick: () => calls.push('click') } } } },
            });
            const prev = query(container, 'arrow-prev');
            expect(prev).toHaveClass('custom-left');
            expect(prev).toHaveTextContent(/^Back$/);
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Carousel.next }));
            expect(calls).toEqual(['click']);
            expect(getActive(container)).toHaveTextContent(/^index1$/);
        });

        it('箭头按钮以 snippet 名标注 x-semi-prop', () => {
            setup();
            expect(screen.getByRole('button', { name: zh_CN.Carousel.prev })).toHaveAttribute('x-semi-prop', 'leftArrow');
            expect(screen.getByRole('button', { name: zh_CN.Carousel.next })).toHaveAttribute('x-semi-prop', 'rightArrow');
        });
    });

    describe('键盘', () => {
        it('箭头是可由键盘激活的原生 button', async () => {
            const { container } = setup();
            const next = screen.getByRole('button', { name: zh_CN.Carousel.next });
            const prev = screen.getByRole('button', { name: zh_CN.Carousel.prev });
            expect(next).toHaveAttribute('type', 'button');
            next.focus();
            await userEvent.keyboard('{Enter}');
            expect(activeTitle(container)).toBe('index1');
            await userEvent.keyboard(' ');
            expect(activeTitle(container)).toBe('index2');
            prev.focus();
            await userEvent.keyboard('{Enter}');
            expect(activeTitle(container)).toBe('index1');
        });

        it('指示点组成带 roving tabindex 的具名 tablist', async () => {
            setup({}, { mode: 'bind', activeIndex: 1 });
            expect(screen.getByRole('tablist', { name: zh_CN.Carousel.indicators })).toBeInTheDocument();
            expect(tabs().map((tab) => tab.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
            expect(tabs().map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
            expect(tabs()[0]).toHaveAccessibleName(zh_CN.Carousel.slideN.replace('${index}', '1'));
            // Tab order: only the current tab of the tablist, then the arrows
            await userEvent.tab();
            expect(tabs()[1]).toHaveFocus();
            await userEvent.tab();
            expect(screen.getByRole('button', { name: zh_CN.Carousel.prev })).toHaveFocus();
            await userEvent.tab();
            expect(screen.getByRole('button', { name: zh_CN.Carousel.next })).toHaveFocus();
        });

        it('带 Alt、Ctrl、Meta 的方向键与 Home、End 不切换也不拦截', () => {
            const { container } = setup();
            for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
                for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                    const event = new KeyboardEvent('keydown', { key, [modifier]: true, bubbles: true, cancelable: true });
                    tabs()[0].dispatchEvent(event);
                    expect(event.defaultPrevented).toBe(false);
                }
            }
            expect(activeTitle(container)).toBe('index0');
        });

        it('Left 与 Right 切换幻灯片，并把焦点移到当前 tab', async () => {
            const { container } = setup();
            tabs()[0].focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(activeTitle(container)).toBe('index1');
            expect(tabs()[1]).toHaveFocus();
            expect(tabs()[1]).toHaveAttribute('aria-selected', 'true');
            await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
            expect(activeTitle(container)).toBe('index2');
            expect(tabs()[2]).toHaveFocus();
        });

        it('Home 与 End 跳到第一张与最后一张幻灯片', async () => {
            const { container } = setup({}, { mode: 'bind', activeIndex: 1 });
            tabs()[1].focus();
            await userEvent.keyboard('{End}');
            expect(activeTitle(container)).toBe('index2');
            expect(tabs()[2]).toHaveFocus();
            await userEvent.keyboard('{Home}');
            expect(activeTitle(container)).toBe('index0');
            expect(tabs()[0]).toHaveFocus();
        });

        it('RTL 下 Left 切换到下一张，Right 切换到上一张', async () => {
            const { container } = render(Rtl);
            tabs()[0].focus();
            await userEvent.keyboard('{ArrowLeft}');
            expect(activeTitle(container)).toBe('index1');
            expect(tabs()[1]).toHaveFocus();
            await userEvent.keyboard('{ArrowRight}');
            expect(activeTitle(container)).toBe('index0');
            expect(tabs()[0]).toHaveFocus();
        });

        it('受控轮播跟随 bind 时焦点保持在 tab 上', async () => {
            setup({}, { mode: 'bind', activeIndex: 0 });
            tabs()[0].focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(tabs()[1]).toHaveFocus();
        });
    });
});
