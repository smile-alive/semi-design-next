import { describe, expect, it, vi } from 'vite-plus/test';
import SliderFoundation, { type SliderAdapter, type SliderProps, type SliderState } from '../foundation';

function createFoundation(props: SliderProps, state: Partial<SliderState> = {}, direction?: 'rtl') {
    const fullProps = { min: 0, max: 100, step: 1, ...props };
    const fullState = { ...SliderFoundation.getInitialState(fullProps), ...state };
    const adapter = {
        getSliderNode: () => null,
        getProp: (key: keyof SliderProps) => fullProps[key],
        getProps: () => fullProps,
        getState: (key: keyof SliderState) => fullState[key],
        getStates: () => fullState,
        setState: (partial: Partial<SliderState>, callback?: () => void) => {
            Object.assign(fullState, partial);
            callback?.();
        },
        getContext: () => direction,
        notifyChange: () => {},
    } as unknown as SliderAdapter;
    return { foundation: new SliderFoundation(adapter), state: fullState };
}

describe('SliderFoundation.normalizeValue', () => {
    it('保留 min 带小数时步长网格上的值', () => {
        expect(SliderFoundation.normalizeValue(0.5, 0.25, 'min', 0.75)).toBe(0.75);
        expect(SliderFoundation.normalizeValue(0.5, 0.25, 'min', [0.25, 1.75])).toEqual([0.25, 1.75]);
    });

    it('科学计数法表示的步长按其小数位取整', () => {
        expect(SliderFoundation.normalizeValue(1e-7, 0, 'min', 0.1234567)).toBe(0.1234567);
        expect(SliderFoundation.normalizeValue(1e-7, 0, 'min', 0.12345674)).toBe(0.1234567);
    });

    it('步长为整数时取整到整数', () => {
        expect(SliderFoundation.normalizeValue(1, 0, 'min', 3.4)).toBe(3);
    });

    it('交叉的范围值收拢到活动手柄移动到的一端', () => {
        expect(SliderFoundation.normalizeValue(1, 0, 'min', [60, 40])).toEqual([40, 40]);
        expect(SliderFoundation.normalizeValue(1, 0, 'max', [60, 40])).toEqual([60, 60]);
    });
});

describe('SliderFoundation.handleKeyDown', () => {
    const press = (foundation: SliderFoundation, key: string, pos: 'min' | 'max' = 'min') => {
        const event = { key, defaultPrevented: false, altKey: false, ctrlKey: false, metaKey: false, stopPropagation: vi.fn<() => void>(), preventDefault: vi.fn<() => void>() };
        foundation.handleKeyDown(event, pos);
        return event;
    };

    it('vertical 中向下与向右增大、向上与向左减小，并阻止原生步进', () => {
        const { foundation, state } = createFoundation({ vertical: true, defaultValue: 50 });
        expect(press(foundation, 'ArrowDown').preventDefault).toHaveBeenCalled();
        expect(state.currentValue).toBe(51);
        press(foundation, 'ArrowRight');
        expect(state.currentValue).toBe(52);
        press(foundation, 'ArrowUp');
        press(foundation, 'ArrowLeft');
        press(foundation, 'ArrowLeft');
        expect(state.currentValue).toBe(49);
    });

    it('verticalReverse 中向上增大、向下减小', () => {
        const { foundation, state } = createFoundation({ vertical: true, verticalReverse: true, defaultValue: 50 });
        press(foundation, 'ArrowUp');
        expect(state.currentValue).toBe(51);
        press(foundation, 'ArrowDown');
        press(foundation, 'ArrowDown');
        expect(state.currentValue).toBe(49);
    });

    it('按步长移动所在手柄，越过 min 或 max 时不变', () => {
        const { foundation, state } = createFoundation({ vertical: true, range: true, step: 0.1, min: 0, max: 1, defaultValue: [0.1, 0.9] });
        press(foundation, 'ArrowUp', 'min');
        expect(state.currentValue).toEqual([0, 0.9]);
        press(foundation, 'ArrowUp', 'min');
        press(foundation, 'ArrowDown', 'max');
        expect(state.currentValue).toEqual([0, 1]);
        press(foundation, 'ArrowDown', 'max');
        expect(state.currentValue).toEqual([0, 1]);
    });

    it('水平滑块向右与向上增大；rtl 中向左与向上增大', () => {
        const ltr = createFoundation({ defaultValue: 50 });
        press(ltr.foundation, 'ArrowRight');
        press(ltr.foundation, 'ArrowUp');
        press(ltr.foundation, 'ArrowLeft');
        expect(ltr.state.currentValue).toBe(51);
        const rtl = createFoundation({ defaultValue: 50 }, {}, 'rtl');
        press(rtl.foundation, 'ArrowLeft');
        press(rtl.foundation, 'ArrowUp');
        press(rtl.foundation, 'ArrowRight');
        press(rtl.foundation, 'ArrowDown');
        press(rtl.foundation, 'ArrowDown');
        expect(rtl.state.currentValue).toBe(49);
    });

    it('Page、Home、End 键交给原生 range，同样不再向外冒泡', () => {
        const { foundation, state } = createFoundation({ vertical: true, defaultValue: 50 });
        const event = press(foundation, 'PageUp');
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(state.currentValue).toBe(50);
    });
});

