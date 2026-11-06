import { describe, expect, it, vi } from 'vite-plus/test';
import DataPartFoundation, { type DataPartAdapter, type DataPartBaseProps, type DataPartBaseState } from '../data-part-foundation';
import type { ColorValue } from '../foundation';

const currentColor: ColorValue = { hsva: { h: 0, s: 100, v: 100, a: 0.5 }, rgba: { r: 255, g: 0, b: 0, a: 0.5 }, hex: '#ff000080' };

const setup = (format: DataPartBaseState['format']) => {
    const notifyChange = vi.fn<DataPartAdapter['notifyChange']>();
    const notifyAlphaChange = vi.fn<DataPartAdapter['notifyAlphaChange']>();
    const state: DataPartBaseState = { format, inputValue: '' };
    const props = { currentColor, alpha: true };
    const adapter = {
        getProp: (key: keyof typeof props) => props[key],
        getProps: () => props,
        getState: (key: keyof DataPartBaseState) => state[key],
        getStates: () => state,
        setState: (next: Partial<DataPartBaseState>) => {
            Object.assign(state, next);
        },
        notifyChange,
        notifyAlphaChange,
    } as unknown as DataPartAdapter<DataPartBaseProps>;
    return { foundation: new DataPartFoundation(adapter), state, notifyChange, notifyAlphaChange };
};

describe('DataPartFoundation', () => {
    it('输入合法文本时通知颜色，并保存输入框文本', () => {
        const { foundation, state, notifyChange } = setup('hex');
        foundation.handleInputValueChange('#00ff00');
        expect(notifyChange).toHaveBeenCalledWith('#00ff0080', 'hex');
        expect(state.inputValue).toBe('#00ff00');
    });

    it('rgba 格式缺省透明度时沿用当前颜色的透明度', () => {
        const { foundation, notifyChange } = setup('rgba');
        foundation.handleInputValueChange('1,2,3');
        expect(notifyChange).toHaveBeenCalledWith({ r: 1, g: 2, b: 3, a: 0.5 }, 'rgba');
    });

    it('输入不合法时只保存文本，不通知', () => {
        const { foundation, state, notifyChange } = setup('hex');
        foundation.handleInputValueChange('#12');
        expect(notifyChange).not.toHaveBeenCalled();
        expect(state.inputValue).toBe('#12');
    });

    it('透明度输入框的百分比换算成两位小数的透明度', () => {
        const { foundation, notifyAlphaChange } = setup('hex');
        foundation.handleAlphaInputChange(29);
        expect(notifyAlphaChange).toHaveBeenCalledWith(0.29);
    });
});
