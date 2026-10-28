import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { numbers } from '../constants';
import CarouselFoundation from '../foundation';

describe('CarouselFoundation 悬停与幻灯片数量变化', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('matchMedia', () => ({ matches: false }));
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    const create = (props: Record<string, unknown> = {}, slideCount = 3) => {
        const adapter = {
            getProps: () => ({ autoPlay: true, speed: 0, ...props }),
            getStates: () => ({ activeIndex: 0, isInit: true }),
            getSlideCount: () => slideCount,
            setRotating: vi.fn<(rotating: boolean) => void>(),
        };
        return { adapter, foundation: new CarouselFoundation(adapter as any) };
    };

    it('悬停暂停在防抖延迟后生效，离开后恢复', () => {
        const { adapter, foundation } = create();
        foundation.handleAutoPlay();
        foundation.handlePointerEnter();
        expect(adapter.setRotating).toHaveBeenLastCalledWith(true);
        vi.advanceTimersByTime(numbers.HOVER_DELAY);
        expect(adapter.setRotating).toHaveBeenLastCalledWith(false);
        foundation.handlePointerLeave();
        vi.advanceTimersByTime(numbers.HOVER_DELAY);
        expect(adapter.setRotating).toHaveBeenLastCalledWith(true);
    });

    it('destroy 与 resetPointer 取消尚未触发的悬停', () => {
        const { adapter, foundation } = create();
        foundation.handleAutoPlay();
        foundation.handlePointerEnter();
        foundation.destroy();
        vi.advanceTimersByTime(numbers.HOVER_DELAY);
        expect(adapter.setRotating).not.toHaveBeenCalledWith(false);
        foundation.handleAutoPlay();
        foundation.handlePointerEnter();
        foundation.resetPointer();
        vi.advanceTimersByTime(numbers.HOVER_DELAY);
        expect(adapter.setRotating).not.toHaveBeenCalledWith(false);
    });

    it('幻灯片从不超过一张增到多张时启动自动播放，指针在内则补一次暂停', () => {
        const { adapter, foundation } = create();
        foundation.handlePointerEnter();
        vi.advanceTimersByTime(numbers.HOVER_DELAY);
        foundation.handleSlideCountChange(1, 3);
        expect(adapter.setRotating.mock.calls.map(([rotating]) => rotating)).toEqual([true, false]);
    });

    it('受控或数量未跨过一张时不启动', () => {
        const controlled = create({ activeIndex: 0 });
        controlled.foundation.handleSlideCountChange(1, 3);
        const grown = create();
        grown.foundation.handleSlideCountChange(2, 3);
        grown.foundation.handleSlideCountChange(3, 1);
        expect(controlled.adapter.setRotating).not.toHaveBeenCalled();
        expect(grown.adapter.setRotating).not.toHaveBeenCalled();
    });
});

describe('CarouselFoundation 静态方法', () => {
    it('isAutoPlayOn 接受 true 与任意配置对象', () => {
        expect(CarouselFoundation.isAutoPlayOn(true)).toBe(true);
        expect(CarouselFoundation.isAutoPlayOn({})).toBe(true);
        expect(CarouselFoundation.isAutoPlayOn({ interval: 1000, hoverToPause: false })).toBe(true);
        expect(CarouselFoundation.isAutoPlayOn(false)).toBe(false);
        expect(CarouselFoundation.isAutoPlayOn(undefined)).toBe(false);
    });

    it('getDefaultActiveIndex 优先使用不为 undefined 的 activeIndex', () => {
        expect(CarouselFoundation.getDefaultActiveIndex({ activeIndex: 2, defaultActiveIndex: 1 })).toBe(2);
        expect(CarouselFoundation.getDefaultActiveIndex({ activeIndex: undefined, defaultActiveIndex: 1 })).toBe(1);
        expect(CarouselFoundation.getDefaultActiveIndex({ defaultActiveIndex: 1 })).toBe(1);
    });

    it('deriveActiveIndex 使用不为 undefined 的 activeIndex 属性，否则使用 state', () => {
        expect(CarouselFoundation.deriveActiveIndex({ activeIndex: 0 }, { activeIndex: 2 }, 3)).toBe(0);
        expect(CarouselFoundation.deriveActiveIndex({ activeIndex: undefined }, { activeIndex: 2 }, 3)).toBe(2);
        expect(CarouselFoundation.deriveActiveIndex({}, { activeIndex: 2 }, 3)).toBe(2);
    });

    it('deriveActiveIndex 把超出幻灯片数量的索引夹到最后一张，没有幻灯片时为 0', () => {
        expect(CarouselFoundation.deriveActiveIndex({}, { activeIndex: 2 }, 2)).toBe(1);
        expect(CarouselFoundation.deriveActiveIndex({ activeIndex: 5 }, { activeIndex: 0 }, 3)).toBe(2);
        expect(CarouselFoundation.deriveActiveIndex({}, { activeIndex: 2 }, 0)).toBe(0);
    });
});
