import { describe, expect, it, vi } from 'vite-plus/test';
import ColorSliderFoundation, { type ColorSliderAdapter, type ColorSliderBaseProps, type ColorSliderBaseState } from '../color-slider-foundation';

const setup = (props: Pick<ColorSliderBaseProps, 'value' | 'max'>) => {
    const notifyChange = vi.fn<ColorSliderAdapter['notifyChange']>();
    const setPointerCapture = vi.fn<(pointerId: number) => void>();
    const state = ColorSliderFoundation.getInitialState();
    const adapter = {
        getProps: () => ({ width: 200, ...props }),
        getState: (key: keyof ColorSliderBaseState) => state[key],
        setState: (next: Partial<ColorSliderBaseState>) => {
            Object.assign(state, next);
        },
        getDOM: () => ({ getBoundingClientRect: () => ({ x: 10 }) }),
        notifyChange,
    } as unknown as ColorSliderAdapter;
    const press = (e: { button?: number; clientX: number }) => ({ button: 0, clientY: 0, pointerId: 1, currentTarget: { setPointerCapture } as unknown as Element, ...e });
    const key = (name: string, extra: { altKey?: boolean } = {}) => ({ key: name, altKey: false, ctrlKey: false, metaKey: false, preventDefault: vi.fn<() => void>(), ...extra });
    return { foundation: new ColorSliderFoundation(adapter), state, notifyChange, press, key };
};

describe('ColorSliderFoundation', () => {
    it('指针位置按 max 取整数档位：色相 360，透明度百分比 100', () => {
        const hue = setup({ value: 0, max: 360 });
        hue.foundation.handlePointerDown(hue.press({ clientX: 110 }));
        expect(hue.notifyChange).toHaveBeenCalledWith(180);

        const alpha = setup({ value: 0, max: 100 });
        alpha.foundation.handlePointerDown(alpha.press({ clientX: 61 }));
        expect(alpha.notifyChange).toHaveBeenCalledWith(26);
    });

    it('拖出轨道时取到两端，捕获丢失后不再跟随', () => {
        const { foundation, notifyChange, press } = setup({ value: 0, max: 100 });
        foundation.handlePointerDown(press({ clientX: 500 }));
        expect(notifyChange).toHaveBeenLastCalledWith(100);
        foundation.handlePointerMove(press({ clientX: -50 }));
        expect(notifyChange).toHaveBeenLastCalledWith(0);
        foundation.handleLostPointerCapture();
        notifyChange.mockClear();
        foundation.handlePointerMove(press({ clientX: 60 }));
        expect(notifyChange).not.toHaveBeenCalled();
    });

    it('非主键按下不捕获也不通知', () => {
        const { foundation, state, notifyChange, press } = setup({ value: 0, max: 100 });
        foundation.handlePointerDown(press({ button: 2, clientX: 60 }));
        expect(state.isHandleGrabbing).toBe(false);
        expect(notifyChange).not.toHaveBeenCalled();
    });

    it('按键相对当前值移动，带修饰键的组合不处理', () => {
        const { foundation, notifyChange, key } = setup({ value: 50, max: 100 });
        const arrow = key('ArrowRight');
        foundation.handleKeyDown(arrow);
        expect(arrow.preventDefault).toHaveBeenCalled();
        expect(notifyChange).toHaveBeenLastCalledWith(51);
        foundation.handleKeyDown(key('End'));
        expect(notifyChange).toHaveBeenLastCalledWith(100);
        notifyChange.mockClear();
        foundation.handleKeyDown(key('ArrowLeft', { altKey: true }));
        foundation.handleKeyDown(key('a'));
        expect(notifyChange).not.toHaveBeenCalled();
    });

    it('手柄位置按比例减去半个手柄宽度', () => {
        expect(ColorSliderFoundation.getHandlePosition({ value: 180, max: 360, width: 200 }, 18)).toBe(91);
    });
});
