import { describe, expect, it } from 'vite-plus/test';
import TagInputFoundation from '../foundation';

const { getVisibleCount } = TagInputFoundation;

describe('TagInputFoundation.getVisibleCount', () => {
    const idle = { active: false, sorting: false };

    it('标签数不超过 maxTagCount 或未设置时全部显示', () => {
        expect(getVisibleCount({ maxTagCount: 3 }, idle, 3)).toBe(3);
        expect(getVisibleCount({}, idle, 5)).toBe(5);
    });

    it('超出 maxTagCount 时折叠多余标签', () => {
        expect(getVisibleCount({ maxTagCount: 2 }, idle, 5)).toBe(2);
    });

    it('激活后按 expandRestTagsOnClick 展开，排序中总是全部显示', () => {
        const active = { active: true, sorting: false };
        expect(getVisibleCount({ maxTagCount: 2, expandRestTagsOnClick: true }, active, 5)).toBe(5);
        expect(getVisibleCount({ maxTagCount: 2, expandRestTagsOnClick: false }, active, 5)).toBe(2);
        expect(getVisibleCount({ maxTagCount: 2 }, { active: false, sorting: true }, 5)).toBe(5);
    });
});
