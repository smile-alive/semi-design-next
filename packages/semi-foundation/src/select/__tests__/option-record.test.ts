import { describe, expect, it } from 'vite-plus/test';
import { getOptionRuns, optionListToRecords, toOptionRecord } from '../option-foundation';

describe('optionListToRecords', () => {
    it('非空 optionList 按位置生成记录', () => {
        expect(optionListToRecords([{ value: 'a' }, { value: 'b' }])).toStrictEqual([
            { _show: true, _selected: false, _scrollIndex: 0, value: 'a' },
            { _show: true, _selected: false, _scrollIndex: 1, value: 'b' },
        ]);
    });

    it('缺省或空数组返回 undefined，由宿主读取子节点', () => {
        expect(optionListToRecords()).toBeUndefined();
        expect(optionListToRecords([])).toBeUndefined();
    });
});

describe('toOptionRecord', () => {
    it('optionList 项补上显示、未选中与位置，不加分组和 JSX key', () => {
        const record = toOptionRecord({ value: 'a', label: 'A' }, 2);
        expect(record).toStrictEqual({ _show: true, _selected: false, _scrollIndex: 2, value: 'a', label: 'A' });
    });

    it('子节点记录分组与 JSX key，数据中的同名键覆盖默认值', () => {
        const group = { key: 'g', label: 'Group' };
        const record = toOptionRecord({ value: 'a', _show: false }, 0, group, 'g.0');
        expect(record).toStrictEqual({ _show: false, _selected: false, _scrollIndex: 0, value: 'a', _parentGroup: group, _keyInJsx: 'g.0' });
    });

    it('不在分组中的子节点也记录 JSX key，分组为 undefined', () => {
        const record = toOptionRecord({ value: 'a' }, 1, undefined, '.0');
        expect(record).toHaveProperty('_parentGroup', undefined);
        expect(record._keyInJsx).toBe('.0');
    });
});

describe('getOptionRuns', () => {
    it('相邻的同组选项合成一段，记下首项与每项的可见下标', () => {
        const a = { key: 'a' };
        const b = { key: 'b' };
        const options = [{ value: 1 }, { value: 2, _parentGroup: a }, { value: 3, _parentGroup: a }, { value: 4, _parentGroup: b }, { value: 5 }];
        expect(getOptionRuns(options)).toStrictEqual([
            { group: undefined, first: 0, rows: [{ option: options[0], index: 0 }] },
            {
                group: a,
                first: 1,
                rows: [
                    { option: options[1], index: 1 },
                    { option: options[2], index: 2 },
                ],
            },
            { group: b, first: 3, rows: [{ option: options[3], index: 3 }] },
            { group: undefined, first: 4, rows: [{ option: options[4], index: 4 }] },
        ]);
    });

    it('同组选项被隔开时分成两段', () => {
        const a = { key: 'a' };
        const options = [{ value: 1, _parentGroup: a }, { value: 2 }, { value: 3, _parentGroup: a }];
        expect(getOptionRuns(options).map((run) => run.first)).toStrictEqual([0, 1, 2]);
    });
});
