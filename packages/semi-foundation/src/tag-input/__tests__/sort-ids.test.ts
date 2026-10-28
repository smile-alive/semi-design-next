import { describe, expect, it } from 'vite-plus/test';
import TagInputFoundation from '../foundation';

const { getSortIds } = TagInputFoundation;

describe('TagInputFoundation.getSortIds', () => {
    it('重复标签各有唯一 id', () => {
        expect(getSortIds(['a', 'b', 'a']).ids).toEqual(['0:a', '0:b', '1:a']);
    });

    it('值体现了排序时 id 随标签移动，被拖动的标签保留自己的 id', () => {
        const prev = getSortIds(['a', 'b', 'a']);
        const next = getSortIds(['b', 'a', 'a'], { ...prev, move: { oldIndex: 0, newIndex: 2 } });
        expect(next.ids).toEqual(['0:b', '1:a', '0:a']);
        expect(next.move).toBeUndefined();
    });

    it('值未体现排序（受控值拒绝或尚未更新）时原样返回，排序保持待定，之后体现时再移动', () => {
        const pending = { ...getSortIds(['a', 'b', 'a']), move: { oldIndex: 0, newIndex: 2 } };
        expect(getSortIds(['a', 'b', 'a'], pending)).toBe(pending);
        expect(getSortIds(['b', 'a', 'a'], pending).ids).toEqual(['0:b', '1:a', '0:a']);
    });

    it('外部改值时相同的值按顺序保留原 id，新值取未占用的 id', () => {
        const prev = { values: ['b', 'a', 'a'], ids: ['0:b', '1:a', '0:a'] };
        expect(getSortIds(['x', 'a', 'b', 'a', 'a'], prev).ids).toEqual(['0:x', '1:a', '0:b', '0:a', '2:a']);
        expect(getSortIds(['a'], prev).ids).toEqual(['1:a']);
    });
});
