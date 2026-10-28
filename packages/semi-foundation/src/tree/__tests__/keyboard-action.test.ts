import { describe, expect, it } from 'vite-plus/test';
import { Typeahead } from '../../utils/a11y';
import type { BasicFlattenNode } from '../foundation';
import { getTreeKeyboardAction } from '../shared';

const parent: BasicFlattenNode = { key: 'p', label: 'Parent' };
const rows: BasicFlattenNode[] = [parent, { key: 'a', label: 'Apple', parent }, { key: 'b', label: 42, parent }, { key: 'c', label: null, parent }, { key: 'd', label: 'Date' }];
const press = (key: string, modifiers: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey', boolean>> = {}) => ({ key, ctrlKey: false, metaKey: false, altKey: false, ...modifiers });

function act(key: string, { index = 0, editing = false, expanded = new Set<string>(), leaves = new Set(['a', 'b', 'c', 'd']), noRow = new Set<string>(), rtl = false, modifiers = {} } = {}) {
    return getTreeKeyboardAction(press(key, modifiers), rows, index, editing, { isRow: (row) => !noRow.has(String(row.key)), isExpanded: (row) => expanded.has(String(row.key)), isLeaf: (row) => leaves.has(String(row.key)), rtl }, new Typeahead());
}

describe('getTreeKeyboardAction', () => {
    it('Ctrl、Meta、Alt 组合键不处理', () => {
        expect(act('ArrowDown', { modifiers: { ctrlKey: true } })).toBeNull();
        expect(act('a', { modifiers: { metaKey: true } })).toBeNull();
        expect(act('Enter', { modifiers: { altKey: true } })).toBeNull();
    });

    it('方向键移到相邻行，Home 和 End 到两端', () => {
        expect(act('ArrowDown')).toEqual({ type: 'move', index: 1 });
        expect(act('ArrowUp', { index: 1 })).toEqual({ type: 'move', index: 0 });
        expect(act('End')).toEqual({ type: 'move', index: 4 });
        expect(act('Home', { index: 3 })).toEqual({ type: 'move', index: 0 });
    });

    it('Enter 和 Space 选择当前行，没有行属性时不处理', () => {
        expect(act('Enter')).toEqual({ type: 'select' });
        expect(act(' ')).toEqual({ type: 'select' });
        expect(act('Enter', { noRow: new Set(['p']) })).toBeNull();
        expect(act('Enter', { index: -1 })).toBeNull();
    });

    it('文本框中只有 Enter、上下键作用于树，Space 和字符留给输入', () => {
        expect(act('Enter', { editing: true })).toEqual({ type: 'select' });
        expect(act('ArrowDown', { editing: true })).toEqual({ type: 'move', index: 1 });
        expect(act(' ', { editing: true })).toBeNull();
        expect(act('x', { editing: true })).toBeNull();
        expect(act('ArrowRight', { editing: true })).toBeNull();
        expect(act('Home', { editing: true })).toBeNull();
    });

    it('右键展开收起的分支，已展开时进入第一个子行', () => {
        expect(act('ArrowRight')).toEqual({ type: 'expand' });
        expect(act('ArrowRight', { expanded: new Set(['p']) })).toEqual({ type: 'move', index: 1 });
        expect(act('ArrowRight', { index: 1 })).toBeNull();
    });

    it('左键收起已展开的分支，否则回到父行', () => {
        expect(act('ArrowLeft', { expanded: new Set(['p']) })).toEqual({ type: 'collapse' });
        expect(act('ArrowLeft', { index: 2 })).toEqual({ type: 'move', index: 0 });
        expect(act('ArrowLeft')).toBeNull();
    });

    it('RTL 下左右键互换', () => {
        expect(act('ArrowLeft', { rtl: true })).toEqual({ type: 'expand' });
        expect(act('ArrowRight', { rtl: true, index: 2 })).toEqual({ type: 'move', index: 0 });
    });

    it('没有行属性的行上展开或收起只消费按键', () => {
        expect(act('ArrowRight', { noRow: new Set(['p']) })).toEqual({ type: 'none' });
        expect(act('ArrowLeft', { noRow: new Set(['p']), expanded: new Set(['p']) })).toEqual({ type: 'none' });
    });

    it('字符移到以它开头的下一行，没有匹配时只消费按键', () => {
        expect(act('d')).toEqual({ type: 'move', index: 4 });
        expect(act('z')).toEqual({ type: 'none' });
    });

    it('数字标签参与匹配，其余类型的标签视为空文本', () => {
        expect(act('4')).toEqual({ type: 'move', index: 2 });
        expect(act('n')).toEqual({ type: 'none' });
    });

    it('其他按键不处理', () => {
        expect(act('Tab')).toBeNull();
        expect(act('Escape')).toBeNull();
    });
});
