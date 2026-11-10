import { describe, expect, it } from 'vite-plus/test';
import PreviewInnerFoundation from '../preview-inner-foundation';

describe('PreviewInnerFoundation.getRatio', () => {
    it('比例只属于选它时的那张图，切到别的图显示 adaptation', () => {
        const state = { currentIndex: 1, ratio: 'realSize' as const, ratioIndex: 1 };
        expect(PreviewInnerFoundation.getRatio({}, state)).toBe('realSize');
        expect(PreviewInnerFoundation.getRatio({}, { ...state, currentIndex: 0 })).toBe('adaptation');
        expect(PreviewInnerFoundation.getRatio({ currentIndex: 1 }, { ...state, currentIndex: 0 })).toBe('realSize');
        expect(PreviewInnerFoundation.getRatio({ currentIndex: 2 }, state)).toBe('adaptation');
    });
});