describe('SliderFoundation.handleValueChange', () => {
    it('范围值的两端都夹到 min 与 max 之间', () => {
        const { foundation, state } = createFoundation({ range: true, value: [10, 20] });
        foundation.handleValueChange([150, 200]);
        expect(state.currentValue).toEqual([100, 100]);
        foundation.handleValueChange([-50, -10]);
        expect(state.currentValue).toEqual([0, 0]);
    });

    it('单值夹到 min 与 max 之间', () => {
        const { foundation, state } = createFoundation({ value: 10 });
        foundation.handleValueChange(150);
        expect(state.currentValue).toBe(100);
    });

    it('形状不对的值被忽略', () => {
        const { foundation, state } = createFoundation({ range: true, value: [10, 20] });
        foundation.handleValueChange(null);
        expect(state.currentValue).toEqual([10, 20]);
    });
});

describe('SliderFoundation.onHandleDown', () => {
    const press = (init: { pointerType: string; button: number }) => ({ pointerId: 1, clientX: 0, clientY: 0, currentTarget: document.createElement('span'), ...init });

    it.each([
        ['mouse', 2],
        ['pen', 2],
        ['pen', 5],
    ])('%s 的非主键按下（button %i）不开始拖拽', (pointerType, button) => {
        const { foundation, state } = createFoundation({ value: 10 });
        expect(foundation.onHandleDown(press({ pointerType, button }) as never, 'min')).toBe(false);
        expect(state.isDrag).toBe(false);
        foundation.destroy();
    });

    it.each(['mouse', 'pen', 'touch'])('%s 的主键按下开始拖拽', (pointerType) => {
        const { foundation, state } = createFoundation({ value: 10 });
        expect(foundation.onHandleDown(press({ pointerType, button: 0 }) as never, 'min')).toBe(true);
        expect(state.isDrag).toBe(true);
        foundation.destroy();
    });
});

describe('SliderFoundation.getHandleA11y', () => {
    const base = { id: 'volume', ariaLabel: 'Volume', ariaLabelledby: undefined, generatedId: 'gen', endName: 'Start' };

    it('单个滑块沿用调用方的名称与 id', () => {
        expect(SliderFoundation.getHandleA11y({ ...base, range: false, pos: 'min' })).toEqual({ id: 'volume', ariaLabel: 'Volume', ariaLabelledby: undefined });
        expect(SliderFoundation.getHandleA11y({ ...base, range: false, pos: 'max' }).id).toBeUndefined();
    });

    it('范围滑块的 aria-label 追加端点名称，没有 aria-label 时只用端点名称', () => {
        expect(SliderFoundation.getHandleA11y({ ...base, range: true, pos: 'min' }).ariaLabel).toBe('Volume Start');
        expect(SliderFoundation.getHandleA11y({ ...base, range: true, pos: 'min', ariaLabel: undefined }).ariaLabel).toBe('Start');
    });

    it('范围滑块的 aria-labelledby 之后跟随手柄自身，并为没有 id 的手柄生成 id', () => {
        const min = SliderFoundation.getHandleA11y({ ...base, range: true, pos: 'min', ariaLabelledby: 'caption' });
        expect(min).toEqual({ id: 'volume', ariaLabel: 'Start', ariaLabelledby: 'caption volume' });
        const max = SliderFoundation.getHandleA11y({ ...base, range: true, pos: 'max', ariaLabelledby: 'caption', endName: 'End' });
        expect(max).toEqual({ id: 'gen-max', ariaLabel: 'End', ariaLabelledby: 'caption gen-max' });
    });
});
