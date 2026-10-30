import { describe, expect, it, vi } from 'vite-plus/test';
import RatingFoundation, { type RatingAdapter } from '../foundation';

function createFoundation(getStarDOM: RatingAdapter['getStarDOM']) {
    const adapter = {
        getProps: () => ({ allowHalf: true, count: 5 }),
        getStates: () => ({ value: 0, hoverValue: undefined, clearedValue: null }),
        getContext: () => 'ltr',
        getStarDOM,
        setValue: vi.fn<(value: number) => void>(),
        notifyChange: vi.fn<(value: number) => void>(),
        setClearedValue: vi.fn<(value: number) => void>(),
        notifyClick: vi.fn<(e: unknown, index: number) => void>(),
    } as unknown as RatingAdapter;
    return { foundation: new RatingFoundation(adapter), adapter };
}

describe('RatingFoundation.isRadioValue', () => {
    it('整星值始终有对应 radio，半星值只在 allowHalf 下有', () => {
        expect(RatingFoundation.isRadioValue(3, 5, false)).toBe(true);
        expect(RatingFoundation.isRadioValue(2.5, 5, false)).toBe(false);
        expect(RatingFoundation.isRadioValue(2.5, 5, true)).toBe(true);
        expect(RatingFoundation.isRadioValue(2.3, 5, true)).toBe(false);
        expect(RatingFoundation.isRadioValue(6, 5, false)).toBe(false);
    });
});

describe('RatingFoundation.getItemModel', () => {
    const base = { index: 1, count: 5, allowHalf: true, value: 0, displayValue: 0, disabled: false, firstTabStop: false };

    it('allowHalf 下给出半星与整星 radio 的取值、位置和 Tab 顺序', () => {
        const model = RatingFoundation.getItemModel({ ...base, value: 1.5 });
        expect(model).toMatchObject({ firstValue: 1.5, secondValue: 2, setSize: 11, secondPosInSet: 4, firstTabIndex: 0, secondTabIndex: -1 });
    });

    it('空星的整星 radio 代表 0，位置在末尾', () => {
        const model = RatingFoundation.getItemModel({ ...base, index: 5, value: 0 });
        expect(model).toMatchObject({ secondValue: 0, secondPosInSet: 11, secondTabIndex: 0 });
    });

    it('没有 radio 对应当前值时第一颗星的第一个可聚焦 radio 是 Tab 停靠点', () => {
        expect(RatingFoundation.getItemModel({ ...base, index: 0, allowHalf: false, value: 2.5, firstTabStop: true }).secondTabIndex).toBe(0);
        expect(RatingFoundation.getItemModel({ ...base, index: 0, value: 2.5, firstTabStop: true })).toMatchObject({ firstTabIndex: 0, secondTabIndex: -1 });
    });

    it('disabled 时没有 Tab 停靠点', () => {
        expect(RatingFoundation.getItemModel({ ...base, value: 2, disabled: true })).toMatchObject({ firstTabIndex: -1, secondTabIndex: -1 });
    });

    it('按展示值计算填充：半填充星的第一个 radio 占一半宽度', () => {
        expect(RatingFoundation.getItemModel({ ...base, displayValue: 1.5 })).toMatchObject({ isHalf: true, isFull: false, firstWidth: '50%' });
        expect(RatingFoundation.getItemModel({ ...base, displayValue: 2 })).toMatchObject({ isHalf: false, isFull: true });
        expect(RatingFoundation.getItemModel({ ...base, allowHalf: false, displayValue: 1.5 }).isHalf).toBe(false);
    });
});

describe('RatingFoundation radio activation', () => {
    it('只有 detail 为 0 的点击按 radio 取值', () => {
        expect(RatingFoundation.resolveClickRadio(0, 2)).toBe(2);
        expect(RatingFoundation.resolveClickRadio(1, 2)).toBeUndefined();
        expect(RatingFoundation.resolveClickRadio(0, undefined)).toBeUndefined();
    });

    it('Enter 选中 radio，已选中的也会交给 allowClear 处理', () => {
        expect(RatingFoundation.resolveKeyActivation('Enter', 2, 2)).toEqual({ preventDefault: true, selectValue: 2 });
    });

    it('Space 不重复选中已选中的 radio，但仍阻止默认滚动', () => {
        expect(RatingFoundation.resolveKeyActivation(' ', 2, 2)).toEqual({ preventDefault: true, selectValue: undefined });
        expect(RatingFoundation.resolveKeyActivation(' ', 3, 2)).toEqual({ preventDefault: true, selectValue: 3 });
    });

    it('其他按键或不在 radio 上时不处理', () => {
        expect(RatingFoundation.resolveKeyActivation('a', 2, 0)).toEqual({ preventDefault: false });
        expect(RatingFoundation.resolveKeyActivation('Enter', undefined, 0)).toEqual({ preventDefault: false });
    });
});

describe('RatingFoundation.isFirstRadio / isTipVisible', () => {
    it('只有 allowHalf 下的半值聚焦第一个 radio', () => {
        expect(RatingFoundation.isFirstRadio(1.5, 1, true)).toBe(true);
        expect(RatingFoundation.isFirstRadio(2, 1, true)).toBe(false);
        expect(RatingFoundation.isFirstRadio(1.5, 1, false)).toBe(false);
    });

    it('悬停的星抢走聚焦星的提示，没有提示文案时不显示', () => {
        expect(RatingFoundation.isTipVisible(2, undefined, 2, 'tip')).toBe(true);
        expect(RatingFoundation.isTipVisible(2, 1, 2, 'tip')).toBe(false);
        expect(RatingFoundation.isTipVisible(2, 2.5, 0, 'tip')).toBe(true);
        expect(RatingFoundation.isTipVisible(2, undefined, 2, '')).toBe(false);
    });
});

describe('RatingFoundation.handleClick', () => {
    it('allowHalf 下找不到星星节点时按整星选中', () => {
        const { foundation, adapter } = createFoundation(() => null);
        foundation.handleClick({ pageX: 0 }, 2);
        expect(adapter.notifyChange).toHaveBeenCalledWith(3);
    });

    it('空星（序号等于 count）上的点击得到 0', () => {
        const { foundation, adapter } = createFoundation(() => null);
        foundation.handleClick({ pageX: 0 }, 5);
        expect(adapter.notifyChange).toHaveBeenCalledWith(0);
    });

    it('allowHalf 下点在星星左半边时选半星', () => {
        const star = { clientWidth: 20, getBoundingClientRect: () => ({ left: 0 }), ownerDocument: { defaultView: { scrollX: 0 } } } as unknown as Element;
        const { foundation, adapter } = createFoundation(() => star);
        foundation.handleClick({ pageX: 5 }, 2);
        expect(adapter.notifyChange).toHaveBeenCalledWith(2.5);
    });
});
