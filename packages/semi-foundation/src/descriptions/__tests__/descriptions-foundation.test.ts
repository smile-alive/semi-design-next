import { describe, expect, it } from 'vite-plus/test';
import DescriptionsFoundation, { type DescriptionsColumn } from '../foundation';

const { getHorizontalList } = DescriptionsFoundation;

describe('DescriptionsFoundation.getHorizontalList', () => {
    it('把可见列按列跨度分组为行', () => {
        const columns = [{ key: 'a' }, { key: 'b', hidden: true }, { key: 'c', span: 2 }, { key: 'd' }, { key: 'e' }];
        expect(getHorizontalList(columns, 3)).toEqual([
            [{ key: 'a' }, { key: 'c', span: 2 }],
            [{ key: 'd' }, { key: 'e', span: 2 }],
        ]);
    });

    it('通过副本拉伸不足一行的最后一行，不修改输入', () => {
        const columns: (DescriptionsColumn & { key: string })[] = [{ key: 'a' }];
        const [[last]] = getHorizontalList(columns, 3);
        expect(last).toEqual({ key: 'a', span: 3 });
        expect(columns).toEqual([{ key: 'a' }]);
    });

    it('短行最后一项保留显式设置的 span', () => {
        expect(getHorizontalList([{ key: 'a', span: 1 }], 3)).toEqual([[{ key: 'a', span: 1 }]]);
    });

    it('span 为 0 的列与分行一样按 1 格计算，拉伸后不超出行宽', () => {
        expect(getHorizontalList([{ key: 'a', span: 0 }, { key: 'b' }], 3)).toEqual([
            [
                { key: 'a', span: 0 },
                { key: 'b', span: 2 },
            ],
        ]);
    });

    it('没有列时返回空行', () => {
        expect(getHorizontalList([], 3)).toEqual([]);
    });
});
