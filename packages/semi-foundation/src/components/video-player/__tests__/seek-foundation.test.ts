import { describe, expect, it, vi } from 'vite-plus/test';
import SeekFoundation, { type SeekAdapter, type SeekBaseProps, type SeekBaseState } from '../seek-foundation';

const setup = (props: SeekBaseProps, focusOnPress?: () => void) => {
    const notifyChange = vi.fn<SeekAdapter['notifyChange']>();
    const setPointerCapture = vi.fn<(pointerId: number) => void>();
    // a 100 by 100 track whose bottom edge is at y = 110
    const slider = { getBoundingClientRect: () => ({ left: 0, bottom: 110, width: 100, height: 100 }) } as HTMLDivElement;
    const state = SeekFoundation.getInitialState();
    const adapter = {
        getProps: () => props,
        getState: (key: keyof SeekBaseState) => state[key],
        setState: (next: Partial<SeekBaseState>) => {
            Object.assign(state, next);
        },
        getSliderRef: () => slider,
        notifyChange,
        focusOnPress,
    } as unknown as SeekAdapter;
    const press = (e: { button?: number; clientX: number; clientY: number }) => ({ button: 0, pointerId: 1, currentTarget: { setPointerCapture } as unknown as Element, ...e });
    return { foundation: new SeekFoundation(adapter), state, notifyChange, setPointerCapture, press };
};

describe('SeekFoundation', () => {
    it('竖直轨道从底边向上计位置，预览偏移相对轨道中心', () => {
        const { foundation, state, notifyChange, press } = setup({ max: 200, vertical: true });
        foundation.handlePointerDown(press({ clientX: 0, clientY: 30 }));
        expect(notifyChange).toHaveBeenCalledWith(160);
        expect(state.isDragging).toBe(true);
        expect(state.movingInfo).toEqual({ progress: 0.8, offset: 30, value: 160 });
    });

    it('不在拖动时只更新预览，不通知', () => {
        const { foundation, state, notifyChange } = setup({ max: 60 });
        foundation.handlePointerPosition({ button: 0, clientX: 50, clientY: 0 }, { seek: true });
        expect(notifyChange).not.toHaveBeenCalled();
        expect(state.movingInfo).toEqual({ progress: 0.5, offset: 0, value: 30 });
    });

    it('主键按下后聚焦控件，其他键不聚焦也不捕获', () => {
        const focusOnPress = vi.fn<() => void>();
        const { foundation, setPointerCapture, press } = setup({ max: 100 }, focusOnPress);
        foundation.handlePointerDown(press({ button: 2, clientX: 10, clientY: 0 }));
        expect(focusOnPress).not.toHaveBeenCalled();
        expect(setPointerCapture).not.toHaveBeenCalled();
        foundation.handlePointerDown(press({ clientX: 10, clientY: 0 }));
        expect(focusOnPress).toHaveBeenCalledTimes(1);
    });

    it('指针捕获丢失结束拖动，clearPreview 清除预览', () => {
        const { foundation, state, press } = setup({ max: 100 });
        foundation.handlePointerDown(press({ clientX: 10, clientY: 0 }));
        foundation.handleLostPointerCapture();
        expect(state.isDragging).toBe(false);
        expect(state.movingInfo).not.toBeNull();
        foundation.clearPreview();
        expect(state.movingInfo).toBeNull();
    });
});
