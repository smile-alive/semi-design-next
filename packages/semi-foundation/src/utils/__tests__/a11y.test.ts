import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { getEnabledStepIndex, getListTargetIndex, getMenuButton, isInnerControlActivation, isInnerControlKey, joinIds, stopButtonActivationKeys, Typeahead, type ListNavigationOptions } from '../a11y';

describe('getListTargetIndex', () => {
    const none = () => false;
    const odd = (index) => index === 1 || index === 3;

    it.each<[string, number, (index: number) => boolean, ListNavigationOptions, number | null]>([
        ['ArrowDown', 0, none, {}, 1],
        ['ArrowDown', 4, none, {}, 4],
        ['ArrowDown', 4, none, { loop: true }, 0],
        ['ArrowUp', 0, none, {}, 0],
        ['ArrowUp', 0, none, { loop: true }, 4],
        ['ArrowDown', -1, none, {}, 0],
        ['ArrowUp', -1, none, {}, 4],
        ['ArrowDown', 0, odd, {}, 2],
        ['ArrowUp', 4, odd, {}, 2],
        ['ArrowDown', 4, odd, { loop: true }, 0],
        ['Home', 3, odd, {}, 0],
        ['End', 0, odd, {}, 4],
        ['ArrowRight', 0, none, { orientation: 'horizontal' }, 1],
        ['ArrowRight', 1, none, { orientation: 'horizontal', rtl: true }, 0],
        ['ArrowLeft', 1, none, { orientation: 'horizontal', rtl: true }, 2],
        ['ArrowRight', 0, none, {}, null],
        ['Enter', 0, none, {}, null],
    ])('%s 从 %i 开始', (key, current, isDisabled, options, expected) => {
        expect(getListTargetIndex(key, current, 5, isDisabled, options)).toBe(expected);
    });

    it('其他项全部禁用时停留在当前项', () => {
        expect(getListTargetIndex('ArrowDown', 2, 5, (index) => index !== 2, { loop: true })).toBe(2);
        expect(getListTargetIndex('Home', 2, 5, () => true)).toBe(2);
    });

    it('空列表没有目标', () => {
        expect(getListTargetIndex('ArrowDown', -1, 0, () => false)).toBeNull();
        expect(getListTargetIndex('End', -1, 0, () => false)).toBeNull();
    });
});

describe('getEnabledStepIndex', () => {
    const disabledAt =
        (...indexes: number[]) =>
        (index: number) =>
            indexes.includes(index);

    it('尾项禁用时向下绕回首项', () => {
        expect(getEnabledStepIndex(1, 1, 3, disabledAt(2))).toBe(0);
    });

    it('首项禁用时向上绕回尾项', () => {
        expect(getEnabledStepIndex(-1, 1, 3, disabledAt(0))).toBe(2);
    });

    it('没有高亮项时向下到首项、向上到尾项', () => {
        expect(getEnabledStepIndex(1, -1, 3, disabledAt())).toBe(0);
        expect(getEnabledStepIndex(-1, -1, 3, disabledAt())).toBe(2);
    });

    it('高亮项越界时按移动方向从边缘进入', () => {
        expect(getEnabledStepIndex(1, 7, 3, disabledAt())).toBe(0);
        expect(getEnabledStepIndex(-1, 7, 3, disabledAt())).toBe(2);
    });

    it('全部禁用或列表为空时返回 -1', () => {
        expect(getEnabledStepIndex(1, 0, 2, () => true)).toBe(-1);
        expect(getEnabledStepIndex(-1, -1, 2, () => true)).toBe(-1);
        const items = [{ disabled: true }, { disabled: true }];
        expect(getEnabledStepIndex(-1, -1, 2, (index) => items[index].disabled)).toBe(-1);
        expect(getEnabledStepIndex(1, 5, 2, (index) => items[index].disabled)).toBe(-1);
        expect(getEnabledStepIndex(1, -1, 0, () => false)).toBe(-1);
    });

    it('只有一个可用项时停在该项', () => {
        expect(getEnabledStepIndex(1, 1, 3, disabledAt(0, 2))).toBe(1);
    });
});

