import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import CarouselFoundation from '@fibrae/semi-foundation/carousel/foundation';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Carousel, ConfigProvider } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { mockMatchMedia } from '@test/utils/dom/react';
import type { CarouselHandle } from '../interface';

type OnChange = (index: number, preIndex: number) => void;

function getCarousel(carouselProps) {
    const contentStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        background: 'lightBlue',
    };

    return (
        <Carousel style={{ width: '600px', height: '240px' }} {...carouselProps}>
            <div style={contentStyle}>
                <h3>index0</h3>
            </div>
            <div style={contentStyle}>
                <h3>index1</h3>
            </div>
            <div style={contentStyle}>
                <h3>index2</h3>
            </div>
        </Carousel>
    );
}

function getSingleCarousel(carouselProps) {
    const contentStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        background: 'lightBlue',
    };

    return (
        <Carousel style={{ width: '600px', height: '240px' }} {...carouselProps}>
            <div style={contentStyle}>
                <h3>index0</h3>
            </div>
        </Carousel>
    );
}

const query = (container: HTMLElement, suffix: string) => container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-carousel-${suffix}`);
const getActiveItem = (container: HTMLElement) => query(container, 'content-item-active');
const getIndicatorItems = (container) => container.querySelectorAll(`.${BASE_CLASS_PREFIX}-carousel-indicator-item`);

const presentClasses = (propsList, suffixes) =>
    propsList.map((props) => {
        const { container, unmount } = render(getCarousel(props));
        const present = suffixes.filter((suffix) => query(container, suffix) !== null);
        unmount();
        return present;
    });

describe('Carousel', () => {
    it('基础渲染', () => {
        const { container } = render(getCarousel({}));
        expect(query(container, 'content').children).toHaveLength(3);
        expect(getActiveItem(container)).toHaveTextContent(/^index0$/);
    });

    it('自定义 className 与 style 的 Carousel', () => {
        const { container } = render(getCarousel({ className: 'test', style: { color: 'red' } }));
        const carousel = container.querySelector(`.${BASE_CLASS_PREFIX}-carousel`);
        expect(carousel).toHaveClass('test');
        expect(carousel).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('带 defaultActiveIndex 的 Carousel', () => {
        const { container } = render(getCarousel({ defaultActiveIndex: 2 }));
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
        const { container } = render(getCarousel({ onChange }));
        expect(query(container, 'arrow')).not.toBeNull();

        await userEvent.click(screen.getByLabelText(zh_CN.Carousel.prev));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getActiveItem(container)).toHaveTextContent(/^index2$/);

        await userEvent.click(screen.getByLabelText(zh_CN.Carousel.next));
        expect(getActiveItem(container)).toHaveTextContent(/^index0$/);
    });

    it('通过点击或 trigger 切换 indicator', async () => {
        const onChange = vi.fn<OnChange>();
        const { container, unmount } = render(getCarousel({ onChange }));
        await userEvent.click(getIndicatorItems(container)[2]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getActiveItem(container)).toHaveTextContent(/^index2$/);
        unmount();

        const onChangeHover = vi.fn<OnChange>();
        const hover = render(getCarousel({ onChange: onChangeHover, trigger: 'hover' }));
        await userEvent.hover(getIndicatorItems(hover.container)[2]);
        expect(onChangeHover).toHaveBeenCalledTimes(1);
        expect(getActiveItem(hover.container)).toHaveTextContent(/^index2$/);
    });

    it('单个索引', () => {
        const { container } = render(getSingleCarousel({}));
        expect(query(container, 'indicator')).toBeNull();
        expect(query(container, 'arrow')).toBeNull();
    });

    describe('fix-1482', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('fix-1482：children 变化时更新幻灯片，ref.play 覆盖 autoPlay={false}', () => {
            const ref = React.createRef<CarouselHandle>();
            const renderSlides = (items) => (
                <Carousel ref={ref} style={{ width: '600px', height: '240px' }} autoPlay={false}>
                    {items.map((item, index) => (
                        <div key={index}>
                            <h3>item{item}</h3>
                        </div>
                    ))}
                </Carousel>
            );
            const { container, rerender } = render(renderSlides([1, 2]));
            rerender(renderSlides([3, 4, 5]));
            expect(getIndicatorItems(container)).toHaveLength(3);
            expect(getActiveItem(container)).toHaveTextContent(/^item3$/);

            act(() => {
                vi.advanceTimersByTime(2300);
            });
            expect(getActiveItem(container)).toHaveTextContent(/^item3$/);

            act(() => {
                ref.current.play();
            });
            act(() => {
                vi.advanceTimersByTime(2300);
            });
            expect(getActiveItem(container)).toHaveTextContent(/^item4$/);
            act(() => {
                vi.advanceTimersByTime(2300);
            });
            expect(getActiveItem(container)).toHaveTextContent(/^item5$/);

            act(() => {
                ref.current.stop();
            });
            act(() => {
                vi.advanceTimersByTime(2300);
            });
            expect(getActiveItem(container)).toHaveTextContent(/^item5$/);
        });
    });

    it('幻灯片减少到当前索引之外时，显示最后一张，指示点仍可 Tab 到达，下一步回到第一张', () => {
        const onChange = vi.fn<OnChange>();
        const renderSlides = (count: number) => (
            <Carousel autoPlay={false} defaultActiveIndex={2} onChange={onChange}>
                {Array.from({ length: count }, (_, i) => (
                    <div key={i}>
                        <h3>slide{i}</h3>
                    </div>
                ))}
            </Carousel>
        );
        const { container, rerender } = render(renderSlides(3));
        expect(getActiveItem(container)).toHaveTextContent(/^slide2$/);

        rerender(renderSlides(2));
        expect(getActiveItem(container)).toHaveTextContent(/^slide1$/);
        expect(screen.getAllByRole('tab').filter((tab) => tab.tabIndex === 0)).toHaveLength(1);

        fireEvent.click(query(container, 'arrow-next'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith(0, 1);
        expect(getActiveItem(container)).toHaveTextContent(/^slide0$/);
    });

    describe('悬停防抖', () => {
        const autoPlay = { interval: 1000, hoverToPause: true };

        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('重渲染间共享同一个防抖的鼠标处理函数', () => {
            const { container, rerender } = render(getCarousel({ autoPlay }));
            const handleAutoPlay = vi.spyOn(CarouselFoundation.prototype, 'handleAutoPlay');
            const root = container.querySelector(`.${BASE_CLASS_PREFIX}-carousel`);

            fireEvent.mouseEnter(root);
            act(() => {
                vi.advanceTimersByTime(400);
            });
            fireEvent.mouseLeave(root);
            rerender(getCarousel({ autoPlay, className: 'rerendered' }));
            fireEvent.mouseLeave(root);
            act(() => {
                vi.advanceTimersByTime(400);
            });
            expect(handleAutoPlay).toHaveBeenCalledTimes(1);
            handleAutoPlay.mockRestore();
        });

        it('卸载时丢弃待执行的悬停处理函数', () => {
            const onChange = vi.fn<OnChange>();
            const { container, unmount } = render(getCarousel({ autoPlay, onChange }));
            fireEvent.mouseLeave(container.querySelector(`.${BASE_CLASS_PREFIX}-carousel`));
            unmount();
            act(() => {
                vi.advanceTimersByTime(5000);
            });
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe('首次交互与幻灯片增加', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('首次交互指向当前索引时不播放动画', () => {
            const { container } = render(getCarousel({ autoPlay: false }));
            fireEvent.click(getIndicatorItems(container)[0]);
            expect(query(container, 'content-item-slide-in')).toBeNull();
            expect(query(container, 'content-item-slide-out')).toBeNull();
        });

        it('幻灯片从一张增加到多张时按配置开始自动播放', () => {
            const onChange = vi.fn<OnChange>();
            const { rerender } = render(getSingleCarousel({ onChange }));
            act(() => {
                vi.advanceTimersByTime(10000);
            });
            expect(onChange).not.toHaveBeenCalled();
            rerender(getCarousel({ onChange }));
            act(() => {
                vi.advanceTimersByTime(2300);
            });
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it('幻灯片增加时，autoPlay 关闭、受控或悬停暂停中的轮播不会开始播放', () => {
            const off = vi.fn<OnChange>();
            const offView = render(getSingleCarousel({ onChange: off, autoPlay: false }));
            offView.rerender(getCarousel({ onChange: off, autoPlay: false }));
            act(() => {
                vi.advanceTimersByTime(10000);
            });
            expect(off).not.toHaveBeenCalled();
            offView.unmount();

            const controlled = vi.fn<OnChange>();
            const controlledView = render(getSingleCarousel({ onChange: controlled, activeIndex: 0 }));
            controlledView.rerender(getCarousel({ onChange: controlled, activeIndex: 0 }));
            act(() => {
                vi.advanceTimersByTime(10000);
            });
            expect(controlled).not.toHaveBeenCalled();
            controlledView.unmount();

            const hovering = vi.fn<OnChange>();
            const hoveringView = render(getSingleCarousel({ onChange: hovering }));
            const root = hoveringView.container.querySelector(`.${BASE_CLASS_PREFIX}-carousel`);
            fireEvent.mouseEnter(root);
            act(() => {
                vi.advanceTimersByTime(400);
            });
            hoveringView.rerender(getCarousel({ onChange: hovering }));
            act(() => {
                vi.advanceTimersByTime(10000);
            });
            expect(hovering).not.toHaveBeenCalled();
            fireEvent.mouseLeave(root);
            act(() => {
                vi.advanceTimersByTime(400);
            });
            act(() => {
                vi.advanceTimersByTime(2300);
            });
            expect(hovering).toHaveBeenCalledTimes(1);
        });
    });

    describe('基线', () => {
        const getRoot = (container) => container.querySelector(`.${BASE_CLASS_PREFIX}-carousel`);
        const clickNext = (container) => fireEvent.click(query(container, 'arrow-next'));
        const clickPrev = (container) => fireEvent.click(query(container, 'arrow-prev'));
        const tick = (ms) =>
            act(() => {
                vi.advanceTimersByTime(ms);
            });

        it('onChange 传入新索引与旧索引', () => {
            const onChange = vi.fn<OnChange>();
            const { container } = render(getCarousel({ onChange, autoPlay: false, defaultActiveIndex: 1 }));
            fireEvent.click(getIndicatorItems(container)[0]);
            expect(onChange).toHaveBeenLastCalledWith(0, 1);
            clickPrev(container);
            expect(onChange).toHaveBeenLastCalledWith(2, 0);
            clickNext(container);
            expect(onChange).toHaveBeenLastCalledWith(0, 2);
            fireEvent.click(getIndicatorItems(container)[0]);
            expect(onChange).toHaveBeenCalledTimes(3);
        });

        it('受控的 activeIndex 仅随 prop 变化', () => {
            const onChange = vi.fn<OnChange>();
            const { container, rerender } = render(getCarousel({ onChange, autoPlay: false, activeIndex: 1 }));
            expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
            clickNext(container);
            expect(onChange).toHaveBeenLastCalledWith(2, 1);
            expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
            fireEvent.click(getIndicatorItems(container)[0]);
            expect(onChange).toHaveBeenLastCalledWith(0, 1);
            expect(getActiveItem(container)).toHaveTextContent(/^index1$/);

            rerender(getCarousel({ onChange, autoPlay: false, activeIndex: 2 }));
            expect(getActiveItem(container)).toHaveTextContent(/^index2$/);
            expect(getIndicatorItems(container)[2]).toHaveClass(`${BASE_CLASS_PREFIX}-carousel-indicator-item-active`);
            clickNext(container);
            expect(onChange).toHaveBeenLastCalledWith(0, 2);
        });

        it('移除 activeIndex 后保留最后的受控索引，之后转为非受控运行', () => {
            const onChange = vi.fn<OnChange>();
            const { container, rerender } = render(getCarousel({ onChange, autoPlay: false, activeIndex: 0 }));
            rerender(getCarousel({ onChange, autoPlay: false, activeIndex: 2 }));
            rerender(getCarousel({ onChange, autoPlay: false }));
            expect(getActiveItem(container)).toHaveTextContent(/^index2$/);
            clickNext(container);
            expect(onChange).toHaveBeenLastCalledWith(0, 2);
            expect(getActiveItem(container)).toHaveTextContent(/^index0$/);
        });

        it('标记幻灯片方向，以及进入与离开的项', () => {
            const { container } = render(getCarousel({ autoPlay: false }));
            const content = query(container, 'content');
            expect(query(container, 'content-item-slide-in')).toBeNull();
            clickPrev(container);
            expect(content).toHaveClass(`${BASE_CLASS_PREFIX}-carousel-content-reverse`);
            expect(query(container, 'content-item-slide-in')).toHaveTextContent(/^index2$/);
            expect(query(container, 'content-item-slide-out')).toHaveTextContent(/^index0$/);
            clickNext(container);
            expect(content).not.toHaveClass(`${BASE_CLASS_PREFIX}-carousel-content-reverse`);

            const fade = render(getCarousel({ autoPlay: false, animation: 'fade', speed: 500 }));
            expect(query(fade.container, 'content')).toHaveClass(`${BASE_CLASS_PREFIX}-carousel-content-fade`);
            expect(getActiveItem(fade.container)).toHaveStyle({ transitionDuration: '500ms' });
            clickNext(fade.container);
            expect(query(fade.container, 'content-item-slide-in')).toBeNull();
        });

        it('trigger 为 hover 时忽略 indicator 点击', () => {
            const onChange = vi.fn<OnChange>();
            const { container } = render(getCarousel({ onChange, autoPlay: false, trigger: 'hover' }));
            fireEvent.click(getIndicatorItems(container)[1]);
            expect(onChange).not.toHaveBeenCalled();
            fireEvent.mouseEnter(getIndicatorItems(container)[1]);
            expect(onChange).toHaveBeenLastCalledWith(1, 0);

            const click = render(getCarousel({ onChange: vi.fn<OnChange>(), autoPlay: false }));
            fireEvent.mouseEnter(getIndicatorItems(click.container)[2]);
            expect(getActiveItem(click.container)).toHaveTextContent(/^index0$/);
        });

        it('自定义箭头接收 children 与 props', () => {
            const onClick = vi.fn<() => void>();
            const { container } = render(
                getCarousel({
                    autoPlay: false,
                    arrowProps: {
                        leftArrow: { children: 'L', props: { className: 'custom-left' } },
                        rightArrow: { children: null, props: { onClick } },
                    },
                })
            );
            expect(query(container, 'arrow-prev')).toBeNull();
            expect(container.querySelector('.custom-left')).toHaveTextContent(/^L$/);
            expect(query(container, 'arrow-next')).toBeEmptyDOMElement();
            clickNext(container);
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(getActiveItem(container)).toHaveTextContent(/^index0$/);
        });

        it('箭头名称：优先 aria-label，其次可读的 children，否则使用语言包名称', () => {
            render(
                getCarousel({
                    autoPlay: false,
                    arrowProps: {
                        leftArrow: { children: <i /> },
                        rightArrow: { children: 'Forward', props: { 'aria-label': 'Go on' } },
                    },
                })
            );
            expect(screen.getByRole('button', { name: zh_CN.Carousel.prev })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Go on' })).toBeInTheDocument();
        });

        it('箭头的文字 children 在没有 aria-label 时为按钮命名', () => {
            render(
                getCarousel({
                    autoPlay: false,
                    arrowProps: {
                        leftArrow: { children: <span>Back</span> },
                        rightArrow: { children: ['Forward ', <i key="i" />] },
                    },
                })
            );
            const back = screen.getByRole('button', { name: 'Back' });
            expect(back).not.toHaveAttribute('aria-label');
            expect(screen.getByRole('button', { name: 'Forward' })).not.toHaveAttribute('aria-label');
            expect(screen.queryByRole('button', { name: zh_CN.Carousel.prev })).toBeNull();
        });

        it('将 data-* 属性传给根元素', () => {
            const { container } = render(getCarousel({ 'data-testid': 'carousel', autoPlay: false }));
            expect(getRoot(container)).toHaveAttribute('data-testid', 'carousel');
        });

        it('showIndicator 为 false 时隐藏 indicator', () => {
            const { container } = render(getCarousel({ showIndicator: false, autoPlay: false }));
            expect(query(container, 'indicator')).toBeNull();
            expect(query(container, 'arrow')).not.toBeNull();
        });

        it('ref 方法切换轮播并触发 onChange', () => {
            const ref = React.createRef<CarouselHandle>();
            const onChange = vi.fn<OnChange>();
            const { container } = render(getCarousel({ ref, onChange, autoPlay: false }));
            act(() => ref.current.next());
            expect(onChange).toHaveBeenLastCalledWith(1, 0);
            expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
            act(() => ref.current.prev());
            expect(onChange).toHaveBeenLastCalledWith(0, 1);
            act(() => ref.current.goTo(5));
            expect(onChange).toHaveBeenLastCalledWith(2, 0);
            expect(getActiveItem(container)).toHaveTextContent(/^index2$/);
        });

        it('goTo 小于负总数的索引也回绕；没有幻灯片时 next 不抛错', () => {
            const ref = React.createRef<CarouselHandle>();
            const { container } = render(getCarousel({ ref, autoPlay: false }));
            act(() => ref.current.goTo(-4));
            expect(getActiveItem(container)).toHaveTextContent(/^index2$/);

            const emptyRef = React.createRef<CarouselHandle>();
            render(<Carousel ref={emptyRef} autoPlay={false} />);
            expect(() => act(() => emptyRef.current.next())).not.toThrow();
        });

        it('用户传入的 onMouseEnter、onMouseLeave、onFocus、onBlur 会被调用', () => {
            const handlers = {
                onMouseEnter: vi.fn<React.MouseEventHandler<HTMLDivElement>>(),
                onMouseLeave: vi.fn<React.MouseEventHandler<HTMLDivElement>>(),
                onFocus: vi.fn<React.FocusEventHandler<HTMLDivElement>>(),
                onBlur: vi.fn<React.FocusEventHandler<HTMLDivElement>>(),
            };
            const { container } = render(getCarousel({ autoPlay: false, ...handlers }));
            const root = getRoot(container);
            const arrow = query(container, 'arrow-next');
            fireEvent.mouseEnter(root);
            fireEvent.mouseLeave(root);
            fireEvent.focus(arrow);
            fireEvent.blur(arrow);
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

            it('按 interval 与 speed 定时切换', () => {
                const onChange = vi.fn<OnChange>();
                const { container } = render(getCarousel({ onChange, autoPlay: { interval: 1000 }, speed: 200 }));
                tick(1199);
                expect(onChange).not.toHaveBeenCalled();
                tick(1);
                expect(onChange).toHaveBeenLastCalledWith(1, 0);
                expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
                // one act per switch: a class component reads state committed by the previous act
                tick(1200);
                tick(1200);
                expect(onChange).toHaveBeenLastCalledWith(0, 2);
                expect(onChange).toHaveBeenCalledTimes(3);
            });

            it('autoPlay 为 true 时使用默认 interval，为 false 时不切换', () => {
                const onChange = vi.fn<OnChange>();
                render(getCarousel({ onChange }));
                tick(2300);
                expect(onChange).toHaveBeenCalledTimes(1);

                const off = vi.fn<OnChange>();
                render(getCarousel({ onChange: off, autoPlay: false }));
                tick(10000);
                expect(off).not.toHaveBeenCalled();
            });

            it('悬停经过防抖后暂停，离开后恢复', () => {
                const onChange = vi.fn<OnChange>();
                const { container } = render(getCarousel({ onChange, autoPlay: { interval: 1000, hoverToPause: true } }));
                fireEvent.mouseEnter(getRoot(container));
                tick(400);
                tick(5000);
                expect(onChange).not.toHaveBeenCalled();
                fireEvent.mouseLeave(getRoot(container));
                tick(400);
                tick(1300);
                expect(onChange).toHaveBeenCalledTimes(1);
            });

            it('悬停暂停后点击箭头只切换一次，指针仍在时不恢复，离开后恢复', () => {
                const onChange = vi.fn<OnChange>();
                const { container } = render(getCarousel({ onChange, autoPlay: { interval: 1000, hoverToPause: true } }));
                fireEvent.mouseEnter(getRoot(container));
                tick(400);
                clickNext(container);
                expect(onChange).toHaveBeenCalledTimes(1);
                tick(5000);
                expect(onChange).toHaveBeenCalledTimes(1);
                fireEvent.mouseLeave(getRoot(container));
                tick(400);
                tick(1300);
                expect(onChange).toHaveBeenCalledTimes(2);
            });

            it('hoverToPause 为 false 时悬停不暂停', () => {
                const onChange = vi.fn<OnChange>();
                const { container } = render(getCarousel({ onChange, autoPlay: { interval: 1000, hoverToPause: false } }));
                fireEvent.mouseEnter(getRoot(container));
                tick(1300);
                expect(onChange).toHaveBeenCalledTimes(1);
            });

            it('autoPlay 为对象且未指定时，hoverToPause 默认为 true', () => {
                const onChange = vi.fn<OnChange>();
                const { container } = render(getCarousel({ onChange, autoPlay: { interval: 1000 } }));
                fireEvent.mouseEnter(getRoot(container));
                tick(400 + 5000);
                expect(onChange).not.toHaveBeenCalled();
            });

            it('autoPlay 为 true 时悬停暂停', () => {
                const onChange = vi.fn<OnChange>();
                const { container } = render(getCarousel({ onChange }));
                fireEvent.mouseEnter(getRoot(container));
                tick(400 + 5000);
                expect(onChange).not.toHaveBeenCalled();
            });

            it('手动切换后重新开始计时', () => {
                const onChange = vi.fn<OnChange>();
                const { container } = render(getCarousel({ onChange, autoPlay: { interval: 1000 }, speed: 0 }));
                tick(800);
                clickNext(container);
                tick(800);
                expect(onChange).toHaveBeenCalledTimes(1);
                tick(200);
                expect(onChange).toHaveBeenCalledTimes(2);
                expect(onChange).toHaveBeenLastCalledWith(2, 1);
            });

            it('卸载后停止', () => {
                const onChange = vi.fn<OnChange>();
                const { unmount } = render(getCarousel({ onChange }));
                unmount();
                tick(10000);
                expect(onChange).not.toHaveBeenCalled();
            });

            it('StrictMode 下只运行一个定时器', () => {
                const onChange = vi.fn<OnChange>();
                render(<React.StrictMode>{getCarousel({ onChange, autoPlay: { interval: 1000 } })}</React.StrictMode>);
                tick(1300);
                expect(onChange).toHaveBeenCalledTimes(1);
                tick(1300);
                expect(onChange).toHaveBeenCalledTimes(2);
            });

            it('从 props 读取最新的 onChange 与 speed', () => {
                const first = vi.fn<OnChange>();
                const second = vi.fn<OnChange>();
                const { rerender } = render(getCarousel({ onChange: first, autoPlay: { interval: 1000 } }));
                rerender(getCarousel({ onChange: second, autoPlay: { interval: 1000 } }));
                tick(1300);
                expect(first).not.toHaveBeenCalled();
                expect(second).toHaveBeenCalledTimes(1);
            });

            it('受控时挂载不自动播放', () => {
                const onChange = vi.fn<OnChange>();
                render(getCarousel({ onChange, activeIndex: 0 }));
                tick(10000);
                expect(onChange).not.toHaveBeenCalled();
            });

            it('受控轮播通过 ref.play() 播放，悬停后恢复', () => {
                const ref = React.createRef<CarouselHandle>();
                const onChange = vi.fn<OnChange>();
                const { container } = render(getCarousel({ ref, onChange, activeIndex: 0, autoPlay: true }));
                act(() => ref.current.play());
                tick(2300);
                expect(onChange).toHaveBeenCalledTimes(1);
                fireEvent.mouseEnter(getRoot(container));
                tick(400 + 5000);
                expect(onChange).toHaveBeenCalledTimes(1);
                fireEvent.mouseLeave(getRoot(container));
                tick(400);
                tick(2300);
                expect(onChange).toHaveBeenCalledTimes(2);
            });

            it('autoPlay={false} 下通过 ref.play() 播放时悬停暂停，离开后恢复', () => {
                const ref = React.createRef<CarouselHandle>();
                const onChange = vi.fn<OnChange>();
                const { container } = render(getCarousel({ ref, onChange, autoPlay: false }));
                act(() => ref.current.play());
                fireEvent.mouseEnter(getRoot(container));
                tick(400 + 5000);
                expect(onChange).not.toHaveBeenCalled();
                fireEvent.mouseLeave(getRoot(container));
                tick(400);
                tick(2300);
                expect(onChange).toHaveBeenCalledTimes(1);
            });

            it('离开时不会启动原本未播放的轮播', () => {
                const onChange = vi.fn<OnChange>();
                const { container } = render(getCarousel({ onChange, activeIndex: 0 }));
                fireEvent.mouseEnter(getRoot(container));
                tick(400);
                fireEvent.mouseLeave(getRoot(container));
                tick(400 + 10000);
                expect(onChange).not.toHaveBeenCalled();
            });

            it('ref play 覆盖 autoPlay={false}，stop 可停止播放', () => {
                const ref = React.createRef<CarouselHandle>();
                const onChange = vi.fn<OnChange>();
                render(getCarousel({ ref, onChange, autoPlay: false }));
                act(() => ref.current.play());
                tick(2300);
                expect(onChange).toHaveBeenCalledTimes(1);
                act(() => ref.current.stop());
                tick(10000);
                expect(onChange).toHaveBeenCalledTimes(1);
            });

            it('ref.stop() 之后手动切换不会重新开始播放，ref.play() 才恢复', () => {
                const ref = React.createRef<CarouselHandle>();
                const onChange = vi.fn<OnChange>();
                const { container } = render(getCarousel({ ref, onChange, autoPlay: { interval: 1000 } }));
                act(() => ref.current.stop());
                clickNext(container);
                act(() => ref.current.next());
                expect(onChange).toHaveBeenCalledTimes(2);
                tick(10000);
                expect(onChange).toHaveBeenCalledTimes(2);
                act(() => ref.current.play());
                tick(1300);
                expect(onChange).toHaveBeenCalledTimes(3);
            });

            it('onChange 为 null 时切换不会抛错', () => {
                const { container } = render(getCarousel({ onChange: null, autoPlay: false }));
                expect(() => clickNext(container)).not.toThrow();
                expect(getActiveItem(container)).toHaveTextContent(/^index1$/);
            });

            describe('prefers-reduced-motion', () => {
                afterEach(() => {
                    vi.unstubAllGlobals();
                });

                it('系统要求减少动态效果时不自动播放，ref.play() 仍可播放', () => {
                    mockMatchMedia(['(prefers-reduced-motion: reduce)']);
                    const ref = React.createRef<CarouselHandle>();
                    const onChange = vi.fn<OnChange>();
                    render(getCarousel({ ref, onChange, autoPlay: { interval: 1000 } }));
                    tick(5000);
                    expect(onChange).not.toHaveBeenCalled();
                    act(() => ref.current.play());
                    tick(1300);
                    expect(onChange).toHaveBeenCalledTimes(1);
                });

                it('未要求减少动态效果时照常自动播放', () => {
                    mockMatchMedia();
                    const onChange = vi.fn<OnChange>();
                    render(getCarousel({ onChange, autoPlay: { interval: 1000 } }));
                    tick(1300);
                    expect(onChange).toHaveBeenCalledTimes(1);
                });
            });

            // jsdom guesses :focus-visible from the last event, so a Tab keydown makes the focus a keyboard one;
            describe('键盘焦点', () => {
                const focus = (el) =>
                    act(() => {
                        fireEvent.keyDown(document.activeElement, { key: 'Tab' });
                        el.focus();
                    });
                const blur = (el) =>
                    act(() => {
                        el.blur();
                    });
                const getTab = () => screen.getByRole('tab', { selected: true });

                it('轮播暂停；键盘切换不会重新开始，离开后恢复', () => {
                    const onChange = vi.fn<OnChange>();
                    render(getCarousel({ onChange, autoPlay: { interval: 1000, hoverToPause: false } }));
                    focus(getTab());
                    tick(5000);
                    expect(onChange).not.toHaveBeenCalled();
                    fireEvent.keyDown(getTab(), { key: 'ArrowRight' });
                    expect(onChange).toHaveBeenCalledTimes(1);
                    tick(5000);
                    expect(onChange).toHaveBeenCalledTimes(1);
                    blur(getTab());
                    tick(1300);
                    expect(onChange).toHaveBeenCalledTimes(2);
                });

                it('焦点在轮播内移动不会恢复播放', () => {
                    const onChange = vi.fn<OnChange>();
                    render(getCarousel({ onChange, autoPlay: { interval: 1000 } }));
                    focus(getTab());
                    focus(screen.getByRole('button', { name: zh_CN.Carousel.next }));
                    tick(5000);
                    expect(onChange).not.toHaveBeenCalled();
                });

                it('获得焦点时调用 ref.stop()，离开后不会被撤销', () => {
                    const ref = React.createRef<CarouselHandle>();
                    const onChange = vi.fn<OnChange>();
                    render(getCarousel({ ref, onChange, autoPlay: { interval: 1000 } }));
                    focus(getTab());
                    act(() => ref.current.stop());
                    blur(getTab());
                    tick(5000);
                    expect(onChange).not.toHaveBeenCalled();
                });

                it('获得焦点时悬停暂停结束，需等焦点离开后才恢复', () => {
                    const onChange = vi.fn<OnChange>();
                    const { container } = render(getCarousel({ onChange, autoPlay: { interval: 1000 } }));
                    fireEvent.mouseEnter(getRoot(container));
                    tick(400);
                    focus(getTab());
                    fireEvent.mouseLeave(getRoot(container));
                    tick(400 + 5000);
                    expect(onChange).not.toHaveBeenCalled();
                    blur(getTab());
                    tick(1300);
                    expect(onChange).toHaveBeenCalledTimes(1);
                });

                it('焦点暂停的时效长于一次悬停进出', () => {
                    const onChange = vi.fn<OnChange>();
                    const { container } = render(getCarousel({ onChange, autoPlay: { interval: 1000 } }));
                    focus(getTab());
                    fireEvent.mouseEnter(getRoot(container));
                    tick(400);
                    fireEvent.mouseLeave(getRoot(container));
                    tick(400 + 5000);
                    expect(onChange).not.toHaveBeenCalled();
                });

                it('仅在关闭轮播时，幻灯片才是 live region', () => {
                    const { container } = render(getCarousel({ autoPlay: { interval: 1000 } }));
                    const content = query(container, 'content');
                    expect(content).toHaveAttribute('aria-live', 'off');
                    focus(getTab());
                    expect(content).toHaveAttribute('aria-live', 'polite');
                    blur(getTab());
                    expect(content).toHaveAttribute('aria-live', 'off');
                });
            });
        });

        it('只有当前幻灯片在焦点顺序与无障碍树中', () => {
            const { container } = render(getCarousel({ autoPlay: false, defaultActiveIndex: 1 }));
            const slides = [...query(container, 'content').children];
            expect(slides.map((slide) => slide.hasAttribute('inert'))).toEqual([true, false, true]);
            expect(query(container, 'content')).toHaveAttribute('aria-live', 'polite');
        });

        it('是 region 角色，描述为 carousel，名称由用户指定', () => {
            render(getCarousel({ autoPlay: false, 'aria-label': 'news' }));
            const region = screen.getByRole('region', { name: 'news' });
            expect(region).toHaveAttribute('aria-roledescription', zh_CN.Carousel.carousel);
        });

        it('有 indicator 时，每张幻灯片是对应 tab 的 panel', () => {
            render(
                <Carousel autoPlay={false}>
                    <div id="mine">a</div>
                    <div>b</div>
                </Carousel>
            );
            const tabs = screen.getAllByRole('tab');
            for (const tab of tabs) {
                const panel = document.getElementById(tab.getAttribute('aria-controls'));
                expect(panel).toHaveAttribute('role', 'tabpanel');
                expect(panel).toHaveAccessibleName(tab.getAttribute('aria-label'));
            }
            expect(tabs[0]).toHaveAttribute('aria-controls', 'mine');
        });

        it('无 indicator 时，每张幻灯片是以位置命名的 group', () => {
            const { container } = render(getCarousel({ autoPlay: false, showIndicator: false }));
            const slides = [...query(container, 'content').children];
            expect(slides.map((slide) => slide.getAttribute('aria-label'))).toEqual([1, 2, 3].map((n) => zh_CN.Carousel.slideN.replace('${index}', String(n))));
            for (const slide of slides) {
                expect(slide).toHaveAttribute('role', 'group');
                expect(slide).toHaveAttribute('aria-roledescription', zh_CN.Carousel.slide);
            }
        });
    });

    describe('函数组件', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
            semiGlobal.config.overrideDefaultProps = { Carousel: { indicatorType: 'line', autoPlay: false } };
            try {
                const { container } = render(getCarousel({}));
                expect(query(container, 'indicator-line')).not.toBeNull();
                expect(query(render(getCarousel({ indicatorType: 'columnar' })).container, 'indicator-columnar')).not.toBeNull();
            } finally {
                semiGlobal.config.overrideDefaultProps = {};
            }
        });

        it('ref 仅暴露文档中的方法', () => {
            const ref = React.createRef<CarouselHandle>();
            render(getCarousel({ ref, autoPlay: false }));
            expect(Object.keys(ref.current).sort()).toEqual(['goTo', 'next', 'play', 'prev', 'stop']);
        });

        it('将其他属性传给根元素', () => {
            const { container } = render(getCarousel({ id: 'c1', 'aria-label': 'slides', autoPlay: false }));
            const root = container.querySelector(`.${BASE_CLASS_PREFIX}-carousel`);
            expect(root).toHaveAttribute('id', 'c1');
            expect(root).toHaveAttribute('aria-label', 'slides');
        });

        it('autoPlay 关闭后立即停止自动播放', () => {
            const onChange = vi.fn<OnChange>();
            const { rerender } = render(getCarousel({ onChange, autoPlay: { interval: 1000 } }));
            rerender(getCarousel({ onChange, autoPlay: false }));
            act(() => {
                vi.advanceTimersByTime(10000);
            });
            expect(onChange).not.toHaveBeenCalled();
        });

        it('每次渲染新建 autoPlay 对象不会重新开始计时', () => {
            const onChange = vi.fn<OnChange>();
            const { rerender } = render(getCarousel({ onChange, autoPlay: { interval: 1000 } }));
            act(() => {
                vi.advanceTimersByTime(800);
            });
            rerender(getCarousel({ onChange, autoPlay: { interval: 1000 } }));
            act(() => {
                vi.advanceTimersByTime(500);
            });
            expect(onChange).toHaveBeenCalledTimes(1);
        });
    });

    describe('键盘', () => {
        const tabs = () => screen.getAllByRole('tab');
        const activeTitle = (container) => getActiveItem(container).textContent;
        const renderCarousel = (props = {}) => render(getCarousel({ autoPlay: false, ...props }));

        it('箭头是可由键盘激活的原生 button', async () => {
            const { container } = renderCarousel({ arrowType: 'always' });
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
            renderCarousel({ defaultActiveIndex: 1 });
            expect(screen.getByRole('tablist', { name: zh_CN.Carousel.indicators })).toBeInTheDocument();
            expect(tabs().map((tab) => tab.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
            expect(tabs().map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
            expect(tabs()[0]).toHaveAccessibleName(zh_CN.Carousel.slideN.replace('${index}', '1'));
            await userEvent.tab();
            expect(tabs()[1]).toHaveFocus();
            await userEvent.tab();
            expect(screen.getByRole('button', { name: zh_CN.Carousel.prev })).toHaveFocus();
            await userEvent.tab();
            expect(screen.getByRole('button', { name: zh_CN.Carousel.next })).toHaveFocus();
        });

        it('Left 与 Right 切换幻灯片，并把焦点移到当前 tab', async () => {
            const { container } = renderCarousel();
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
            const { container } = renderCarousel({ defaultActiveIndex: 1 });
            tabs()[1].focus();
            await userEvent.keyboard('{End}');
            expect(activeTitle(container)).toBe('index2');
            expect(tabs()[2]).toHaveFocus();
            await userEvent.keyboard('{Home}');
            expect(activeTitle(container)).toBe('index0');
            expect(tabs()[0]).toHaveFocus();
        });

        it('带 Alt、Ctrl、Meta 的方向键与 Home、End 不切换也不拦截', () => {
            const { container } = renderCarousel();
            for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
                for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                    // fireEvent returns false when the default was prevented
                    expect(fireEvent.keyDown(tabs()[0], { key, [modifier]: true })).toBe(true);
                }
            }
            expect(activeTitle(container)).toBe('index0');
        });

        it('无指示器时幻灯片自带的 aria-label 优先于内置的第 N 项', () => {
            const { container } = render(
                <Carousel autoPlay={false} showIndicator={false}>
                    <div aria-label="cover">a</div>
                    <div>b</div>
                </Carousel>
            );
            const slides = query(container, 'content').children;
            expect(slides[0]).toHaveAttribute('aria-label', 'cover');
            expect(slides[1]).toHaveAttribute('aria-label', zh_CN.Carousel.slideN.replace('${index}', '2'));
        });

        it('RTL 下 Left 切换到下一张，Right 切换到上一张', async () => {
            const { container } = render(<ConfigProvider direction="rtl">{getCarousel({ autoPlay: false })}</ConfigProvider>);
            tabs()[0].focus();
            await userEvent.keyboard('{ArrowLeft}');
            expect(activeTitle(container)).toBe('index1');
            expect(tabs()[1]).toHaveFocus();
            await userEvent.keyboard('{ArrowRight}');
            expect(activeTitle(container)).toBe('index0');
            expect(tabs()[0]).toHaveFocus();
        });

        it('受控轮播跟随 onChange 时焦点保持在 tab 上', async () => {
            function Controlled() {
                const [activeIndex, setActiveIndex] = React.useState(0);
                return getCarousel({ autoPlay: false, activeIndex, onChange: setActiveIndex });
            }
            render(<Controlled />);
            tabs()[0].focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(tabs()[1]).toHaveFocus();
        });
    });
});
