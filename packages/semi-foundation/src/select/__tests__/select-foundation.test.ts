import { describe, expect, it } from 'vite-plus/test';
import SelectFoundation from '../foundation';
import type { OptionRecord } from '../option-foundation';

describe('SelectFoundation 渲染期静态函数', () => {
    it('getPosition 未指定时按方向给默认值，指定后原样返回', () => {
        expect(SelectFoundation.getPosition(undefined, 'rtl')).toBe('bottomRight');
        expect(SelectFoundation.getPosition(undefined, 'ltr')).toBe('bottomLeft');
        expect(SelectFoundation.getPosition(undefined)).toBe('bottomLeft');
        expect(SelectFoundation.getPosition('topLeft', 'rtl')).toBe('topLeft');
    });

    it('getVisibleOptions 只留下 show 为 true 的记录', () => {
        const options = [{ show: true }, { show: false }, { show: true }] as OptionRecord[];
        expect(SelectFoundation.getVisibleOptions(options)).toEqual([options[0], options[2]]);
    });

    it('getActiveOptionIndex 仅在展开、非加载且高亮项存在时给出下标', () => {
        const base = { isOpen: true, loading: false, focusIndex: 1, visibleCount: 3 };
        expect(SelectFoundation.getActiveOptionIndex(base)).toBe(1);
        expect(SelectFoundation.getActiveOptionIndex({ ...base, isOpen: false })).toBeUndefined();
        expect(SelectFoundation.getActiveOptionIndex({ ...base, loading: true })).toBeUndefined();
        expect(SelectFoundation.getActiveOptionIndex({ ...base, focusIndex: -1 })).toBeUndefined();
        expect(SelectFoundation.getActiveOptionIndex({ ...base, focusIndex: 3 })).toBeUndefined();
    });

    it('isClearable 需要 showClear、有选中项或输入，且未禁用', () => {
        const selected = { selections: new Map([['a', {}]]), inputValue: '' };
        const empty = { selections: new Map(), inputValue: '' };
        expect(SelectFoundation.isClearable({ showClear: true }, selected)).toBe(true);
        expect(SelectFoundation.isClearable({ showClear: true }, { ...empty, inputValue: 'x' })).toBe(true);
        expect(SelectFoundation.isClearable({ showClear: true }, empty)).toBe(false);
        expect(SelectFoundation.isClearable({ showClear: false }, selected)).toBe(false);
        expect(SelectFoundation.isClearable({ showClear: true, disabled: true }, selected)).toBe(false);
    });

    it('isInputCombobox 仅当触发器内的搜索框承担 combobox 角色时为 true', () => {
        const props = { filter: true, searchPosition: 'trigger' as const, multiple: false };
        expect(SelectFoundation.isInputCombobox(props, true, false)).toBe(true);
        expect(SelectFoundation.isInputCombobox(props, false, false)).toBe(false);
        expect(SelectFoundation.isInputCombobox({ ...props, multiple: true }, false, false)).toBe(true);
        expect(SelectFoundation.isInputCombobox(props, true, true)).toBe(false);
        expect(SelectFoundation.isInputCombobox({ ...props, filter: false }, true, false)).toBe(false);
        expect(SelectFoundation.isInputCombobox({ ...props, searchPosition: 'dropdown' }, true, false)).toBe(false);
    });
});
