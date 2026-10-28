import { describe, expect, it } from 'vite-plus/test';
import { getPosCls } from '../utils';

describe('getPosCls', () => {
    it('left 和 right 模式忽略条目自身的 position', () => {
        expect(getPosCls('left', 'right', 0)).toBe('semi-timeline-item-left');
        expect(getPosCls('right', 'left', 1)).toBe('semi-timeline-item-right');
    });

    it('center 与 alternate 模式优先使用条目的 position', () => {
        expect(getPosCls('center', 'right', 0)).toBe('semi-timeline-item-right');
        expect(getPosCls('alternate', 'left', 1)).toBe('semi-timeline-item-left');
    });

    it('alternate 模式按下标奇偶交替', () => {
        expect(getPosCls('alternate', undefined, 0)).toBe('semi-timeline-item-left');
        expect(getPosCls('alternate', undefined, 1)).toBe('semi-timeline-item-right');
    });

    it('center 模式无 position 时落在左侧，其余情况为空串', () => {
        expect(getPosCls('center', undefined, 3)).toBe('semi-timeline-item-left');
        expect(getPosCls(undefined, undefined, 0)).toBe('');
    });
});