describe('Typeahead', () => {
    const labels = ['Apple', 'apricot', 'Banana', '', 'Blueberry'];

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('输入时延长搜索词，停顿后重新开始', () => {
        const typeahead = new Typeahead();
        expect(typeahead.match('a', labels, -1)).toBe(0);
        expect(typeahead.match('p', labels, 0)).toBe(0);
        expect(typeahead.match('r', labels, 0)).toBe(1);
        vi.advanceTimersByTime(600);
        expect(typeahead.match('b', labels, 1)).toBe(2);
    });

    it('对重复字符开头的 label 循环切换', () => {
        const typeahead = new Typeahead();
        expect(typeahead.match('b', labels, 0)).toBe(2);
        expect(typeahead.match('b', labels, 2)).toBe(4);
        expect(typeahead.match('b', labels, 4)).toBe(2);
    });

    it('无匹配时返回 -1，且仅在搜索中接收 Space', () => {
        const typeahead = new Typeahead();
        expect(typeahead.accepts({ key: ' ' })).toBe(false);
        expect(typeahead.match('z', labels, 0)).toBe(-1);
        expect(typeahead.accepts({ key: ' ' })).toBe(true);
        expect(typeahead.accepts({ key: 'Enter' })).toBe(false);
    });

    it('带 Ctrl、Meta、Alt 的按键不参与搜索，非 BMP 字符可以', () => {
        const typeahead = new Typeahead();
        expect(typeahead.accepts({ key: 'a' })).toBe(true);
        expect(typeahead.accepts({ key: 'a', ctrlKey: true })).toBe(false);
        expect(typeahead.accepts({ key: '1', metaKey: true })).toBe(false);
        expect(typeahead.accepts({ key: 'a', altKey: true })).toBe(false);
        expect(typeahead.accepts({ key: '\u{20BB7}' })).toBe(true);
        typeahead.match('z', labels, 0);
        expect(typeahead.accepts({ key: ' ', ctrlKey: true })).toBe(false);
    });
});

describe('isInnerControlKey', () => {
    const build = () => {
        const host = document.createElement('div');
        host.innerHTML = '<div role="button" id="outer"><div id="trigger"><span role="button" id="tag"><i id="icon"></i></span><button id="clear"></button><input id="search"></div></div><div id="portal"><span role="button" id="rest"></span></div>';
        const get = (id: string) => host.querySelector(`#${id}`);
        return { get, currentTarget: get('trigger') };
    };

    it.each(['tag', 'icon', 'clear', 'rest'])('Enter 落在 #%s 内的控件上时属于该控件', (id) => {
        const { get, currentTarget } = build();
        expect(isInnerControlKey({ key: 'Enter', target: get(id), currentTarget })).toBe(true);
    });

    it.each(['trigger', 'search'])('#%s 上的 Enter 属于 combobox，触发器外层的 role="button" 不算', (id) => {
        const { get, currentTarget } = build();
        expect(isInnerControlKey({ key: 'Enter', target: get(id), currentTarget })).toBe(false);
    });

    it.each(['Escape', 'Tab'])('%s 从控件上仍交给 combobox', (key) => {
        const { get, currentTarget } = build();
        expect(isInnerControlKey({ key, target: get('tag'), currentTarget })).toBe(false);
    });

    it('无指针的 click 落在控件上属于该控件，指针点击与触发器自身的 click 不算', () => {
        const { get, currentTarget } = build();
        expect(isInnerControlActivation({ detail: 0, target: get('tag'), currentTarget })).toBe(true);
        expect(isInnerControlActivation({ detail: 1, target: get('tag'), currentTarget })).toBe(false);
        expect(isInnerControlActivation({ detail: 0, target: get('trigger'), currentTarget })).toBe(false);
    });
});

describe('getMenuButton', () => {
    it('data-popupid 列出多个弹层 id 时，按其中任一 id 都能找到触发器，部分匹配不算', () => {
        const root = document.createElement('div');
        root.innerHTML = '<button data-popupid="outer inner"></button>';
        const trigger = root.querySelector('button');
        expect(getMenuButton('outer', root)).toBe(trigger);
        expect(getMenuButton('inner', root)).toBe(trigger);
        expect(getMenuButton('inn', root)).toBeNull();
    });
});

describe('joinIds', () => {
    it('只保留非空字符串，按顺序用空格拼接，全部为空时为 undefined', () => {
        expect(joinIds('a', '', false, undefined, null, 1, 'b')).toBe('a b');
        expect(joinIds('', false, undefined, null)).toBeUndefined();
    });
});

describe('stopButtonActivationKeys', () => {
    it('只阻止 Enter 与空格冒泡', () => {
        const stopped = (key: string) => {
            const stopPropagation = vi.fn<() => void>();
            stopButtonActivationKeys({ key, stopPropagation });
            return stopPropagation.mock.calls.length > 0;
        };
        expect(stopped('Enter')).toBe(true);
        expect(stopped(' ')).toBe(true);
        expect(stopped('ArrowDown')).toBe(false);
        expect(stopped('Escape')).toBe(false);
    });
});
