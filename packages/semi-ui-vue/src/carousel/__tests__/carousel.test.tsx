/** @jsxImportSource vue */
import { KeepAlive, defineComponent, nextTick, reactive, ref } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { mockMatchMedia, render } from '@test/utils/vue';
import Carousel, { type CarouselHandle } from '..';
import semiGlobal, { semiGlobalKey } from '../../_utils/semi-global';
import Arrows from './fixtures/arrows.vue';
import ComponentSlides from './fixtures/component-slides.vue';
import MixedSlides from './fixtures/mixed-slides.vue';
import Model from './fixtures/model.vue';
import OneWay from './fixtures/one-way.vue';
import Rtl from './fixtures/rtl.vue';

type Props = Record<string, unknown>;
type OnChange = (index: number, preIndex: number) => void;

const query = (container: Element, suffix: string) => container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-carousel-${suffix}`);
const getRoot = (container: Element) => container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-carousel`) as HTMLElement;
const getActiveItem = (container: Element) => query(container, 'content-item-active');
const getIndicatorItems = (container: Element) => container.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-carousel-indicator-item`);
const activeTitle = (container: Element) => getActiveItem(container)?.textContent;
const slideText = (container: Element) => [...(query(container, 'content')?.children ?? [])].map((s) => s.textContent);

const slide = (index: number) => (
    <div style={{ color: '#fff' }}>
        <h3>{`index${index}`}</h3>
    </div>
);

// Props and the slide count live in reactive state so a test can change them, as a parent re-render would.
function renderCarousel(props: Props = {}, count = 3) {
    const state = reactive<Props>({ ...props });
    const total = ref(count);
    const handle = ref<CarouselHandle>();
    const view = render({
        render: () => (
            <Carousel {...state} ref={handle}>
                {() => Array.from({ length: total.value }, (_, index) => slide(index))}
            </Carousel>
        ),
    });
    return { ...view, state, total, handle: () => handle.value as CarouselHandle };
}

// The carousel sits in a KeepAlive; setting `shown` to false deactivates it, back to true activates it.
function renderKeptAlive(onChange: OnChange) {
    const shown = ref(true);
    const Page = defineComponent({
        render: () => (
            <Carousel autoPlay={{ interval: 1000 }} speed={0} onChange={onChange}>
                {() => [0, 1, 2].map((index) => slide(index))}
            </Carousel>
        ),
    });
    const view = render({
        render: () => (
            <KeepAlive>
                {{
                    default: () => (shown.value ? <Page /> : <div />),
                }}
            </KeepAlive>
        ),
    });
    return { ...view, shown };
}

const tick = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
    await nextTick();
};
// Renders each props variant on its own and reports which of the given class suffixes are present.
const presentClasses = (propsList: Props[], suffixes: string[]) =>
    propsList.map((props) => {
        const view = renderCarousel(props);
        const present = suffixes.filter((suffix) => query(view.container, suffix) !== null);
        view.unmount();
        return present;
    });

afterEach(() => {
    semiGlobal.config = {};
});

describe('Carousel', () => {
    it('基础渲染', () => {
        const { container } = renderCarousel();
        expect(query(container, 'content')?.children).toHaveLength(3);
        expect(getActiveItem(container)).toHaveTextContent(/^index0$/);
    });

    it('自定义 class 与 style 的 Carousel', () => {
        const { container } = renderCarousel({ class: 'test', style: { color: 'red' } });
        expect(getRoot(container)).toHaveClass('test');
        expect(getRoot(container)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('带 defaultActiveIndex 的 Carousel', () => {
        const { container } = renderCarousel({ defaultActiveIndex: 2 });
        expect(getActiveItem(container)).toHaveTextContent(/^index2$/);
    });

    it('不同 theme', () => {
        const themes = ['primary', 'light', 'dark'];
        const suffixes = themes.flatMap((theme) => [`arrow-${theme}`, `indicator-item-${theme}`]);
        expect(
            presentClasses(
                themes.map((theme) => ({ theme })),
                suffixes
            )
        ).toEqual(themes.map((theme) => [`arrow-${theme}`, `indicator-item-${theme}`]));
    });

    it('不同 indicator 类型', () => {
        const types = ['dot', 'line', 'columnar'];
        const suffixes = types.map((type) => `indicator-${type}`);
        expect(
            presentClasses(
                types.map((indicatorType) => ({ indicatorType })),
                suffixes
            )
        ).toEqual(suffixes.map((suffix) => [suffix]));
    });

    it('不同 indicator 位置', () => {
        const positions = ['left', 'center', 'right'];
        const suffixes = positions.map((position) => `indicator-${position}`);
        expect(
            presentClasses(
                positions.map((indicatorPosition) => ({ indicatorPosition })),
                suffixes
            )
        ).toEqual(suffixes.map((suffix) => [suffix]));
    });

    it('不同 indicator 尺寸', () => {
        const sizes = ['small', 'medium'];
        const suffixes = sizes.map((size) => `indicator-item-${size}`);
        expect(
            presentClasses(
                sizes.map((indicatorSize) => ({ indicatorSize })),
                suffixes
            )
        ).toEqual(suffixes.map((suffix) => [suffix]));
    });

    it('显示箭头及箭头切换', async () => {
        expect(presentClasses([{ showArrow: false }, { arrowType: 'hover' }], ['arrow', 'arrow-hover'])).toEqual([[], ['arrow', 'arrow-hover']]);

        const onChange = vi.fn<OnChange>();
        const { container } = renderCarousel({ onChange, autoPlay: false });
        expect(query(container, 'arrow')).not.toBeNull();

        await userEvent.click(screen.getByLabelText(zh_CN.Carousel.prev));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getActiveItem(container)).toHaveTextContent(/^index2$/);

        await userEvent.click(screen.getByLabelText(zh_CN.Carousel.next));
        expect(getActiveItem(container)).toHaveTextContent(/^index0$/);
    });

    it('通过点击或 trigger 切换 indicator', async () => {
        const onChange = vi.fn<OnChange>();
        const click = renderCarousel({ onChange, autoPlay: false });
        await userEvent.click(getIndicatorItems(click.container)[2] as HTMLElement);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getActiveItem(click.container)).toHaveTextContent(/^index2$/);
        click.unmount();

        const onChangeHover = vi.fn<OnChange>();
        const hover = renderCarousel({ onChange: onChangeHover, trigger: 'hover', autoPlay: false });
        await userEvent.hover(getIndicatorItems(hover.container)[2] as HTMLElement);
        expect(onChangeHover).toHaveBeenCalledTimes(1);
        expect(getActiveItem(hover.container)).toHaveTextContent(/^index2$/);
    });

    it('单个索引', () => {
        const { container } = renderCarousel({}, 1);
        expect(query(container, 'indicator')).toBeNull();
        expect(query(container, 'arrow')).toBeNull();
    });

    describe('children 变化', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });
        afterEach(() => {
            vi.useRealTimers();
        });

        it('更新幻灯片，handle.play 覆盖 autoPlay 关闭', async () => {
            const { container, total, handle } = renderCarousel({ autoPlay: false }, 2);
            total.value = 3;
            await nextTick();
            expect(getIndicatorItems(container)).toHaveLength(3);

            // One switch takes the default interval (2000ms) plus the default speed (300ms)
            await tick(2300);
            expect(getActiveItem(container)).toHaveTextContent(/^index0$/);

            handle().play();
            await tick(2300);
            expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
            await tick(2300);
            expect(getActiveItem(container)).toHaveTextContent(/^index2$/);

            handle().stop();
            await tick(2300);
            expect(getActiveItem(container)).toHaveTextContent(/^index2$/);
        });

        it('幻灯片从一张增加到多张时按配置开始自动播放', async () => {
            const onChange = vi.fn<OnChange>();
            const { total } = renderCarousel({ onChange }, 1);
            await tick(10000);
            expect(onChange).not.toHaveBeenCalled();
            total.value = 3;
            await nextTick();
            await tick(2300);
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it('幻灯片增加时，autoPlay 关闭、受控或悬停暂停中的轮播不会开始播放', async () => {
            const off = vi.fn<OnChange>();
            const offView = renderCarousel({ onChange: off, autoPlay: false }, 1);
            offView.total.value = 3;
            await nextTick();
            await tick(10000);
            expect(off).not.toHaveBeenCalled();
            offView.unmount();

            const controlled = vi.fn<OnChange>();
            const controlledView = renderCarousel({ onChange: controlled, activeIndex: 0 }, 1);
            controlledView.total.value = 3;
            await nextTick();
            await tick(10000);
            expect(controlled).not.toHaveBeenCalled();
            controlledView.unmount();

            const hovering = vi.fn<OnChange>();
            const hoveringView = renderCarousel({ onChange: hovering }, 1);
            await fireEvent.mouseEnter(getRoot(hoveringView.container));
            await tick(400);
            hoveringView.total.value = 3;
            await nextTick();
            await tick(10000);
            expect(hovering).not.toHaveBeenCalled();
            await fireEvent.mouseLeave(getRoot(hoveringView.container));
            await tick(400);
            await tick(2300);
            expect(hovering).toHaveBeenCalledTimes(1);
        });
    });

    it('幻灯片减少到当前索引之外时，显示最后一张，指示点仍可 Tab 到达，下一步回到第一张', async () => {
        const onChange = vi.fn<OnChange>();
        const { container, total } = renderCarousel({ autoPlay: false, defaultActiveIndex: 2, onChange });
        expect(getActiveItem(container)).toHaveTextContent(/^index2$/);

        total.value = 2;
        await nextTick();
        expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
        expect(screen.getAllByRole('tab').filter((tab) => tab.tabIndex === 0)).toHaveLength(1);

        await fireEvent.click(query(container, 'arrow-next') as HTMLElement);
        expect(onChange).toHaveBeenCalledExactlyOnceWith(0, 1);
        expect(getActiveItem(container)).toHaveTextContent(/^index0$/);
    });

    describe('悬停防抖', () => {
        const autoPlay = { interval: 1000, hoverToPause: true };

        beforeEach(() => {
            vi.useFakeTimers();
        });
        afterEach(() => {
            vi.useRealTimers();
        });

        it('卸载时丢弃待执行的悬停处理函数', async () => {
            const onChange = vi.fn<OnChange>();
            const view = renderCarousel({ autoPlay, onChange });
            await fireEvent.mouseLeave(getRoot(view.container));
            view.unmount();
            await tick(5000);
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe('基线', () => {
        const clickNext = (container: Element) => fireEvent.click(query(container, 'arrow-next') as HTMLElement);
        const clickPrev = (container: Element) => fireEvent.click(query(container, 'arrow-prev') as HTMLElement);

        it('change 传入新索引与旧索引，并同时发出 update:activeIndex', async () => {
            const onChange = vi.fn<OnChange>();
            const onUpdate = vi.fn<(index: number) => void>();
            const { container } = renderCarousel({
                'onUpdate:activeIndex': onUpdate,
                onChange,
                autoPlay: false,
                defaultActiveIndex: 1,
            });
            await fireEvent.click(getIndicatorItems(container)[0] as HTMLElement);
            expect(onChange).toHaveBeenLastCalledWith(0, 1);
            expect(onUpdate).toHaveBeenLastCalledWith(0);
            await clickPrev(container);
            expect(onChange).toHaveBeenLastCalledWith(2, 0);
            await clickNext(container);
            expect(onChange).toHaveBeenLastCalledWith(0, 2);
            await fireEvent.click(getIndicatorItems(container)[0] as HTMLElement);
            expect(onChange).toHaveBeenCalledTimes(3);
            expect(onUpdate).toHaveBeenCalledTimes(3);
        });

        it('受控的 activeIndex 仅随 prop 变化', async () => {
            const onChange = vi.fn<OnChange>();
            const { container, state } = renderCarousel({ onChange, autoPlay: false, activeIndex: 1 });
            expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
            await clickNext(container);
            expect(onChange).toHaveBeenLastCalledWith(2, 1);
            expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
            await fireEvent.click(getIndicatorItems(container)[0] as HTMLElement);
            expect(onChange).toHaveBeenLastCalledWith(0, 1);
            expect(getActiveItem(container)).toHaveTextContent(/^index1$/);

            state.activeIndex = 2;
            await nextTick();
            expect(getActiveItem(container)).toHaveTextContent(/^index2$/);
            expect(getIndicatorItems(container)[2]).toHaveClass(`${BASE_CLASS_PREFIX}-carousel-indicator-item-active`);
            // the next step starts from the controlled index
            await clickNext(container);
            expect(onChange).toHaveBeenLastCalledWith(0, 2);
        });

        it('activeIndex 变为 undefined 后保留最后的受控索引，之后转为非受控运行', async () => {
            const onChange = vi.fn<OnChange>();
            const { container, state } = renderCarousel({ onChange, autoPlay: false, activeIndex: 0 });
            state.activeIndex = 2;
            await nextTick();
            state.activeIndex = undefined;
            await nextTick();
            expect(getActiveItem(container)).toHaveTextContent(/^index2$/);
            await clickNext(container);
            expect(onChange).toHaveBeenLastCalledWith(0, 2);
            expect(getActiveItem(container)).toHaveTextContent(/^index0$/);
        });

        it('显式的 activeIndex 为 undefined 按非受控处理', async () => {
            const { container } = renderCarousel({ autoPlay: false, activeIndex: undefined, defaultActiveIndex: 1 });
            expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
            await clickNext(container);
            expect(getActiveItem(container)).toHaveTextContent(/^index2$/);
        });

        it('首次交互指向当前索引时不播放动画', async () => {
            const { container } = renderCarousel({ autoPlay: false });
            await fireEvent.click(getIndicatorItems(container)[0]);
            expect(query(container, 'content-item-slide-in')).toBeNull();
            expect(query(container, 'content-item-slide-out')).toBeNull();
        });

        it('标记幻灯片方向，以及进入与离开的项', async () => {
            const { container } = renderCarousel({ autoPlay: false });
            const content = query(container, 'content');
            expect(query(container, 'content-item-slide-in')).toBeNull();
            await clickPrev(container);
            expect(content).toHaveClass(`${BASE_CLASS_PREFIX}-carousel-content-reverse`);
            expect(query(container, 'content-item-slide-in')).toHaveTextContent(/^index2$/);
            expect(query(container, 'content-item-slide-out')).toHaveTextContent(/^index0$/);
            await clickNext(container);
            expect(content).not.toHaveClass(`${BASE_CLASS_PREFIX}-carousel-content-reverse`);

            const fade = renderCarousel({ autoPlay: false, animation: 'fade', speed: 500 });
            expect(query(fade.container, 'content')).toHaveClass(`${BASE_CLASS_PREFIX}-carousel-content-fade`);
            expect(getActiveItem(fade.container)).toHaveStyle({ transitionDuration: '500ms' });
            await clickNext(fade.container);
            expect(query(fade.container, 'content-item-slide-in')).toBeNull();
        });

        it('slideDirection 为 right 时反转方向类', async () => {
            const { container } = renderCarousel({ autoPlay: false, slideDirection: 'right' });
            await clickNext(container);
            expect(query(container, 'content')).toHaveClass(`${BASE_CLASS_PREFIX}-carousel-content-reverse`);
        });

        it('trigger 为 hover 时忽略 indicator 点击', async () => {
            const onChange = vi.fn<OnChange>();
            const { container } = renderCarousel({ onChange, autoPlay: false, trigger: 'hover' });
            await fireEvent.click(getIndicatorItems(container)[1] as HTMLElement);
            expect(onChange).not.toHaveBeenCalled();
            await fireEvent.mouseEnter(getIndicatorItems(container)[1] as HTMLElement);
            expect(onChange).toHaveBeenLastCalledWith(1, 0);

            const click = renderCarousel({ onChange: vi.fn<OnChange>(), autoPlay: false });
            await fireEvent.mouseEnter(getIndicatorItems(click.container)[2] as HTMLElement);
            expect(getActiveItem(click.container)).toHaveTextContent(/^index0$/);
        });

        it('将 data-* 属性传给根元素', () => {
            const { container } = renderCarousel({ 'data-testid': 'carousel', autoPlay: false });
            expect(getRoot(container)).toHaveAttribute('data-testid', 'carousel');
        });

        it('showIndicator 为 false 时隐藏 indicator', () => {
            const { container } = renderCarousel({ showIndicator: false, autoPlay: false });
            expect(query(container, 'indicator')).toBeNull();
            expect(query(container, 'arrow')).not.toBeNull();
        });

        it('handle 方法切换轮播并触发 change', () => {
            const onChange = vi.fn<OnChange>();
            const { container, handle } = renderCarousel({ onChange, autoPlay: false });
            handle().next();
            expect(onChange).toHaveBeenLastCalledWith(1, 0);
            handle().prev();
            expect(onChange).toHaveBeenLastCalledWith(0, 1);
            handle().goTo(5);
            expect(onChange).toHaveBeenLastCalledWith(2, 0);
            return nextTick().then(() => expect(getActiveItem(container)).toHaveTextContent(/^index2$/));
        });

        it('goTo 小于负总数的索引也回绕；没有幻灯片时 next 不抛错', async () => {
            const { container, handle } = renderCarousel({ autoPlay: false });
            handle().goTo(-4);
            await nextTick();
            expect(getActiveItem(container)).toHaveTextContent(/^index2$/);

            const empty = renderCarousel({ autoPlay: false }, 0);
            expect(() => empty.handle().next()).not.toThrow();
        });

        it('handle 暴露文档中的方法', () => {
            const { handle } = renderCarousel({ autoPlay: false });
            for (const name of ['play', 'stop', 'goTo', 'prev', 'next'] as const) {
                expect(handle()[name]).toBeTypeOf('function');
            }
        });

        it('使用方传入的 mouseenter、mouseleave、focusin、focusout 监听会被调用', async () => {
            const handlers = {
                onMouseenter: vi.fn<() => void>(),
                onMouseleave: vi.fn<() => void>(),
                onFocusin: vi.fn<() => void>(),
                onFocusout: vi.fn<() => void>(),
            };
            const { container } = renderCarousel({ autoPlay: false, ...handlers });
            const root = getRoot(container);
            const arrow = query(container, 'arrow-next') as HTMLElement;
            await fireEvent.mouseEnter(root);
            await fireEvent.mouseLeave(root);
            arrow.focus();
            arrow.blur();
            for (const handler of Object.values(handlers)) {
                expect(handler).toHaveBeenCalledTimes(1);
            }
        });

        describe('自动播放', () => {
            beforeEach(() => {
                vi.useFakeTimers();
            });
            afterEach(() => {
                vi.useRealTimers();
            });

            it('按 interval 与 speed 定时切换', async () => {
                const onChange = vi.fn<OnChange>();
                const { container } = renderCarousel({ onChange, autoPlay: { interval: 1000 }, speed: 200 });
                await tick(1199);
                expect(onChange).not.toHaveBeenCalled();
                await tick(1);
                expect(onChange).toHaveBeenLastCalledWith(1, 0);
                expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
                await tick(1200);
                await tick(1200);
                expect(onChange).toHaveBeenLastCalledWith(0, 2);
                expect(onChange).toHaveBeenCalledTimes(3);
            });

            it('autoPlay 为 true 时使用默认 interval，为 false 时不切换', async () => {
                const onChange = vi.fn<OnChange>();
                renderCarousel({ onChange });
                await tick(2300);
                expect(onChange).toHaveBeenCalledTimes(1);

                const off = vi.fn<OnChange>();
                renderCarousel({ onChange: off, autoPlay: false });
                await tick(10000);
                expect(off).not.toHaveBeenCalled();
            });

            it('悬停经过防抖后暂停，离开后恢复', async () => {
                const onChange = vi.fn<OnChange>();
                const { container } = renderCarousel({ onChange, autoPlay: { interval: 1000, hoverToPause: true } });
                await fireEvent.mouseEnter(getRoot(container));
                await tick(400);
                await tick(5000);
                expect(onChange).not.toHaveBeenCalled();
                await fireEvent.mouseLeave(getRoot(container));
                await tick(400);
                await tick(1300);
                expect(onChange).toHaveBeenCalledTimes(1);
            });

            it('悬停暂停后点击箭头只切换一次，指针仍在时不恢复，离开后恢复', async () => {
                const onChange = vi.fn<OnChange>();
                const { container } = renderCarousel({ onChange, autoPlay: { interval: 1000, hoverToPause: true } });
                await fireEvent.mouseEnter(getRoot(container));
                await tick(400);
                await clickNext(container);
                expect(onChange).toHaveBeenCalledTimes(1);
                await tick(5000);
                expect(onChange).toHaveBeenCalledTimes(1);
                await fireEvent.mouseLeave(getRoot(container));
                await tick(400);
                await tick(1300);
                expect(onChange).toHaveBeenCalledTimes(2);
            });

            it('hoverToPause 为 false 时悬停不暂停', async () => {
                const onChange = vi.fn<OnChange>();
                const { container } = renderCarousel({ onChange, autoPlay: { interval: 1000, hoverToPause: false } });
                await fireEvent.mouseEnter(getRoot(container));
                await tick(1300);
                expect(onChange).toHaveBeenCalledTimes(1);
            });

            it('autoPlay 为对象且未指定时，hoverToPause 默认为 true', async () => {
                const onChange = vi.fn<OnChange>();
                const { container } = renderCarousel({ onChange, autoPlay: { interval: 1000 } });
                await fireEvent.mouseEnter(getRoot(container));
                await tick(400 + 5000);
                expect(onChange).not.toHaveBeenCalled();
            });

            it('autoPlay 为 true 时悬停暂停', async () => {
                const onChange = vi.fn<OnChange>();
                const { container } = renderCarousel({ onChange });
                await fireEvent.mouseEnter(getRoot(container));
                await tick(400 + 5000);
                expect(onChange).not.toHaveBeenCalled();
            });

            it('手动切换后重新开始计时', async () => {
                const onChange = vi.fn<OnChange>();
                const { container } = renderCarousel({ onChange, autoPlay: { interval: 1000 }, speed: 0 });
                await tick(800);
                await clickNext(container);
                await tick(800);
                expect(onChange).toHaveBeenCalledTimes(1);
                await tick(200);
                expect(onChange).toHaveBeenCalledTimes(2);
                expect(onChange).toHaveBeenLastCalledWith(2, 1);
            });

            it('卸载后停止', async () => {
                const onChange = vi.fn<OnChange>();
                renderCarousel({ onChange }).unmount();
                await tick(10000);
                expect(onChange).not.toHaveBeenCalled();
            });

            it('换 speed 与监听器后按最新值运行', async () => {
                const first = vi.fn<OnChange>();
                const second = vi.fn<OnChange>();
                const { state } = renderCarousel({ onChange: first, autoPlay: { interval: 1000 }, speed: 300 });
                state.onChange = second;
                await nextTick();
                await tick(1300);
                expect(first).not.toHaveBeenCalled();
                expect(second).toHaveBeenCalledTimes(1);
                state.speed = 1000;
                await nextTick();
                // the timer already running keeps the old speed; the one it schedules uses the new one
                await tick(1300);
                expect(second).toHaveBeenCalledTimes(2);
                await tick(1300);
                expect(second).toHaveBeenCalledTimes(2);
                await tick(700);
                expect(second).toHaveBeenCalledTimes(3);
            });

            it('挂载与自动切换期间不出现插槽在渲染之外调用的警告', async () => {
                const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
                try {
                    renderCarousel({ autoPlay: { interval: 1000 } });
                    await tick(2600);
                    expect(warn.mock.calls.filter(([message]) => String(message).includes('outside of the render'))).toEqual([]);
                } finally {
                    warn.mockRestore();
                }
            });

            it('受控时挂载不自动播放', async () => {
                const onChange = vi.fn<OnChange>();
                renderCarousel({ onChange, activeIndex: 0 });
                await tick(10000);
                expect(onChange).not.toHaveBeenCalled();
            });

            it('受控轮播通过 handle.play() 播放，悬停后恢复', async () => {
                const onChange = vi.fn<OnChange>();
                const { container, handle } = renderCarousel({ onChange, activeIndex: 0, autoPlay: true });
                handle().play();
                await tick(2300);
                expect(onChange).toHaveBeenCalledTimes(1);
                await fireEvent.mouseEnter(getRoot(container));
                await tick(400 + 5000);
                expect(onChange).toHaveBeenCalledTimes(1);
                await fireEvent.mouseLeave(getRoot(container));
                await tick(400);
                await tick(2300);
                expect(onChange).toHaveBeenCalledTimes(2);
            });

            it('autoPlay 关闭下通过 handle.play() 播放时悬停暂停，离开后恢复', async () => {
                const onChange = vi.fn<OnChange>();
                const { container, handle } = renderCarousel({ onChange, autoPlay: false });
                handle().play();
                await fireEvent.mouseEnter(getRoot(container));
                await tick(400 + 5000);
                expect(onChange).not.toHaveBeenCalled();
                await fireEvent.mouseLeave(getRoot(container));
                await tick(400);
                await tick(2300);
                expect(onChange).toHaveBeenCalledTimes(1);
            });

            it('离开时不会启动原本未播放的轮播', async () => {
                const onChange = vi.fn<OnChange>();
                const { container } = renderCarousel({ onChange, activeIndex: 0 });
                await fireEvent.mouseEnter(getRoot(container));
                await tick(400);
                await fireEvent.mouseLeave(getRoot(container));
                await tick(400 + 10000);
                expect(onChange).not.toHaveBeenCalled();
            });

            it('handle.play 覆盖 autoPlay 关闭，stop 可停止播放', async () => {
                const onChange = vi.fn<OnChange>();
                const { handle } = renderCarousel({ onChange, autoPlay: false });
                handle().play();
                await tick(2300);
                expect(onChange).toHaveBeenCalledTimes(1);
                handle().stop();
                await tick(10000);
                expect(onChange).toHaveBeenCalledTimes(1);
            });

            it('handle.stop() 之后手动切换不会重新开始播放，handle.play() 才恢复', async () => {
                const onChange = vi.fn<OnChange>();
                const { container, handle } = renderCarousel({ onChange, autoPlay: { interval: 1000 } });
                handle().stop();
                await fireEvent.click(query(container, 'arrow-next') as HTMLElement);
                handle().next();
                expect(onChange).toHaveBeenCalledTimes(2);
                await tick(10000);
                expect(onChange).toHaveBeenCalledTimes(2);
                handle().play();
                await tick(1300);
                expect(onChange).toHaveBeenCalledTimes(3);
            });

            it('系统要求减少动态效果时不自动播放，handle.play() 仍可播放', async () => {
                mockMatchMedia(['(prefers-reduced-motion: reduce)']);
                const onChange = vi.fn<OnChange>();
                const { handle } = renderCarousel({ onChange, autoPlay: { interval: 1000 } });
                await tick(5000);
                expect(onChange).not.toHaveBeenCalled();
                handle().play();
                await tick(1300);
                expect(onChange).toHaveBeenCalledTimes(1);
                vi.unstubAllGlobals();
            });

            it('autoPlay 关闭后立即停止自动播放', async () => {
                const onChange = vi.fn<OnChange>();
                const { state } = renderCarousel({ onChange, autoPlay: { interval: 1000 } });
                state.autoPlay = false;
                await nextTick();
                await tick(10000);
                expect(onChange).not.toHaveBeenCalled();
            });

            it('KeepAlive 失活后停止自动播放，激活后按配置恢复', async () => {
                const onChange = vi.fn<OnChange>();
                const { shown } = renderKeptAlive(onChange);
                await tick(1000);
                expect(onChange).toHaveBeenCalledTimes(1);

                shown.value = false;
                await nextTick();
                await tick(5000);
                expect(onChange).toHaveBeenCalledTimes(1);

                shown.value = true;
                await nextTick();
                await tick(1000);
                expect(onChange).toHaveBeenCalledTimes(2);
            });

            it('每次渲染新建 autoPlay 对象不会重新开始计时', async () => {
                const onChange = vi.fn<OnChange>();
                const { state } = renderCarousel({ onChange, autoPlay: { interval: 1000 } });
                await tick(800);
                state.autoPlay = { interval: 1000 };
                await nextTick();
                await tick(500);
                expect(onChange).toHaveBeenCalledTimes(1);
            });

            // jsdom guesses :focus-visible from the last event, so a Tab keydown makes the focus a keyboard one;
            // the mouse case is in the browser tests
            describe('键盘焦点', () => {
                const focus = async (el: HTMLElement) => {
                    await fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Tab' });
                    el.focus();
                    await nextTick();
                };
                const blur = async (el: HTMLElement) => {
                    el.blur();
                    await nextTick();
                };
                const getTab = () => screen.getByRole('tab', { selected: true });

                it('轮播暂停；键盘切换不会重新开始，离开后恢复', async () => {
                    const onChange = vi.fn<OnChange>();
                    renderCarousel({ onChange, autoPlay: { interval: 1000, hoverToPause: false } });
                    await focus(getTab());
                    await tick(5000);
                    expect(onChange).not.toHaveBeenCalled();
                    await fireEvent.keyDown(getTab(), { key: 'ArrowRight' });
                    expect(onChange).toHaveBeenCalledTimes(1);
                    await tick(5000);
                    expect(onChange).toHaveBeenCalledTimes(1);
                    await blur(getTab());
                    await tick(1300);
                    expect(onChange).toHaveBeenCalledTimes(2);
                });

                it('焦点在轮播内移动不会恢复播放', async () => {
                    const onChange = vi.fn<OnChange>();
                    renderCarousel({ onChange, autoPlay: { interval: 1000 } });
                    await focus(getTab());
                    await focus(screen.getByRole('button', { name: zh_CN.Carousel.next }));
                    await tick(5000);
                    expect(onChange).not.toHaveBeenCalled();
                });

                it('获得焦点时调用 handle.stop()，离开后不会被撤销', async () => {
                    const onChange = vi.fn<OnChange>();
                    const { handle } = renderCarousel({ onChange, autoPlay: { interval: 1000 } });
                    await focus(getTab());
                    handle().stop();
                    await blur(getTab());
                    await tick(5000);
                    expect(onChange).not.toHaveBeenCalled();
                });

                it('获得焦点时悬停暂停结束，需等焦点离开后才恢复', async () => {
                    const onChange = vi.fn<OnChange>();
                    const { container } = renderCarousel({ onChange, autoPlay: { interval: 1000 } });
                    await fireEvent.mouseEnter(getRoot(container));
                    await tick(400);
                    await focus(getTab());
                    await fireEvent.mouseLeave(getRoot(container));
                    await tick(400 + 5000);
                    expect(onChange).not.toHaveBeenCalled();
                    await blur(getTab());
                    await tick(1300);
                    expect(onChange).toHaveBeenCalledTimes(1);
                });

                it('焦点暂停的时效长于一次悬停进出', async () => {
                    const onChange = vi.fn<OnChange>();
                    const { container } = renderCarousel({ onChange, autoPlay: { interval: 1000 } });
                    await focus(getTab());
                    await fireEvent.mouseEnter(getRoot(container));
                    await tick(400);
                    await fireEvent.mouseLeave(getRoot(container));
                    await tick(400 + 5000);
                    expect(onChange).not.toHaveBeenCalled();
                });

                it('KeepAlive 失活时丢弃悬停与键盘焦点的暂停，激活后按配置播放', async () => {
                    const onChange = vi.fn<OnChange>();
                    const { container, shown } = renderKeptAlive(onChange);
                    await fireEvent.mouseEnter(getRoot(container));
                    await tick(400);
                    await focus(getTab());
                    shown.value = false;
                    await nextTick();
                    shown.value = true;
                    await nextTick();
                    await tick(1000);
                    expect(onChange).toHaveBeenCalledTimes(1);
                });

                it('仅在关闭轮播时，幻灯片才是 live region', async () => {
                    const { container } = renderCarousel({ autoPlay: { interval: 1000 } });
                    const content = query(container, 'content');
                    await nextTick();
                    expect(content).toHaveAttribute('aria-live', 'off');
                    await focus(getTab());
                    expect(content).toHaveAttribute('aria-live', 'polite');
                    await blur(getTab());
                    expect(content).toHaveAttribute('aria-live', 'off');
                });
            });
        });

        it('只有当前幻灯片在焦点顺序与无障碍树中', () => {
            const { container } = renderCarousel({ autoPlay: false, defaultActiveIndex: 1 });
            const slides = [...(query(container, 'content')?.children ?? [])];
            expect(slides.map((item) => item.hasAttribute('inert'))).toEqual([true, false, true]);
            expect(query(container, 'content')).toHaveAttribute('aria-live', 'polite');
        });

        it('是 region 角色，描述为 carousel，名称由用户指定', () => {
            renderCarousel({ autoPlay: false, 'aria-label': 'news' });
            const region = screen.getByRole('region', { name: 'news' });
            expect(region).toHaveAttribute('aria-roledescription', zh_CN.Carousel.carousel);
        });

        it('有 indicator 时，每张幻灯片是对应 tab 的 panel，使用方的 id 被沿用', () => {
            render(MixedSlides);
            const tabs = screen.getAllByRole('tab');
            for (const tab of tabs) {
                const panel = document.getElementById(tab.getAttribute('aria-controls') as string);
                expect(panel).toHaveAttribute('role', 'tabpanel');
                expect(panel).toHaveAccessibleName(tab.getAttribute('aria-label') as string);
            }
            expect(tabs[0]).toHaveAttribute('aria-controls', 'first');
        });

        it('无 indicator 时，每张幻灯片是以位置命名的 group', () => {
            const { container } = renderCarousel({ autoPlay: false, showIndicator: false });
            const slides = [...(query(container, 'content')?.children ?? [])];
            expect(slides.map((item) => item.getAttribute('aria-label'))).toEqual([1, 2, 3].map((n) => zh_CN.Carousel.slideN.replace('${index}', String(n))));
            for (const item of slides) {
                expect(item).toHaveAttribute('role', 'group');
                expect(item).toHaveAttribute('aria-roledescription', zh_CN.Carousel.slide);
            }
        });
    });

    describe('全局默认值', () => {
        it('从模块级 semiGlobal 读取', () => {
            semiGlobal.config = { overrideDefaultProps: { Carousel: { indicatorType: 'line', autoPlay: false } } };
            const { container } = renderCarousel();
            expect(query(container, 'indicator-line')).not.toBeNull();
            expect(query(renderCarousel({ indicatorType: 'columnar' }).container, 'indicator-columnar')).not.toBeNull();
        });

        it('app 级配置优先于模块级', () => {
            semiGlobal.config = { overrideDefaultProps: { Carousel: { indicatorType: 'line' } } };
            const view = render(Carousel, {
                global: {
                    provide: {
                        [semiGlobalKey as symbol]: {
                            config: {
                                overrideDefaultProps: {
                                    Carousel: {
                                        indicatorType: 'columnar',
                                        arrowProps: { leftArrow: { props: { 'aria-label': 'Before' } } },
                                    },
                                },
                            },
                        },
                    },
                },
                slots: {
                    default: () => (
                        <>
                            <div>a</div>
                            <div>b</div>
                        </>
                    ),
                },
            });
            expect(query(view.container, 'indicator-columnar')).not.toBeNull();
            expect(screen.getByRole('button', { name: 'Before' })).toBeInTheDocument();
        });

        it('全局 autoPlay 为 false 时不自动播放', async () => {
            vi.useFakeTimers();
            try {
                semiGlobal.config = { overrideDefaultProps: { Carousel: { autoPlay: false } } };
                const onChange = vi.fn<OnChange>();
                renderCarousel({ onChange });
                await tick(10000);
                expect(onChange).not.toHaveBeenCalled();
            } finally {
                vi.useRealTimers();
            }
        });
    });

    describe('attrs', () => {
        it('id、aria-label、aria-labelledby 与 data-* 落在根元素，控件不带', () => {
            const { container } = renderCarousel({
                id: 'c1',
                'aria-label': 'slides',
                'aria-labelledby': 'heading',
                'data-x': '1',
                autoPlay: false,
            });
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

        it('使用方的 role 与 aria-roledescription 覆盖默认值', () => {
            const { container } = renderCarousel({ autoPlay: false, role: 'group', 'aria-roledescription': 'gallery' });
            expect(getRoot(container)).toHaveAttribute('role', 'group');
            expect(getRoot(container)).toHaveAttribute('aria-roledescription', 'gallery');
        });
    });

    describe('箭头插槽', () => {
        it('不传插槽时有默认图标与语言包名称', () => {
            render(Arrows);
            expect(screen.getByRole('button', { name: zh_CN.Carousel.prev }).querySelector('svg')).not.toBeNull();
            expect(screen.getByRole('button', { name: zh_CN.Carousel.next }).querySelector('svg')).not.toBeNull();
        });

        it('空插槽让按钮内容为空，不回落默认图标', () => {
            render(Arrows, { props: { left: 'empty' } });
            const prev = screen.getByRole('button', { name: zh_CN.Carousel.prev });
            expect(prev.textContent).toBe('');
            expect(prev.querySelector('svg')).toBeNull();
        });

        it('文字与嵌套元素为按钮命名，不再设置 aria-label', () => {
            render(Arrows, { props: { left: 'nested', right: 'mixed' } });
            expect(screen.getByRole('button', { name: 'Back' })).not.toHaveAttribute('aria-label');
            expect(screen.getByRole('button', { name: 'Forward' })).not.toHaveAttribute('aria-label');
            expect(screen.queryByRole('button', { name: zh_CN.Carousel.prev })).toBeNull();
            expect(screen.queryByRole('button', { name: zh_CN.Carousel.next })).toBeNull();
        });

        it('插槽里带 aria-label 的元素为按钮命名，按钮自身不设置 aria-label', () => {
            render(Arrows, { props: { left: 'labelled' } });
            expect(screen.getByRole('button', { name: 'Back' })).not.toHaveAttribute('aria-label');
            expect(screen.queryByRole('button', { name: zh_CN.Carousel.prev })).toBeNull();
        });

        it('没有可读内容的插槽使用语言包名称；arrowProps 的 aria-label 优先', () => {
            render(Arrows, {
                props: {
                    left: 'icon',
                    right: 'mixed',
                    arrowProps: { rightArrow: { props: { 'aria-label': 'Go on' } } },
                },
            });
            expect(screen.getByRole('button', { name: zh_CN.Carousel.prev })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Go on' })).toBeInTheDocument();
        });

        it('arrowProps 的 class 叠加、onClick 与内置切换都执行', async () => {
            const onClick = vi.fn<() => void>();
            const { container } = render(Arrows, {
                props: {
                    left: 'text',
                    arrowProps: { leftArrow: { props: { class: 'custom-left' } }, rightArrow: { props: { onClick } } },
                },
            });
            const prev = container.querySelector(`.${BASE_CLASS_PREFIX}-carousel-arrow-prev`);
            expect(prev).toHaveClass('custom-left');
            expect(prev).toHaveTextContent(/^Back$/);
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Carousel.next }));
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
        });

        it('箭头先调用使用方的 onClick，再执行内置切换', async () => {
            const calls: string[] = [];
            renderCarousel({
                autoPlay: false,
                onChange: () => calls.push('change'),
                arrowProps: { rightArrow: { props: { onClick: () => calls.push('click') } } },
            });
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Carousel.next }));
            expect(calls).toEqual(['click', 'change']);
        });

        it('箭头按钮以插槽名标注 x-semi-prop', () => {
            renderCarousel({ autoPlay: false });
            expect(screen.getByRole('button', { name: zh_CN.Carousel.prev })).toHaveAttribute('x-semi-prop', 'leftArrow');
            expect(screen.getByRole('button', { name: zh_CN.Carousel.next })).toHaveAttribute('x-semi-prop', 'rightArrow');
        });
    });

    describe('幻灯片节点', () => {
        it('v-for、v-if 与 template 产生的幻灯片被展开，文本子节点被忽略', async () => {
            const view = render(MixedSlides);
            const { container } = view;
            expect(slideText(container)).toEqual(['first', 'a', 'b', 'last']);
            expect(screen.getAllByRole('tab')).toHaveLength(4);

            await view.rerender({ showFirst: false, showLast: false, items: ['a'] });
            expect(slideText(container)).toEqual(['a']);
            expect(query(container, 'indicator')).toBeNull();

            await view.rerender({ items: ['a', 'b', 'c'] });
            expect(slideText(container)).toEqual(['a', 'b', 'c']);
            expect(screen.getAllByRole('tab')).toHaveLength(3);
        });

        it('前面的幻灯片消失时，其余幻灯片按 key 复用原有元素', async () => {
            const view = render(MixedSlides);
            const before = [...(query(view.container, 'content')?.children ?? [])];
            await view.rerender({ showFirst: false });
            const after = [...(query(view.container, 'content')?.children ?? [])];
            expect(after).toHaveLength(3);
            after.forEach((element, index) => expect(element).toBe(before[index + 1]));
        });

        it('组件幻灯片的 id、role、inert、class 落到其根元素', () => {
            const { container } = render(ComponentSlides);
            const slides = [...container.querySelectorAll<HTMLElement>('section.own-slide')];
            expect(slides).toHaveLength(2);
            expect(slides[0]).toHaveClass('mine', `${BASE_CLASS_PREFIX}-carousel-content-item`);
            expect(slides[0]).toHaveAttribute('role', 'tabpanel');
            expect(slides[0]?.id).not.toBe('');
            expect(slides[0]).not.toHaveAttribute('inert');
            expect(slides[1]).toHaveAttribute('inert');
        });
    });

    describe('v-model:activeIndex', () => {
        it('箭头、指示器、键盘与 handle 的切换同步回宿主', async () => {
            const { container } = render(Model);
            const output = () => container.querySelector('p')?.textContent;
            expect(output()).toBe('0');
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Carousel.next }));
            expect(output()).toBe('1');
            await userEvent.click(screen.getAllByRole('tab')[0] as HTMLElement);
            expect(output()).toBe('0');
            screen.getAllByRole('tab')[0]?.focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(output()).toBe('1');
            await userEvent.click(screen.getByText('goTo3'));
            expect(output()).toBe('2');
            expect(getActiveItem(container)).toHaveTextContent(/^index2$/);
        });

        it('单向绑定只发 change，显示不翻转', async () => {
            const view = render(OneWay);
            const { container } = view;
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Carousel.next }));
            expect(container.querySelector('p')).toHaveTextContent('[[2,1]]');
            expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
            await view.rerender({ activeIndex: 1 });
            expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
            await view.rerender({ activeIndex: 2 });
            expect(getActiveItem(container)).toHaveTextContent(/^index2$/);
        });
    });

    describe('键盘', () => {
        const tabs = () => screen.getAllByRole('tab');
        const renderStatic = (props: Props = {}) => renderCarousel({ autoPlay: false, ...props });

        it('箭头是可由键盘激活的原生 button', async () => {
            const { container } = renderStatic({ arrowType: 'always' });
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

        it('indicator 组成带 roving tabindex 的具名 tablist', async () => {
            renderStatic({ defaultActiveIndex: 1 });
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
            const { container } = renderStatic();
            for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
                for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                    const event = new KeyboardEvent('keydown', { key, [modifier]: true, bubbles: true, cancelable: true });
                    tabs()[0]?.dispatchEvent(event);
                    expect(event.defaultPrevented).toBe(false);
                }
            }
            expect(activeTitle(container)).toBe('index0');
        });

        it('无指示器时幻灯片自带的 aria-label 优先于内置的第 N 项', () => {
            const view = render({
                render: () => (
                    <Carousel showIndicator={false} autoPlay={false}>
                        {() => (
                            <>
                                <div aria-label="cover">a</div>
                                <div>b</div>
                            </>
                        )}
                    </Carousel>
                ),
            });
            const slides = query(view.container, 'content')?.children as HTMLCollection;
            expect(slides[0]).toHaveAttribute('aria-label', 'cover');
            expect(slides[1]).toHaveAttribute('aria-label', zh_CN.Carousel.slideN.replace('${index}', '2'));
        });

        it('Left 与 Right 切换幻灯片，并把焦点移到当前 tab', async () => {
            const { container } = renderStatic();
            tabs()[0]?.focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(activeTitle(container)).toBe('index1');
            expect(tabs()[1]).toHaveFocus();
            expect(tabs()[1]).toHaveAttribute('aria-selected', 'true');
            await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
            expect(activeTitle(container)).toBe('index2');
            expect(tabs()[2]).toHaveFocus();
        });

        it('焦点只跟随本轮播的指示器，幻灯片内的 tab 不被选中', async () => {
            render({
                render: () => (
                    <Carousel autoPlay={false}>
                        {() =>
                            [0, 1, 2].map((n) => (
                                <div>
                                    <button role="tab" tabindex={0} type="button">{`inner${n}`}</button>
                                </div>
                            ))
                        }
                    </Carousel>
                ),
            });
            const indicatorTabs = screen.getAllByRole('tab').filter((tab) => tab.classList.contains(`${BASE_CLASS_PREFIX}-carousel-indicator-item`));
            expect(indicatorTabs).toHaveLength(3);
            indicatorTabs[0]?.focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(indicatorTabs[1]).toHaveFocus();
        });

        it('Home 与 End 跳到第一张与最后一张幻灯片', async () => {
            const { container } = renderStatic({ defaultActiveIndex: 1 });
            tabs()[1]?.focus();
            await userEvent.keyboard('{End}');
            expect(activeTitle(container)).toBe('index2');
            expect(tabs()[2]).toHaveFocus();
            await userEvent.keyboard('{Home}');
            expect(activeTitle(container)).toBe('index0');
            expect(tabs()[0]).toHaveFocus();
        });

        it('RTL 下 Left 切换到下一张，Right 切换到上一张', async () => {
            const { container } = render(Rtl);
            tabs()[0]?.focus();
            await userEvent.keyboard('{ArrowLeft}');
            expect(activeTitle(container)).toBe('index1');
            expect(tabs()[1]).toHaveFocus();
            await userEvent.keyboard('{ArrowRight}');
            expect(activeTitle(container)).toBe('index0');
            expect(tabs()[0]).toHaveFocus();
        });

        it('受控轮播跟随 v-model 时焦点保持在 tab 上', async () => {
            render(Model);
            tabs()[0]?.focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(tabs()[1]).toHaveFocus();
        });
    });
});
