import { describe, expect, it } from 'vite-plus/test';
import { getOptionRuns, optionListToRecords, toOptionRecord } from '../option-foundation';

describe('optionListToRecords', () => {
    it('非空 optionList 按位置生成记录，data 仍是原条目', () => {
        const optionList = [{ value: 'a' }, { value: 'b' }];
        const records = optionListToRecords(optionList);
        expect(records).toStrictEqual([
            { data: { value: 'a' }, index: 0, group: undefined, childKey: undefined, show: true, selected: false },
            { data: { value: 'b' }, index: 1, group: undefined, childKey: undefined, show: true, selected: false },
        ]);
        expect(records?.[0].data).toBe(optionList[0]);
    });

    it('缺省或空数组返回 undefined，由宿主读取子节点', () => {
        expect(optionListToRecords()).toBeUndefined();
        expect(optionListToRecords([])).toBeUndefined();
    });
});

describe('toOptionRecord', () => {
    it('Select 的状态放在记录上，不写进用户数据', () => {
        const data = { value: 'a', label: 'A' };
        const record = toOptionRecord(data, 2);
        expect(record).toStrictEqual({ data, index: 2, group: undefined, childKey: undefined, show: true, selected: false });
        expect(data).toStrictEqual({ value: 'a', label: 'A' });
    });

    it('子节点记录分组与 childKey', () => {
        const group = { key: 'g', label: 'Group' };
        const record = toOptionRecord({ value: 'a' }, 0, group, 'g.0');
        expect(record.group).toBe(group);
        expect(record.childKey).toBe('g.0');
    });
});

describe('getOptionRuns', () => {
    it('相邻的同组选项合成一段，记下首项与每项的可见下标', () => {
        const a = { key: 'a' };
        const b = { key: 'b' };
        const options = [{ value: 1 }, { value: 2, group: a }, { value: 3, group: a }, { value: 4, group: b }, { value: 5 }];
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
        const options = [{ value: 1, group: a }, { value: 2 }, { value: 3, group: a }];
        expect(getOptionRuns(options).map((run) => run.first)).toStrictEqual([0, 1, 2]);
    });
});
